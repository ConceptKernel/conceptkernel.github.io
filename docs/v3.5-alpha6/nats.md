---
title: NATS Topic Topology
description: Two NATS topic formats for inter-kernel communication -- name-based (primary) and GUID-based (multi-instance extension).
---

# NATS Topic Topology

v3.2 defines two NATS topic formats. The name-based format is the primary standard -- it is what fleet kernels use. The GUID-based format from v3.1 is retained as the optional multi-instance extension for SPIFFE-isolated production deployments.

::: tip Two Formats, One Rule
Name-based topics are the default for all kernels. GUID-based topics are only required when deploying multiple simultaneous instances of the same kernel class with SPIFFE isolation. Processors read topic names from `conceptkernel.yaml spec.nats` -- never hardcoded -- so migration between formats requires only a config change.
:::

## Primary Format -- Name-Based

Namespace prefix in the kernel name provides domain isolation. No topic collisions between `CK.*`, `TG.*`, `CS.*` namespaces.

```
# Primary format: {direction}.{KernelName}
input.{KernelName}    # messages to kernel
result.{KernelName}   # responses from kernel
event.{KernelName}    # broadcast events from kernel

# Examples with namespace isolation:
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

### Task Lifecycle via NATS

All task mutations flow through NATS -- enforcing the write-once rule:

```
input.CK.Task  { action: task.start,    task_id: '...' }
input.CK.Task  { action: task.update,   delta: {...}   }
input.CK.Task  { action: task.complete, output: {...}  }  # seals data.json
```

## Extended Format -- GUID-Based (Multi-Instance / SPIFFE)

Used only when multiple instances of the same kernel class run simultaneously and require per-instance NATS isolation under SPIFFE. Declared in `conceptkernel.yaml spec.nats`.

## Per-Loop NATS Topics

### CK Loop Topics

```
ck.{guid}.ck.commit           # CK loop repo -- new commit
ck.{guid}.ck.ref-update       # Branch pointer moved
ck.{guid}.ck.promote          # Version promoted to stable
ck.{guid}.ck.rollback         # Version rolled back
ck.{guid}.ck.canary           # Canary weight updated
ck.{guid}.ck.schema-change    # ontology.yaml or rules.shacl changed
ck.{guid}.ck.depends-on       # Dependency on another CK declared or updated
```

### TOOL Loop Topics

```
ck.{guid}.tool.commit          # TOOL repo -- new commit (tool updated)
ck.{guid}.tool.ref-update      # Tool branch pointer moved
ck.{guid}.tool.promote         # Tool version promoted to stable
ck.{guid}.tool.invoked         # Tool execution started
ck.{guid}.tool.completed       # Tool execution finished successfully
ck.{guid}.tool.failed          # Tool execution failed
```

### DATA Loop Topics

```
ck.{guid}.data.written         # New instance written to storage/
ck.{guid}.data.indexed         # Index files updated
ck.{guid}.data.proof-generated # proof/ entry created
ck.{guid}.data.ledger-entry    # audit.jsonl appended
ck.{guid}.data.accessed        # storage/ read by another kernel (audit)
ck.{guid}.data.exported        # Dataset derived from storage/ for consumers
ck.{guid}.data.amended         # Instance amendment committed + proof rebuilt (v3.3)
```

## NATS Authentication

NATS connections from CKs require a SPIFFE JWT-SVID as the connection credential:

```python
# NATS connection authenticated by SPIFFE JWT-SVID
spiffe_jwt = spire_agent.fetch_jwt_svid(audience='nats.{domain}')

nats.connect('nats://nats.{domain}:4222',
             user=f'spiffe://{domain}/ck/{class}/{guid}',
             password=spiffe_jwt)

# Subject-level ACLs derived from grants block:
#   publish:   ck.{own-guid}.*           (always allowed -- own topics)
#   subscribe: ck.{other-guid}.*          (only if grant exists + action matches)
```
