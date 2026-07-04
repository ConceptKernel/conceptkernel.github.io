---
title: "Quickstart: zero to sealed state"
description: "The shortest path from zero to sealed, governed, provable state — cklib over the real NATS-WSS wire, Docker only, via the runnable hello-kernel example."
---

# Quickstart: zero to sealed state

The shortest path from nothing to sealed, governed, provable state runs over the real wire: cklib attaches to a kernel over NATS-WSS, and every step below asserts something you can independently re-verify. The only prerequisite is Docker.

## Run it

The [`hello-kernel`](https://github.com/sporaxis-com/oci-germination/tree/main/examples/hello-kernel) example in oci-germination brings up the full stack — a governed pgCK door behind a NATS-WSS relay — and drives it with cklib exactly as a browser or agent would:

```sh
bash examples/hello-kernel/run.sh
```

One script, only Docker required. It walks the five steps that follow.

## 1. Activate

Attaching to a kernel is the whole of setup. `CK.activate` authenticates the connection, subscribes the granted scope, and returns a live handle:

```js
import { CK } from 'cklib';

const k = await CK.activate('demo', { wssEndpoint: 'ws://host:9222' });

const Task = 'https://conceptkernel.org/ontology/v3.8/core#Task';
```

## 2. Land sealed state

A `create` lands through the kernel's `validate → seal → HMAC-chained ledger → verifiable proof` path in one transaction. The reply is a receipt for a fact that already exists, shape-checked and proof-chained:

```js
const task = await k.create(Task, {
  part_of_goal: 'backlog:demo',
  target_kernel: 'urn:ckp:kernel:demo',
});
// → { ok: true, id, verified: true, proof_digest }
```

`verified: true` and a `proof_digest` mean the fact sealed and its proof minted in the same transaction that stored it.

## 3. Enforcement is real

The seal is a gate, and the way to see that is to try a write that violates the shape. Omit a shape-required field and the kernel rejects it at the seal:

```js
await k.create(Task, { part_of_goal: 'backlog:demo' });   // shape-required field omitted
// → { ok: false }   — rejected at the seal; the fact cannot land
```

A fact that fails its shape gate never enters the graph and never mints a proof. Enforcement is a property of the write path, present on every landing.

## 4. Verify the proof

Any sealed fact re-verifies independently. `verify` re-checks the proof chain against the ledger — the same check anyone can run, any time:

```js
await k.verify(task.id);
// → { verified: true, proof_digest: '…' }
```

## 5. Relate and traverse

Sealed links are traversable. `reach` follows a declared predicate from an instance to the facts it points at:

```js
await k.reach(task.id, 'https://conceptkernel.org/ontology/v3.8/core#part_of_goal');
```

## What just happened

Five lines carried you from an empty kernel to sealed, provable, reachable state — over NATS-WSS, through one governed door. The client held exactly one capability, `ckp.dispatch`. It ran no SQL and reached no query engine: it named a type and a predicate, and the kernel resolved the meaning, gated the write, sealed the fact, and minted the proof. Identity rode the connection's verified JWT the whole way; no step named an actor in a payload.

::: tip Operator note
`hello-kernel` is the adopter path — the wire a real app or agent integrates against. A direct `SELECT ckp.dispatch(...)` inside the container exists for debugging only and bypasses the relay.
:::

## Continue

- [The client: cklib](/v3.9/client) — the full handle and its verb map.
- [Seal and proof](/v3.9/seal-and-proof) — the `validate → seal → ledger → proof` path in detail.
- [The fleet](/v3.9/ecosystem) — the runtime, client, substrate, composer, and bundle behind this example.
