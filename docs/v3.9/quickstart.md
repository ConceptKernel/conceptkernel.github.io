---
title: "Quickstart: one docker run to sealed state"
description: "Stand up the whole CKP v3.9.1 substrate with one docker run, then drive it with cklib over NATS-WSS — the runnable hello-kernel journey, Docker only."
---

# Quickstart: one `docker run` to sealed state

The whole substrate is a single image. One `docker run` stands up PostgreSQL 17, the pgRDF graph engine, the pgCK runtime, NATS, and the browser client — about 128 MB, scratch base, no Python. The only prerequisite is Docker.

## 1. Stand up the substrate

```sh
docker run --rm -d --name ckp \
  -e OCIGER_CK_PARTICIPANT_PASSWORD='choose-a-password' \
  -p 5432:5432 -p 8000:8000 -p 4222:4222 -p 9222:9222 \
  ghcr.io/sporaxis-com/ociger-ck-allinone:v0.7.28
```

That single command gives you a complete **CKP v3.9.1 — Critical Isolation** substrate:

```
PostgreSQL 17  +  pgRDF (graph engine)  +  pgCK (concept-kernel runtime)
NATS core :4222  +  NATS WebSocket :9222   (the only door for apps)
busybox httpd :8000  serving /cklib/ (the browser client) + a landing probe
```

Set `OCIGER_CK_PARTICIPANT_PASSWORD` — without it the participant role exists but cannot log in, so the isolation floor is never cosmetic. The landing page at `http://localhost:8000/` runs a live round-trip in your browser and shows ✓ when the wire is alive.

## 2. Drive it with cklib

The [`hello-kernel`](https://github.com/sporaxis-com/oci-germination/tree/main/examples/hello-kernel) example drives the running substrate the way a real app does — the bundled cklib client over NATS-WSS, through the in-image relay, to `ckp.dispatch`:

```sh
bash examples/hello-kernel/run.sh
```

One script, only Docker required. It walks the steps that follow, staging the bundle's own cklib so the example always exercises the exact client the bundle ships.

## 3. Activate

Attaching to a kernel is the whole of setup. `CK.activate` opens the connection and returns a live handle. On a direct `docker run` (no TLS gateway in front) pass an explicit `ws://` endpoint:

```js
import { CK } from 'cklib';
const k = await CK.activate('demo', { wssEndpoint: 'ws://localhost:9222' });
```

The bundled `demo` kernel arms itself with the Task and Goal shapes at first boot, so it accepts sealed writes immediately.

## 4. Land sealed state

A `create` runs the kernel's `validate → seal → HMAC-chained ledger → verifiable proof` path in one transaction. The reply is a receipt for a fact that already exists, shape-checked and proof-chained:

```js
const task = await k.create('Task', { target_kernel: 'demo', title: 'patrol sector 7' });
// → { ok: true, id: 'task-…', verified: true, proof_digest: '7c1387a6…' }
```

`verified: true` and a `proof_digest` mean the fact sealed and its proof minted in the same transaction that stored it.

## 5. Enforcement is real

The seal is a gate. Omit a shape-required field and the kernel rejects the write at the seal:

```js
await k.create('Task', { target_kernel: 'demo' });   // title omitted
// → { ok: false }   — rejected at the seal; the fact never enters the graph
```

A fact that fails its shape gate never lands and never mints a proof. Enforcement is a property of the write path, present on every landing.

## 6. Verify, read, traverse

Any sealed fact re-verifies independently, and sealed links are traversable:

```js
await k.verify(task.id);                 // → { verified: true, proof_digest: '…' }
await k.query('Task', { target_kernel: 'demo' });   // the sealed tasks in this kernel
await k.reach(task.id, 'part_of_goal');  // follow a declared predicate
```

## What just happened

A few lines carried you from an empty kernel to sealed, provable, reachable state — over NATS-WSS, through one governed door. The client held exactly one capability, `ckp.dispatch`. It ran no SQL and reached no query engine: it named a type and a predicate, and the runtime resolved the meaning, gated the write, sealed the fact, and minted the proof.

::: warning Alpha-trust today
Identity is currently the participant role's shared password, not a per-user verified claim. The isolation floor is real — the role can call `ckp.dispatch` and nothing else — but treat a deployment as alpha-trust and do not expose it to untrusted users as-is. Per-user verified-JWT identity is an inherited upstream prerequisite (CKP v3.9 §10).
:::

## Continue

- [The client: cklib](/v3.9/client) — the full handle and its verb map.
- [Seal and proof](/v3.9/seal-and-proof) — the `validate → seal → ledger → proof` path in detail.
- [The fleet](/v3.9/ecosystem) — the runtime, client, substrate, and bundle behind this example.
