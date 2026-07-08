---
title: "The One Door: ckp.dispatch"
description: "A single typed verb — ckp.dispatch — is the whole surface of a concept kernel. The connection carries the acting participant, every dispatch routes to its plane, and unknown verbs are honestly denied."
---

# The One Door: ckp.dispatch

One capability reaches a concept kernel: `ckp.dispatch`. Four things cross the door on every call, and it returns JSON.

```
ckp.dispatch  ·  ⟨ verb, kernel, payload, identity ⟩  →  jsonb
```

This tuple — ⟨verb, kernel, payload, identity⟩ — is the only atom that crosses the membrane between a participant and a kernel. You hand the function a verb and its payload; the target kernel rides in the NATS subject (or is named inside the payload on a direct call), and the acting identity is carried by the connection. The door is the whole surface.

## The four-tuple

| Field | Meaning |
|---|---|
| `verb` | The affordance name — `task.create`, `instances.list`, `kernel.vote`. One of a closed set. |
| `kernel` | The target kernel — `demo`. Named in the NATS subject, or inside the payload on a direct call. |
| `payload` | The verb-specific body. |
| `identity` | The acting participant, carried by the connection. Today the `ck_participant` role you authenticate as (a SCRAM password); verified-JWT identity is the upstream roadmap (CKP v3.9 §10). |

A participant names a verb and a kernel, hands over a typed payload, and receives a JSON reply. The other side of the door is one typed handler — the entire interface a participant ever touches.

## Identity is carried by the connection

The caller supplies the `verb`, the target `kernel`, and the `payload`. The acting identity arrives with the connection: today that is the `ck_participant` role a connection authenticates as, a SCRAM password held by the deployment. pgCK stamps the acting participant onto every sealed fact, so each write records who acted in its provenance. The payload carries the *what*; the connection carries the *who*.

```js
// the client names verb + kernel + payload; the connection carries the participant
await k.create({ task: { target_kernel: 'demo', title: 'ship it' } });
// pgCK stamps the acting ck_participant into the sealed fact's provenance
```

::: warning Alpha-trust identity
Verified-JWT identity — a per-user claim checked at the seal against the kernel's contract — is an inherited upstream prerequisite (CKP v3.9 §10) that rides in on a later cut. Treat a current deployment as **alpha-trust**: the isolation floor is real and structural, and the acting participant is recorded, but participant identity is a shared secret rather than a per-user verified claim. Hold the door behind your own gateway before exposing it to untrusted users. See [/v3.9/seal-and-proof](/v3.9/seal-and-proof).
:::

## Two ways to reach the door

Apps reach `ckp.dispatch` over NATS; operators and servers can also reach it directly over Postgres. Both land on the same one function.

**Over NATS-WSS — the app path.** A client publishes the four-tuple to the subject `input.kernel.<K>.action.<verb>` on the WebSocket port `:9222` and reads the typed reply on `result.kernel.<K>.<verb>`. The verb and kernel ride in the subject, the payload in the body, and the acting participant in the connection. The bundle's in-image relay bridges the message to `ckp.dispatch` and preserves the `Trace-Id` end to end.

```
PUB  input.kernel.demo.action.task.create   { "task": { "target_kernel": "demo", "title": "ship it" } }
MSG  result.kernel.demo.task.create          { "id": "task-…", "ok": true, "verified": true, "proof_digest": "…" }
```

**Direct — as `ck_participant`.** A server or operator connects over Postgres as the `ck_participant` role and calls the function itself, naming the kernel inside the payload:

```sql
SELECT ckp.dispatch('task.create',
  '{"task":{"target_kernel":"demo","title":"ship it"}}'::jsonb);
-- → {"id":"task-…","ok":true,"verified":true,"proof_digest":"…"}
```

Both paths cross the same membrane and hit the same seal gate. The NATS door is the integration surface for browsers, agents, and services; the direct call is for operators and server-side code.

## Two planes

Every dispatch routes to exactly one of two planes:

- **instance** — verbs that read and write a kernel's instances: `task.create`, `goal.create`, `instances.list`, `instance.get`, `instance.verify`, `instance.provenance`.
- **governance** — verbs that change the kernel's own types: `kernel.propose_change`, `kernel.vote`, `kernel.apply`.

The plane is a sealed property of each affordance. A governance verb runs only on the governance plane; an instance verb runs only on the instance plane. Storing a fact stays separate from rewriting the rules. See [/v3.9/governance](/v3.9/governance).

## The registry: exact match, implicit deny

`ckp.dispatch` resolves every verb through a sealed **affordance registry** keyed on `(kernel, verb)`. The lookup is parameterized equality — exact match only. A verb that resolves lands on its handler; a verb that does not resolve is denied, honestly and cheaply:

```js
await k.do('instance.teleport', {});
// → { ok: false, error: 'unknown_affordance' }
```

An unknown verb evaluates no payload and reaches no handler. Implicit deny is the default: only the verbs a kernel has sealed into its registry are reachable. See [/v3.9/affordances](/v3.9/affordances) for how a kernel declares its verb set and [/v3.9/grants](/v3.9/grants) for who may call each.

## Why the door is the whole surface

The verb vocabulary is closed, named, and grantable. A participant holds a set of verbs it may invoke, and each is a fixed, typed affordance. The live set the bundle demonstrates today:

```
kernel.create          open a named domain
task.create            land a governed, sealed work object in a kernel
goal.create            declare an objective a kernel works toward
instances.list         list a kernel's sealed instances
instance.get           read one sealed instance
instance.verify        re-verify an instance's proof
instance.provenance    read an instance's PROV-O chain
kernel.propose_change ┐
kernel.vote           ├ evolve the kernel's own type
kernel.apply          ┘
```

`instance.create` is the generic landing verb; today it routes to `Task` and `Goal`. Modeling your own first-class sealed type — a `Ship` with its own create verb and shape — is the next pgCK capability (CKP v3.9 §4).

You invoke one of these verbs with a typed payload. No expression position exists where a caller could hand the kernel a program to run — no SQL string, no SPARQL, no query language. This is the spine of the protocol — [/v3.9/verb-vs-query-surface](/v3.9/verb-vs-query-surface) — and it is what makes a kernel safe to expose to browsers, agents, and services at once.

```
participant ──► ckp.dispatch( verb, payload ) ──► kernel
                 └ closed verb set · exact-match registry · connection-carried identity
```

The role floor makes this structural. The role `ck_participant` holds only `EXECUTE` on `ckp.dispatch`. It reaches no table and no engine; it names only the verbs the registry has sealed. The door is the only surface a participant is given, and it is enough to write, read, prove, and govern a kernel end to end. See [/v3.9/client](/v3.9/client) for the client that drives it.
