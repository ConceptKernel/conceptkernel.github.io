---
title: "What a Concept Kernel Is"
description: "A concept kernel is a sovereign Material Entity whose types are ontology — RDF classes, SHACL shapes, and OWL-RL rules — addressed by a urn:ckp: identity and governed by its own participants."
---

# What a Concept Kernel Is

A concept kernel is a self-contained unit of meaning with a stable identity — a **Material Entity** in the sense of BFO 2020. It persists over time, accumulates the facts it seals, and is addressed by what it means rather than where it is stored. Its *types are ontology*: RDF classes that name what kinds of thing may exist, SHACL shapes that gate what may land, and OWL-RL rules that entail what follows. Meaning is the schema.

## Types that are ontology

A kernel declares three grounded layers:

- **RDF classes** name the kinds of thing the kernel holds — `urn:ckp:demo/type/Ship`, `urn:ckp:demo/type/Task`.
- **SHACL shapes** constrain each class — a `Ship` shape may require `crew_size`; the shape is the contract every landing satisfies.
- **OWL-RL rules** entail new facts from the ones already sealed, so derived knowledge follows from stated knowledge.

These declarations ground into the stable core vocabulary at `https://conceptkernel.org/ontology/v3.8/core#` and, through it, toward upper ontologies such as the Basic Formal Ontology. See [/v3.9/naming](/v3.9/naming) for the addressing scheme and [/v3.9/shapes](/v3.9/shapes) for the shape contract.

## The address is the identity

A kernel's identity is its URN. The kernel is addressed at `urn:ckp:<project>`; its vocabulary at `urn:ckp:<project>/type/<Name>`, `/prop/<name>`, and `/shape/<Name>`; its instances at `urn:ckp:<project>/<id>`. That URN is how every participant names the kernel, how the door routes a dispatch to it, and how a sealed fact points back to the entity it describes.

## Declarative data, brought to life

A kernel begins as declarative data — a set of RDF, SHACL, and OWL statements. **Activation** brings it to life: a participant opens a live handle and the kernel becomes an addressable, governed surface.

```js
import { CK } from 'cklib';
const k = await CK.activate('demo', { wssEndpoint: 'wss://host/wss' });
```

From that handle the kernel accepts typed verbs — see [/v3.9/the-door](/v3.9/the-door) — and every write [seals](/v3.9/seal-and-proof) a shaped, proof-chained fact into its shared graph.

## Multi-participant by design

Many participants — browsers, agents, services — act on one kernel at once. Each dispatch seals a shaped fact into the kernel's graph, and the sealed fact emits to every participant. They converge on a single governed truth while each holds exactly one capability: the door. See [/v3.9/grants](/v3.9/grants) for the role floor.

## Sovereignty

A kernel governs its own types. Its shapes change through consensus: a participant proposes a change, the kernel's participants vote, and a quorum applies it. The very next write is bound by the quorum-approved shape, with a proof chain running from proposal to applied epoch. A kernel answers *what kinds of things exist, what constrains them, and what has actually happened* entirely from within itself. See [/v3.9/governance](/v3.9/governance).

## The nine strands

A kernel's anatomy resolves into nine strands. Each is one aspect of the same sovereign entity:

| Strand | Symbol | What it is |
|---|---|---|
| Classes | χ | The RDF classes that name what kinds of thing exist. |
| Properties | ρ | The declared properties — raw gestures a participant supplies and governed constants the kernel fixes. |
| Shapes | σ | The SHACL shapes that gate every landing against its class. |
| Affordances | α | The closed, named verb set the kernel exposes. |
| Grants | γ | The role → permission bindings that decide who may invoke what. |
| Proof chain | π | The HMAC-chained ledger and re-verifiable proof over every write. |
| Dispatch tuple | δ | The four-tuple ⟨verb, kernel_urn, payload, identity⟩ that crosses the membrane. |
| Plane function | φ | The router that sends each dispatch to the instance or governance plane. |
| Epoch | ε | The compile epoch — the kernel's current shape version. |

These nine strands are the working vocabulary of the **Concept Kernel Notation (CKN)**. The full treatment — how the strands compose, and the notation that writes a whole kernel as one expression — arrives in [/v3.10/](/v3.10/).

## A verb, not a query surface

Everything a participant can do to a kernel is one of a closed, named, grantable set of verbs (the α strand). You invoke a verb; you hand the kernel a typed payload, never a program to run. That single discipline — see [/v3.9/verb-vs-query-surface](/v3.9/verb-vs-query-surface) — is what keeps a kernel sovereign, provable, and safe to share among many participants at once.

A concept kernel, then, is one entity holding all nine strands together: a URN-addressed Material Entity whose ontology *is* its type system, whose every write is shaped and proved, and whose governance lives inside itself. The pages that follow open each strand in turn — [the door](/v3.9/the-door), [the seal and proof](/v3.9/seal-and-proof), [naming](/v3.9/naming), and [governance](/v3.9/governance).
