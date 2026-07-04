---
title: "Naming: the developer writes URN"
description: "Three namespace tiers — the stable protocol core, the domain kernel, and the instance. The developer addresses meaning; pgCK resolves short keys to declared IRIs."
---

# Naming: the developer writes URN

A developer working a concept kernel writes URNs. Every write and every read names a class, a property, or an instance by its stable identifier — and that identifier *is* the meaning. The developer addresses what a thing means; pgCK resolves the address to storage. Nothing about the storage layout reaches the developer's hands: no HTTP schema version, no graph id, no quad.

## Three namespace tiers

CKP names things across three tiers. Each tier answers a different question — *what protocol, what kernel, what thing* — and each has a fixed grammar.

| Tier | Grammar | Names | Example |
|---|---|---|---|
| Protocol core | `https://conceptkernel.org/ontology/v3.8/core#<Term>` | the protocol's own vocabulary | `…/core#Task` |
| Domain kernel | `urn:ckp:<project>/type\|prop\|shape/<Name>` | a kernel's classes, properties, shapes | `urn:ckp:demo/type/Ship` |
| Instance | `urn:ckp:<project>/<id>` | a sealed individual | `urn:ckp:demo/ship/endurance` |

### The protocol core is stable

The core vocabulary — `ckp:Kernel`, `ckp:Proposal`, `ckp:Grant`, `ckp:Transition`, and the properties that shape them — lives at a single stable IRI: `https://conceptkernel.org/ontology/v3.8/core#`. That IRI is the name of the protocol's vocabulary, and it holds steady across protocol releases. The vocabulary is versioned by the specification that governs it, so the identifier a developer writes stays fixed while the spec around it advances. A `Task` is `https://conceptkernel.org/ontology/v3.8/core#Task` in a v3.9.1 kernel exactly as it reads on the page.

### Domain kernels carve their own space

A project models its world under `urn:ckp:<project>/`, with a segment that says which kind of term follows:

```turtle
@prefix demo: <urn:ckp:demo/> .

demo:type/Ship    a rdfs:Class .
demo:prop/blocks  a rdf:Property .
demo:shape/Ship   a sh:NodeShape ; sh:targetClass demo:type/Ship .
```

- `urn:ckp:demo/type/Ship` — an `rdfs:Class` the kernel declares.
- `urn:ckp:demo/prop/blocks` — a property the kernel declares.
- `urn:ckp:demo/shape/Ship` — an `sh:NodeShape` that gates instances of the class.

The `<project>` segment scopes the kernel; the `type` / `prop` / `shape` segment tells a reader — human or machine — what tier of meaning the `<Name>` occupies.

### Instances are individuals in that space

A sealed individual is `urn:ckp:<project>/<id>` — `urn:ckp:demo/ship/endurance`. It belongs to the same project namespace as the class it instantiates, so an instance and its type read as neighbours.

## The developer addresses meaning

Because the developer names meaning, the storage layout stays out of reach. There is no schema version in the developer's hands beyond the stable core IRI; there is no graph id to route to; there is no quad to assemble. The [client](/v3.9/client) speaks typed instances and URNs, and pgCK — composing pgRDF beneath the door — turns those names into shaped, sealed, proof-chained state.

## Short keys resolve to declared IRIs

Inside a `create`, `query`, or `link`, a developer writes **short localnames** for a kernel's properties. pgCK resolves each short key to the declared property IRI by reading the kernel's own shapes — the same `sh:path` declarations the seal gate reads.

```js
import { CK } from 'cklib';
const k = await CK.activate('demo', { wssEndpoint });

// create: `type` is the full class IRI; fields are short keys.
await k.create('urn:ckp:demo/type/Ship', {
  name: 'Endurance',
  crew_size: 12,
});
// pgCK resolves `name` → urn:ckp:demo/prop/name, `crew_size` → …/prop/crew_size,
// seals against urn:ckp:demo/shape/Ship, and returns { ok, id, proof_digest, seq }.
```

The rule is uniform across the read and write surface. A `query` filter keys on short localnames; a short key that resolves to a declared property is accepted, and a key the kernel never declared is rejected — the shape is the allow-list.

```js
await k.query('urn:ckp:demo/type/Ship', { crew_size: { '>=': 10 } });
// `crew_size` resolves to its declared property IRI; an undeclared key is rejected.
```

## A link target is a plain IRI

A relation is a `link` from a source to a target across a declared predicate. The predicate is a declared property IRI; the target is a **plain IRI string** — the URN of the thing linked, written directly.

```js
await k.link(
  'urn:ckp:demo/ship/endurance',   // source instance IRI
  'urn:ckp:demo/prop/blocks',      // declared predicate IRI
  'urn:ckp:demo/ship/aurora'       // target — a plain IRI string
);
// pgCK gates the predicate against the kernel's declared property set,
// seals the edge, and materializes the traversable quad for reach().
```

The predicate must be one of the kernel's declared predicates; a link across an undeclared predicate is rejected. Once sealed, the edge is traversable by `reach` from the source across that predicate.

## Related

- [Ontology](/v3.9/ontology) — the classes, properties, and shapes a URN names.
- [Concept Kernel](/v3.9/concept-kernel) — the sovereign unit each `urn:ckp:<project>/` namespace scopes.
- [Client](/v3.9/client) — the cklib surface that speaks URNs and typed instances over the door.
