---
title: CK Loop Evolution and Multi-Model Configuration
description: How the CK loop evolves through consensus workflow and how model selection works across 3 precedence levels.
---

# CK Loop Evolution and Multi-Model Configuration

## Why Evolution Needs a Workflow

The CK loop is **read-only at runtime**. An agent cannot edit `conceptkernel.yaml` during execution any more than a deployed container can rewrite its own image. But kernels must evolve -- ontologies grow, actions expand, skills sharpen. The answer is a governed workflow where changes are proposed, validated, approved, and applied through a controlled pipeline that preserves the three-loop invariant.

The rationale for this workflow rather than direct editing is **traceability**: every change to a kernel's identity has a provenance chain linking it to a decision, a task, and an actor. This makes the kernel's evolution history auditable.

## Evolution Workflow

The workflow has five steps:

### Step 1: Subagent Proposes Change

A developer working in a `/ck` session identifies a needed evolution. The subagent formulates a proposal specifying the target file, change type, and specification.

```
Developer -> /ck Delvinator.Core
  "We need a quality.score action"
  Subagent formulates proposal:
    target_file: conceptkernel.yaml
    change_type: action_add
    specification: { name: quality.score, type: inspect, access: auth }
```

### Step 2: Parent Session Writes the Change

The parent Claude Code session -- not the subagent -- performs the file edit. This respects the three-loop discipline: the agent (TOOL loop) proposes, the platform (parent session) writes.

::: tip Three-Loop Discipline
The subagent MUST NOT modify CK loop files. It proposes changes as output; the parent agent applies them with human approval. This separation prevents self-referential instability and governance violations.
:::

### Step 3: Git Commits the Change

The change is committed with a message referencing the proposal. The commit hash becomes the version pin for the change.

### Step 4: Filer Sync Propagates

Git changes are synced to SeaweedFS filer. The new version becomes available for mounting into kernel containers.

### Step 5: Operator Reconciles

CK.Operator detects the changed `conceptkernel.yaml` or `ontology.yaml`. Reconciliation creates updated resources. The ConceptKernel CR status reflects the new state.

```
Subagent proposes -> Parent writes -> Git commits
  -> Filer sync -> Operator reconciles -> New version live
```

## Change Types and Governance Levels

Not all changes require the same governance overhead. The change type determines the governance level:

| Change Type | Target Files | Governance Level |
|---|---|---|
| `action_add` | `conceptkernel.yaml` (spec.actions) | **STRICT** -- requires consensus |
| `action_remove` | `conceptkernel.yaml` (spec.actions) | **STRICT** -- requires consensus |
| `edge_add` | `conceptkernel.yaml` (spec.edges) | **STRICT** -- requires consensus |
| `ontology_update` | `ontology.yaml` | **STRICT** -- requires consensus |
| `skill_update` | `SKILL.md` | **RELAXED** -- direct edit allowed |
| `claude_md_update` | `CLAUDE.md` | **RELAXED** -- direct edit allowed |
| `memory_update` | `data/memory/MEMORY.md` | **AUTONOMOUS** -- agent writes freely |

::: info Governance Hierarchy
Files that define kernel identity (actions, edges, ontology) require consensus. Files that refine behavior (skills, instructions) allow direct editing. Files that accumulate knowledge (memory) are freely writable. This hierarchy reflects the severity of change: identity changes have fleet-wide consequences; memory changes are local.
:::

## Version Pinning

Every CK loop mutation is tied to a specific git commit. Version pinning is project-wide: the project's `.ckproject` manifest holds a SHA1 pin for each of the 3 organs (`ck/`, `tool/`, `data/`) per kernel version. [CK.Operator](./operator) reads the manifest and materializes the kernel at those exact commits. Rolling back means editing the manifest, not rewriting git history — instant, reversible, and auditable. See [Versioning](./versioning) for the full storage model and [CK.Project](./project) for the manifest itself.

## Multi-Model Configuration

CK.Claude supports multiple LLM models and effort levels, configurable per persona and per action. The rationale is cost-performance optimization: a simple `check.identity` verification can use a low-effort haiku call, while a complex `analyze` action may require high-effort opus.

### Three Precedence Levels

Model selection follows a strict precedence chain, with each level overriding the one above:

