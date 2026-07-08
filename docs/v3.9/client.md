---
title: "The Client: cklib"
description: "cklib is the dispatch-only JavaScript client for concept kernels — a handle whose every method maps to one governed verb, carrying no RDF, no quad store, and no query language."
---

# The Client: cklib

**cklib** is how JavaScript operates a concept kernel. A browser page, a service, a CLI, or an LLM agent attaches to a kernel by name and receives a live handle. Every method on that handle compiles to exactly one governed dispatch. The handle's entire outbound surface is `ckp.dispatch`: it publishes the four-tuple — verb, kernel URN, payload, identity — to `input.kernel.<K>.action.<verb>` over NATS-WSS and correlates the typed reply by its `Trace-Id`. It carries no RDF, no quad store, and no SPARQL — the dispatch four-tuple is the whole of what crosses the wire.

The client is dependency-vendored and air-gapped: the NATS-WSS transport and MsgPack codec are vendored inside the bundle, so it runs with no runtime CDN fetch. It ships as an attested, byte-verified OCI bundle (`ghcr.io/conceptkernel/ck-lib-js`); the latest release is `1.5.4`, and the runnable `ck-allinone` bundle pins and serves `1.5.3` at `/cklib/` (`ck-client.js` + `vendor/`), so a browser becomes a concept-kernel client by importing it straight from the running substrate.

## Attach and operate

```js
import { CK } from 'cklib';

const k = await CK.activate('demo', { wssEndpoint: 'ws://<host>:9222' });

// Land sealed, proof-chained state — a Task targeting the kernel:
const t = await k.create('Task', { target_kernel: 'demo', title: 'patrol sector 7' });
//  → { ok: true, id: 'task-…', verified: true, proof_digest: '7c1387a6…' }

await k.verify(t.id);   // { ok: true, verified: true } — re-verifiable any time
```

`CK.activate(name, { wssEndpoint })` authenticates the connection, subscribes the kernel's granted result and event scope, fetches the affordances this identity may call, and returns a live handle. The handle is the surface application code touches. It names concept kernels and concepts (URNs) — the NATS subjects, trace ids, and codecs stay inside the transport.

The `demo` kernel arms the `Task` and `Goal` shapes at first boot, so `create('Task', …)` works out of the box, and reads (`verify`, `query`, `link`, `reach`) round-trip over the same door. A create that omits a shape-required field is rejected at the seal — enforcement is real, and the handle surfaces the `{ ok: false }` verdict. Point the handle at another kernel once that kernel has adopted its shapes into `urn:ckp:<kernel>/kernel/ck`.

::: tip The `wssEndpoint` gotcha
On a direct `docker run`, pass an explicit `ws://<host>:9222` — the NATS WebSocket door is on container port `:9222`. cklib's same-origin default is `wss://<host>/wss`, which a TLS gateway serves by routing `/wss` → `:9222`; behind such a gateway you drop the option and the default resolves.
:::

## The handle maps one method to one verb

Each handle method is sugar over a single dispatch. The mapping is fixed:

| Handle method | Dispatch verb |
|---|---|
| `create(type, body)` | `instance.create` |
| `update(id, patch)` | `instance.update` |
| `transition(id, toState)` | `instance.transition` |
| `link(source, predicate, target)` | `instance.link` |
| `notify(from, predicate, to, body)` | `instance.link` (sealed event edge) |
| `retire(id, reason)` | `instance.retire` |
| `get(id)` | `instance.get` |
| `query(type, filter)` | `instance.query` |
| `reach(from, via)` | `instance.reach` |
| `match(term)` | `concept.match` |
| `validate(body)` | `instance.validate` |
| `verify(id)` | `instance.verify` |
| `provenance(id)` | `instance.provenance` |
| `snapshot(scope)` | `instance.snapshot` |
| `propose(op, detail)` | `kernel.propose_change` |
| `vote(proposal, value)` | `kernel.vote` |
| `apply(proposal)` | `kernel.apply` |

