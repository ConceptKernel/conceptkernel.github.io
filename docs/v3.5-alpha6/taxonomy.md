---
title: System Kernel Taxonomy
description: Platform Material Entities in the CK.* namespace -- four enterprise archetypes and the full system kernel catalog.
---

# System Kernel Taxonomy

System kernels are platform Material Entities in the `CK.*` namespace. Each follows the same three-loop structure as domain kernels.

## Enterprise Kernel Archetypes (v3.4)

v3.4 maps system kernels to four enterprise kernel archetypes:

| Enterprise Archetype | CKP Kernels | qualities.type | Enterprise Role |
|---------------------|-------------|----------------|-----------------|
| **Executor** | CK.Task, CK.Workflow | node:hot | Receives formal task description, executes playbook, writes sealed instance with PROV-O trace |
| **Registrar** | CK.Discovery, CK.Ontology | service | Publishes fleet capability catalog; answers fleet.catalog queries; maintains semantic registries |
| **Monitor** | CK.ComplianceCheck, CK.Probe | service | Validates fleet against spec; detects anomalies; executes SHACL reactive rules; health monitoring |
| **Personaliser** | (domain kernels) | node:cold | Adapts content per audience profile; writes i-audience-{session}/ instances; serves web/ surface |
| **Universal Operator** | CK.Agent | agent | Reads any kernel context, executes tasks, manages conversations -- inhabits any archetype |

::: info CK.Agent
CK.Agent is the universal operator -- it can inhabit any archetype by loading the target kernel's context. A `LOCAL.*` prefix means it runs without SPIFFE and is never deployed to the cluster.
:::

## System Kernel Catalog

| Kernel Class | Purpose | Tool Form | Primary DATA Output |
|-------------|---------|-----------|---------------------|
| **CK.Create** | Scaffolds new CK -- 3 volumes, 3 git repos, 8 awakening files, .ck-guid, apiVersion v3, compliance check on mint | bash | New CK directory tree |
| **CK.Artifact** | C-P-A triplet: compile tool -> Wasm, push to registry, apply CK custom resource | bash | CK custom resource in cluster |
| **CK.Validate** | SHACL validation of instances before storage write | Wasm | proof.json |
| **CK.LinkCreate** | 3-way predicate handshake -- creates PredicateKernelInstance | Wasm | Predicate storage instance |
| **CK.IndexBuild** | Rebuilds index/ for a given CK's storage | Wasm | Updated index/ files |
| **CK.Query** | Federated query across all CK storage volumes via URN resolver + filesystem scan | Wasm | Query result set |
| **CK.AuditFinal** | Verifies git graph integrity, symlinks, proofs across local storage | bash | Audit report in ledger/ |
| **CK.Project** | Defines federated namespace -- the project identity root | bash | Project instance in storage/ |
| **CK.ComplianceCheck** | Fleet validator -- 13 check types (v3.3 adds check.mutation_frequency) | Python | check.report instance (proof.json per check) |
| **CK.Task** | Task lifecycle manager -- pending->in_progress->completed; NATS-only mutations; conv_guid as instance folder name | Python | storage/i-task-{conv_guid}/ with sealed data.json |
| **CK.Goal** | Goal manager -- owner priority, spans multiple CKs, groups tasks | Python | Goal instance in storage/ referencing task IDs |
| **CK.Discovery** | Fleet discovery -- kernel list, health status, namespace catalog | Python | Fleet status instance |
| **CK.Agent** | Agent kernel -- reads fleet context, builds action plans, executes tasks, manages conversations bound to tasks/goals | agent | Conversation sessions in CK.Task instances |

## Goal -> Task -> Conversation Hierarchy

v3.2 adds a three-level work management hierarchy spanning the fleet. v3.4 maps this to the enterprise's unlimited autonomous directions model.

::: tip Direction = Goal
A Goal IS a direction -- a formally-typed autonomous pursuit with a declared goal state, kernel agents assigned to pursue it, resources allocated by priority, and a termination condition that the compliance engine can evaluate. This is not a JIRA board. It is a machine-executable autonomous pursuit.
:::

| Level | Kernel | BFO Type | Storage | Key Properties |
|-------|--------|----------|---------|----------------|
| Goal | CK.Goal | BFO:0000040 (continuant) | CK.Goal/storage/ | Owner-assigned priority; spans multiple CKs; groups tasks |
| Task | CK.Task | BFO:0000040 + lifecycle | CK.Task/storage/i-task-{conv_guid}/ | Targets one CK; build-order within goal; pending->in_progress->completed |
| Conversation | CK.Task | BFO:0000015 (occurrent) | task/conversation/c-{conv_id}.jsonl | Append-only; bound to task; resumable -- new file per session |

```
Goal (CK.Goal -- continuant, owner priority, spans CKs)
 +-- Task (CK.Task -- continuant instance with lifecycle)
      +-- manifest.json          status, target_ck, goal_id, priority, order
      +-- conversation_ref.json  { conv_guid, path }
      +-- conversation/          occurrent records
      |    +-- c-{id_1}.jsonl   first session
      |    +-- c-{id_2}.jsonl   resumed session
      +-- ledger.json            state transitions (NATS-driven, append-only)
      +-- data.json             sealed at task.complete (write-once)
```
