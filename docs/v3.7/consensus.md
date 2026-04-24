---
title: CK.Consensus -- Ontological Governance
description: How changes to concept kernels go through proposal, evaluation, and approval -- governed by the ontology, enforced by SHACL, and recorded as prov:Activity.
---

# CK.Consensus -- Ontological Governance

## The Core Principle

A developer does not edit a concept kernel's tool directly. They **talk to the kernel** via Claude Code (`/ck`), propose changes through **consensus**, and the kernel's ontology governs what changes are valid. The tool is a consequence of the ontology, not the other way around.

This inverts the typical development flow:

| Traditional | CKP Consensus |
|-------------|---------------|
| Edit code, then update docs | Propose change to ontology, then generate code |
| Code review catches design issues | Ontology review catches design issues BEFORE code exists |
| CI validates after commit | Consensus validates before commit |
| Documentation drifts from code | Ontology IS the code's schema -- drift is a compliance failure |

## The Consensus Loop

```
Developer (Claude Code)
    |
    v
  /ck {Kernel}                    -- Talk to the CK loop
    |
    v
  CK.Consensus propose            -- Submit change proposal
    |
    v
  CK.Consensus evaluate           -- Evaluate against ontology + SHACL + fleet
    |
    v
  CK.Consensus approve            -- Generate tasks for TOOL changes
    |
    v
  Headless Claude Code             -- Execute tasks against tool/processor.py
    |
    v
  Tool behaves per ontology        -- Produces typed instances
    |
    v
  Instances accumulate             -- Knowledge grows in DATA loop
    |
    v
  Developer observes, proposes     -- Back to top
```

## CK.Consensus Kernel

CK.Consensus is a system kernel (`node:hot`, STRICT governance) with five actions:

| Action | Access | Description |
|--------|--------|-------------|
| `propose` | auth | Submit a change proposal for a target kernel |
| `evaluate` | auth | Evaluate a proposal against ontology, SHACL, and fleet topology |
| `approve` | auth | Approve an evaluated proposal, generate tasks |
| `decisions` | anon | List all consensus decisions with provenance |
| `review` | auth | Review a pending proposal (uses CK.Claude strict-auditor) |

### Edges

CK.Consensus declares three outbound edges:

| Target | Predicate | Rationale |
|---|---|---|
| `CK.ComplianceCheck` | `TRIGGERS` | Validate proposals against CKP compliance (20 check types) |
| `CK.Operator` | `TRIGGERS` | Reconcile changes after tasks complete |
| `CK.Claude` | `EXTENDS` | AI review of proposals via `strict-auditor` persona |

The EXTENDS edge to CK.Claude means CK.Consensus gains a `review` action that uses Claude with the `strict-auditor` persona -- zero speculation, evidence-only verdicts. The TRIGGERS edges create the governance pipeline: proposals are validated by ComplianceCheck and, once approved and executed, reconciled by the Operator.

## Propose

Any change to a kernel's CK loop goes through a formal proposal. The proposal declares what to change, where, and why:

```yaml
proposal_id: "P-a1b2c3d4"
proposer: "ckp://Actor#developer.peter"
target_kernel: "Delvinator.Core"
change_type: "action_add"
specification:
  action_name: "quality.score"
  action_type: "inspect"
  access: "auth"
  description: "Compute quality score for an entity"
rationale: "Exchange analysis reveals recurring quality assessment patterns
  that should be formalised as an action"
```

The `rationale` field is important -- it records the **why** behind the change. This becomes part of the [provenance](./provenance) chain, enabling future auditors to understand the reasoning behind every evolution.

### Change Types

| Type | What Changes | CK Loop Files Affected |
|------|-------------|----------------------|
| `action_add` | New action on the kernel | SKILL.md, conceptkernel.yaml (spec.actions) |
| `action_modify` | Change existing action | SKILL.md, conceptkernel.yaml |
| `edge_add` | New edge to another kernel | conceptkernel.yaml (spec.edges) |
| `ontology_update` | New or modified classes | ontology.yaml |
| `skill_update` | Behavioral instruction changes | SKILL.md |
| `claude_md_update` | Agent context changes | CLAUDE.md |
| `shacl_update` | New validation constraints | rules.shacl |

