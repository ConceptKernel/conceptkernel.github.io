---
title: "What a Concept Kernel Is"
description: "A concept kernel is a named domain — a Material Entity whose types are ontology — that holds governed, sealed, proof-chained instances and evolves its own type by consensus."
---

# What a Concept Kernel Is

A concept kernel is a self-contained unit of meaning with a stable identity — a **Material Entity** in the sense of BFO 2020. It persists over time, accumulates the facts it seals, and is addressed by what it means rather than where it is stored. Its *types are ontology*: RDF classes that name what kinds of thing may exist, SHACL shapes that gate what may land, and OWL-RL rules that entail what follows. Meaning is the schema.

In practice a kernel is a **named domain** — a match, an experiment, a service, any bounded universe. You open one with a single verb, and any name works:

```js
import { CK } from 'cklib';
const k = await CK.activate('demo', { wssEndpoint: 'ws://localhost:9222' });
```

The bundled `demo` kernel arms itself with the Task and Goal shapes at first boot, so it accepts sealed writes out of the box.

## What a kernel holds

Inside a kernel you land **instances** — sealed, proof-chained facts that satisfy the kernel's shapes. The live substrate holds two kinds:

- **Tasks** — governed work-or-state objects that target a kernel: a lifecycle, a priority, a queue position. Each `task.create` seals a fact and returns a re-verifiable proof.
- **Goals** — the objectives and backlogs a kernel works toward.

```js
const task = await k.create('Task', { target_kernel: 'demo', title: 'patrol sector 7' });
//   → { ok: true, id: 'task-…', verified: true, proof_digest: '7c1387a6…' }
```

Every landing carries its own proof; the [seal and proof](/v3.9/seal-and-proof) page shows the mechanism. Modeling your *own* first-class type — a `Ship` with its own create verb and its own shape — is the next pgCK capability (CKP v3.9 §4); today `instance.create` routes to Task and Goal, and a domain entity lives as a task in its kernel with its state in the task body. The [naming](/v3.9/naming) page describes the addressing the protocol defines for those custom types.

## Types that are ontology

A kernel's structure is declared in three grounded layers:

- **RDF classes** name the kinds of thing the kernel holds.
- **SHACL shapes** constrain each class — a shape may require a `title` or a `crew_size`; the shape is the contract every landing satisfies, checked at the [seal](/v3.9/shapes).
- **OWL-RL rules** entail new facts from the ones already sealed, so derived knowledge follows from stated knowledge.

These declarations ground into the stable core vocabulary at `https://conceptkernel.org/ontology/v3.8/core#` and, through it, toward upper ontologies such as the Basic Formal Ontology. A kernel's own adopter shapes load into its graph `urn:ckp:<kernel>/kernel/ck`. See [naming](/v3.9/naming) for the addressing scheme and [the core vocabulary](/v3.9/ontology) for what ships inside the runtime.

## Declarative data, brought to life

A kernel begins as declarative data — a set of RDF, SHACL, and OWL statements. **Activation** brings it to life: a participant opens a live handle and the kernel becomes an addressable, governed surface. From that handle the kernel accepts typed verbs — see [the door](/v3.9/the-door) — and every write [seals](/v3.9/seal-and-proof) a shaped, proof-chained fact into its shared graph.

## Multi-participant by design

Many participants — browsers, agents, services — act on one kernel at once. Each dispatch seals a shaped fact into the kernel's graph, and each participant reads the sealed instances back and re-verifies their proofs. They converge on a single governed truth while each holds exactly one capability: the door. See [grants and the role floor](/v3.9/grants).

## Sovereignty

A kernel governs its own types. Its shapes change through consensus: a participant proposes a change, the kernel's participants vote, and a quorum applies it. The very next write is bound by the approved shape, and applying the change advances the kernel's **epoch** — with a proof chain running from proposal to applied epoch. A kernel answers *what kinds of things exist, what constrains them, and what has actually happened* entirely from within itself. See [governance](/v3.9/governance) and [epochs](/v3.9/epochs).

## A verb, not a query surface

Everything a participant can do to a kernel is one of a closed, named, grantable set of verbs. You invoke a verb and hand the kernel a typed payload, never a program to run. That single discipline — see [A Verb, Not a Query Surface](/v3.9/verb-vs-query-surface) — is what keeps a kernel sovereign, provable, and safe to share among many participants at once.

A concept kernel, then, is one entity: a named, ontology-typed Material Entity whose every write is shaped and proved, and whose governance lives inside itself. The pages that follow open each part in turn — [the door](/v3.9/the-door), [the seal and proof](/v3.9/seal-and-proof), [shapes](/v3.9/shapes), and [governance](/v3.9/governance).

::: info The notation is v3.10
Describing a kernel as an alphabet of *strands* (χ, ρ, σ, α, …) — Concept Kernel Notation — is the [v3.10 design direction](/v3.10/), conceptual and not part of the shipped v3.9.1 surface. This page describes the kernel as it runs today.
:::
