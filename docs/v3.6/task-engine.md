---
title: Task Execution Engine (Planned)
description: How consensus-produced tasks will be executed autonomously by headless Claude Code, validated against ontology, and sealed with full provenance.
---

# Task Execution Engine

::: warning Planned Feature
This feature is specified in SPEC.CKP.v3.5.4.delta.md (D7.3-D7.4) and planned for v3.5.15. It is not yet implemented. The consensus kernel (v3.5.11) can produce tasks, but they currently accumulate rather than executing automatically.
:::

## The Missing Link

The consensus loop (v3.5.11) produces approved tasks. The subagent (v3.5.8) proves that Claude Code can modify kernel files. But there is no automated bridge: tasks sit in the consensus output waiting for a human to manually execute them.

The Task Execution Engine closes this gap. It picks up approved tasks, executes them via headless Claude Code, validates the output against the kernel's ontology, and seals the result with full provenance linking back to the consensus decision.

## Architecture

```
CK.Consensus approve
    |
    v
Task stored in CK.Operator DATA loop
    |
    v
Task Executor picks up pending tasks
    |
    v
Headless Claude Code executes:
  - claude -p (batch) for simple edits
  - claude_agent_sdk (streaming) for complex multi-step changes
    |
    v
Output validated against kernel's ontology.yaml
    |
    v
If valid: seal instance, mark task complete
If invalid: mark task failed, return to consensus for re-evaluation
    |
    v
Full provenance chain:
  consensus decision -> task -> execution -> instance
```

## Task Queue

Tasks from consensus are stored as instances in the CK.Operator DATA loop:

```yaml
_id: "task-T001-add-quality-scoring"
source: consensus
consensus_record: "ckp://Instance#CK.Consensus/decision-2026-04-06T20:00:00Z"
target_kernel: Delvinator.Core
target_file: tool/processor.py
instruction: |
  Add @on('quality.score') handler that computes quality metrics
  per ontology.yaml QualityScore class
constraints:
  - "Output MUST validate against ontology.yaml QualityScore schema"
  - "MUST produce prov:wasGeneratedBy linking to this task"
  - "MUST emit event to event.{kernel}"
executor: headless-claude-code
status: pending
kernel_version: "abc123"  # git commit hash at time of consensus
created_at: "2026-04-06T20:00:00Z"
```

### Task States

| State | Meaning | Transition |
|-------|---------|------------|
| `pending` | Approved by consensus, awaiting execution | -> `executing` when picked up |
| `executing` | Claude Code is working on it | -> `validating` when done |
| `validating` | Output being checked against ontology | -> `complete` or `failed` |
| `complete` | Output validated, instance sealed | Terminal |
| `failed` | Output invalid or execution error | -> `pending` after re-evaluation |

## Execution Modes

Two execution modes, matching the streaming architecture (v3.5.9):

**Batch** (`claude -p`): For straightforward edits -- add a handler, fix a bug, refactor a function. The task instruction is the prompt. Constraints are injected as system rules. Output captured as a single blob.

**Streaming** (`claude_agent_sdk`): For complex multi-step changes where intermediate visibility matters. Stream events published to `stream.CK.Operator` so the web shell can show execution progress.

## Validation

After execution, the output is validated:

1. **Structural check**: Does the modified file parse correctly? (Python AST, YAML, etc.)
2. **Ontology check**: If the task produces instances, do they validate against ontology.yaml?
3. **SHACL check**: Do produced instances satisfy rules.shacl constraints?
4. **Constraint check**: Are all task-specified constraints met?

If any check fails, the task is marked `failed` with evidence. The consensus kernel can then re-evaluate the proposal or generate a revised task.

## Provenance Chain

The full chain from proposal to instance:

```
prov:Activity (consensus decision)
    prov:wasAttributedTo -> user who proposed
    prov:generatedAtTime -> decision timestamp
    prov:generated -> task

prov:Activity (task execution)
    prov:wasGeneratedBy -> consensus decision
    prov:used -> kernel's ontology.yaml, tool/processor.py
    prov:generated -> modified files, instances

prov:Entity (sealed instance)
    prov:wasGeneratedBy -> task execution
    prov:wasDerivedFrom -> original file state
    prov:wasAttributedTo -> CK.Operator (executor)
```

Every link is recorded. Every step is auditable.

## Version Fixing and Branching

Tasks are version-fixed to a specific kernel commit:

- The `kernel_version` field records the git commit hash at proposal time
- If the kernel evolves between proposal and execution, the task MUST be re-evaluated
- Tasks can be branched into subtasks for parallel work
- Tasks can be merged when multiple tasks converge on the same file

This prevents a common failure mode: task written against version A, executed against version B where the target code has changed. Version fixing catches this.

## Prerequisites

| Prerequisite | Version | Status |
|-------------|---------|--------|
| Consensus (task generation) | v3.5.11 | Deployed |
| Subagent (Claude Code execution) | v3.5.8 | Deployed |
| Streaming (execution visibility) | v3.5.9 | Deployed |
| Ontology validation | v3.5 | Available via CK.ComplianceCheck |

The remaining work is:
1. Task queue management in CK.Operator
2. Headless executor that picks up pending tasks
3. Validation pipeline (structural + ontology + SHACL + constraints)
4. Status tracking and failure handling
5. Version-fix enforcement
