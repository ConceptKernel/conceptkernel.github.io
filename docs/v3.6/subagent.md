---
title: CK as Claude Code Subagent
description: How /ck spawns a Claude Code subagent loaded with a kernel's identity, actions, ontology, and memory -- and why the CK loop IS the agent context.
---

# CK as Claude Code Subagent

## The Insight: The CK Loop IS the Agent Context

Every Concept Kernel already carries the exact files a Claude Code subagent needs to assume an identity:

| CK Loop File | Agent Equivalent |
|-------------|------------------|
| `conceptkernel.yaml` | System identity (name, URN, type, edges) |
| `CLAUDE.md` | Behavioral instructions |
| `SKILL.md` | Action catalog with parameters and examples |
| `ontology.yaml` | Data schema -- what the agent can produce |
| `data/memory/MEMORY.md` | Persistent cross-session memory |

There is no translation layer. The files that define the kernel's identity in the three-loop model are the same files that define the agent's prompt. This is why `/ck Operator` can spawn a subagent that IS the CK.Operator kernel -- not a simulation of it, but the same identity loaded into a different runtime.

## The /ck Command

The `/ck` command loads a named kernel's CK loop into the current Claude Code session. This is not a plugin architecture -- it is subagent spawning, where the parent Claude Code session creates a child agent whose context is the kernel's CK loop.

The rationale for subagent integration rather than a separate CLI is **locality of reasoning**: the developer's conversation already has project context, file awareness, and memory. Loading a kernel's CK loop into that conversation adds domain-specific knowledge without losing the ambient context.

From the Claude Code CLI:

```bash
# Talk to the operator
/ck Operator

# Ask a specific kernel to do something
/ck ComplianceCheck -- validate the delvinator fleet

# Talk to a domain kernel
/ck Delvinator.Core -- what actions do you support?
```

The `/ck` command triggers the `ck-agent` skill, which:

1. **Resolves** the kernel name to a concept directory
2. **Loads** CK loop files in the awakening sequence order
3. **Constructs** a subagent prompt from the loaded files
4. **Spawns** a Claude Code `Agent` subprocess with the prompt
5. **Captures** the agent's output, including any memory updates
6. **Persists** memory updates to `data/memory/MEMORY.md`

### 8-File Loading Order

The loading order is deterministic and specified. Each file serves a distinct purpose in the subagent context:

```
/ck Delvinator.Core

Loading order:
  1. conceptkernel.yaml     -- identity, URN, type, governance, actions, edges
  2. CLAUDE.md              -- behavioural instructions (how to think)
  3. SKILL.md               -- action catalog (what to do)
  4. ontology.yaml          -- data schema (what things are)
  5. rules.shacl            -- validation constraints (what's allowed)
  6. data/memory/MEMORY.md -- persistent memory (what's been learned)
  7. data/tasks/          -- pending tasks (what needs doing)
  8. changelog              -- recent changes (what's happened)
```

After loading, the agent responds within the kernel's identity: it uses the kernel's terminology, respects its governance mode, and constrains its outputs to the kernel's ontology.

### Kernel Resolution

The skill resolves kernel names through a multi-path search:

```
Search paths (in order):
  1. {CK_ROOT}/{name}/conceptkernel.yaml           -- exact match
  2. {CK_ROOT}/CK.{name}/conceptkernel.yaml        -- CK. prefix
  3. {CK_ROOT}/Delvinator.{name}/conceptkernel.yaml -- namespace prefix
  4. {CK_ROOT}/*{name}*/conceptkernel.yaml          -- fuzzy glob

CK_ROOT resolution:
  1. $CK_CONCEPTS_DIR environment variable
  2. ./concepts/ relative to workspace
  3. ~/git/delve_workspace/concepts/
```

This means `/ck Operator` resolves to `CK.Operator`, `/ck Core` resolves to `Delvinator.Core`, and `/ck Hello` resolves to `Hello.Greeter`. The fuzzy resolution allows natural conversation without requiring exact class names.

### Prompt Construction

The subagent prompt is built from CK loop files in strict awakening order:

