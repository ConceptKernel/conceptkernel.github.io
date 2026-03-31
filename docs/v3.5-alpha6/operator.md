---
title: CK.Operator
description: The cluster operator that reconciles conceptkernel.yaml into gateway resources -- if it is not in the ontology, it does not exist in the cluster.
---

# CK.Operator -- CKP Cluster Operator

CK.Operator reconciles `.ckproject` and `conceptkernel.yaml` files into cluster gateway resources. It reads the declared state (TBox) and makes the cluster match.

::: warning Single Rule
If it is not in the ontology, it does not exist in the cluster.
:::

## Lineage

| CKOP v2.0 | CKP v3.4 | CK.Operator v3.5.1 |
|-----------|----------|---------------------|
| Three orthogonal loops | Three independently-versioned volumes | Three persistent volumes per kernel |
| OPS/TOOL/DATA | CK/TOOL/DATA | TBox/RBox/ABox |
| Custom objects/refs/commits | Native git per volume | Git on volume-mounted filesystem |
| serving.json with canary weights | serving.json with ck_ref + tool_ref | Explicit version directories + route rule |
| NATS topics per loop | Name-based NATS (primary) + GUID-based (extended) | Operator watches resources, not NATS |
| Manual apply | Inline YAML via platform tooling | Operator reconciles from conceptkernel.yaml |
| BFO Continuant/Occurrent | BFO 2020 full hierarchy | BFO + IAO + CCO + PROV-O + ValueFlows |

## Ontological Grounding

CK.Operator is itself a `ckp:HotKernel` (BFO:0000040 + cco:Agent). Its actions are `ckp:Reconciliation` (iao:PlanSpecification + cco:Event). Its outputs are `ckp:Instance` (iao:DataItem) with PROV-O provenance.

### What the Operator Maps

| CKP Class (Layer 1) | Mid-Level (Layer 0.5) | Cluster Resource | Relationship |
|---------------------|----------------------|------------------|--------------|
| `ckp:Kernel` | cco:Agent + BFO:0000040 | Workload, Service | One kernel -> one workload |
| `ckp:Action` | iao:PlanSpecification | Route rule `/action/*` | Actions exposed as API endpoints |
| `ckp:Instance` | iao:DataItem | Persistent volume (DATA loop) | Instances written to storage volume |
| `ckp:Edge` | cco:Artifact | Route subpath, volume mount | Edge dependencies as shared volumes |
| `ckp:GovernanceMode` | BFO:0000019 | Security policy | STRICT/RELAXED/AUTONOMOUS -> CORS/auth |
| `ckp:KernelType` | BFO:0000019 | Workload strategy | HOT -> process; INLINE -> config artifact; STATIC -> filer only |
| `ckp:ServingDisposition` | BFO:0000016 | Route rules | APIServing -> /action/; WebServing -> filer; NATSListening -> no gateway resource |
| `ckp:Project` | cco:Organization | CKProject custom resource | One project -> one namespace scope |

### What the Operator Does NOT Map

Resources without ontological basis are not created:

- No init containers (unauthorized foreign images)
- No sidecars (unless declared as edge kernel with COMPOSES predicate)
- No cluster-scoped resources (operator stays in namespace)
- No DNS records (external-dns handles that from route rule annotations)
- No secrets (identity provider operator handles identity secrets)
- No gateway resource (gateway-system boundary -- operator only creates route rules)

## Input: What the Operator Watches

### CKProject Custom Resource

```yaml
apiVersion: conceptkernel.org/v1
kind: CKProject
metadata:
  name: example-project
spec:
  domain: example.org
  storage: volume       # configmap | filer | volume
  gateway:
    parentRef:
      name: multi-domain-gateway
      namespace: gateway-system
```

### conceptkernel.yaml Fields

The operator reads from TBox only -- it never reads TOOL or DATA loop files:

| Field | DL Box | Drives |
|-------|--------|--------|
| `metadata.name` | TBox | Cluster resource naming |
| `kernel_class` | TBox | Filer path, volume naming |
| `qualities.type` | TBox | HOT/COLD/INLINE/STATIC -> workload strategy |
| `qualities.governance_mode` | TBox | Security policy generation |
| `spec.web.subdomain` | TBox | Route rule hostname |
| `spec.tool.runtime` | TBox | Whether to create workload |
| `spec.actions.unique` | TBox | Route rules for `/action/*` |
| `spec.edges.outbound` | TBox | Shared volume mounts, subpath routes |

## Output: What the Operator Creates

### Per-Kernel: Three Persistent Volumes

| DL Box | Volume Name | Filer Path | Access |
|--------|-------------|------------|--------|
| TBox | `ck-{conceptkernel}-ck` | `/ck/{project}/concepts/{conceptkernel}/` | ReadOnlyMany |
| RBox | `ck-{conceptkernel}-tool` | `/ck/{project}/concepts/{conceptkernel}/tool/` | ReadOnlyMany |
| ABox | `ck-{conceptkernel}-storage` | `/ck/{project}/concepts/{conceptkernel}/storage/` | ReadWriteMany |

