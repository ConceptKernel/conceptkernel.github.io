---
title: System Kernel Taxonomy
description: The five system kernel archetypes — Materialiser, Validator, Declarator, Capability, Governor — their identities, and the edge topology that connects them.
---

# System Kernel Taxonomy

## Platform as Fleet

CKP treats its own runtime as ontologically equal to the applications it hosts. System kernels are platform-level Material Entities in the `CK.*` namespace that provide the infrastructure on which domain kernels operate. The platform itself is a fleet of typed kernels, subject to the same compliance checks, provenance tracking, and governance rules as any domain kernel.

In this self-referential design, "platform code" and "application code" are both CKP citizens, governed by the same rules.

Every system kernel conforms to the same structural requirements as domain kernels: three-loop separation, eight awakening files, NATS topic topology, URN identity, and PROV-O attribution. The `CK.*` namespace prefix is reserved exclusively for platform kernels; domain kernels MUST NOT use this prefix.

## Five Archetypes

System kernels map to five functional archetypes. Each archetype corresponds to a distinct role in the CKP runtime.

| Archetype | System Kernel | `qualities.type` | Governance | Role |
|-----------|--------------|-------------------|------------|------|
| **Materialiser** | `CK.Operator` | `node:hot` | `AUTONOMOUS` | Converts ontological declarations into running infrastructure; reconciles desired state against actual cluster state |
| **Validator** | `CK.ComplianceCheck` | `node:hot` | `STRICT` | Validates fleet against the CKP specification; produces compliance reports as sealed instances |
| **Declarator** | `CK.Project` | `static` | `STRICT` | Declares projects (kernel collections under a shared domain); provides AuthConfig and storage configuration |
| **Capability Provider** | (project-specific) | `agent` | `AUTONOMOUS` | A kernel that provides a capability (LLM inference, search, transcoding, etc.) to other kernels via the [EXTENDS](./extends) predicate; maintains its own behavioural-template registry. Concrete provider kernels are project-specific and not part of the protocol specification. |
| **Governor** | `CK.Consensus` | `node:hot` | `STRICT` | Evaluates and approves proposed changes to kernel CK loops; generates tasks from approved decisions |

::: tip Runtime Libraries
The two runtime libraries (`CK.Lib.Py`, `CK.Lib.Js`) are not kernels in the ontological sense -- they are shared code artifacts mounted into kernel containers. They are specified alongside system kernels because they implement the server-side and client-side CKP contracts that all kernels depend on. See [CK.Project, CK.Lib.Py, and CK.Lib.Js](./project) for details.
:::

## System Kernel Identity Table

Each system kernel has a stable URN and kernel_id that persists across versions.

| Kernel | URN | BFO Type | NATS Input Topic |
|--------|-----|----------|------------------|
| `CK.Operator` | `ckp://Kernel#CK.Operator:v1.0` | `BFO:0000040` | `input.CK.Operator` |
| `CK.ComplianceCheck` | `ckp://Kernel#CK.ComplianceCheck:v1.0` | `BFO:0000040` | `input.CK.ComplianceCheck` |
| `CK.Project` | `ckp://Kernel#CK.Project:v1.0` | `BFO:0000040` | `input.CK.Project` |
| `CK.Consensus` | `ckp://Kernel#CK.Consensus:v1.0` | `BFO:0000040` | `input.CK.Consensus` |

All system kernels are typed as `BFO:0000040` (Material Entity) -- they are persistent, identifiable objects in the CKP ontology.

## Edge Topology Between System Kernels

System kernels form a connected graph. The edges encode the platform's own operational dependencies.

```
CK.Consensus
  |--- TRIGGERS ---> CK.ComplianceCheck
  |--- TRIGGERS ---> CK.Operator
  |--- EXTENDS ----> {capability provider}    # project-specific

CK.Operator
  |--- TRIGGERS ---> CK.ComplianceCheck
  |--- COMPOSES ---> CK.Project
```