```markdown
You are {kernel_class} ({urn}).
Type: {qualities.type} | Governance: {governance_mode}

## Identity
{contents of CLAUDE.md}

## Actions
{contents of SKILL.md}

## Edges
{formatted edges from conceptkernel.yaml}

## Data Schema
{formatted classes from ontology.yaml}

## Memory
{contents of data/memory/MEMORY.md, or "No memory yet."}

## Three-Loop Rules
- CK loop files are READ-ONLY (CLAUDE.md, SKILL.md, conceptkernel.yaml,
  ontology.yaml, rules.shacl, serving.json)
- TOOL loop is READ-ONLY (tool/processor.py)
- DATA loop is WRITABLE (data/ -- instances, proof, ledger, memory)
- You may suggest changes to CK loop files, but output them as
  proposals for the parent agent to apply

## User Request
{user_message}
```

## Three-Loop Discipline for Subagents

The subagent operates under the same separation axiom as the runtime:

| Loop | Subagent Access | What |
|------|----------------|------|
| CK | **Read-only** | CLAUDE.md, SKILL.md, conceptkernel.yaml, ontology.yaml, rules.shacl |
| TOOL | **Read-only** | tool/processor.py -- can read to understand capabilities, never modify |
| DATA | **Read-write** | data/ -- can create instances, write memory, append ledger |

The subagent MUST NOT modify CK loop files. This is not just a rule in the prompt -- it reflects the physical volume separation. In the cluster, the CK volume is `ReadOnlyMany`. In the subagent, the same discipline applies through instruction.

### Why the Subagent Cannot Modify Its Own Identity

If the subagent could edit `CLAUDE.md`, it would be modifying its own behavioral instructions -- the equivalent of rewriting your own brain's instruction set during execution. This creates two problems:

1. **Self-referential instability.** Changes to CLAUDE.md change the subagent's behavior, which changes what it writes to CLAUDE.md, creating an infinite loop.
2. **Governance violation.** Under STRICT governance, CK loop changes must go through consensus. Letting the runtime modify its own identity bypasses the governance model entirely.

The solution is a clean separation of powers: the subagent can PROPOSE changes (output them as suggestions), but the PARENT agent (the Claude Code main session) applies them with human approval.

## Memory Persistence

Each kernel has persistent memory at `data/memory/MEMORY.md`. This file survives across Claude Code sessions, providing continuity. The agent SHOULD read memory at session start and SHOULD update it with significant learnings at session end.

After the subagent completes, the parent agent:

1. Checks output for a `MEMORY_UPDATE` section
2. Appends it to `{kernel}/data/memory/MEMORY.md` (DATA loop -- writable)
3. Next invocation of `/ck {kernel}` includes the accumulated memory

Memory is part of the **DATA loop** (writable), not the CK loop (read-only). This is intentional: memory accumulates knowledge, which is a data concern. Identity (CK loop) changes only through [governed evolution](./evolution).

This means:
- Memory accumulates across sessions -- each `/ck Operator` call gets all previous memories
- Memory is stored alongside instances and proofs -- it is part of the kernel's knowledge
- Memory can be inspected, versioned, and rolled back using standard git tools on the DATA loop

## CK Loop Evolution: Local Authoring, Remote Commit

When a developer conversation identifies a needed change (e.g., "add a new action"), the evolution workflow is:

```
1. Developer talks to kernel via /ck              (subagent reads CK loop)
2. Conversation identifies improvement             (e.g., "add quality.score action")
3. Subagent proposes change as diff/suggestion     (CK loop is read-only for subagent)
4. Developer approves                               (human in the loop)
5. Parent agent writes the change                   (local filesystem, git-tracked)
6. git commit + push                                (version controlled)
7. Filer sync (manual or CI)                        (propagates to cluster)
8. CK.Operator reconcile                            (picks up new version)
```

The key principle: no LLM runs in the cloud for this workflow. LOCAL.ClaudeCode enriches kernel definitions locally, commits to git, syncs to the filer, and the deployed kernels pick up the changes.

## NATS Bridge (Optional)

The subagent MAY dispatch actions to the live kernel process via NATS:

```bash
# From within the subagent, dispatch to the running kernel
nats pub input.CK.Operator '{"action": "status"}'
```

