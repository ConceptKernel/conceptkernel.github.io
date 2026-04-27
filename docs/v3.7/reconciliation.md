---
title: Reconciliation Lifecycle, Logging, and Security
description: The 11-step canonical reconciliation lifecycle from namespace creation to endpoint verification, structured JSON logging, and security considerations.
---

# Reconciliation Lifecycle, Logging, and Security

## Reconciliation Purpose

The reconciliation lifecycle is the ordered sequence of substeps that transforms a CKProject declaration into running Kubernetes resources. It is specified as a deterministic pipeline rather than a bag of operations because ordering matters: organs must be materialised before volumes can mount them, volumes must exist before deployments can mount them, deployments must exist before services can route to them, and authentication must be configured before the endpoint can be verified.

This page is the **normative** lifecycle. The [Changelog](./changelog) describes the same pipeline at the implementation layer, where step 4 (`deploy.storage`) further expands into per-organ steps `deploy.storage.{ck,tool,data}`. When the two views differ in granularity, this page wins.

## Full 11-Step Lifecycle

```
project.deploy lifecycle:

  1. deploy.namespace          -- Create namespace ck-{subdomain}
  2. deploy.security           -- ServiceAccount, NetworkPolicies
  3. deploy.materialise        -- git archive each kernel's organs from per-kernel
                                  master clone via worktree to /ck/{kernel}/<sha>/{ck,tool}/
  4. deploy.storage            -- PV/PVC per three-loop spec, mounting the
                                  materialised organ paths
  5. deploy.processors         -- ConfigMap (boot.py) + Deployment
  6. deploy.web                -- index.html generation + web Deployment + Service
  7. deploy.routing            -- HTTPRoute with Gateway API parentRef
  8. deploy.conceptkernels     -- ConceptKernel CRs per kernel
  9. deploy.auth               -- Keycloak realm creation/reuse
  10. deploy.graph             -- RDF materialisation to Jena Fuseki
  11. deploy.endpoint          -- External endpoint verification
```

Each step produces an occurrent with [proof verification](./proof). If any step fails, the action halts and subsequent steps do not execute.

## Step Details

### 1. deploy.namespace

Creates the project namespace `ck-{subdomain}`. If the namespace already exists with the correct labels, the step is skipped (idempotent).

**Verification:** `kubectl get namespace {ns} -o jsonpath={.status.phase}` returns `Active`.

### 2. deploy.security -- Namespace Isolation

Creates per-project security resources. The rationale for default-deny is defence in depth: even if a container is compromised, it cannot reach services outside its allowed egress list.

| Resource | Name | Purpose |
|----------|------|---------|
| ServiceAccount | `ckp-runtime` | Pod identity; `automountServiceAccountToken: false` |
| NetworkPolicy | `ckp-default-deny` | Deny all ingress and egress by default |
| NetworkPolicy | `ckp-allow-nats` | Allow egress to NATS service (port 4222) |
| NetworkPolicy | `ckp-allow-dns` | Allow egress to kube-dns |
| NetworkPolicy | `ckp-allow-gateway` | Allow ingress from gateway namespace (port 80) |

`automountServiceAccountToken: false` prevents processor pods from accessing the Kubernetes API. The separation axiom extends to the control plane: kernel code cannot inspect or modify cluster resources.

### 3. deploy.materialise

Extracts each kernel's `ck/` and `tool/` organs from per-kernel master clones on the SeaweedFS filer to versioned materialisation paths under `/ck/{kernel}/{version}/`. Implementation: `git archive <pin>` for each organ, where the pin is the SHA1 declared in the project's `.ckproject` manifest (see [Versioning](./versioning)).

| Output | Location | Content |
|---|---|---|
| Materialised CK organ | `/ck/{kernel}/{version}/ck/` | Files extracted from `ck/` organ at the manifest pin |
| Materialised TOOL organ | `/ck/{kernel}/{version}/tool/` | Files extracted from `tool/` organ at the manifest pin |
| `.git-ref` provenance | `/ck/{kernel}/{version}/{ck,tool}/.git-ref` | The exact SHA1 the directory was extracted from |

