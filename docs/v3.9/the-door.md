---
title: "The One Door: ckp.dispatch"
description: "A single typed verb — ckp.dispatch(verb, kernel_urn, payload, identity) — is the whole surface of a concept kernel. Identity is server-derived, the plane function routes every dispatch, and unknown verbs are honestly denied."
---

# The One Door: ckp.dispatch

One capability reaches a concept kernel: `ckp.dispatch`. It takes a four-tuple and returns JSON.

```
ckp.dispatch(verb, kernel_urn, payload, identity) → jsonb
```

This tuple — ⟨verb, kernel_urn, payload, identity⟩ — is the only atom that crosses the membrane between a participant and a kernel. The door is the whole surface.

## The four-tuple

| Field | Meaning |
|---|---|
| `verb` | The affordance name — `instance.create`, `kernel.vote`, `concept.match`. One of a closed set. |
| `kernel_urn` | The target kernel — `urn:ckp:demo`. |
| `payload` | The verb-specific body. |
| `identity` | The verified JWT the connection holds. Server-derived; carried by the connection. |

A participant names a verb and a kernel, hands over a typed payload, and receives a JSON reply. The other side of the door is one typed handler — the entire interface a participant ever touches.

## Identity is server-derived

The caller supplies `verb`, `kernel_urn`, and `payload`. `identity` arrives with the connection: the connection carries a verified JWT, and the server derives the acting participant from it, then stamps that participant onto the sealed fact. The payload carries the *what*; the connection carries the *who*.

```js
// the client sends verb + kernel + payload
const task = await k.create('urn:ckp:demo/type/Task', { title: 'ship it' });
// pgCK derives the participant from the connection's JWT and seals it in
```

::: info
Identity is a property of the authenticated connection, checked at the door and written into provenance at the seal. See [/v3.9/seal-and-proof](/v3.9/seal-and-proof).
:::

## The plane function φ

Every dispatch routes through the **plane function** — φ — which sends it to exactly one of two planes:

- **instance** — verbs that read and write the kernel's instances: `instance.create`, `instance.update`, `instance.query`, `instance.link`, `instance.reach`, and their siblings.
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

The verb vocabulary is closed, named, and grantable. A participant holds a set of verbs it may invoke — around sixteen of them across the instance and governance planes — and each is a fixed, typed affordance:

```
instance.{create, update, transition, link, query, get, reach,
          verify, provenance, snapshot, validate, retire}
kernel.{propose_change, vote, apply}
concept.match
```

You invoke one of these verbs with a typed payload. No expression position exists where a caller could hand the kernel a program to run — no SQL string, no SPARQL, no query language. This is the spine of the protocol — [/v3.9/verb-vs-query-surface](/v3.9/verb-vs-query-surface) — and it is what makes a kernel safe to expose to browsers, agents, and services at once.

```
participant ──► ckp.dispatch(verb, kernel_urn, payload, identity) ──► kernel
                 └ closed verb set · exact-match registry · server-derived identity
```

The role floor makes this structural. The role `ck_participant` holds only `EXECUTE` on `ckp.dispatch`. It reaches no table and no engine; it names only the verbs the registry has sealed. The door is the only surface a participant is given, and it is enough to write, read, prove, and govern a kernel end to end. See [/v3.9/client](/v3.9/client) for the client that drives it.