This bridges local development and the deployed cluster. The subagent running locally can invoke actions on the live kernel, see results in the web shell, and verify behavior without redeployment.

## What Can Be Evolved Through /ck

| File | Evolves How | Example |
|------|-------------|---------|
| `CLAUDE.md` | Add behavioral instructions, refine self-check protocol | "Add awareness of the new auth system" |
| `SKILL.md` | Add/modify action descriptions, parameters, examples | "Add a kernel.scale action" |
| `conceptkernel.yaml` | Add actions, edges, grants | "Add COMPOSES edge to CK.Auth" |
| `ontology.yaml` | Add/modify instance types, attributes | "Add AuthEvent class" |
| `rules.shacl` | Add validation constraints | "Require email on user instances" |

All changes go through git -- version controlled, auditable, rollback-able. The subagent proposes; the developer approves; git records.

## Multi-Root Search and Storage

The ck-agent skill creates `data/memory/` directories for all discovered kernels, ensuring the DATA loop writable path exists even for kernels that have never been invoked as subagents.

Multi-root search covers:
- `$CK_CONCEPTS_DIR` -- explicit override
- `./concepts/` -- workspace-relative
- `~/git/delve_workspace/concepts/` -- fallback to reference workspace

## Architectural Consistency Check

::: details Logical Analysis: Subagent Architecture

**Question:** Is the subagent the same as the deployed kernel?

**Answer:** No. The subagent runs locally with Claude Code tools (Read, Edit, Bash, etc.). The deployed kernel runs in a container with a Python processor and NATS subscriptions. They share the same IDENTITY (CK loop files) but have different CAPABILITIES (different TOOL loops). This is architecturally correct -- the CK loop defines who the kernel is, not where it runs.

**Question:** Can the subagent produce instances?

**Answer:** Yes. The subagent writes to `data/` (DATA loop), which IS the instance store. However, instances produced by the subagent are not sealed in the same way as runtime instances -- they lack the NATS event trail and the proof chain. This is a known gap. A future version should generate lightweight proof records for subagent-produced instances.

**Question:** What happens if two developers use `/ck Core` simultaneously?

**Answer:** Each Claude Code session spawns its own subagent. Both read the same CK loop (identity is shared, read-only). Both write to the same DATA loop (data/memory/). This creates a potential memory conflict -- the last writer wins. This is acceptable for the current single-developer model but will need addressing in the multi-user sessions feature (v3.5.14).

**Gap identified:** The subagent does not currently validate instances against `rules.shacl` before writing to storage. In the deployed runtime, the processor validates via SHACL before sealing. The subagent skips this step. This means subagent-produced instances may not conform to the kernel's constraints.
:::

## Subagent Context Building

When spawning a subagent, the parent session calls `build_context()` from CK.Lib.Py, which assembles the complete CK loop into a structured payload:

```python
context = build_context(
    ck_dir="/path/to/concepts/Delvinator.Core",
    context_items=["identity", "claude_md", "skill_md", "ontology", "memory", "tasks", "edges"]
)
# Returns: { identity, claude_md, skill_md, ontology, memory_md, tasks, edges, loop }
# loop: maps each item to its filesystem path
```

The `context_items` parameter controls what gets loaded, allowing lightweight context for simple queries vs. full context for complex operations. For a quick status check, loading only `identity` and `skill_md` may suffice. For a governance proposal, the full context including `ontology`, `memory`, and `edges` is needed.

## Conformance Requirements

| Criterion | Level |
|---|---|
| `/ck` MUST load the kernel's CK loop in the specified 8-file order | REQUIRED |
| Agents MUST NOT modify CK loop files during normal operation | REQUIRED |
| Memory MUST persist in the DATA loop at `data/memory/MEMORY.md` | REQUIRED |
| Context building MUST use `build_context()` or equivalent | REQUIRED |
| Agents MUST respect the kernel's governance mode | REQUIRED |
| Every Concept Kernel MUST have CLAUDE.md and SKILL.md in its CK loop | REQUIRED |
| The parent agent MAY modify CK loop files with human approval | PERMITTED |