This step runs before `deploy.storage` because the PVs created in step 4 mount these materialised paths. If `deploy.materialise` fails (missing pin, unreachable filer, archive error), `deploy.storage` cannot create valid PVs and the lifecycle halts.

### 4. deploy.storage

Creates PersistentVolumes and PersistentVolumeClaims for the three-loop filesystem. CK and TOOL loops share one ReadOnlyMany volume; DATA uses a separate ReadWriteMany volume.

| Resource | Name | Access Mode | Rationale |
|----------|------|-------------|-----------|
| PV | `ck-{sub}-ck` | ReadOnlyMany | CK+TOOL loops are immutable at runtime |
| PVC | `ck` | ReadOnlyMany | Binds to CK PV |
| PV | `ck-{sub}-data` | ReadWriteMany | DATA loop must be writable |
| PVC | `data` | ReadWriteMany | Binds to DATA PV |

### 5. deploy.processors

Creates the ConfigMap containing `boot.py` (the Python startup script that discovers and runs all kernel processors) and the Deployment that runs processor pods.

The boot ConfigMap is generated from the project's kernel list. Each kernel's `tool/processor.py` is executed as a subprocess by `boot.py`.

### 6. deploy.web -- Web Shell Generation

[CK.Operator](./operator) generates a minimal `index.html` (~30 lines) that bootstraps the web shell from CK.Lib.Js on the CK volume. The shell reads kernel declarations to build the UI dynamically.

**Generated index.html structure:**

1. Loads `/cklib/ck-client.js` from the CK volume
2. Loads `/cklib/ck-page.js` from the CK volume
3. Passes inline config via `window.__CK_CONFIG`: kernel list, auth endpoint, NATS WSS URL
4. Redirects to `/cklib/console.html` for the full three-panel console

The rationale for generating a minimal shell rather than deploying a full SPA is that the shell's behaviour is entirely driven by kernel declarations. Changing the fleet changes the UI without redeploying the web tier.

### 7. deploy.routing

Creates Gateway API HTTPRoutes from kernel ontology declarations.

| CKP Class | Gateway Resource | Condition |
|-----------|-----------------|-----------|
| `ckp:APIServing` | HTTPRoute rule `/action/*` -> container | Kernel has runtime |
| `ckp:WebServing` | HTTPRoute rule `/*` -> filer or container | `spec.web.serve: true` |
| `ckp:NATSListening` | No gateway resource | NATS-only, no HTTP |
| `ckp:NATSBrowserClient` | HTTPRoute for CK.Lib.Js + index | Inline kernel |

Edge subpath rules: each `COMPOSES` edge with `web.serve: true` on the target produces an HTTPRoute rule `/{edge_slug}/*` -> target's `data/web/`.

### 8. deploy.conceptkernels

Creates [ConceptKernel CRs](./crd) for every kernel declared in the project. The kopf timer begins re-verifying status after creation.

### 9. deploy.auth -- Authentication Provisioning

Executes between routing and endpoint verification. Auth configuration must be injected into both the processor deployment (env vars) and the web ConfigMap (inline config) before the endpoint can be verified.

**Flow:**

1. Read `auth` block from CK.Project instance
2. If `provider: none` or missing -> skip
3. If `create_realm: true` -> create `KeycloakRealmImport` CR (skip if exists)
4. Inject `KEYCLOAK_ISSUER` + `KEYCLOAK_CLIENT_ID` into processor Deployment
5. Inject auth config into web `index.html` ConfigMap
6. Verify: OIDC discovery endpoint returns HTTP 200
7. Verify: JWKS endpoint returns HTTP 200 with keys

**RBAC for realm creation:**

