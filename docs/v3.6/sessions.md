---
title: Multi-User NATS Sessions (Planned)
description: How multiple authenticated users will share a unified real-time session over NATS, with JWT identity, presence tracking, and fan-out rendering.
---

# Multi-User NATS Sessions

::: warning Planned Feature
This feature is specified in SPEC.CKP.v3.5.4.delta.md (D6.3) and planned for v3.5.14. It is not yet implemented. This page describes the architectural design and prerequisites.
:::

## The Problem: Single-User Limitation

The current web shell operates in single-user mode. Each browser tab connects to NATS independently, subscribes to kernel topics, and dispatches actions. If two users open the web shell simultaneously, they both see kernel results (NATS pub/sub fans out), but they cannot see each other's actions. There is no shared conversation, no presence awareness, and no coordination.

This limits CKP to a single-operator model. For teams working on kernel evolution, multi-user interaction is essential: one user proposes a change via consensus, another reviews it, a third monitors the deployment -- all in real-time.

## Session Topic Convention

Multi-user sessions introduce a new NATS topic layer:

```
session.{project}.{session_id}
```

For example: `session.delvinator.tech.games.abc123`

All participants in a session subscribe to this topic. Actions and results are published to the session topic in addition to kernel-specific topics. This means:

| Topic | Who Publishes | Who Subscribes |
|-------|--------------|----------------|
| `input.{kernel}` | User (via session) | Kernel processor |
| `result.{kernel}` | Kernel processor | All kernel subscribers |
| `stream.{kernel}` | Kernel processor | All stream subscribers |
| `session.{project}.{id}` | All participants + kernel processors | All participants |

The session topic carries **user-attributed messages**: every action includes the user's identity from their Keycloak JWT.

## JWT Identity on Every Message

Every NATS message published to the session topic carries the user's JWT claims:

```json
{
  "user": "peter@conceptkernel.org",
  "user_name": "Peter",
  "action": "propose",
  "target_kernel": "Delvinator.Core",
  "data": { ... },
  "session_id": "abc123",
  "ts": "2026-04-06T14:00:00Z"
}
```

Kernel processors see who sent each action. Results fan out to the session topic, so all participants see who did what.

## Presence Tracking

Each participant sends a heartbeat every 10 seconds on the session topic:

```json
{
  "type": "presence",
  "user": "peter@conceptkernel.org",
  "user_name": "Peter",
  "ts": "2026-04-06T14:00:10Z"
}
```

The web shell tracks heartbeats and shows who is online. If no heartbeat is received for 30 seconds, the user is marked as offline.

## Fan-Out Rendering

The web shell's results panel shows a shared conversation view:

- Each message shows the user's name/avatar
- Actions sent by others appear in the stream (not just your own)
- Kernel results are attributed to the action that triggered them (via `trace_id`)
- The conversation is ordered by timestamp across all participants

## Prerequisites

Multi-user sessions depend on several already-implemented features:

| Prerequisite | Version | Status |
|-------------|---------|--------|
| Auth (JWT identity) | v3.5.5 | Deployed |
| Web shell (UI) | v3.5.6 | Deployed |
| Streaming (progressive rendering) | v3.5.9 | Deployed |
| NATS WSS (browser connection) | v3.5 | Deployed |

The remaining work is:
1. Session creation and joining protocol
2. Session topic subscriptions in the web shell
3. Presence heartbeat and tracking
4. User attribution in the UI
5. Session lifecycle (create, join, leave, close)

## Architectural Considerations

::: details Design Questions

**Question:** Should session state be stored?

**Answer:** Session state (who is in the session, what actions were dispatched) could be ephemeral (NATS pub/sub only) or durable (NATS JetStream with replay). The initial design uses ephemeral sessions -- if you join late, you do not see history. Durable sessions (with replay) are a future enhancement.

**Question:** How do sessions interact with kernel DATA loops?

**Answer:** Sessions do not write to DATA loops. Actions dispatched through sessions follow the normal kernel flow: publish to `input.{kernel}`, kernel processes, result sealed in DATA loop. The session topic is a parallel notification channel, not a storage mechanism.

**Question:** What about conflicting actions from multiple users?

**Answer:** Kernels process actions sequentially (one NATS message at a time per subscription). If two users send conflicting actions, the kernel processes them in NATS delivery order. This is the same behavior as concurrent API calls -- first-come, first-served. For actions that require coordination (e.g., consensus proposals), the consensus loop itself provides the ordering guarantee.
:::
