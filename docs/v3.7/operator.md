---
title: CK.Operator -- Lifecycle, Proof, and the ConceptKernel CRD
description: How CK.Operator reconciles ontological declarations into cluster resources, verifies each step with evidence, and represents kernels as first-class Kubernetes objects.
---

# CK.Operator

## Identity

| Property | Value |
|----------|-------|
| URN | `ckp://Kernel#CK.Operator:v1.0` |
| kernel_id | `c995bbf7-241d-448d-af8c-38187e02d1c5` |
| Type | `node:hot` |
| Governance | `AUTONOMOUS` |
| Archetype | Materialiser |
| Entrypoint | `tool/processor.py` |
| NATS Topics | `input.CK.Operator`, `result.CK.Operator`, `event.CK.Operator` |

## The Operator Principle

CK.Operator enforces a single rule: **if it is not in the ontology, it does not exist in the cluster.** The operator reads `conceptkernel.yaml` (CK loop, TBox) and materialises the cluster state. It never reads `tool/processor.py` or `data/` -- those are TOOL loop and DATA loop concerns.

This matters because it closes the gap between declaration and reality. A developer declares a kernel in `conceptkernel.yaml`. The operator creates the namespace, volumes, deployment, routes, auth, and CRD. If the declaration changes, the operator reconciles. If the kernel is removed from the declaration, the operator deletes the compute resources (but retains data -- identity outlives compute).

## Dual Entry Architecture

CK.Operator accepts actions through two equivalent entry points. Both invoke the same `reconcile()` function to guarantee identical behaviour regardless of how the action was initiated.

| Entry Point | Mechanism | Invocation |
|-------------|-----------|------------|
| **NATS listener** | `KernelProcessor` with `@on` handlers | `python processor.py --listen` |
| **kopf CRD** | kopf operator watching `CKProject` CR | `kopf run processor.py` |
| **Dual mode** | Both simultaneously (production) | `python processor.py --dual` |
| **CLI direct** | Argparse, no NATS/kopf | `python processor.py --action project.deploy --data '{...}'` |

The rationale for dual entry is operational flexibility: NATS provides real-time browser and inter-kernel communication, while kopf provides Kubernetes-native GitOps integration via `kubectl apply`.

## Action Catalog (11 Actions)

| Action | Type | Access | Description |
|--------|------|--------|-------------|
| `project.deploy` | deploy | auth | Materialise a CKProject into Kubernetes resources |
| `project.teardown` | deploy | auth | Remove compute resources; retain PVs and namespace |
| `project.status` | inspect | anon | Return pod status for a deployed project |
| `project.list` | inspect | anon | List all managed CKProject instances |
| `project.create` | mutate | auth | Scaffold a new project with kernel files and filer structure |
| `kernel.create` | mutate | auth | Create awakening files for a new kernel |
| `kernel.start` | operate | auth | Scale deployment to replicas=1 |
| `kernel.stop` | operate | auth | Scale deployment to replicas=0 |
| `kernel.spawn` | mutate | auth | Dynamically create a new concept kernel from a template |
| `status` | inspect | anon | Built-in kernel status |
| `ontology` | inspect | anon | Return kernel ontology |

::: tip Grants
| Identity | Permitted Actions |
|----------|-------------------|
| `anon` | `status`, `ontology`, `project.list`, `project.status` |
| `auth` | `project.deploy`, `project.teardown`, `project.create`, `kernel.create`, `kernel.start`, `kernel.stop`, `kernel.spawn` |
:::

## Reconciliation Lifecycle

The `project.deploy` action follows a deterministic 10-step sequence. Each step produces an occurrent with [proof verification](./proof). If any check fails, the step halts and subsequent steps do not execute.

```
1. deploy.namespace     -- Create namespace ck-{subdomain}
2. deploy.security      -- ServiceAccount, NetworkPolicies
3. deploy.storage       -- PV/PVC per three-loop spec
4. deploy.processors    -- ConfigMap (boot.py) + Deployment
5. deploy.web           -- index.html generation + web Deployment + Service
6. deploy.routing       -- HTTPRoute with Gateway API parentRef
7. deploy.ck_resources  -- ConceptKernel CRs per kernel
8. deploy.auth          -- Keycloak realm creation/reuse
9. deploy.graph         -- RDF materialisation to Jena Fuseki
10. deploy.endpoint     -- External endpoint verification
```