```yaml
- apiGroups: [k8s.keycloak.org]
  resources: [keycloakrealmimports]
  verbs: [get, list, create]
```

CK.Operator can create realms but MUST NOT modify or delete existing ones. On teardown, `KeycloakRealmImport` is RETAINED -- identity outlives compute.

### 10. deploy.graph -- Ontological Graph Materialisation

After successful deployment, CK.Operator publishes kernel metadata and edges as RDF triples to Jena Fuseki's `/ckp` dataset.

Each kernel becomes a `ckp:Kernel` individual typed as `bfo:0000040` Material Entity. Edges become RDF object properties using CKP predicates.

**Per project:**

```turtle
<ckp://Project#delvinator.tech.games> a ckp:Project ;
    rdfs:label "delvinator.tech.games" ;
    ckp:hasNamespace "ck-delvinator" .
```

**Per kernel:**

```turtle
<ckp://Kernel#Delvinator.Core:v1.0> a ckp:Kernel, bfo:0000040 ;
    rdfs:label "Delvinator.Core" ;
    ckp:hasType "node:cold" ;
    ckp:belongsToProject <ckp://Project#delvinator.tech.games> .

<ckp://Kernel#Delvinator.Core:v1.0> ckp:composes
    <ckp://Kernel#CK.Compliance:v1.0> .
```

**Named graphs:** Each project's fleet is stored in a named graph `urn:ckp:fleet:{hostname}` for per-project SPARQL queries.

```sparql
# All kernels in a project
SELECT ?kernel ?type WHERE {
  GRAPH <urn:ckp:fleet:delvinator-tech-games> {
    ?kernel a ckp:Kernel ; ckp:hasType ?type .
  }
}

# All edges across fleet
SELECT ?source ?predicate ?target WHERE {
  ?source ?predicate ?target .
  ?source a ckp:Kernel .
  ?target a ckp:Kernel .
}
```

::: tip Best Effort
Graph materialisation is best-effort: deploy succeeds even if Jena is unreachable, but the operator SHOULD log a warning.
:::

### 11. deploy.endpoint

Verifies the external endpoint returns HTTP 200. This is the final health check that confirms the full stack is operational from the user's perspective.

## Idempotent Deploy

CK.Operator MUST be idempotent. Deploying the same project declaration twice MUST produce the same cluster state.

| Resource Category | Idempotency Rule |
|-------------------|------------------|
| **Immutable** (PVs, Namespaces) | Skip creation if resource exists with correct spec. Do not attempt to update. |
| **Mutable** (Deployments, ConfigMaps, HTTPRoutes) | Apply desired state via `kubectl apply`. Kubernetes handles the diff. |
| **CRDs** (ConceptKernel) | Update `.spec` if changed; `.status` is managed by the timer, not by deploy. |

---

## Structured JSON Logging

### Format

Kernel processors MUST output one JSON object per line to stdout. This ensures standard Kubernetes log aggregation tooling (Loki, Fluentd, Elasticsearch) works without custom parsers.

```json
{"ts":"2026-04-05T16:37:23Z","level":"info","kernel":"Delvinator.Core","event":"nats.connected","endpoint":"nats://nats.nats.svc:4222"}
{"ts":"2026-04-05T16:37:23Z","level":"info","kernel":"Delvinator.Core","event":"nats.subscribed","topic":"input.Delvinator.Core"}
{"ts":"2026-04-05T16:37:23Z","level":"info","kernel":"Delvinator.Core","event":"ready"}
{"ts":"2026-04-05T16:37:25Z","level":"info","kernel":"Delvinator.Core","event":"rx","trace":"tx-a8f3c1","action":"status","user":"anonymous"}
```

### Required Fields

| Field | Requirement | Description |
|-------|-------------|-------------|
| `ts` | MUST | ISO 8601 timestamp |
| `level` | MUST | One of: `debug`, `info`, `warn`, `error` |
| `kernel` | MUST | Kernel class name |
| `event` | MUST | Dotted event identifier (e.g., `nats.connected`, `rx`, `ready`) |

