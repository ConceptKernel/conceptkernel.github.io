---
title: ConceptKernel Custom Resource Definition
description: The ConceptKernel CRD makes every kernel a first-class Kubernetes object with proof status, lifecycle phase, and native kubectl visibility.
---

# ConceptKernel Custom Resource Definition

## Purpose

Every Concept Kernel in a deployed project becomes a first-class Kubernetes resource. The ConceptKernel CRD exists because kernels are not mere deployment artifacts -- they are ontological entities with identity, proof status, and lifecycle state. Making them CRDs means standard Kubernetes tooling (`kubectl get ck`, `kubectl describe ck`) provides native visibility into the CKP fleet, and the Kubernetes API becomes a queryable index of kernel state alongside the ontological graph.

## CRD Schema

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
                  description: "Kernel deployment type per CKP type registry"
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

## Printer Columns

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

## Status Subresource

The status subresource is managed exclusively by [CK.Operator](./operator) via a kopf timer that re-verifies every 60 seconds.

| Condition | `.status.phase` |
|-----------|----------------|
| All proof checks pass | `Running` |
| Any proof check fails | `Degraded` |
| Pod not found | `Failed` |
| Deployment replicas = 0 | `Stopped` |
| Awaiting first verification | `Pending` |

This means `kubectl get ck` is always current. If a volume gets accidentally reconfigured or a deployment scales to zero, the CRD status reflects it within 60 seconds.

## Per-Kernel Resources

For each kernel declared in a project, CK.Operator creates:

| Resource | Name Pattern | Purpose |
|----------|-------------|---------|
| ConceptKernel CR | `{kernel-lower}` | First-class Kubernetes identity with proof in `.status` |
| Pod/Deployment | `{kernel-lower}` | Processor runtime (if `node:hot` or `node:cold`) |

## Example ConceptKernel Resource

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

## Conformance Requirements

| Criterion | Level |
|-----------|-------|
| CK.Operator MUST create a ConceptKernel resource per kernel in the project | REQUIRED |
| `.status.proof` MUST reflect actual verification results, not hardcoded values | REQUIRED |
| `kubectl get ck` MUST display: name, type, phase, checks, age | REQUIRED |
| Status re-verification MUST occur at least every 60 seconds | REQUIRED |
| The ConceptKernel CRD MUST be installed before any project deploy | REQUIRED |