### Per-Kernel: Route Rules

```
Gateway split routing:

/action/*   -> process (TOOL loop)
/cklib/*    -> filer (CK.Lib edge storage/web/)
/v{N}/*     -> filer (versioned DATA loop storage/web/v{N}/)
/*          -> filer (current DATA loop storage/web/)
```

### Per-Kernel: Security Policy

| GovernanceMode | CORS | Auth | Inter-Kernel |
|----------------|------|------|--------------|
| RELAXED | Allow `*.{domain}` | None (anon) | Open |
| STRICT | Specific origins only | JWT (identity provider) | JWT required |
| AUTONOMOUS | No CORS | mTLS (SPIFFE) | SVID required |

### Per-Kernel: Workload (HOT/COLD only)

Process filesystem follows CKP canonical tree:

```
/app/concepts/{conceptkernel}/
+-- conceptkernel.yaml              <- CK loop volume (ReadOnly)
+-- tool/                           <- TOOL loop volume (ReadOnly)
|   +-- processor.py
|   +-- cklib/                      <- Edge volume: CK.Lib (ReadOnly)
+-- storage/                        <- DATA loop volume (ReadWrite)
    +-- web/
    +-- instances/
    +-- proof/
    +-- ledger/
    +-- index/
    +-- llm/
```

### Edge Dependencies

| Edge Predicate | Cluster Resource | Mount |
|---------------|------------------|-------|
| EXTENDS | Volume mount (TOOL loop of target) | `tool/cklib/` or target tool path |
| COMPOSES | Route subpath to target's web | `/cklib/`, `/{edge-name}/` |
| TRIGGERS | (no cluster resource -- NATS-level) | -- |

## Reconciliation Loop

```
On CKProject or conceptkernel.yaml change:
|
+-- Read .ckproject -> domain, storage type, gateway parentRef
+-- Scan concepts/ -> list all conceptkernel.yaml
|
+-- For each kernel:
|   +-- Read conceptkernel.yaml (TBox only)
|   +-- Read serving.json (version routing)
|   +-- Determine kernel type (HOT/COLD/INLINE/STATIC)
|   +-- Compute desired state:
|   |   +-- Persistent volumes  (if storage: volume)
|   |   +-- Workload + Service  (if HOT or COLD)
|   |   +-- Route rules         (actions + versions + edges + web)
|   |   +-- Security policy     (from governance_mode)
|   |   +-- Edge volumes/routes (from edges.outbound)
|   |
|   +-- Diff against current cluster state
|   +-- Apply delta (create / update / delete)
|
+-- Record reconciliation as Instance with PROV-O provenance
|
+-- On kernel deleted:
    +-- Delete route rules, security policy
    +-- Delete workload, service
    +-- RETAIN persistent volumes (data preservation)
    +-- Record deletion instance with PROV-O
```

::: tip Data Preservation
When a kernel is deleted, the ABox (DATA loop) persistent volume is NEVER destroyed by the operator. Data is preserved.
:::

## NATS Harness

CK.Operator is a HotKernel -- it runs the standard NATS harness alongside the operator loop:

| NATS Topic | Direction | Payload |
|-----------|-----------|---------|
| `input.CK.Operator` | Subscribe | `{ action: "reconcile" }`, `{ action: "status" }`, `{ action: "rollback", kernel: "..." }` |
| `event.CK.Operator` | Publish | `{ event: "reconciled", project: "...", kernels: N }` |
| `event.CK.Operator` | Publish | `{ event: "kernel.deployed", kernel: "...", type: "HOT", version: "v2" }` |
| `event.CK.Operator` | Publish | `{ event: "kernel.deleted", kernel: "..." }` |
| `event.CK.Operator` | Publish | `{ event: "error", kernel: "...", reason: "..." }` |

## Versioning Roadmap

| Version | Scope |
|---------|-------|
| v3.5.1 | Persistent volume creation, route rules, security policy, workload for `storage: volume` projects |
| v3.5.2 | serving.json version routing, explicit `/v1/`, `/v2/` paths, deprecation announcements |
| v3.5.3 | Edge dependency volume management, inter-kernel security policy, COMPOSES/EXTENDS resolution |
| v3.5.4 | Compliance gate -- refuse to reconcile kernels that fail `check.ontology` |
| v3.6.0 | SPIFFE integration -- mTLS policies derived from grants block |

## CRD Definition

::: details CKProject CustomResourceDefinition
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: ckprojects.conceptkernel.org
spec:
  group: conceptkernel.org
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              required: [domain, storage]
              properties:
                domain:
                  type: string
                storage:
                  type: string
                  enum: [configmap, filer, volume]
                gateway:
                  type: object
                  properties:
                    parentRef:
                      type: object
                      properties:
                        name: { type: string }
                        namespace: { type: string }
  scope: Namespaced
  names:
    plural: ckprojects
    singular: ckproject
    kind: CKProject
    shortNames: [ckp]
```
:::
