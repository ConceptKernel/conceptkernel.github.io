---
title: Extended URN Scheme
description: Complete URN scheme for all 19 entity types across 8 continuant and 11 occurrent categories.
---

# Extended URN Scheme (v3.2)

v3.2 defines a complete URN scheme for all 19 entity types. CKP URNs are semantic addresses -- they coexist with SPIFFE IDs and serve a different purpose:

- **SPIFFE** authenticates workloads
- **CKP URNs** address knowledge graph entities and are resolvable to filesystem paths

## Continuant URNs (8 types)

| Type | Pattern | Example |
|------|---------|---------|
| Kernel | `ckp://Kernel#{Name}:{Version}` | `ckp://Kernel#CK.Task:v1.0` |
| Actor | `ckp://Actor#{Name}` | `ckp://Actor#operator` |
| Role | `ckp://Role#{Name}` | `ckp://Role#ck-owner` |
| Edge | `ckp://Edge#{Predicate}` | `ckp://Edge#COMPOSES` |
| Goal | `ckp://Goal#{ID}:{Version}` | `ckp://Goal#G001:v1.0` |
| Domain | `ckp://Domain#{Name}` | `ckp://Domain#example.org` |
| Project | `ckp://Project#{Name}` | `ckp://Project#ExampleProject` |
| Grant | `ckp://Grant#{Kernel}-{Identity}` | `ckp://Grant#CK.Task-anon` |

## Occurrent URNs (11 types)

| Type | Pattern | Example |
|------|---------|---------|
| Process | `ckp://Process#{Type}-{TimestampMs}-{Hash}` | `ckp://Process#deploy-1773518402000-3fff0e38` |
| Task | `ckp://Task#{InstanceID}` | `ckp://Task#i-task-1773518402` |
| Instance | `ckp://Instance#{InstanceID}` | `ckp://Instance#i-tx-3fff0e38-1773518402` |
| Event | `ckp://Event#{Kernel}-{Type}-{TimestampMs}` | `ckp://Event#CK.Task-status-1773518402000` |
| Transaction | `ckp://Transaction#{TimestampMs}-{Hash}` | `ckp://Transaction#1773518402000-abc123` |
| Message | `ckp://Message#{Type}-{TimestampMs}-{Kernel}` | `ckp://Message#status-1773518402000-CK.Task` |
| Check | `ckp://Check#{CheckName}-{Kernel}-{TimestampMs}` | `ckp://Check#identity-CK.Task-1773518402000` |
| Action | `ckp://Action#{Kernel}.{ActionName}[-{TimestampMs}]` | `ckp://Action#CK.Task.task.create-1773518402000` |
| Deployment | `ckp://Deployment#{Type}-{TimestampMs}-{Hash}` | `ckp://Deployment#apply-1773518402000-abc123` |
| Transfer | `ckp://Transfer#{Type}-{TimestampMs}-{Hash}` | `ckp://Transfer#regenerate-1773518402000-abc123` |
| Mutation | `ckp://Mutation#{Action}-{Target}-{TimestampMs}` | `ckp://Mutation#task.update-T002-1773518402000` |

## Navigable Paths

URNs become resolvable addresses via the URN resolver -- path segments navigate the filesystem tree rooted at the kernel's `storage/`:

```
ckp://Kernel#CK.Task:v1.0/spid                -> kernel_id UUID (.ck-guid)
ckp://Kernel#CK.Task:v1.0/actions              -> all declared actions (SKILL.md)
ckp://Kernel#CK.Task:v1.0/actions/task.create  -> specific action spec
ckp://Kernel#CK.Task:v1.0/instances            -> storage/ instance list
ckp://Kernel#CK.Task:v1.0/instances?since=24h  -> recent instances (filesystem scan)
ckp://Kernel#CK.Task:v1.0/edges                -> outbound edges
ckp://Kernel#CK.Task:v1.0/grants               -> grants block
ckp://Kernel#CK.Task:v1.0/tasks?status=pending -> pending tasks targeting this CK
```

::: info Version Format
Version format: `vX.Y` (short) or `vX.Y.Z` (full semver) -- both valid.
:::

::: tip SPIFFE URN vs CKP URN
These two identity systems coexist with different purposes:
- `spiffe://{domain}/ck/CK.Task/{guid}` -- workload authentication (SPIRE)
- `ckp://Kernel#CK.Task:v1.0` -- semantic addressing (URN resolver)
:::