| Level | Source | Example |
|---|---|---|
| **1. CK.Claude default** | `conceptkernel.yaml` qualities | `default_model: sonnet`, `default_effort: medium` |
| **2. Persona template** | `data/personas/{name}.yaml` | `model: sonnet`, `effort: high` |
| **3. EXTENDS edge config** | Source kernel's `conceptkernel.yaml` | `constraints.model: opus`, `constraints.effort: max` |

Edge-level constraints always win. This means the source kernel (the domain kernel that owns the action) has final say over which model executes its actions.

```yaml
# Level 1: CK.Claude default (conceptkernel.yaml)
qualities:
  default_model: sonnet
  default_effort: medium

# Level 2: Persona template (data/personas/strict-auditor.yaml)
model: sonnet
effort: high

# Level 3: EXTENDS edge config (source kernel's conceptkernel.yaml)
edges:
  outbound:
    - target_kernel: CK.Claude
      predicate: EXTENDS
      config:
        constraints:
          model: opus
          effort: max
```

### CLI Flag Mapping

Model and effort settings map directly to Claude Code CLI flags:

| Setting | CLI Flag | Values |
|---|---|---|
| `model` | `--model` | `haiku`, `sonnet`, `opus` (aliases) or full model name |
| `effort` | `--effort` | `low`, `medium`, `high`, `max` |
| `tools` | `--tools` | Tool list or `""` to disable tools |
| `json_schema` | `--json-schema` | JSON schema for structured output |

### Structured Output via JSON Schema

For actions that require structured output (classification, extraction, scoring), the EXTENDS config declares a `json_schema`:

```yaml
config:
  constraints:
    json_schema: |
      {
        "type": "object",
        "properties": {
          "category": {"type": "string"},
          "confidence": {"type": "number"},
          "evidence": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["category", "confidence"]
      }
```

This maps to `claude -p --json-schema '{...}'`, ensuring the LLM output validates against the specified schema before being sealed as an instance.

### No API Keys

All LLM calls go through `claude -p` (non-interactive mode) or `claude_agent_sdk`. No API keys are required -- authentication uses the Claude Code CLI's existing auth mechanism. This design decision eliminates key management as a deployment concern.

::: tip Zero Key Management
CKP never stores, rotates, or manages API keys. The Claude Code CLI handles authentication. Kernels invoke Claude through the CLI, not through direct API calls. This means deploying a new kernel with LLM capability requires zero credential provisioning.
:::

## Persona Template Library

CK.Claude maintains a library of persona templates in `data/personas/`. Each persona shapes how Claude behaves when a kernel EXTENDS CK.Claude:

| Persona | System Prompt Summary | Model | Temperature |
|---|---|---|---|
| `analytical-reviewer` | Precise, evidence-based analysis | sonnet | 0.1 |
| `strict-auditor` | CKP compliance verification | sonnet | 0.0 |
| `creative-explorer` | Open-ended ideation and brainstorming | opus | 0.7 |
| `code-implementer` | Focused code generation and editing | sonnet | 0.1 |
| `documentation-writer` | Technical writing, specification authoring | sonnet | 0.3 |

Persona templates are stored in the target kernel's DATA loop (writable), allowing them to evolve through use. New personas can be added without modifying CK.Claude's CK loop.

## Conformance Requirements

| Criterion | Level |
|---|---|
| CK loop modifications MUST follow the evolution workflow | REQUIRED |
| STRICT governance changes MUST pass through [CK.Consensus](./consensus) | REQUIRED |
| Every CK loop change MUST be committed to git with a traceable reference | REQUIRED |
| Only versions pinned in the project's `.ckproject` manifest MUST be mounted | REQUIRED |
| Memory updates (DATA loop) MAY be written directly by agents | PERMITTED |
| Model selection MUST follow the three-level precedence chain | REQUIRED |
| Edge-level constraints MUST override persona-level settings | REQUIRED |
| All LLM calls MUST go through Claude Code CLI (`claude -p`) or the Claude Code SDK (`claude_agent_sdk`); direct API calls with self-managed API keys are PROHIBITED | REQUIRED |
| Structured output SHOULD use `--json-schema` for validation | RECOMMENDED |
