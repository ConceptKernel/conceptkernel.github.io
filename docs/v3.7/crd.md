---
title: Custom Resource Definitions (ConceptKernel and CKProject)
description: The ConceptKernel CRD makes every kernel a first-class Kubernetes object; the CKProject CRD projects the .ckproject manifest onto the Kubernetes control plane. Both provide native kubectl visibility into the CKP fleet.
---

# Custom Resource Definitions

v3.7 publishes two CRDs:

| CRD | API Group / Kind | shortname | Purpose |
|---|---|---|---|
| [ConceptKernel](#conceptkernel-crd) | `conceptkernel.org/v1` / `ConceptKernel` | `ck` | One CR per kernel in a deployed project. Carries identity, proof status, and lifecycle phase. |
| [CKProject](#ckproject-crd) | `ck.tech.games/v1` / `CKProject` | `ckp` | One CR per project. Cluster-side projection of the project's `.ckproject` manifest. Drives CK.Operator reconciliation. |

The two groups are intentionally separate: `conceptkernel.org` is the canonical CKP group for kernel-level resources; `ck.tech.games` scopes project-level orchestration resources under a deployment-specific domain. A conformant cluster MUST install both CRDs before any project deploy.

## ConceptKernel CRD

### Purpose

Every Concept Kernel in a deployed project becomes a first-class Kubernetes resource. The ConceptKernel CRD exists because kernels are not mere deployment artifacts -- they are ontological entities with identity, proof status, and lifecycle state. Making them CRDs means standard Kubernetes tooling (`kubectl get ck`, `kubectl describe ck`) provides native visibility into the CKP fleet, and the Kubernetes API becomes a queryable index of kernel state alongside the ontological graph.

### CRD Schema

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: conceptkernels.conceptkernel.org
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
              required: [kernelClass, type]
              properties:
                kernelClass:
                  type: string
                  description: "Fully qualified kernel class name (e.g., Delvinator.Core)"
                type:
                  type: string
                  enum: ["node:hot", "node:cold", "inline", "static", "agent"]
                  description: "Kernel deployment type per CKP type registry. `agent` kernels are long-running, conversational, persistent NATS subscribers that support multi-turn sessions, streaming via stream.{kernel}, and a behavioural-template registry served from their DATA organ. They are typically used as capability providers reached via the EXTENDS edge predicate (see extends.md)."
                governance:
                  type: string
                  enum: ["STRICT", "RELAXED", "AUTONOMOUS"]
                  description: "Governance mode per CKP governance registry"
                edges:
                  type: array
                  items:
                    type: object
                    properties:
                      target:
                        type: string
                        description: "Target kernel class name"
                      predicate:
                        type: string
                        description: "Edge predicate (COMPOSES, EXTENDS, TRIGGERS, PRODUCES, LOOPS_WITH)"
                  description: "Outbound edges declared in conceptkernel.yaml"
            status:
              type: object
              properties:
                phase:
                  type: string
                  enum: ["Pending", "Running", "Degraded", "Failed", "Stopped"]
                  description: "Current lifecycle phase"
                proof:
                  type: object
                  properties:
                    totalChecks:
                      type: integer
                      description: "Total number of proof checks executed"
                    totalPassed:
                      type: integer
                      description: "Number of checks that passed"
                    chainValid:
                      type: boolean
                      description: "Whether the proof hash chain is intact"
                    lastVerified:
                      type: string
                      description: "ISO-8601 timestamp of last verification"
                volumes:
                  type: object
                  description: "Volume mount status for CK, TOOL, and DATA loops"
      subresources:
        status: {}
      additionalPrinterColumns:
        - name: Type
          type: string
          jsonPath: .spec.type
          description: "Kernel type"
        - name: Phase
          type: string
          jsonPath: .status.phase
          description: "Current phase"
        - name: Checks
          type: string
          jsonPath: .status.proof.totalPassed
          description: "Passed proof checks"
        - name: Age
          type: date
          jsonPath: .metadata.creationTimestamp
  scope: Namespaced
  names:
    plural: conceptkernels
    singular: conceptkernel
    kind: ConceptKernel
    shortNames: [ck]
```

### Printer Columns

The `additionalPrinterColumns` provide at-a-glance fleet status via `kubectl`:

```
$ kubectl get ck -n ck-delvinator
NAME                TYPE        PHASE     CHECKS   AGE
delvinator-core     node:cold   Running   7        3d
ck-compliancecheck  node:hot    Running   7        3d
ck-operator         node:hot    Running   7        3d
```

| Column | JSON Path | Purpose |
|--------|-----------|---------|
| Type | `.spec.type` | Hot/cold/inline/static deployment type |
| Phase | `.status.phase` | Running/Degraded/Failed/Stopped/Pending |
| Checks | `.status.proof.totalPassed` | How many proof checks pass |
| Age | `.metadata.creationTimestamp` | Standard Kubernetes age |

### Status Subresource

The status subresource is managed exclusively by [CK.Operator](./operator) via a kopf timer that re-verifies every 60 seconds.

| Condition | `.status.phase` |
|-----------|----------------|
| All proof checks pass | `Running` |
| Any proof check fails | `Degraded` |
| Pod not found | `Failed` |
| Deployment replicas = 0 | `Stopped` |
| Awaiting first verification | `Pending` |

This means `kubectl get ck` is always current. If a volume gets accidentally reconfigured or a deployment scales to zero, the CRD status reflects it within 60 seconds.

### Per-Kernel Resources

For each kernel declared in a project, CK.Operator creates:

| Resource | Name Pattern | Purpose |
|----------|-------------|---------|
| ConceptKernel CR | `{kernel-lower}` | First-class Kubernetes identity with proof in `.status` |
| Pod/Deployment | `{kernel-lower}` | Processor runtime (if `node:hot` or `node:cold`) |

### Example ConceptKernel Resource

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

::: tip Cross-Reference
For the full reconciliation lifecycle that creates these resources, see [Reconciliation Lifecycle](./reconciliation). For proof verification details, see [Proof Verification](./proof).
:::

---

## CKProject CRD

### Purpose

The CKProject CR is the cluster-side projection of the project's `.ckproject` manifest (see [CK.Project](./project) for the manifest itself). CK.Operator reconciles this CR: reading `spec.versions` to determine which kernels to materialise at which commits, and writing materialisation state and proof status back to `.status`.

There is exactly one CKProject CR per project. It lives in the project's Kubernetes namespace (`ck-{serving.subdomain}`) and is created either by `kubectl apply -f ckproject.yaml` or by CK.Operator from the `.ckproject` manifest at project bootstrap.

### CRD Schema

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: ckprojects.ck.tech.games
spec:
  group: ck.tech.games
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          required: [spec]
          properties:
            spec:
              type: object
              required: [hostname, storage, gateway, versions]
              properties:
                hostname:
                  type: string
                  description: "Fully-qualified project hostname (e.g., delvinator.tech.games). Drives DNS, namespace naming, and filer path prefixes."
                domain:
                  type: string
                  description: "DNS domain (e.g., tech.games). Optional — derivable from hostname."
                serving:
                  type: object
                  description: "Serving configuration. Optional — subdomain derivable from hostname."
                  properties:
                    subdomain:
                      type: string
                      description: "Subdomain prefix (e.g., delvinator). Namespace derived as ck-{subdomain}."
                storage:
                  type: string
                  enum: ["volume", "filer", "configmap"]
                  description: "Deployment method for kernel organs."
                gateway:
                  type: object
                  required: [parentRef]
                  properties:
                    parentRef:
                      type: object
                      required: [name, namespace]
                      properties:
                        name:
                          type: string
                          description: "Kubernetes Gateway API gateway name."
                        namespace:
                          type: string
                          description: "Gateway namespace."
                backends:
                  type: object
                  description: "Backend endpoint declarations."
                  properties:
                    nats:
                      type: object
                      properties:
                        endpoint:
                          type: string
                          description: "NATS TCP endpoint (e.g., nats://nats.nats.svc:4222)."
                        wssEndpoint:
                          type: string
                          description: "NATS WebSocket-Secure endpoint for browser clients."
                auth:
                  type: object
                  description: "OIDC identity provider configuration. See auth.md for the full schema."
                  properties:
                    provider: { type: string, enum: ["keycloak", "none"] }
                    realm: { type: string }
                    client_id: { type: string }
                    issuer_url: { type: string }
                    create_realm: { type: boolean }
                    redirect_uris: { type: array, items: { type: string } }
                    web_origins: { type: array, items: { type: string } }
                versions:
                  type: array
                  description: "One entry per deployed version of the project."
                  items:
                    type: object
                    required: [name, kernels]
                    properties:
                      name:
                        type: string
                        description: "Version tag (semver, e.g., v1.3.19)."
                      route:
                        type: string
                        description: "HTTPRoute path prefix for this version (e.g., '/' or '/next')."
                      data:
                        type: string
                        enum: ["isolated", "shared"]
                        description: "DATA-organ isolation policy across versions of the same kernel."
                      kernels:
                        type: array
                        items:
                          type: object
                          required: [name, pins]
                          properties:
                            name:
                              type: string
                              description: "Kernel class name (e.g., Delvinator.Core)."
                            pins:
                              type: object
                              required: [ck, tool]
                              description: "SHA1 commit pins per organ. See CK.Project §Pin Semantics."
                              properties:
                                ck:
                                  type: string
                                  description: "SHA1 commit hash for ck/ organ materialisation."
                                tool:
                                  type: string
                                  description: "SHA1 commit hash for tool/ organ materialisation."
                                data:
                                  type: string
                                  description: "SHA1 commit hash for initial data/ seed. Optional."
            status:
              type: object
              properties:
                phase:
                  type: string
                  enum: ["Pending", "Running", "Degraded", "Failed", "Stopped", "PartiallyRunning"]
                  description: "Aggregate project phase across all versions."
                versions:
                  type: object
                  description: "Per-version materialisation state, keyed by version name."
                  additionalProperties:
                    type: object
                    properties:
                      phase: { type: string }
                      kernelsReady: { type: integer }
                      kernelsTotal: { type: integer }
                      lastMaterialised: { type: string, format: date-time }
                proof:
                  type: object
                  description: "Aggregate proof summary across all kernels in all versions."
                  properties:
                    totalChecks: { type: integer }
                    totalPassed: { type: integer }
                    chainValid: { type: boolean }
                    lastVerified: { type: string, format: date-time }
                conditions:
                  type: array
                  description: "Standard Kubernetes-style conditions."
                  items:
                    type: object
                    properties:
                      type: { type: string }
                      status: { type: string, enum: ["True", "False", "Unknown"] }
                      reason: { type: string }
                      message: { type: string }
                      lastTransitionTime: { type: string, format: date-time }
      subresources:
        status: {}
      additionalPrinterColumns:
        - name: Hostname
          type: string
          jsonPath: .spec.hostname
        - name: Phase
          type: string
          jsonPath: .status.phase
        - name: Versions
          type: string
          jsonPath: .status.versions
          description: "Per-version phase summary"
        - name: Checks
          type: string
          jsonPath: .status.proof.totalPassed
        - name: Age
          type: date
          jsonPath: .metadata.creationTimestamp
  scope: Namespaced
  names:
    plural: ckprojects
    singular: ckproject
    kind: CKProject
    shortNames: [ckp]
```

### Example CKProject Resource

```yaml
apiVersion: ck.tech.games/v1
kind: CKProject
metadata:
  name: delvinator
  namespace: ck-delvinator
spec:
  hostname: delvinator.tech.games
  domain: tech.games
  serving:
    subdomain: delvinator
  storage: volume
  gateway:
    parentRef:
      name: multi-domain-gateway
      namespace: gateway-system
  backends:
    nats:
      endpoint: nats://nats.nats.svc:4222
      wssEndpoint: wss://stream.tech.games
  auth:
    provider: keycloak
    realm: techgames
    client_id: ck-web
    issuer_url: https://id.tech.games/realms/techgames
  versions:
    - name: v1.3.19
      route: /
      data: isolated
      kernels:
        - name: Delvinator.Core
          pins:
            ck:   "abc123f..."
            tool: "aaa111..."
            data: "ccc333..."
status:
  phase: Running
  versions:
    v1.3.19:
      phase: Running
      kernelsReady: 1
      kernelsTotal: 1
      lastMaterialised: "2026-04-24T12:00:00Z"
  proof:
    totalChecks: 20
    totalPassed: 20
    chainValid: true
    lastVerified: "2026-04-24T12:00:00Z"
```

### CKProject Printer Columns

```
$ kubectl get ckp -A
NAMESPACE        NAME         HOSTNAME                 PHASE     CHECKS   AGE
ck-delvinator    delvinator   delvinator.tech.games    Running   20       3d
ck-hello         hello        hello.tech.games         Running   14       1d
```

### CKProject Conformance Requirements

| Criterion | Level |
|-----------|-------|
| Every deployed project MUST have exactly one CKProject CR in its namespace | REQUIRED |
| `spec.hostname`, `spec.storage`, `spec.gateway.parentRef`, and `spec.versions` MUST be present | REQUIRED |
| Each `versions[].kernels[].pins` MUST declare `ck` and `tool` SHA1 commit hashes; `data` is OPTIONAL | REQUIRED |
| The CKProject CR MUST be the cluster-side projection of the project's `.ckproject` manifest — they MUST NOT diverge | REQUIRED |
| `.status` MUST reflect actual materialisation and proof state; no hardcoded values | REQUIRED |
| Status re-verification MUST occur at least every 60 seconds | REQUIRED |

---

## Combined Conformance Requirements

| Criterion | Level |
|-----------|-------|
| Both `conceptkernels.conceptkernel.org` and `ckprojects.ck.tech.games` CRDs MUST be installed before any project deploy | REQUIRED |
| CK.Operator MUST create a ConceptKernel resource per kernel in every deployed project version | REQUIRED |
| `.status.proof` on both CRDs MUST reflect actual verification results, not hardcoded values | REQUIRED |
| `kubectl get ck` MUST display: name, type, phase, checks, age | REQUIRED |
| `kubectl get ckp` MUST display: name, hostname, phase, checks, age | REQUIRED |
| Status re-verification MUST occur at least every 60 seconds on both CRDs | REQUIRED |