## Evaluate

The evaluation phase subjects the proposal to **four validation layers**. All four must pass for the proposal to be approved:

### 1. Ontological Validity

Does the proposed change conform to the target kernel's `ontology.yaml`? An action that references undefined classes is rejected. If the proposal adds a `quality.score` action that produces `QualityScore` instances, does `ontology.yaml` define `QualityScore`? If not, the ontology must be updated as part of the proposal.

### 2. Constraint Compliance

Does the change satisfy `rules.shacl`? A new edge to a non-existent kernel violates structural constraints. If `rules.shacl` requires all instances to have `prov:wasGeneratedBy`, does the proposal include provenance generation?

### 3. Fleet Topology

Does the change create orphan references, circular dependencies, or broken edge targets? If the proposal adds an edge to `CK.Auth`, does `CK.Auth` exist in the fleet? Topology validation prevents changes that would make the fleet inconsistent.

### 4. CKP Compliance (20 Check Types)

The proposal is validated against the full compliance suite via the TRIGGERS edge to CK.ComplianceCheck. This catches issues that the first three layers miss:
- Missing awakening files
- Invalid NATS topic declarations
- Version conflicts
- Governance mode violations
- [Provenance](./provenance) field completeness

### Verdict

| Verdict | Meaning | Next Step |
|---------|---------|-----------|
| `pass` | Proposal is structurally valid, constraint-compliant, and topologically consistent | Proceed to approve |
| `fail` | Proposal violates ontology, SHACL, or fleet topology | Reject with evidence |
| `needs_revision` | Proposal is partially valid but requires amendments | Return to proposer |

## Approve

Approved proposals generate tasks. Each task is a concrete work item with an instruction, a target file, constraints, and an executor:

```yaml
decision_id: "D-e5f6g7h8"
proposal_id: "P-a1b2c3d4"
verdict: "pass"
tasks_generated:
  - task_id: "T-i9j0k1l2"
    target_file: "concepts/Delvinator.Core/tool/processor.py"
    instruction: "Add @on('quality.score') handler that computes quality
      score per ontology.yaml QualityScore schema"
    constraints:
      - "Output MUST validate against ontology.yaml QualityScore class"
      - "MUST produce prov:wasGeneratedBy linking to this task"
    executor: "headless-claude-code"
    version_pin: "abc123"         # git commit hash
prov:wasGeneratedBy: "ckp://Action#CK.Consensus/evaluate-{ts}"
prov:wasAttributedTo: "ckp://Actor#developer.peter"
prov:generatedAtTime: "2026-04-05T10:00:00Z"
```

Tasks flow to the [Task Execution Engine](./task-engine) for automated execution via headless Claude Code. See the task engine documentation for the full lifecycle (pending, executing, completed, failed), task operations (split, evolve, merge), and version pinning details.

## Provenance: Every Decision Is a prov:Activity

Every consensus decision produces a provenance record:

```yaml
prov:Activity:
  id: "ckp://Instance#CK.Consensus/decision-2026-04-06T20:00:00Z"
  prov:wasAttributedTo: "user:peter@conceptkernel.org"
  prov:generatedAtTime: "2026-04-06T20:00:00Z"
  prov:wasGeneratedBy: "ckp://Action#CK.Consensus/evaluate"
  prov:used:
    - "ckp://Kernel#Delvinator.Core:v1.0/ontology.yaml"
    - "ckp://Kernel#CK.ComplianceCheck:v1.0/check.all"
  decision:
    verdict: pass
    target_kernel: Delvinator.Core
    change_type: action_add
    proposal_hash: "sha256:..."
```

The provenance chain is complete and auditable:
- **Who** proposed the change (`prov:wasAttributedTo`)
- **When** the decision was made (`prov:generatedAtTime`)
- **What** was evaluated (`prov:used` -- links to ontology and compliance results)
- **How** the decision was reached (`prov:wasGeneratedBy` -- the evaluate action)