Additional fields (e.g., `trace`, `action`, `user`) are context-dependent and MAY be included.

### Stream Topic

Kernels with LLM or streaming capability SHOULD publish per-token events to `stream.{kernel}`:

| Field | Requirement | Description |
|-------|-------------|-------------|
| `type` | MUST | Event type (`content_block_delta`, `tool_use`, `AssistantMessage`, `ResultMessage`) |
| `trace_id` | MUST | Correlation ID |
| `kernel_urn` | MUST | Source kernel URN |
| `data` | MUST | Event payload |

---

## Security Considerations

### Container Isolation

Containers are sealed environments. They see ONLY what the operator mounted:

- **CK + TOOL loops:** ReadOnly -- container cannot modify identity or code
- **DATA loop:** ReadWrite -- the only writable surface
- **Version pinning:** Only the SHA1 commits declared in the project's `.ckproject` manifest (per organ, per kernel version) can be mounted
- The operator verifies ontology + rules.shacl + `.ckproject` manifest BEFORE creating the container
- If validation fails, the container MUST NOT be created

### NATS Authentication

| Level | Mechanism | Available Subjects |
|-------|----------|-------------------|
| Anonymous | No auth on NATS connection | `input.*` (pub), `result.*` + `event.*` (sub) |
| Authenticated | JWT in `Authorization` header | + `admin.*` (pub), + `metrics.*` (sub) |
| Owner | JWT with kernel-owner claim | All subjects |

The `NatsKernelLoop` MUST verify the JWT before dispatching to action handlers. If verification fails, the message MUST be treated as anonymous.

### Grants Enforcement

The grants block in `conceptkernel.yaml` declares which identities can invoke which actions:

- `access: anon` -- any caller, no auth required
- `access: auth` -- valid JWT required
- `access: owner` -- JWT with kernel owner claim required

::: danger Rejection, Not Silence
A conformant implementation MUST reject unauthorized action invocations with an error response, NOT silently ignore the access level.
:::

### Destructive Operations

Destructive operations (teardown, delete) MUST:

1. Be scoped to the target kernel or project (no wildcard deletes)
2. Retain PVCs and namespaces (data preservation by default)
3. Record the operation as an occurrent with proof chain
4. Require `auth` or `owner` access level

## Conformance Requirements

### Reconciliation

| Criterion | Level |
|-----------|-------|
| Reconciliation MUST follow the specified step order | REQUIRED |
| Each step MUST produce an occurrent with proof verification | REQUIRED |
| Namespace isolation resources MUST be created per project | REQUIRED |
| Volume access modes MUST match the three-loop spec | REQUIRED |
| Web shell MUST be generated from CK.Lib.Js, not from external assets | REQUIRED |
| Auth config MUST be injected when declared in CK.Project | REQUIRED |
| Graph materialisation failure MUST NOT block deploy | RECOMMENDED |
| Idempotent deploy MUST skip existing immutable resources | REQUIRED |

### Logging

| Criterion | Level |
|-----------|-------|
| Processors MUST output structured JSON to stdout | REQUIRED |
| Each log line MUST include `ts`, `level`, `kernel`, `event` | REQUIRED |
| Log aggregation via standard k8s tooling SHOULD work without configuration | RECOMMENDED |
| Streaming handlers SHOULD publish to `stream.{kernel}` | RECOMMENDED |

### Security

| Criterion | Level |
|-----------|-------|
| CK+TOOL volumes MUST be ReadOnly at runtime | REQUIRED |
| Containers MUST NOT be created if validation fails | REQUIRED |
| JWT MUST be verified before handler dispatch | REQUIRED |
| Unauthorized invocations MUST be rejected with error, not ignored | REQUIRED |
| Destructive operations MUST retain data volumes | REQUIRED |
