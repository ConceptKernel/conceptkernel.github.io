---
title: Multi-User NATS Sessions
description: How multiple authenticated users share a unified real-time session over NATS, with JWT identity, presence tracking, and fan-out rendering.
---

# Multi-User NATS Sessions

## Beyond Single-User

CKP supports collaborative real-time interaction where multiple authenticated users work with the same project simultaneously. Kernel development and operation is often collaborative: a developer proposes a change while an operator monitors the deploy, and both see the same events in real time.

Multi-user sessions extend the single-user NATS model (where one browser connects to one kernel) to shared sessions where multiple browsers subscribe to a common topic and see each other's actions and results.

## Session Topic Convention

Each session is identified by a NATS topic that scopes it to a project:

```
session.{project}.{session_id}
```

For example: `session.delvinator.tech.games.abc123`

Multiple users subscribe to the same session topic. Each message carries JWT identity in its headers. Kernel results fan out to all subscribers.

::: info Project Scoping
Session topics are scoped to a project -- there is no cross-project session leakage. A user in the `delvinator` session cannot see messages from the `hello` project's sessions. This is enforced at the NATS topic level.
:::

## Session Lifecycle

Sessions progress through five phases:

| Phase | Action | Description |
|---|---|---|
| **Create** | `session.create` | Authenticated user sends a create action to a project kernel |
| **Join** | NATS subscribe | Other users subscribe to `session.{project}.{id}` via WSS |
| **Interact** | Send/receive | Messages carry `X-User-ID` and `Authorization` headers |
| **Presence** | Heartbeat | 30-second heartbeat messages; subscribed clients render who is online |
| **Close** | `session.close` | Session creator sends close action; subscribers notified |

### Create

An authenticated user initiates a session. Anonymous users cannot create sessions -- authentication is required to establish identity for attribution.

### Join

Other users subscribe to the session topic via NATS WSS. No explicit join action is needed -- subscribing to the topic is joining. The presence heartbeat mechanism detects who is actively participating.

### Interact

During interaction, every message carries full identity headers. Users send actions through the session topic; results from kernel processing fan out to all participants.

### Presence

Each participant publishes a heartbeat every 30 seconds on the session topic:

```json
{
  "type": "presence",
  "user": "peter@conceptkernel.org",
  "user_name": "Peter",
  "ts": "2026-04-06T14:00:10Z"
}
```

The web shell tracks heartbeats and shows who is online. If no heartbeat is received for 30 seconds, the user is marked as offline.

### Close

The session creator sends a `session.close` action. All subscribers receive a notification and the session is terminated.

## Message Identity

Every message in a session carries full identity through NATS headers:

```
Headers:
  Trace-Id: tx-{uuid}
  X-User-ID: {preferred_username from JWT}
  X-Kernel-ID: browser
  Authorization: Bearer {jwt}
```

Kernels see who sent what. The web shell renders messages with user identity, enabling collaborative workflows where actions are attributed to specific users.

## Session vs. Kernel Topics

Sessions introduce a new topic layer alongside the existing kernel topics:

| Topic Pattern | Purpose | Who Subscribes |
|---|---|---|
| `input.{kernel}` | Action dispatch to kernel | Kernel processor |
| `result.{kernel}` | Action results from kernel | Subscribed client (single user) |
| `stream.{kernel}` | Progressive token stream from an `agent`-type kernel | Subscribed client |
| `session.{project}.{id}` | Shared conversation | All session participants |

Results from kernel actions are ALSO published to the session topic so all participants see them. This dual publication ensures that solo users (not in a session) still receive results on `result.{kernel}`, while session participants see results on the session topic.

## Fan-Out Semantics

When a kernel processes an action that originated from a session:

1. Kernel publishes result to `result.{kernel}` (standard single-user path)
2. Kernel ALSO publishes result to `session.{project}.{id}` (session fan-out)
3. All session subscribers receive the result
4. The web shell deduplicates if the user is subscribed to both topics

```
User A sends action via session topic
  -> Kernel processes action
  -> Result published to result.{kernel}  (User A sees it)
  -> Result ALSO published to session topic (Users A, B, C see it)
  -> Web shell deduplicates for User A
```

::: tip Dual Publication
The dual publication pattern means sessions are purely additive. They do not change how kernel processing works -- they add a second notification channel. Removing sessions leaves the single-user model intact.
:::

## Collaborative Workflows

Multi-user sessions enable several collaborative patterns:

| Workflow | Participants | Session Behavior |
|---|---|---|
| **Governance review** | Developer proposes, reviewer evaluates | Both see the [consensus](./consensus) proposal and evaluation in real time |
| **Deployment monitoring** | Developer triggers deploy, operator monitors | Both see reconciliation events and status updates |
| **Pair debugging** | Two developers investigating an issue | Both see kernel actions and results, can dispatch from the same session |
| **Training** | Instructor demonstrates, learners observe | Learners see all actions and results without needing to dispatch |

## Architectural Considerations

::: details Design Questions

**Question:** Should session state be stored?

**Answer:** Session state (who is in the session, what actions were dispatched) is ephemeral -- NATS pub/sub only. If you join late, you do not see history. Durable sessions (with replay via NATS JetStream) are a future enhancement.

**Question:** How do sessions interact with kernel DATA loops?

**Answer:** Sessions do not write to DATA loops. Actions dispatched through sessions follow the normal kernel flow: publish to `input.{kernel}`, kernel processes, result sealed in DATA loop. The session topic is a parallel notification channel, not a storage mechanism.

**Question:** What about conflicting actions from multiple users?

**Answer:** Kernels process actions sequentially (one NATS message at a time per subscription). If two users send conflicting actions, the kernel processes them in NATS delivery order. This is the same behavior as concurrent API calls -- first-come, first-served. For actions that require coordination (e.g., consensus proposals), the consensus loop itself provides the ordering guarantee.
:::

## Conformance Requirements

| Criterion | Level |
|---|---|
| Session messages MUST carry JWT identity in headers | REQUIRED |
| Kernel processors MUST publish results to both `result.{kernel}` and the session topic | REQUIRED |
| Presence heartbeats SHOULD be published every 30 seconds | RECOMMENDED |
| Session topics MUST be scoped to project (no cross-project leakage) | REQUIRED |
| Sessions MUST require authentication (no anonymous session creation) | REQUIRED |
