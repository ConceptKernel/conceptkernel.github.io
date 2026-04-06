---
title: Agent Teams -- Multi-Kernel Coordination (Planned)
description: How multiple concept kernels will operate as concurrent Claude Code subagents, each with its own identity, working on coordinated tasks.
---

# Agent Teams

::: warning Planned Feature
This feature is specified in SPEC.CKP.v3.5.4.delta.md (D3) and planned for v3.5.16. It is not yet implemented. It depends on Claude Code Agent Teams (currently experimental) stabilizing.
:::

## The Problem: One Kernel at a Time

The `/ck` command (v3.5.8) spawns a single subagent with one kernel's identity. This works for focused conversations: "talk to Core about its actions" or "ask ComplianceCheck to validate the fleet."

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

Each named kernel becomes a concurrent Claude Code subagent:

```
/ck-team ComplianceCheck Operator Core
    |
    +-- Agent 1: CK.ComplianceCheck
    |   CK loop: ComplianceCheck identity
    |   Task: validate the fleet
    |   DATA loop: writes validation results
    |
    +-- Agent 2: CK.Operator
    |   CK loop: Operator identity
    |   Task: reconcile deployments
    |   DATA loop: writes reconciliation records
    |
    +-- Agent 3: Delvinator.Core
        CK loop: Core identity
        Task: aggregate and report
        DATA loop: writes summary instances
    |
    Parent agent orchestrates, merges results
```

## Per-Agent Identity

Each agent in the team loads its own CK loop, following the same awakening sequence as the single-agent `/ck` command:

1. `conceptkernel.yaml` -- identity
2. `CLAUDE.md` -- behavioral instructions
3. `SKILL.md` -- action catalog
4. `ontology.yaml` -- data schema
5. `storage/memory/MEMORY.md` -- persistent memory

Each agent operates under three-loop discipline: CK read-only, TOOL read-only, DATA writable. Each agent writes memory independently.

## Cross-Kernel Messaging

Agents in a team can communicate via NATS:

```
Agent 1 (ComplianceCheck) publishes to input.CK.Operator:
  { action: "reconcile", data: { validationResult: "pass" } }

Agent 2 (CK.Operator) receives, processes, publishes to result.CK.Operator:
  { event: "reconciled", kernels: 6 }

Agent 3 (Core) subscribes to event.CK.Operator, sees reconciliation complete
```

This uses the same NATS topic topology as the deployed cluster. The agents do not need a special coordination protocol -- they communicate through the same channels that the live kernels use.

## Coordination Model

The parent agent (the Claude Code main session) orchestrates:

1. **Dispatch**: spawns all team agents with their respective CK loop contexts
2. **Monitor**: watches agent outputs for completion signals
3. **Merge**: combines results from all agents into a unified summary
4. **Memory**: persists each agent's memory updates to their respective `storage/memory/MEMORY.md`

The parent does NOT coordinate the agents' internal work. Each agent is autonomous within its own identity. The parent provides the task; the agents decide how to execute within their capabilities.

## Prerequisites

| Prerequisite | Version | Status |
|-------------|---------|--------|
| Subagent (/ck) | v3.5.8 | Deployed |
| NATS bridge | v3.5.8 | Deployed |
| Streaming | v3.5.9 | Deployed |
| Claude Code Agent Teams | Experimental | Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |

The primary blocker is Claude Code Agent Teams stabilizing. The CKP infrastructure is ready -- each kernel already has the identity files, NATS connectivity, and three-loop discipline that team agents need.

## Design Considerations

::: details Architectural Questions

**Question:** How do agents avoid conflicting DATA loop writes?

**Answer:** Each agent writes to its OWN kernel's DATA loop. ComplianceCheck writes to `CK.ComplianceCheck/storage/`, Operator writes to `CK.Operator/storage/`, Core writes to `Delvinator.Core/storage/`. There is no shared writable path. Cross-kernel communication goes through NATS, not filesystem.

**Question:** Can agents in a team use EXTENDS?

**Answer:** Yes. If Delvinator.Core EXTENDS CK.Claude, the Core agent in the team has access to the `analyze` action. The EXTENDS resolution happens during CK loop loading, before the agent starts working.

**Question:** What happens if one agent in the team fails?

**Answer:** The parent agent detects the failure and can either retry the failed agent, redistribute the task, or report the partial result. The other agents are not affected -- they operate independently.

**Question:** How does this differ from the Task Execution Engine (v3.5.15)?

**Answer:** The Task Engine executes consensus-approved tasks headlessly -- no human in the loop. Agent Teams are interactive -- a developer spawns the team, monitors progress, and can intervene. The Task Engine is autonomous execution; Agent Teams are collaborative execution.
:::
