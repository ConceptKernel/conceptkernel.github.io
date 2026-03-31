---
title: NATS Topic Topology
description: The two NATS topic formats used by Concept Kernels -- name-based (fleet standard) and GUID-based (multi-instance SPIFFE extension).
---

# NATS Topic Topology

CKP defines two NATS topic formats. The name-based format is the primary standard -- it is what fleet kernels use. The GUID-based format is retained as the optional multi-instance extension for SPIFFE-isolated production deployments.

::: tip Two Formats, One Rule
Name-based topics are the default for all kernels. GUID-based topics are only required when deploying multiple simultaneous instances of the same kernel class with SPIFFE isolation. Processors read topic names from `conceptkernel.yaml` `spec.nats` -- never hardcoded -- so migration between formats requires only a config change.
:::

## Primary Format -- Name-Based

Namespace prefix in the kernel name provides domain isolation. No topic collisions between `CK.*`, `TG.*`, `CS.*` namespaces.

```
# Primary format: {direction}.{KernelName}
input.{KernelName}    # messages to kernel
result.{KernelName}   # responses from kernel
event.{KernelName}    # broadcast events from kernel
```

### Examples with Namespace Isolation

```
input.CK.Task              # platform task kernel
result.CK.Task
event.CK.Task

input.TG.Cymatics          # domain kernel
result.TG.Cymatics

input.CS.Voting            # domain kernel
result.CS.Voting

input.CK.ComplianceCheck   # platform compliance kernel
result.CK.ComplianceCheck
```

### Task Lifecycle Messages

All task mutations flow through NATS -- enforcing the write-once rule:

```json
// Start a task
{ "action": "task.start", "task_id": "..." }

// Update task state (appends to ledger.json)
{ "action": "task.update", "delta": {} }

// Complete and seal (writes data.json once, then seals)
{ "action": "task.complete", "output": {} }
```

::: warning
`data.json` is sealed at `task.complete`. It is never opened between creation and the completion event.
:::

## Extended Format -- GUID-Based (Multi-Instance / SPIFFE)

Used only when multiple instances of the same kernel class run simultaneously and require per-instance NATS isolation under SPIFFE. Declared in `conceptkernel.yaml` `spec.nats`.
