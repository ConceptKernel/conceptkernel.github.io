---
title: NATS Messaging and Topic Convention
description: NATS as CKP's primary transport, the transport-agnostic principle, WSS for browsers, TCP for cluster, name-based and GUID-based topic conventions, session topics, per-loop topics, and task lifecycle messaging.
---

# NATS Messaging and Topic Convention

## NATS as Primary Transport

All inter-kernel communication in the Concept Kernel Protocol occurs over NATS messaging. NATS is the sole required transport for action dispatch, result delivery, event broadcasting, and streaming. A conformant CKP implementation MUST use NATS as the primary transport.

### Why NATS

NATS was selected because it provides:

- **Subject-based routing** -- topic names map directly to kernel identity, eliminating service discovery.
- **Dual transport** -- native TCP for cluster-internal traffic, WebSocket Secure (WSS) for browser clients, over a single logical bus.
- **JetStream** -- durable delivery for task lifecycle messages that MUST NOT be lost.
- **Zero broker configuration per kernel** -- a kernel subscribes to its own topics at startup; no per-kernel broker configuration is required.

:::info Why This Matters
NATS is not just a message queue. In CKP, it is the nervous system. Every action dispatch, every result delivery, every edge subscription, and every session interaction flows through NATS. The subject-based routing means that a kernel's NATS topics are derivable from its name and GUID -- no service discovery, no configuration databases, no registry servers.
:::

## Transport-Agnostic Principle

Although NATS is the primary transport, the messaging interface MUST remain transport-agnostic at the kernel boundary. A kernel processor receives a message envelope (headers + JSON body) and returns a result envelope. The transport layer -- NATS TCP, NATS WSS, or a future alternative -- is invisible to the handler.