Tasks generated from the decision carry `prov:wasGeneratedBy` linking back to the consensus record. Instances produced by task execution carry `prov:wasGeneratedBy` linking to the task. The chain is unbroken: proposal -> decision -> task -> instance.

## The Full Picture: Ontology Is Law

After consensus-driven tasks are executed, the tool behaves according to the ontology:

| Aspect | Governed By | Enforcement |
|--------|------------|-------------|
| **Produces** | ontology.yaml | Instance shapes, required fields, types |
| **Notifies** | conceptkernel.yaml | NATS topics, event types |
| **Validates** | rules.shacl | Structural constraints on instances |
| **Composes** | edges | COMPOSES, TRIGGERS, PRODUCES, CONSUMES, EXTENDS predicates |

The ontology is not documentation. It is the schema. The tool is its executor. Consensus is the gate between intent and implementation.

## Governance Mode Interaction

Consensus behavior depends on the target kernel's governance mode:

| Kernel Governance | Consensus Requirement |
|---|---|
| **STRICT** | All CK loop changes MUST go through consensus |
| **RELAXED** | Structural changes (actions, edges, ontology) MUST go through consensus; documentation changes (SKILL.md, CLAUDE.md) MAY be direct |
| **AUTONOMOUS** | MAY bypass consensus; SHOULD still produce [PROV-O](./provenance) records |

This means CK.ComplianceCheck (STRICT governance) requires consensus for every change, while a development kernel with RELAXED governance can iterate faster on documentation without governance overhead. Even AUTONOMOUS kernels should record provenance -- the audit trail matters even when governance is relaxed.

The governance mode is declared in `conceptkernel.yaml` -- the developer sets the rules, consensus enforces them.

## Architectural Consistency Check

::: details Logical Analysis: Consensus Design

**Question:** Is consensus overkill for small changes?

**Answer:** The consensus loop is as lightweight as the change. A small change (add one action) produces a small proposal, a quick evaluation, and one task. The overhead is the provenance record -- about 20 lines of YAML. The benefit is auditability: every change to every kernel has a traceable decision. For RELAXED kernels, consensus is optional -- the overhead only applies when governance demands it.

**Question:** What prevents the consensus kernel itself from being modified without consensus?

**Answer:** CK.Consensus has STRICT governance, which means changes to CK.Consensus must go through... CK.Consensus. This is deliberately self-referential. The bootstrap case (initial CK.Consensus deployment) is handled by the operator, which creates the kernel from a template. After that, all changes are self-governed.

**Question:** How does headless Claude Code execution work in practice?

**Answer:** Currently, tasks are executed via `claude -p` (batch mode) or `claude_agent_sdk` (streaming). The task instruction is the prompt. The constraints are injected as system-level rules. Claude makes the code changes, and the output is validated against the kernel's ontology before sealing. This is the v3.5.15 (Task Execution Engine) feature -- currently at the design stage.

**Gap identified:** The evaluate step checks against the target kernel's current ontology. But if the proposal includes an `ontology_update`, the new ontology does not exist yet at evaluation time. The evaluator must speculatively validate against the proposed ontology -- a form of dry-run that is not yet implemented. Currently, ontology_update proposals are evaluated only for structural validity (valid YAML, valid LinkML), not for semantic consistency with the fleet.

**Gap identified:** CK.Consensus is specified but the task execution pipeline (v3.5.15) is not yet implemented. Proposals can be evaluated and approved, but tasks currently accumulate rather than executing automatically. This is the next major planned feature.
:::

## Conformance Requirements

- Changes to CK loop MUST go through consensus (STRICT governance)
- AUTONOMOUS kernels MAY bypass consensus
- Consensus MUST produce a prov:Activity record for every decision
- Tasks produced by consensus MUST reference the consensus decision via `prov:wasGeneratedBy`
- Task execution MUST validate output against the kernel's ontology
- The tool MUST behave according to the current ontology -- not a cached or previous version
- Edges between kernels MUST be declared in `conceptkernel.yaml` -- implicit dependencies are non-conformant
- Each kernel is a sovereign BFO:0000040 Material Entity -- no kernel can modify another's CK loop