| Source | Predicate | Target | Rationale |
|--------|-----------|--------|-----------|
| `CK.Operator` | `TRIGGERS` | `CK.ComplianceCheck` | After deploy, trigger fleet validation |
| `CK.Operator` | `COMPOSES` | `CK.Project` | Inherit project declaration actions |
| `CK.Consensus` | `TRIGGERS` | `CK.ComplianceCheck` | After approval, validate compliance |
| `CK.Consensus` | `TRIGGERS` | `CK.Operator` | After approval, reconcile changes |
| `CK.Consensus` | `EXTENDS` | (capability provider) | The protocol does not name a provider; deployments declare their own. |

::: tip Reading Edges
For a full explanation of what each predicate means and how edges compose actions, see [Edge Predicates and Action Composition](./edges).
:::

## Archetype Deep Dive

### Materialiser: CK.Operator

CK.Operator is the bridge between ontological declaration and physical infrastructure. It reads the declared state of a project and makes the Kubernetes cluster match. It is the only kernel that creates cluster resources.

- **Single rule:** If it is not in the ontology, it does not exist in the cluster
- **Dual entry:** NATS listener + kopf CRD watcher
- **11 actions:** `project.deploy`, `project.teardown`, `project.status`, `project.list`, `project.create`, `kernel.create`, `kernel.start`, `kernel.stop`, `kernel.spawn`, `status`, `ontology`

See [CK.Operator](./operator) for the full specification.

### Validator: CK.ComplianceCheck

CK.ComplianceCheck validates every kernel in the fleet -- including itself -- against the CKP specification, producing compliance reports as sealed instances with PROV-O provenance.

- **20 check types** covering identity, structure, edges, tools, web, grants, integrity, LLM, versions, NATS, ontology, instances, isolation, materialisation, SHACL, consensus, and provenance
- **Self-validating:** CK.ComplianceCheck validates itself during every fleet scan

See [Compliance Checking](./compliance) for the full specification.

### Declarator: CK.Project

CK.Project declares the existence, scope, and configuration of a project. It is a `static` kernel because it holds only declarations; it has no processor that executes actions at runtime.

- **Static type:** No runtime processor
- **AuthConfig:** Embeds OIDC identity provider configuration
- **Ontology publishing:** Each project publishes a Layer 2 ontology importing CKP Layer 1

See [CK.Project, CK.Lib.Py, and CK.Lib.Js](./project) for the full specification.

### Capability Provider (project-specific)

The CKP specification reserves the **Capability Provider** archetype for kernels that supply a runtime capability (LLM inference, search, transcoding, simulation, etc.) to other kernels via the EXTENDS edge predicate. The protocol does not name a specific provider kernel — concrete providers are project-specific deployments. A capability-provider kernel typically:

- declares `qualities.type: agent` (long-running subscriber, supports streaming, multi-turn sessions)
- maintains its own behavioural-template registry under `data/templates/` (or an equivalent provider-defined path)
- honours the EXTENDS dispatch contract documented in [EXTENDS Predicate](./extends)

A consumer kernel that EXTENDS a provider gains new actions backed by that provider's runtime, with a behavioural template selected per edge. See [EXTENDS Predicate](./extends) for the predicate semantics and the dispatch contract.

### Governor: CK.Consensus

CK.Consensus evaluates and approves proposed changes to kernel CK loops, generating tasks from approved decisions. Consensus deployments often EXTEND a capability provider for AI-assisted review (using a strict-auditor template), but doing so is a deployment choice, not part of the protocol.

- **STRICT governance:** All changes require consensus approval
- **Triggers downstream:** After approval, triggers both CK.ComplianceCheck (validate) and CK.Operator (reconcile)

See [Consensus](./consensus) for the full specification.

## Conformance Requirements

| Criterion | Level |
|-----------|-------|
| System kernels MUST use the `CK.*` namespace prefix | REQUIRED |
| System kernels MUST pass all applicable CK.ComplianceCheck check types | REQUIRED |
| Domain kernels MUST NOT use the `CK.*` namespace prefix | REQUIRED |
| System kernels MUST follow the same three-loop separation as domain kernels | REQUIRED |
| Each system kernel MUST have a stable URN and kernel_id across versions | REQUIRED |