For the full step-by-step breakdown, see [Reconciliation Lifecycle](./reconciliation).

## Version Materialisation (v3.7)

::: info v3.7 -- serving-multiversion-unpack
This section documents the version materialisation model introduced in v3.7, implemented in CK.Operator v1.3.0. See [Versioning](./versioning) for the full storage layout and runc constraint analysis.
:::

### serving.json Is Retired

Prior to v3.7, `serving.json` was the sole exception to the CK loop's read-only policy. It declared which version was active via `ck_ref` and `tool_ref` fields. This created three problems that could not be cleanly solved:

1. **Write-through hack** -- the CK volume had to be writable for one file, breaking the separation axiom.
2. **Inert file** -- `serving.json` existed on disk but was not enforced by the runtime, making it decorative.
3. **Decorative refs** -- the git branch names in `serving.json` had no mechanism to resolve to actual commit hashes.

v3.7 dissolves all three problems by moving version state into the project's `.ckproject` manifest (an instance record in [CK.Project](./project)'s DATA organ, reflected to the cluster as a `CKProject` custom resource). `serving.json` no longer exists on disk, and the CK volume is purely ReadOnlyMany with no exceptions.

### Version State: `.ckproject` Manifest and `CKProject` CR

The authoritative version declarations live in the project's `.ckproject` manifest; the cluster-side `CKProject` custom resource is the manifest projected into the Kubernetes control plane so the operator and kubectl clients can read and patch it. Each version specifies per-kernel SHA1 commit pins for each organ (`ck`, `tool`, `data`):

```yaml
apiVersion: ck.tech.games/v1
kind: CKProject
metadata:
  name: hello
spec:
  hostname: hello.tech.games
  versions:
    - name: v1.3.2
      route: /
      data: isolated
      kernels:
        - name: Hello.Greeter
          pins:
            ck:   "abc123f..."   # SHA1 of ck/ organ at this version
            tool: "aaa111..."    # SHA1 of tool/ organ at this version
            data: "ccc333..."    # SHA1 of initial data/ seed (optional)
        - name: CK.Lib.Py
          pins:
            ck:   "eee555..."
            tool: "fff666..."
    - name: v1.3.19
      route: /next
      data: isolated
      kernels:
        - name: Hello.Greeter
          pins:
            ck:   "def4567..."
            tool: "bbb222..."
            data: "ccc333..."    # same as v1.3.2 when seed is unchanged
        - name: CK.Lib.Py
          pins:
            ck:   "eee555..."    # same as v1.3.2
            tool: "fff666..."    # same as v1.3.2
```

The operator reads `spec.versions`, materialises each version from per-kernel bare repositories on the SeaweedFS filer, and creates per-version deployments, PVs, and HTTPRoute rules. A version promotion is a CKProject resource update -- `kubectl patch`, NATS command, or operator API. Standard Kubernetes-native workflow with etcd history. The CR is the cluster-side projection of the project's `.ckproject` manifest (see [CK.Project](./project) for the manifest itself).

### Per-Version Deployments

Each declared version gets its own Deployment. Pods in one version's deployment mount that version's PVs only. Multiple versions of the same project run simultaneously, each serving its designated route:

```
hello-v1.3.2-proc    → mounts v1.3.2 PVs, serves /
hello-v1.3.19-proc   → mounts v1.3.19 PVs, serves /next
```

This model supports safe canary testing: deploy a new version at `/next`, verify it, then promote by swapping routes in the CK.Project CR.

### Three PVs Per Kernel Per Version

Each kernel in each version gets three independent PVs:

```
ck-{project}-{kernel}-{version}-ck       → /ck/{kernel}/{version}/ck/         ReadOnlyMany
ck-{project}-{kernel}-{version}-tool     → /ck/{kernel}/{version}/tool/       ReadOnlyMany
ck-{project}-{kernel}-{version}-data     → /ck-data/{hostname}/{kernel}/{version}/  ReadWriteMany
```

Inside the pod, these mount as three sibling directories under the kernel name:

```
/ck/{kernel}/ck/      ← CK PV (ReadOnly)
/ck/{kernel}/tool/    ← TOOL PV (ReadOnly)
/ck/{kernel}/data/    ← DATA PV (ReadWrite)
```

