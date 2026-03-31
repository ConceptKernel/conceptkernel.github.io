---
title: DATA Loop -- Knowledge and Production
description: The DATA loop is the memory organ of the Material Entity, holding everything the CK has created, verified, and come to know.
---

# DATA Loop: Knowledge and Production

> **DATA Loop -- What have I produced?**
>
> The DATA loop is the memory organ of the Material Entity. It is the accumulation of everything the CK has created, verified, and come to know. Instances live here. Proofs live here. The audit ledger lives here. LLM context lives here. The web surface lives here. Nothing is ever rewritten. The storage volume grows over time and is the CK's most valuable asset.

## The Instance Tree

Every tool execution that produces an output creates one instance folder. There are two instance kinds:

- **Sealed instances** (write-once from first write) -- used by all non-task CKs
- **Task instances** (lifecycle-managed via NATS, data.json sealed at completion) -- used by CK.Task

::: warning Write-Once Rule
`data.json` is **NEVER** modified after first write. This applies to both sealed instances and task instances. For task instances, lifecycle mutations (`pending -> in_progress -> completed`) are invoked via NATS and recorded append-only in `ledger.json`. The `data.json` is written exactly once at the `task.complete` NATS event.
:::

### Storage Tree

```
storage/

# -- SEALED INSTANCE (all non-task CKs) --
|- instance-<short-tx>/
|   |- manifest.json              # who, what, when, bindings
|   |- data.json                  # write-once output sealed on first write
|   |- proof.json                 # validation result (check-type actions)
|   +- ledger.json                # before/after for mutate-type actions

# -- TASK INSTANCE (CK.Task -- all 13 compliance checks apply equally) --
|- i-task-{conv_guid}/
|   |- manifest.json              # status, target_ck, goal_id, priority, order
|   |- conversation_ref.json      # { conv_guid, path } -- bidirectional link
|   |- data.json                  # write-once -- sealed at task.complete NATS event ONLY
|   |- ledger.json                # append-only state log -- all mutations via NATS
|   +- conversation/              # operate-type: append-only session records
|       |- c-{conv_id_1}.jsonl    #   first session
|       +- c-{conv_id_2}.jsonl    #   resumed session

# -- SHARED STORAGE --
|- proof/
|- ledger/
|   +- audit.jsonl
|- index/
|   |- by_timestamp.json
|   |- by_task_id.json
|   +- by_confidence.json
|- llm/
|   |- context.jsonl
|   |- memory.json
|   +- embeddings/
+- web/
```

### Task State Machine

Task lifecycle is driven entirely through NATS -- no direct file mutation from tooling:

```
pending -> NATS: input.{KernelName}  { action: task.start,    task_id: '...' }
                -> ledger.json appended: { before: pending, after: in_progress }

in_progress -> NATS: input.{KernelName} { action: task.update, delta: {...} }
                -> ledger.json appended: { before: {...}, after: {...} }

in_progress -> NATS: input.{KernelName} { action: task.complete, output: {...} }
                -> data.json written ONCE (sealed)
                -> ledger.json appended: { before: in_progress, after: completed }
                -> result.{KernelName} published
```

## Formal Task Description (v3.4)

A task instance is not a text description -- it is a typed entity with machine-executable formal properties:

```yaml
# CK.Task/storage/i-task-{ts}/task.yaml
type:           ckp:FormalTaskDescription
target_kernel:  ckp://Kernel#Finance.Employee:v1.0
goal:           ckp://Goal#G001:v1.0
order:          1                    # build-dependency sequence within goal

inputs:
  - conceptkernel.yaml
  - CLAUDE.md
  - SKILL.md

expected_outputs:
  - type: code_change
    target: conceptkernel.yaml

quality_criteria:
  - compliance_check: pass
  - syntax_valid: true

acceptance_conditions:
  - all_tests_pass: true
  - compliance_all: true

agent_requirements:
  - capability: code_edit
  - capability: file_read
  - capability: git_commit
```

::: info Enterprise Principle
A ticket requires human interpretation; a formal task description is directly executable by an autonomous agent. The `quality_criteria` and `acceptance_conditions` are what CK.ComplianceCheck validates.
:::

