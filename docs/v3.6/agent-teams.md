---
title: Agent Teams -- Multi-Kernel Coordination
description: How multiple concept kernels operate as concurrent Claude Code subagents, each with its own CK loop identity, working on coordinated tasks via NATS.
---

# Agent Teams -- Multi-Kernel Coordination

::: info Future Capability
This chapter describes a capability that requires Claude Code Agent Teams to stabilize. The CKP infrastructure is ready -- each kernel already has the identity files, NATS connectivity, and three-loop discipline that team agents need.
:::

## Beyond One Kernel at a Time

The [`/ck` command](./subagent) spawns a single subagent with one kernel's identity. This works for focused conversations: "talk to Core about its actions" or "ask ComplianceCheck to validate the fleet."

But real operational tasks involve multiple kernels:
- **Deploy a new feature**: ComplianceCheck validates the ontology, Operator deploys the kernel, Core aggregates the results
- **Governance review**: Consensus evaluates the proposal, ComplianceCheck validates constraints, CK.Claude provides AI review
- **Fleet migration**: Every kernel in the fleet needs its CK loop updated, validated, and redeployed

These tasks require coordination between kernels, not sequential conversations with individual ones.

## The /ck-team Command

```bash
# Spawn a team: three agents working in parallel
/ck-team ComplianceCheck Operator Delvinator.Core

# With a coordinating instruction
/ck-team ComplianceCheck Operator Core -- validate and deploy the new quality.score action
```

Each named kernel becomes a concurrent Claude Code subagent with its own identity and scope.

## Architecture

```
Parent Claude Code session
+-- Agent 1: CK.ComplianceCheck (validates)
+-- Agent 2: CK.Operator (deploys)
+-- Agent 3: Delvinator.Core (aggregates)
    |
    +-- Cross-kernel messaging via NATS
```

The parent session orchestrates the team. Each agent operates independently within its kernel's scope. Cross-kernel communication happens through the same NATS topics used by the deployed cluster.

## Per-Agent Identity

Each agent in the team loads its own CK loop, following the same awakening sequence as the single-agent `/ck` command:

| # | File | Purpose |
|---|---|---|
| 1 | `conceptkernel.yaml` | Identity, URN, actions, edges |
| 2 | `CLAUDE.md` | Behavioral instructions |
| 3 | `SKILL.md` | Action catalog |
| 4 | `ontology.yaml` | Data schema |
| 5 | `storage/memory/MEMORY.md` | Persistent memory |

Each agent operates under three-loop discipline:
- **CK loop**: Read-only -- the agent reads its identity but cannot modify it
- **TOOL loop**: Read-only -- the agent can read `tool/processor.py` to understand capabilities
- **DATA loop**: Writable -- the agent writes to `storage/` (instances, proof, memory)

Each agent works within its kernel directory. There is no shared writable path between agents.

## Cross-Kernel Messaging

Agents dispatch to each other via NATS using standard topics:

```
Agent 1 (ComplianceCheck) -> publishes to input.CK.Operator:
  { "action": "reconcile", "data": { "validationResult": "pass" } }

Agent 2 (CK.Operator) -> receives, processes, publishes to result.CK.Operator:
  { "event": "reconciled", "kernels": 6 }

Agent 3 (Delvinator.Core) -> subscribes to event.CK.Operator, sees reconciliation complete
```

This uses the same NATS topic topology as the deployed cluster. The agents do not need a special coordination protocol -- they communicate through the same channels that the live kernels use.

::: tip Same Channels, Same Identity
An agent team running locally on a developer's machine sends messages through the same NATS topics as the deployed kernels. This means a local ComplianceCheck agent can validate against the live cluster state, and a local Operator agent can trigger real reconciliation.
:::

## Coordination Protocol

The parent agent (the Claude Code main session) orchestrates the team through five steps:

### 1. Spawn

Parent spawns N agents with their respective CK loop contexts. Each agent receives:
- The kernel's full CK loop (identity, instructions, skills, ontology, memory)
- The coordinating instruction from the `/ck-team` invocation
- Access to the NATS connection for cross-kernel messaging

### 2. Independent Execution

Each agent works independently within its kernel scope. The parent does NOT coordinate the agents' internal work. Each agent is autonomous within its own identity -- the parent provides the task; the agents decide how to execute within their capabilities.

### 3. Result Collection

Parent collects results from all agents as they complete. Agents may finish at different times -- the parent waits for all to complete or timeout.

### 4. Memory Merge

Parent persists each agent's memory updates to their respective `storage/memory/MEMORY.md`. Each kernel's memory is updated independently -- there is no shared memory across agents.

### 5. Unified Report

Parent merges results from all agents into a unified summary for the user. The report shows which agents succeeded, what they produced, and any failures that need attention.

## Prerequisites

| Prerequisite | Status |
|---|---|
| Subagent (`/ck`) | Deployed |
| NATS bridge | Deployed |
| [Streaming](./streaming) | Deployed |
| Claude Code Agent Teams | Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |

The primary dependency is Claude Code Agent Teams stabilizing as a feature. The CKP infrastructure -- kernel identity files, NATS connectivity, three-loop discipline -- is ready.

### CLAUDE.md Requirements

Each kernel's `CLAUDE.md` must declare inter-kernel communication patterns for team coordination to work effectively. This includes:
- Which NATS topics the kernel publishes to and subscribes from
- Expected message formats for cross-kernel actions
- Completion signals that the parent agent monitors

## Design Considerations

::: details Architectural Questions

**Question:** How do agents avoid conflicting DATA loop writes?

**Answer:** Each agent writes to its OWN kernel's DATA loop. ComplianceCheck writes to `CK.ComplianceCheck/storage/`, Operator writes to `CK.Operator/storage/`, Core writes to `Delvinator.Core/storage/`. There is no shared writable path. Cross-kernel communication goes through NATS, not filesystem.

**Question:** Can agents in a team use EXTENDS?

**Answer:** Yes. If Delvinator.Core EXTENDS CK.Claude, the Core agent in the team has access to the `analyze` action. The EXTENDS resolution happens during CK loop loading, before the agent starts working.

**Question:** What happens if one agent in the team fails?

**Answer:** The parent agent detects the failure and can either retry the failed agent, redistribute the task, or report the partial result. The other agents are not affected -- they operate independently.

**Question:** How does this differ from the [Task Execution Engine](./task-engine)?

**Answer:** The Task Engine executes consensus-approved tasks headlessly -- no human in the loop. Agent Teams are interactive -- a developer spawns the team, monitors progress, and can intervene. The Task Engine is autonomous execution; Agent Teams are collaborative execution.
:::

## Conformance Requirements

| Criterion | Level |
|---|---|
| Each agent MUST load its own CK loop independently | REQUIRED |
| Cross-kernel communication MUST use standard NATS topics | REQUIRED |
| Three-loop discipline MUST apply per agent | REQUIRED |
| Parent MUST collect and merge memory updates | RECOMMENDED |
| Each agent MUST work within its own kernel directory | REQUIRED |
