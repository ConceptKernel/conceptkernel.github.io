---
title: "The Client: cklib"
description: "cklib is the dispatch-only JavaScript client for concept kernels — a handle whose every method maps to one governed verb, carrying no RDF, no quad store, and no query language."
---

# The Client: cklib

**cklib** is how JavaScript operates a concept kernel. A browser page, a service, a CLI, or an LLM agent attaches to a kernel by name and receives a live handle. Every method on that handle compiles to exactly one governed dispatch. The handle's entire outbound surface is `ckp.dispatch` — it addresses URNs and typed instances, and that is the whole of what crosses the wire.

The client is zero-dependency and air-gapped: the NATS-WSS transport and MsgPack codec are vendored inside the bundle, so it runs with no runtime CDN fetch. It ships as an attested, byte-verified OCI bundle (`ghcr.io/conceptkernel/ck-lib-js:1.5.3`).

## Attach and operate

```js
import { CK } from 'cklib';

const k = await CK.activate('demo', { wssEndpoint: 'ws://host:9222' });
```

`CK.activate(name, { wssEndpoint })` authenticates the connection, subscribes the kernel's granted result and event scope, fetches the affordances this identity may call, and returns a live handle. The handle is the surface application code touches. It names concept kernels and concepts (URNs) — the NATS subjects, trace ids, and codecs stay inside the transport.

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

Identity is derived from the verified JWT the connection carries. The client cannot assert who it is: no method takes an identity argument, and no payload field names an actor. Every sealed fact stamps `created_by` from the connection's identity, server-side. "Client" therefore means anything that can hold a connection — a browser, a service, an agent — and a fleet of attached agents is governable: each does only what the kernel declares and its identity is granted, and everything it does is attributable and sealed.

## Honest degrade

When a capability is unavailable on the substrate, the handle surfaces the substrate's own signal — the governance plane answers `{ ok: false, error: 'gov_plane_unavailable' }` when it is not an affordance; a read that has no grant returns an empty result. The client returns the substrate's `*_unavailable` verdict verbatim and never fabricates, caches-as-answer, or interpolates a value. An empty result is an honest empty result.

```js
await k.propose('add_property', { path: 'urn:ckp:demo/prop/label', targetClass: '…#Task', minCount: 0 });
// → { ok: false, error: 'gov_plane_unavailable' }  — surfaced, never faked
```

## Install

The live channel is the attested OCI bundle. Pin the current tag and copy it into your image:

```dockerfile
FROM ghcr.io/conceptkernel/ck-lib-js:1.5.3 AS cklib_source   # attested + byte-verified
COPY --from=cklib_source / /app/cklib/
```

The bundle is CI-built from the tag, SLSA-attested, and byte-verified before publication (`ck.js` + `ck-client.js` + `ck-store.js` + the vendored transport). Verify any tag:

```sh
gh attestation verify oci://ghcr.io/conceptkernel/ck-lib-js:1.5.3 --repo ConceptKernel/CK.Lib.Js   # exit 0
```

## Continue

- [Quickstart: zero to sealed state](/v3.9/quickstart) — the shortest path over the real wire.
- [The core vocabulary](/v3.9/ontology) and [naming](/v3.9/naming) — the IRIs and URNs the handle addresses.
- [The verb vs. query surface](/v3.9/verb-vs-query-surface) — why the client holds verbs, never expressions.
