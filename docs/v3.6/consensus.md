---
title: Consensus Loop
description: CK evolution through ontological governance -- propose, evaluate, approve, execute.
---

# Consensus Loop

## The Play

A developer does not edit a concept kernel's tool directly. They **talk to the kernel** via Claude Code (`/ck`), propose changes through **consensus**, and the kernel's ontology governs what changes are valid. The tool is a consequence of the ontology, not the other way around.

```
Developer (Claude Code)
    |
    v
  /ck {Kernel}                    <-- Talk to the CK loop
    |
    v
  Consensus (methodology)         <-- Propose, evaluate, agree on changes
    |
    v
  CK Loop mutation                <-- ontology.yaml, SKILL.md, conceptkernel.yaml updated
    |                               (git commit, version-controlled)
    v
  Task generation                 <-- Consensus produces tasks for TOOL changes
    |
    v
  Headless Claude Code            <-- Tasks executed against tool/processor.py
    |                               (claude -p or claude_agent_sdk)
    v
  Tool behaves per ontology       <-- Produces per ontology, notifies per ontology
    |
    v
  Ontological graph               <-- Edges as predicates, kernels as BFO:0000040 nodes
```

## Consensus.Services Methodology

Consensus is the governance process by which changes to a Concept Kernel are proposed, evaluated, and accepted. It operates at the CK loop level -- where identity, schema, and rules live.

**Consensus participants:**
- The **developer** (human, via Claude Code)
- The **kernel** (its CLAUDE.md identity, loaded as subagent)
- The **ontology** (rules.shacl, ontology.yaml -- what is structurally valid)
- **Composed kernels** (CK.ComplianceCheck, CK.Ontology -- what is semantically valid)

**Consensus produces:**
1. **CK loop changes** -- approved mutations to ontology.yaml, SKILL.md, conceptkernel.yaml, rules.shacl
2. **Tasks** -- concrete work items for TOOL loop implementation
3. **Provenance** -- `prov:Activity` record of what was decided, by whom, why

## CK Loop to Tasks to Tool

The result of consensus is a series of tasks. Each task is a scoped instruction for modifying the TOOL loop:

```yaml
task:
  id: T001-add-quality-scoring
  source: consensus
  consensus_record: "ckp://Instance#CK.Operator/consensus-2026-04-05T20:00:00Z"
  target: tool/processor.py
  instruction: >
    Add @on('quality.score') handler that computes quality metrics
    per ontology.yaml QualityScore class
  constraints:
    - "Output MUST validate against ontology.yaml QualityScore schema"
    - "MUST produce prov:wasGeneratedBy linking to this task"
    - "MUST emit event to event.{kernel}"
  executor: headless-claude-code
  status: pending
```

Tasks employ **headless Claude Code** to make changes:
- `claude -p` for batch edits (add handler, fix bug, refactor)
- `claude_agent_sdk` for complex multi-step changes (streaming, human-in-loop)

## Tasks as Versioned Artifacts

Tasks can be:
- **Evolved** -- refined through further consensus
- **Branched** -- split into subtasks for parallel work
- **Merged** -- combined when multiple tasks converge
- **Version-fixed** -- each task targets a specific kernel version (commit hash)

The current setup is version-fixed: a task applies to the kernel at a specific commit. If the kernel evolves, the task must be re-evaluated against the new version.

## The Tool Behaves According to Ontology

After consensus-driven tasks are executed:
- The tool **produces** according to `ontology.yaml` -- instance shapes, required fields, types
- The tool **notifies** according to `conceptkernel.yaml` -- NATS topics, event types
- The tool **validates** according to `rules.shacl` -- structural constraints
- The tool **composes** according to edges -- COMPOSES, TRIGGERS, PRODUCES predicates

The ontology is law. The tool is its executor.

## Ontological Graph

The fleet of concept kernels forms a directed graph:

```
Nodes:  Concept Kernels (BFO:0000040 Material Entity)
        -- independent computational entities
        -- each with sovereign CK/TOOL/DATA loops

Edges:  Predicates from conceptkernel.yaml
        -- COMPOSES: kernel A includes capabilities of B
        -- TRIGGERS: kernel A causes B to execute
        -- PRODUCES: kernel A generates input for B
        -- CONSUMES: kernel A reads output from B
        -- EXTENDS: kernel A adds capability to B

Weights: Governance mode determines edge behavior
        -- STRICT: all changes require consensus
        -- RELAXED: consensus recommended, not required
        -- AUTONOMOUS: kernel self-governs within ontological bounds
```

Each kernel is a **material entity** -- an independent node with its own identity, knowledge, and computational capacity. The graph is not a dependency tree -- it is a knowledge topology where predicates carry semantic meaning.

## The Full Loop

```
  +-------------------------------------------------------------+
  |                                                               |
  |   Developer talks to CK via Claude Code (/ck)                |
  |           |                                                   |
  |           v                                                   |
  |   Consensus evaluates proposal against:                       |
  |     * kernel identity (CLAUDE.md)                             |
  |     * ontology rules (ontology.yaml, rules.shacl)             |
  |     * fleet topology (edges, composed kernels)                |
  |     * compliance (CK.ComplianceCheck)                         |
  |           |                                                   |
  |           v                                                   |
  |   CK loop updated (git commit)                                |
  |     * ontology.yaml -- new/modified types                     |
  |     * SKILL.md -- new/modified actions                        |
  |     * conceptkernel.yaml -- new edges, grants                 |
  |           |                                                   |
  |           v                                                   |
  |   Tasks generated for TOOL loop                               |
  |     * Each task: instruction + constraints + executor         |
  |     * Headless Claude Code executes tasks                     |
  |           |                                                   |
  |           v                                                   |
  |   Tool behaves per ontology                                   |
  |     * Produces typed instances                                |
  |     * Notifies via NATS events                                |
  |     * Validates via SHACL                                     |
  |           |                                                   |
  |           v                                                   |
  |   Instances accumulate in DATA loop                           |
  |     * Knowledge grows                                         |
  |     * Developer observes, proposes next change                |
  |           |                                                   |
  |           +------- back to top --------------------------------+
```

## Conformance

- Changes to CK loop MUST go through consensus (STRICT governance) or MAY bypass (AUTONOMOUS)
- Consensus MUST produce a provenance record (`prov:Activity`)
- Tasks produced by consensus MUST reference the consensus record
- Task execution MUST validate output against the kernel's ontology
- The tool MUST behave according to the current ontology -- not a cached or previous version
- Edges between kernels MUST be declared in `conceptkernel.yaml` -- implicit dependencies are non-conformant
- Each kernel is a sovereign BFO:0000040 Material Entity -- no kernel can modify another's CK loop