The write verbs — `create`, `update`, `transition`, `link`, `notify`, `retire` — each land through the kernel's `validate → seal → HMAC-chained ledger → verifiable proof` path in one transaction. A write that violates its shape returns `{ ok: false }` at the seal; it cannot land. The governance plane — `propose`, `vote`, `apply` — evolves the kernel's own types by quorum, so the next seal is bound by the approved shape.

Today `instance.create` lands the `Task` and `Goal` shapes the substrate ships. Modeling your own first-class domain type — its own create verb and its own shape — is the generic typed-create roadmap item (CKP v3.9 §4); until it lands, a domain object rides as a `Task` targeting its kernel, with its state in the task body.

## Zero query surfaces

The read verbs are `get`, `query`, `reach`, `match`, `validate`, `verify`, `provenance`, and `snapshot`. Each accepts named arguments — an id, a type plus short filter keys, a predicate IRI, a term — and every one of them is a closed, named affordance. The read vocabulary is a finite set of verbs with **no expression position**: there is no `sparql()` method, no query string, and no way for the client to hold a quad. The kernel resolves meaning; the client names what it wants.

```js
// query names a type and short filter keys — a closed shape, never an expression:
const active = await k.query(
  'https://conceptkernel.org/ontology/v3.8/core#Task',
  { status: 'active', limit: 20 }
);
```

This is what "0 query surfaces" means from the client side, and it is a structural property of the surface, not a convention. See [the verb vs. query surface](/v3.9/verb-vs-query-surface) for the full account, and [the door](/v3.9/the-door) for how one capability gates every operation.

## Identity is the connection

Identity today is the connection's `ck_participant` role, authenticated by its SCRAM password. That role holds exactly one capability — `ckp.dispatch` — and every sealed fact stamps `created_by` server-side from the connection; no method takes an identity argument, and no payload field names an actor. "Client" therefore means anything that can hold a connection — a browser, a service, an agent — and a fleet of attached clients is governable: each does only what the kernel declares and its role is granted, and everything it does is attributable and sealed.

Treat a deployment as **alpha-trust**: the isolation floor is real — the participant role reaches meaning through the one door and nothing else — and the participant identity is a shared secret. Per-connection verified-JWT identity, with the seal checking its claims, is the roadmap step that lifts the shared-secret floor to per-user verified identity (CKP v3.9 §10).

## Honest degrade

When a capability is unavailable on the substrate, the handle surfaces the substrate's own signal — the governance plane answers `{ ok: false, error: 'gov_plane_unavailable' }` when it is not an affordance; a read that has no grant returns an empty result. The client returns the substrate's `*_unavailable` verdict verbatim and never fabricates, caches-as-answer, or interpolates a value. An empty result is an honest empty result.

```js
await k.propose('add_property', { path: 'urn:ckp:demo/prop/label', targetClass: '…#Task', minCount: 0 });
// → { ok: false, error: 'gov_plane_unavailable' }  — surfaced, never faked
```

## Install

The shipped artifact is the attested OCI bundle. The runnable `ck-allinone` bundle already serves the browser client at `/cklib/`, so an adopter imports it straight from the running substrate; to build your own image, pin the tag and copy it in:

```dockerfile
FROM ghcr.io/conceptkernel/ck-lib-js:1.5.3 AS cklib_source   # attested + byte-verified
COPY --from=cklib_source / /app/cklib/
```

The bundle is CI-built from the tag, SLSA-attested, and byte-verified before publication (`ck.js` + `ck-client.js` + `ck-store.js` + the vendored transport). Verify any tag:

```sh
gh attestation verify oci://ghcr.io/conceptkernel/ck-lib-js:1.5.3 --repo ConceptKernel/CK.Lib.Js   # exit 0
```

npm distribution of the 1.5.x client is wired with Sigstore provenance and deferred; the OCI bundle above is today's channel.

## Continue

- [Quickstart: zero to sealed state](/v3.9/quickstart) — the shortest path over the real wire.
- [The core vocabulary](/v3.9/ontology) and [naming](/v3.9/naming) — the IRIs and URNs the handle addresses.
- [The verb vs. query surface](/v3.9/verb-vs-query-surface) — why the client holds verbs, never expressions.