## PROV-O Provenance in Instance Records (v3.4)

Every instance record SHOULD include PROV-O provenance fields:

```json
{
  "instance_id":              "i-task-1773518402",
  "prov:wasGeneratedBy":      "ckp://Action#CK.Task.task.create-1773518402000",
  "prov:wasAssociatedWith":   "ckp://Actor#operator",
  "prov:wasAttributedTo":     "ckp://Kernel#CK.Agent:v1.0",
  "prov:generatedAtTime":     "2026-03-14T20:00:02Z",
  "prov:used": [
    "ckp://Kernel#Finance.Employee:v1.0/conceptkernel.yaml",
    "ckp://Kernel#Finance.Employee:v1.0/CLAUDE.md"
  ]
}
```

## Audience Profiles (v3.4)

Kernels serving web content write audience interaction events to their DATA loop. Each interaction creates or amends an audience profile instance:

```json
{
  "trust_state":          "Explorer",
  "topic_affinity": {
    "cymatics": 0.82,
    "generative_art": 0.65
  },
  "cognitive_style":       "systems-first",
  "depth_preference":      "expert-mode",
  "engagement_count":      14,
  "prov:wasAttributedTo":  "ckp://Kernel#ACME.Cymatics:v1.0"
}
```

Trust trajectory is implemented as `instance_mutability: amendments_allowed` -- the profile updates with each interaction, each update git-versioned.

## Instance Versioning and Mutation Policy (v3.3)

Git on the `storage/` volume makes instances natively versioned. The URI of an instance never changes -- the path is stable forever. What it resolves to depends on whether the consumer points to HEAD (always-latest) or pins a commit hash (frozen input).

### Mutability Declaration

The kernel's `ontology.yaml` declares the mutability policy:

```yaml
# ontology.yaml -- instance mutability declaration
instance_mutability: sealed               # default -- data.json never changes
instance_mutability: amendments_allowed   # additions permitted, proof rebuilt
instance_mutability: full_versioning      # data.json replaceable, full history kept
```

### Consumer Resolution Strategies

```
# Pattern A: always-latest (resolves to HEAD)
depends_on: ckp://Instance#i-task-{conv_guid}

# Pattern B: frozen input (pinned to commit hash)
depends_on: ckp://Instance#i-task-{conv_guid}@b2c1f4

# Pattern C: canary promotion on instance
storage/i-task-{conv_guid}/
  refs/
    stable -> commit b2c1   # original sealed state (95% consumers)
    canary -> commit f3a9   # amended state (5% consumers)
```

## Git Commit Frequency as Governance Signal (v3.3)

Commit frequency per file maps predictably to loop membership. A file accumulating commits at the wrong rate is a governance anomaly:

| Frequency Band | Files | Loop | If Violated |
|----------------|-------|------|-------------|
| High -- runtime accumulation | `storage/ledger.json`, `storage/llm/context.jsonl` | DATA | Expected -- append-only logs |
| Medium -- developer-paced | `CLAUDE.md`, `SKILL.md`, `CHANGELOG.md` | CK | Expected -- identity evolves gradually |
| Low -- stable foundation | `conceptkernel.yaml`, `ontology.yaml`, `rules.shacl` | CK | Flag if >20 commits -- schema churn is a smell |
| Variable -- tool development | `tool/*` | TOOL | Expected during active dev; low in production |
| Near-zero -- sealed outputs | `storage/i-*/data.json` (sealed) | DATA | Flag if >1-3 commits -- mutation policy may be violated |

## DATA Loop NATS Topics

```
ck.{guid}.data.written         # New instance written to storage/
ck.{guid}.data.indexed         # Index files updated
ck.{guid}.data.proof-generated # proof/ entry created
ck.{guid}.data.ledger-entry    # audit.jsonl appended
ck.{guid}.data.accessed        # storage/ read by another kernel (audit)
ck.{guid}.data.exported        # Dataset derived from storage/ for consumers
ck.{guid}.data.amended         # Instance amendment committed + proof rebuilt (v3.3)
```