This principle is enforced by the `NatsKernelLoop` abstraction in CK.Lib.Py (see [Message Processing Cycle](./message-envelope#natskerneloop-processing-cycle)). Handlers are decorated functions (`@on("action.name")`) that receive parsed JSON and return dicts. The loop manages connection, subscription, dispatch, instance writing, and result publication.

**Filesystem symlinks as transport.** In local development, the filesystem itself serves as a degenerate transport. A kernel's `storage/` directory is a shared volume; another kernel can read its instances directly via filesystem symlinks. This coexists with NATS -- the symlink provides read access to sealed instances, while NATS provides the event notification that a new instance exists.

| Concern | Handled By | NOT Handled By |
|---------|-----------|----------------|
| Message routing | NATS subject-based routing | Kernel processor code |
| Connection auth | NATS credentials (JWT-SVID or Keycloak JWT) | Kernel processor code |
| Message framing | NATS protocol | Kernel processor code |
| Payload parsing | `NatsKernelLoop` (JSON decode) | NATS server |
| Instance writing | `NatsKernelLoop` (DATA loop) | Handler function |
| Result publication | `NatsKernelLoop` (NATS publish) | Handler function |

## WSS for Browsers, TCP for Cluster

Browser clients MUST connect via WebSocket Secure (WSS). Server-side kernels SHOULD connect via native NATS TCP for performance.

| Client Type | Transport | Port | Auth Mechanism |
|-------------|-----------|------|----------------|
| Browser (CK.Lib.Js) | NATS WSS | 443 (via ingress) | Keycloak JWT in headers |
| Server-side kernel (CK.Lib.Py) | NATS TCP | 4222 | SPIFFE JWT-SVID |
| CLI tool (ckp) | NATS TCP or WSS | 4222 or 443 | Keycloak JWT or SPIFFE |
| Local development | NATS TCP | 4222 | None (anonymous) |

**Why WSS for browsers.** Browsers cannot open raw TCP sockets. NATS provides a first-class WebSocket listener. The WSS endpoint is exposed through the cluster ingress controller, secured by TLS termination. No custom proxy is required.

**Why TCP for cluster.** Native NATS TCP avoids the WebSocket framing overhead. Server-side kernels running inside the cluster connect directly to `nats://nats.nats.svc:4222`. Latency is lower and throughput is higher.

## Topic Convention

### Two Formats, One Rule

CKP defines two topic formats: **name-based** (primary) and **GUID-based** (extended). Name-based topics are the default for all kernels. GUID-based topics are REQUIRED only when deploying multiple simultaneous instances of the same kernel class with SPIFFE isolation.

Processors MUST read topic names from `conceptkernel.yaml` `spec.nats` -- topic names MUST NOT be hardcoded. Migration between formats requires only a configuration change in `conceptkernel.yaml`.

### Primary Format -- Name-Based

The namespace prefix in the kernel class name provides domain isolation. No topic collisions occur between `CK.*`, `TG.*`, `CS.*`, or other namespaces.

```
# Primary format: {direction}.{KernelName}
input.{KernelName}     # messages TO kernel
result.{KernelName}    # responses FROM kernel
event.{KernelName}     # broadcast events FROM kernel
stream.{KernelName}    # streaming events FROM kernel (LLM tokens, progress)
```

Examples:
```
input.CK.Task              # platform task kernel
result.CK.Task
event.CK.Task
stream.CK.Task
input.TG.Cymatics          # domain kernel
input.CK.ComplianceCheck   # compliance kernel
```

| Direction | Publisher | Subscriber | Purpose |
|-----------|-----------|------------|---------|
| `input` | Any authorised client | Target kernel processor | Action dispatch |
| `result` | Target kernel processor | Requesting client(s) | Action response |
| `event` | Target kernel processor | Any interested subscriber | Lifecycle broadcast |
| `stream` | Target kernel processor | Subscribing client(s) | Real-time streaming (LLM tokens, progress) |

### Extended Format -- GUID-Based

Used only when multiple instances of the same kernel class run simultaneously and require per-instance NATS isolation under SPIFFE. The format is declared in `conceptkernel.yaml` `spec.nats`:

```
# Extended format: ck.{guid}.{direction}
ck.{guid}.input          # messages TO specific instance
ck.{guid}.result         # responses FROM specific instance
ck.{guid}.event          # broadcast events FROM specific instance
ck.{guid}.stream         # streaming events FROM specific instance
```

## Session Topics

Multi-user sessions use a dedicated topic namespace scoped to the project:

```
session.{project}.{session_id}
```

Multiple authenticated users subscribe to the same session topic. Each message carries JWT identity in its headers. Kernel results fan out to all session subscribers.

| Phase | Message | Actor |
|-------|---------|-------|
| Create | `{action: "session.create"}` on `input.{Kernel}` | Authenticated user |
| Join | Subscribe to `session.{project}.{id}` via NATS WSS | Other users |
| Interact | Messages with `X-User-ID` + `Authorization` headers | All participants |
| Presence | Heartbeat every 30s on session topic | Each participant |
| Close | `{action: "session.close"}` | Session creator |

Results from kernel actions MUST be published to both `result.{kernel}` (for the requesting client) and the originating session topic (for all participants).

:::tip Session Topics vs Kernel Topics
Session topics are conversation-scoped. Kernel topics are kernel-scoped. A single kernel action may produce a result on `result.{kernel}` (for the caller) AND on `session.{project}.{id}` (for all session participants). These are different audiences with different subscription patterns.
:::

| Topic Pattern | Purpose | Who Subscribes |
|---------------|---------|----------------|
| `input.{kernel}` | Action dispatch | Kernel processor |
| `result.{kernel}` | Action results | Requesting client |
| `stream.{kernel}` | Claude streaming | Subscribing client |
| `event.{kernel}` | Lifecycle events | Any interested party |
| `session.{project}.{id}` | Shared conversation | All session participants |

## Per-Loop NATS Topics

Every loop emits structured events over NATS. These topics form the complete event surface for a kernel instance. Per-loop topics use the GUID-based format because they refer to specific kernel instances.

### CK Loop Topics

| Topic | Description |
|-------|-------------|
| `ck.{guid}.ck.commit` | CK loop repo received new commit |
| `ck.{guid}.ck.ref-update` | Branch pointer moved |
| `ck.{guid}.ck.promote` | Version promoted to stable |
| `ck.{guid}.ck.rollback` | Version rolled back |
| `ck.{guid}.ck.canary` | Canary weight updated |
| `ck.{guid}.ck.schema-change` | `ontology.yaml` or `rules.shacl` changed |
| `ck.{guid}.ck.depends-on` | Dependency on another CK declared or updated |

### TOOL Loop Topics

| Topic | Description |
|-------|-------------|
| `ck.{guid}.tool.commit` | TOOL repo received new commit |
| `ck.{guid}.tool.ref-update` | Tool branch pointer moved |
| `ck.{guid}.tool.promote` | Tool version promoted to stable |
| `ck.{guid}.tool.invoked` | Tool execution started |
| `ck.{guid}.tool.completed` | Tool execution finished successfully |
| `ck.{guid}.tool.failed` | Tool execution failed |

### DATA Loop Topics

| Topic | Description |
|-------|-------------|
| `ck.{guid}.data.written` | New instance written to `storage/` |
| `ck.{guid}.data.indexed` | Index files updated |
| `ck.{guid}.data.proof-generated` | `proof/` entry created |
| `ck.{guid}.data.ledger-entry` | `audit.jsonl` appended |
| `ck.{guid}.data.accessed` | `storage/` read by another kernel (audit) |
| `ck.{guid}.data.exported` | Dataset derived from `storage/` for consumers |
| `ck.{guid}.data.amended` | Instance amendment committed and proof rebuilt |
| `ck.{guid}.data.shacl-rejected` | SHACL validation rejected a write |
| `ck.{guid}.data.nats-degraded` | NATS reconnection after local queue overflow |

## Task Lifecycle Topics

Task lifecycle is driven entirely through NATS. All task state transitions are published to `input.{KernelName}`:

```
input.CK.Task  { action: "task.start",    task_id: "..." }
input.CK.Task  { action: "task.update",   delta: {...}   }
input.CK.Task  { action: "task.complete", output: {...}  }  # seals data.json
```

Task lifecycle NATS messages MUST use JetStream with `at_least_once` delivery guarantee. If NATS is unavailable:

1. Task state transitions queue locally in `storage/ledger/pending_events.jsonl`.
2. On NATS reconnection, pending events replay in order.
3. If the local queue exceeds 1000 events, the kernel enters `degraded` state and publishes `ck.{guid}.data.nats-degraded` on reconnection.
4. `data.json` MUST NOT be written without NATS confirmation of the `task.complete` event.

:::danger
Losing a `task.complete` message would leave an instance in an intermediate state with no proof record. JetStream provides the `at_least_once` guarantee needed to prevent data loss. The local queue provides resilience during transient NATS outages, but `data.json` MUST NOT be written without NATS confirmation.
:::

## Conformance Requirements

| Criterion | Level |
|-----------|-------|
| NATS MUST be the primary transport for all inter-kernel communication | REQUIRED |
| Kernel handlers MUST be transport-agnostic | REQUIRED |
| Browser clients MUST connect via WSS | REQUIRED |
| Server-side kernels SHOULD connect via native TCP | RECOMMENDED |
| Filesystem symlinks MAY supplement NATS for local read access | OPTIONAL |
| Name-based topics MUST be the default format | REQUIRED |
| Topic names MUST be read from `conceptkernel.yaml`, not hardcoded | REQUIRED |
| Task lifecycle messages MUST use JetStream with `at_least_once` delivery | REQUIRED |
| Session results MUST be published to both `result.{kernel}` and the session topic | REQUIRED |
| Session messages MUST carry JWT identity in headers | REQUIRED |
| Presence heartbeats SHOULD be published every 30s | RECOMMENDED |
| Session topics MUST be scoped to project (no cross-project leakage) | REQUIRED |
| Implementations SHOULD support GUID-based topics for multi-instance deployments | RECOMMENDED |

See also: [Message Envelope](./message-envelope) for the NATS message header and body schema, [Authentication](./auth) for JWT verification over NATS, [Sessions](./sessions) for multi-user session management.
