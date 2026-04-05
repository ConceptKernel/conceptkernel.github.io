---
title: CK as Claude Code Subagent
description: Every Concept Kernel becomes a Claude Code subagent via the /ck skill.
---

# CK as Claude Code Subagent

## Motivation

Every Concept Kernel already carries its own behavioral instructions (`CLAUDE.md`), action catalog (`SKILL.md`), identity (`conceptkernel.yaml`), and data schema (`ontology.yaml`). These are the exact inputs a Claude Code subagent needs to assume the kernel's identity and capabilities. The CK loop IS the agent's context.

## The Bridge

Claude Code's `Agent` tool spawns a subprocess with a prompt constructed from the kernel's CK loop files:

```
Agent(
  prompt = """
  You are {metadata.name} ({metadata.urn}).

  {contents of CLAUDE.md}

  Your actions (from SKILL.md):
  {contents of SKILL.md}

  Your ontology (data schema):
  {summary of ontology.yaml classes}

  Your edges:
  {edges from conceptkernel.yaml}

  Your persistent memory:
  {contents of storage/memory/MEMORY.md}

  The user's request: {user_message}

  ## Three-Loop Discipline
  - CK loop is READ-ONLY
  - TOOL loop is READ-ONLY
  - DATA loop (storage/) is WRITABLE
  """
)
```

## File Loading Order

The subagent prompt MUST load CK loop files in this order:

| Order | File | Purpose | Required |
|-------|------|---------|----------|
| 1 | `conceptkernel.yaml` | Identity: URN, type, actions, edges, grants | MUST |
| 2 | `CLAUDE.md` | Behavioral instructions, self-check protocol | MUST |
| 3 | `SKILL.md` | Action catalog with parameters and examples | MUST |
| 4 | `ontology.yaml` | Data schema for instances | SHOULD |
| 5 | `storage/memory/MEMORY.md` | Persistent cross-session memory | MAY |

## Three-Loop Discipline for Subagents

| Loop | Subagent Access | What |
|------|----------------|------|
| CK | **Read-only** | CLAUDE.md, SKILL.md, conceptkernel.yaml, ontology.yaml, rules.shacl |
| TOOL | **Read-only** | tool/processor.py -- can read to understand capabilities, never modify |
| DATA | **Read-write** | storage/ -- can create instances, write memory, append ledger |

The subagent MUST NOT modify CK loop files. Evolution of CLAUDE.md and SKILL.md happens through a controlled commit process (see [Consensus](/v3.6/consensus)).

## Invocation

From Claude Code CLI:

```bash
# Talk to CK.Operator
/ck Operator

# Ask a specific kernel to do something
/ck ComplianceCheck -- validate the delvinator fleet

# Talk to a domain kernel
/ck Delvinator.Core -- what actions do you support?
```

## Kernel Resolution

The skill resolves kernel names by searching concept directories:

```
Search paths (in order):
  1. {CK_ROOT}/{name}/conceptkernel.yaml
  2. {CK_ROOT}/CK.{name}/conceptkernel.yaml
  3. {CK_ROOT}/*{name}*/conceptkernel.yaml (fuzzy)

CK_ROOT resolution:
  1. $CK_CONCEPTS_DIR env var
  2. ./concepts/ (relative to workspace)
  3. ~/git/delve_workspace/concepts/
```

## Memory Persistence

After the subagent completes, the parent agent:

1. Checks output for a `MEMORY_UPDATE` section
2. Appends it to `{kernel}/storage/memory/MEMORY.md` (DATA loop, writable)
3. Memory persists across sessions -- next invocation gets full context

This follows the three-loop model: memory is DATA, not CK. The kernel remembers what it learned without modifying its identity.

## CK Loop Evolution

A developer using Claude Code locally can evolve a kernel's CLAUDE.md, SKILL.md, or ontology.yaml through conversation. But these are CK loop files -- read-only at runtime. The evolution must go through a controlled commit process:

1. Developer talks to kernel via `/ck` (subagent reads CK loop)
2. Conversation identifies improvement (e.g., "add a new action")
3. Subagent proposes change to CLAUDE.md/SKILL.md (outputs as diff/suggestion)
4. Developer approves (human in the loop)
5. Parent agent writes the change (local filesystem, git tracked)
6. `git commit + push` (version controlled)
7. Filer sync (manual or CI) (propagates to cluster)
8. CK.Operator reconcile (picks up new version)

The subagent cannot modify its own CK loop. But the **parent agent** (Claude Code main session) CAN write to the local filesystem. This maintains three-loop separation.

## NATS Bridge (Optional)

The subagent MAY dispatch actions to the live kernel process via NATS:

```bash
# From within the subagent, dispatch to the running kernel
python3 -c "
import asyncio, json, nats
async def send():
    nc = await nats.connect('nats://localhost:4222')
    await nc.publish('input.CK.Operator',
        json.dumps({'action': 'status'}).encode())
    await nc.drain()
asyncio.run(send())
"
```

## Conformance

- Every Concept Kernel MUST have CLAUDE.md and SKILL.md in its CK loop
- The subagent MUST load identity files in the order specified above
- The subagent MUST NOT modify CK loop files
- The subagent MAY write to the DATA loop (storage/)
- Memory updates MUST be written to `storage/memory/MEMORY.md`, not to `CLAUDE.md`
- CK loop evolution MUST go through git (version controlled, auditable)