The kernel name directory is not a volume -- it is a plain directory created by the kubelet. See [Versioning -- Three Sibling Dirs](./versioning#in-container-mount-layout-three-sibling-dirs-option-a) for the runc constraint that drives this design.

### CKProject CRD

v3.7 introduces the `CKProject` Custom Resource Definition at `ck.tech.games/v1`:

```bash
kubectl get ckp -A
```

```
NAMESPACE     NAME          PHASE     VERSIONS   CHECKS   AGE
ck-hello      hello         Running   1          15       1d
ck-delvinator delvinator    Running   1          15       2d
```

The CKProject CRD provides:

- **`spec.versions`** -- array of named versions with per-kernel `ck_ref`/`tool_ref`
- **`spec.hostname`** -- project hostname for HTTPRoute generation
- **`.status.phase`** -- Running, Degraded, or Failed (patched by operator after reconcile)
- **`.status.versions`** -- per-version status with materialisation state
- **`.status.proof`** -- aggregate proof from reconciliation checks

#### CKProject .status Patching

After each reconciliation, the operator patches the CKProject `.status` with the reconciliation result:

```yaml
status:
  phase: Running
  versions:
    - name: v1.0.0
      materialised: true
      deploymentReady: true
      routeAccepted: true
  proof:
    totalChecks: 15
    totalPassed: 15
    lastReconciled: "2026-04-06T14:00:00Z"
```

This means `kubectl get ckp` always reflects the actual cluster state. If materialisation fails or a deployment is unhealthy, the status shows it.

### Dual Control Plane: kopf + NATS

CK.Operator uses both kopf (Kubernetes watch) and NATS messaging as entry points. Both trigger the same `reconcile()` function:

```
kopf watch CKProject CR change  ──→ reconcile()
NATS input.CK.Operator message  ──→ reconcile()
```

This provides two equivalent paths to the same outcome:

| Path | Use Case |
|------|----------|
| `kubectl apply -f ckproject.yaml` | GitOps, CI/CD pipelines, manual ops |
| `nats pub input.CK.Operator '{"action":"project.deploy",...}'` | Web shell, inter-kernel communication, browser |

Both paths produce identical results. The reconcile function is idempotent -- running it twice with the same input produces no changes.

### Materialisation Pipeline

The reconciliation lifecycle gains a new step, `deploy.materialise`, inserted between `deploy.namespace` and `deploy.storage`:

```
Reconciliation lifecycle (v3.7 -- versioned):

  1. deploy.namespace
  2. deploy.materialise          -- NEW: git archive -> filer (per-version, per-kernel)
  3. deploy.storage.ck
  4. deploy.storage.tool         -- NEW: separate TOOL PVs
  5. deploy.storage.data
  6. deploy.processors
  7. deploy.web
  8. deploy.routing
  9. deploy.conceptkernels
  10. deploy.auth
  11. deploy.graph
  12. deploy.endpoint
```

This is 12 steps (11 + the new materialise step). The flat (non-versioned) lifecycle remains 10 steps for backward compatibility.

For each version in `spec.versions`, the materialise step:

1. For each kernel, checks if `/ck/{kernel}/{version}/ck/.git-ref` and `/ck/{kernel}/{version}/tool/.git-ref` exist on filer
2. If they exist and contain the matching refs -- skip (already current)
3. If missing or different ref:
   - CK loop: `git -C /ck/{kernel} archive {ck_ref} | upload to /ck/{kernel}/{version}/ck/`
   - TOOL loop: `git -C /ck/{kernel} archive {tool_ref} | upload to /ck/{kernel}/{version}/tool/`
   - Writes commit hashes to `.git-ref` in each loop directory
4. Ensures three PVs per kernel per version exist
5. Ensures PVCs are bound

### Per-Version HTTPRoutes

HTTPRoute rules are ordered longest-prefix first:

```yaml
spec:
  hostnames: [hello.tech.games]
  rules:
    - matches:
        - path: { type: PathPrefix, value: /next }
      backendRefs:
        - name: hello-v1.3.19
          port: 80
    - matches:
        - path: { type: PathPrefix, value: / }
      backendRefs:
        - name: hello-v1.3.2
          port: 80
```

When a version's ref changes, the PV is not recreated -- the filer path is stable (keyed by version name). Content changes when the operator re-materialises. Pods pick up new content on rolling restart.

### Version Lifecycle via CR

| CR Change | Operator Action |
|-----------|-----------------|
| Add version | Materialise CK + TOOL, create deployment + 3 PVs/PVCs per kernel + route rule |
| Change version ck_ref or tool_ref | Re-materialise affected loop, roll pods |
| Remove version | Delete deployment, PVs/PVCs, route rule, GC filer paths |

### Garbage Collection

After reconciliation, the operator scans version directories under each kernel on the filer and deletes those not referenced by any active version in any CK.Project resource. GC deletes both `ck/` and `tool/` subdirectories together. GC MUST NOT delete git internals (`HEAD`, `objects/`, `refs/`). GC logs every deletion and never removes directories referenced by other projects.

### Shared Kernel Optimisation

When two versions reference the same commit for a kernel's loop, the operator does not extract twice. It checks `.git-ref` in the existing version directory. If the hash matches, the new version's PV points to the existing path -- no duplicate storage.

### Backward Compatibility

If `spec.versions` is absent from a CK.Project resource, the operator falls back to the current flat layout (`/ck/{KernelName}/`). Existing projects deployed without version declarations continue to work unchanged.

### What Each Step Creates

**deploy.namespace**: Namespace `ck-{subdomain}`, ServiceAccount `ckp-runtime`, NetworkPolicies (default-deny, allow-nats, allow-dns, allow-gateway).

**deploy.storage.ck**: PersistentVolume for the CK loop with `ReadOnlyMany` access mode. Filer path: `/ck/{project}/concepts/{kernel}/`. This volume holds identity files -- the runtime process cannot modify them.

**deploy.storage.data**: PersistentVolume for the DATA loop with `ReadWriteMany` access mode. Filer path: `/ck-data/{hostname}`. This is where instances, proofs, and ledger entries accumulate.

**deploy.processors**: For each `node:hot` kernel, a Deployment with the processor container, volume mounts for CK (ReadOnly), TOOL (ReadOnly), and DATA (ReadWrite), and a Service for internal communication.

**deploy.web**: A Deployment serving static files from the DATA loop's `data/web/` directory.

**deploy.routing**: An HTTPRoute with subpath rules:
```
/action/*   -> processor (TOOL loop)
/cklib/*    -> filer (CK.Lib edge data/web/)
/v{N}/*     -> filer (versioned DATA loop)
/*          -> filer (current DATA loop data/web/)
```

**deploy.auth**: See [Auth](/v3.7/auth) for full details.

**deploy.endpoint**: `curl -sI https://{hostname}/` expecting HTTP 200.

## 17 Kubernetes Resources Generated

For each `project.deploy`, CK.Operator creates up to 17 Kubernetes resources:

| # | Kind | Name Pattern | Purpose |
|---|------|-------------|---------|
| 1 | Namespace | `ck-{subdomain}` | Per-project isolation boundary |
| 2 | ServiceAccount | `ckp-runtime` | Pod identity (`automountServiceAccountToken: false`) |
| 3 | NetworkPolicy | `ckp-default-deny` | Deny all ingress/egress by default |
| 4 | NetworkPolicy | `ckp-allow-nats` | Allow egress to NATS (port 4222) |
| 5 | NetworkPolicy | `ckp-allow-dns` | Allow egress to kube-dns |
| 6 | NetworkPolicy | `ckp-allow-gateway` | Allow ingress from gateway namespace |
| 7 | PersistentVolume | `ck-{sub}-ck` | SeaweedFS CSI volume for CK+TOOL loops (ReadOnlyMany) |
| 8 | PersistentVolume | `ck-{sub}-data` | SeaweedFS CSI volume for DATA loop (ReadWriteMany) |
| 9 | PersistentVolumeClaim | `ck` | Binds to CK PV |
| 10 | PersistentVolumeClaim | `data` | Binds to DATA PV |
| 11 | ConfigMap | `boot` | Python boot script for processor pods |
| 12 | Deployment | `processors` | Runs all kernel processors via boot.py |
| 13 | ConfigMap | `index` | Generated index.html (web shell) |
| 14 | Deployment | `web` | nginx serving web shell + CK.Lib.Js |
| 15 | Service | `web` | ClusterIP service for web deployment |
| 16 | HTTPRoute | `{subdomain}` | Gateway API route to web service |
| 17 | ConceptKernel | `{kernel-lower}` | Per-kernel CRD with proof in `.status` |

## Materialisation per Deployment Method

Different deployment methods produce different resource sets. The deployment method is declared in the project's storage configuration.

| Method | PV/PVC | Deployment | ConfigMap | HTTPRoute Backend |
|--------|--------|------------|-----------|-------------------|
| `VOLUME` | SeaweedFS CSI | Yes (runtime image) | Startup script | Pod service |
| `FILER` | None | None (static) | None | SeaweedFS filer service |
| `CONFIGMAP_DEPLOY` | None | Yes (nginx:alpine) | Code + web | Pod service |
| `INLINE_DEPLOY` | None | None | Optional JS | Direct response / filer |

## Edge Composition

CK.Operator declares outbound [edges](./edges) to other system kernels:

| Target Kernel | Predicate | Semantics |
|---------------|-----------|-----------|
| `CK.ComplianceCheck` | `TRIGGERS` | After deploy, trigger fleet compliance validation |
| `CK.Project` | `COMPOSES` | Inherit project declaration actions |

## Lifecycle Events

CK.Operator emits lifecycle events to `event.CK.Operator` at each phase transition, enabling real-time monitoring from web console clients and triggering downstream kernels via edges.

| Event | When | Payload |
|-------|------|---------|
| `deploy.accepted` | Deploy starts | `{ hostname, namespace }` |
| `deploy.scanning` | Scanning kernels | `{ hostname, kernels, kernel_names }` |
| `deploy.materialising` | Resources being applied | `{ hostname, resources }` |
| `deploy.ready` | All resources healthy | `{ hostname, url, kernels, resources }` |
| `deploy.failed` | Failure at any step | `{ hostname, error }` |
| `teardown.accepted` | Teardown starts | `{ hostname }` |
| `teardown.complete` | Compute removed | `{ hostname, retained }` |
| `reconcile.drift` | Desired != actual state | `{ hostname, drift }` |
| `reconcile.converged` | Drift corrected | `{ hostname }` |

## Evidence-Based Proof: 15 Checks

v3.7 extends the v3.5 proof model from a "record that a step was executed" to **evidence that the outcome matches the ontological declaration**. Every check produces:

- **Expected state** -- from the ontology or conceptkernel.yaml
- **Proof method** -- kubectl query, HTTP probe, or filesystem check
- **Observed state** -- the actual value returned
- **Evidence hash** -- SHA-256 of the observed state for tamper detection
- **Verdict** -- expected == observed means PASS; otherwise FAIL

### The 15 Checks

| # | Step | Check | Expected |
|---|------|-------|----------|
| 1 | deploy.namespace | `namespace_active` | Namespace phase = Active |
| 2 | deploy.storage.ck | `pv_bound` | PV phase = Bound |
| 3 | deploy.storage.ck | `pv_access_mode` | ReadOnlyMany |
| 4 | deploy.storage.ck | `pv_filer_path` | Correct SeaweedFS path |
| 5 | deploy.storage.ck | `pvc_bound` | PVC phase = Bound |
| 6 | deploy.storage.data | `pv_bound` | PV phase = Bound |
| 7 | deploy.storage.data | `pv_access_mode` | ReadWriteMany |
| 8 | deploy.storage.data | `pv_filer_path` | Correct SeaweedFS path |
| 9 | deploy.storage.data | `pvc_bound` | PVC phase = Bound |
| 10 | deploy.processors | `deployment_ready` | readyReplicas >= 1 |
| 11 | deploy.web | `deployment_ready` | readyReplicas >= 1 |
| 12 | deploy.routing | `httproute_accepted` | Accepted = True |
| 13 | deploy.endpoint | `endpoint_reachable` | HTTP 200 |
| 14 | deploy.auth | `oidc_discovery` | HTTP 200 |
| 15 | deploy.auth | `jwks_reachable` | HTTP 200 + keys |

::: info Evolution of the Check Count
v3.5.2 deployed with 13 checks (no auth). v3.5.5 added checks 14 and 15 when AuthConfig was implemented. Both `delvinator.tech.games` and `hello.tech.games` pass 15/15 in the current deployment.
:::

### Halt-on-Failure

If ANY check fails:
1. The step halts -- subsequent steps do not execute
2. The instance is NOT sealed -- no partial proofs
3. The proof record includes the failure evidence (actual value, evidence hash)
4. A `deploy.failed` event is published to NATS with the failing check details

This prevents cascading failures. If the PV access mode is wrong, there is no point deploying the processor -- it would start with incorrect volume permissions.

### Three-Loop Separation Proof

The proof chain verifies the separation axiom at materialisation time:

| Volume | Required Access Mode | Why |
|--------|---------------------|-----|
| `ck-{ns}-ck` | ReadOnlyMany | Runtime cannot modify identity or ontology |
| `ck-{ns}-data` | ReadWriteMany | Runtime writes instances, proofs, ledger |

If any volume has the wrong access mode, the deployment fails. This is not a convention check -- it is a physical enforcement proof.

## ConceptKernel CRD

v3.5.2 introduced the ConceptKernel Custom Resource Definition. Each kernel in the fleet is a first-class Kubernetes object:

```bash
kubectl get ck -A
```

```
NAMESPACE        NAME                       TYPE        PHASE     CHECKS   AGE
ck-delvinator    delvinator-core            node:cold   Running   15       2d
ck-delvinator    delvinator-exchangeparser  node:cold   Running   15       2d
ck-delvinator    delvinator-intentmapper    node:cold   Running   15       2d
ck-delvinator    delvinator-threadscout     node:cold   Running   15       2d
ck-delvinator    ck-compliancecheck         node:hot    Running   15       2d
ck-delvinator    ck-operator                node:hot    Running   15       2d
ck-hello         hello-greeter              node:hot    Running   15       1d
```

### CRD Schema

```yaml
apiVersion: conceptkernel.org/v1
kind: ConceptKernel
metadata:
  name: delvinator-core
  namespace: ck-delvinator
spec:
  kernelClass: Delvinator.Core
  type: "node:cold"
  governance: STRICT
  edges:
    - target: CK.ComplianceCheck
      predicate: COMPOSES
    - target: Delvinator.TaxonomySynthesis
      predicate: PRODUCES
status:
  phase: Running
  proof:
    totalChecks: 15
    totalPassed: 15
    chainValid: true
    lastVerified: "2026-04-06T12:00:00Z"
  volumes:
    ck: { bound: true, accessMode: ReadOnlyMany }
    data: { bound: true, accessMode: ReadWriteMany }
```

### Status Management

The operator runs a kopf timer every 60 seconds that re-verifies each kernel:
- All checks pass -- `.status.phase` = `Running`
- Any check fails -- `.status.phase` = `Degraded`
- Pod not found -- `.status.phase` = `Failed`

This means `kubectl get ck` is always current. If a volume gets accidentally reconfigured or a deployment scales to zero, the CRD status reflects it within 60 seconds.

### Additional Printer Columns

`kubectl get ck` shows four columns beyond the default:

| Column | Source | Purpose |
|--------|--------|---------|
| Type | `.spec.type` | Hot/cold/inline/static |
| Phase | `.status.phase` | Running/Degraded/Failed |
| Checks | `.status.proof.totalPassed` | How many proof checks pass |
| Age | `.metadata.creationTimestamp` | Standard k8s age |

## Namespace Isolation

Each project gets its own namespace with security boundaries:

| Resource | Name | Purpose |
|----------|------|---------|
| Namespace | `ck-{subdomain}` | Project scope |
| ServiceAccount | `ckp-runtime` | Processor pod identity |
| NetworkPolicy | `ckp-default-deny` | Deny all ingress/egress by default |
| NetworkPolicy | `ckp-allow-nats` | Allow egress to NATS (port 4222) |
| NetworkPolicy | `ckp-allow-dns` | Allow egress to kube-dns |
| NetworkPolicy | `ckp-allow-gateway` | Allow ingress from gateway-system |

The `ckp-runtime` ServiceAccount has `automountServiceAccountToken: false` -- processor pods cannot access the Kubernetes API. The separation axiom extends to the control plane: a kernel runtime has no business knowing about its own Deployment object.

### Why Default-Deny

The default-deny NetworkPolicy blocks all traffic that is not explicitly allowed. This means:
- Pods in `ck-delvinator` cannot talk to pods in `ck-hello` -- even though they are on the same cluster
- Pods cannot make arbitrary outbound HTTP calls -- only NATS and DNS
- The only ingress path is through the gateway

This is necessary because kernels with different governance modes (STRICT, RELAXED, AUTONOMOUS) may coexist on the same cluster. A STRICT kernel's namespace isolation should not depend on trusting what other namespaces do.

## Structured Logging

All kernel processors output structured JSON to stdout:

```json
{"ts":"2026-04-05T16:37:23Z","level":"info","kernel":"Delvinator.Core","event":"nats.connected","endpoint":"nats://nats.nats.svc:4222"}
{"ts":"2026-04-05T16:37:23Z","level":"info","kernel":"Delvinator.Core","event":"nats.subscribed","topic":"input.Delvinator.Core"}
{"ts":"2026-04-05T16:37:23Z","level":"info","kernel":"Delvinator.Core","event":"ready"}
{"ts":"2026-04-05T16:37:25Z","level":"info","kernel":"Delvinator.Core","event":"rx","trace":"tx-a8f3c1","action":"status","user":"anonymous"}
```

Required fields on every line:

| Field | Required | Description |
|-------|----------|-------------|
| `ts` | MUST | ISO 8601 timestamp |
| `level` | MUST | debug, info, warn, error |
| `kernel` | MUST | Kernel class name |
| `event` | MUST | Dotted event identifier |

This format enables `kubectl logs` to show meaningful kernel activity and allows log aggregation via Loki, Fluentd, or any standard k8s tooling without configuration.

## RBAC Accumulation

The operator's RBAC grew across versions as capabilities were added:

| Version | Added RBAC |
|---------|-----------|
| v3.5.2 | namespaces, PVs, PVCs, deployments, services, configmaps, httproutes, conceptkernels |
| v3.5.5 | keycloakrealmimports (get, list, create) |
| v3.5.7 | patch verb for namespaces, PVs, PVCs, keycloakrealmimports |

The v3.5.7 `patch` addition was necessary for idempotent updates. Without it, `kubectl apply --server-side --force-conflicts` could not update resources on re-deployment.

## Architectural Consistency Check

::: details Logical Analysis: Operator Design Decisions

**Question:** Why is the operator a kernel (CK.Operator) and not a standalone controller?

**Answer:** Because it benefits from the same three-loop model. CK.Operator has its own `conceptkernel.yaml` (CK loop), `tool/processor.py` (TOOL loop), and `data/` (DATA loop). Its reconciliation records are sealed instances in the DATA loop. Its proof records have provenance. It is observable through the same NATS topics as any other kernel. Making the operator a kernel means it is self-describing and self-verifiable.

**Question:** 15 checks feels like a lot. Why not just check "is the pod running"?

**Answer:** Because a running pod is not proof of correct deployment. A pod can be running with the wrong volume access mode (CK loop writable -- violating the separation axiom), wrong filer path (wrong kernel's data), or no auth verification (OIDC endpoint unreachable). Each of the 15 checks catches a specific class of misconfiguration that "pod is running" would miss.

**Question:** The kopf timer re-verifies every 60 seconds. Is this expensive?

**Answer:** Each verification cycle runs kubectl queries against the API server. For a fleet of 7 kernels with 15 checks each, that is 105 API calls per minute. This is well within Kubernetes API server capacity. The timer is configurable -- larger fleets can increase the interval.

**Contradiction identified:** The v3.5.2 delta spec says "13 checks" for the initial deployment, but the v3.5.5 changelog says "13 infra + 2 auth" totaling 15. The v3.5.2 deployment output shows 13/13 checks passing (before auth existed). After v3.5.5, the count became 15/15. The documentation is consistent -- the count increased when auth was added. Not a contradiction, but worth noting for readers comparing version outputs.

**Gap resolved (v3.7):** The operator now supports multi-version deployments via `spec.versions` in the CK.Project CR. `serving.json` has been retired. Each named version gets its own deployment, PV, and HTTPRoute rule. Weighted canary routing is not yet supported -- versions are routed by URL path prefix, not traffic weight.
:::

## Conformance Requirements

- CK.Operator MUST read only from the CK loop (TBox) -- never from TOOL or DATA
- CK.Operator MUST create a ConceptKernel resource for each kernel in the project
- ConceptKernel `.status.proof` MUST reflect actual verification results, not hardcoded values
- The kopf timer MUST re-verify at a configurable interval (default: 60s)
- `kubectl get ck` MUST show: name, type, phase, checks passed, age
- CK.Operator MUST halt deployment on any verification failure
- CK.Operator MUST NOT seal an instance whose proof contains any failure
- Persistent volumes MUST be retained on teardown -- data preservation
- All operator-created resources MUST carry `conceptkernel.org/project` label
