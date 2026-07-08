---
title: "Shapes and the Seal Gate"
description: "SHACL shapes are the seal gate. A kernel declares shapes against its types, and every candidate body is validated against them before it lands — validate is the seal, and the seal is full W3C SHACL Core."
---

# Shapes and the Seal Gate

A concept kernel's types are RDF classes, and their constraints are **SHACL shapes**. Shapes are the kernel's contract about which bodies are well-formed. They are the gate every sealed write passes through: a body that satisfies the kernel's declared shapes lands, and a body that violates them is refused at the seal, in the same transaction, before any fact reaches the ledger.

Shapes are what make a kernel *semantic*. A column tolerates whatever you put in it; a shape declares what a `crew_size` **is** — a single integer, required — and enforces that meaning on every participant, at every write, forever.

::: info
This describes the substrate as the `ck-allinone` v0.7.28 bundle ships it — pgCK 0.4.21, cklib 1.5.3, pgRDF 0.6.19 — on the substrate finalized at CKP v3.9.
:::

## A kernel declares its shapes

The `demo` kernel boots armed with the `Task` and `Goal` shapes, so a task or a goal seals out of the box. An adopter authors a `sh:NodeShape` for each type its kernel constrains, points it at the type through `sh:targetClass`, and loads it into the kernel's own shape graph `urn:ckp:<kernel>/kernel/ck`, sealed there through the [governance plane](/v3.9/governance).

```turtle
@prefix ckp:  <https://conceptkernel.org/ontology/v3.8/core#> .
@prefix sh:   <http://www.w3.org/ns/shacl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .

# The Task shape the demo kernel is armed with at first boot.
ckp:TaskShape
  a sh:NodeShape ;
  sh:targetClass ckp:Task ;
  sh:property [
    sh:path     ckp:target_kernel ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    sh:nodeKind sh:IRI ;
  ] ;
  sh:property [
    sh:path     ckp:part_of_goal ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    sh:nodeKind sh:IRI ;
  ] .

# A Goal must carry a label.
ckp:GoalShape
  a sh:NodeShape ;
  sh:targetClass ckp:Goal ;
  sh:property [
    sh:path     rdfs:label ;
    sh:minCount 1 ;
    sh:datatype xsd:string ;
  ] .
```

The `sh:targetClass` is the binding: `ckp:TaskShape` governs exactly the instances typed `ckp:Task`, requiring every Task to name both a `target_kernel` and a `part_of_goal` as IRIs; `ckp:GoalShape` requires every Goal to carry an `rdfs:label`. The kernel's core types carry the same discipline — `KernelShape`, `AffordanceShape`, `LedgerEntryShape`, `ProofShape` at the stable core namespace `https://conceptkernel.org/ontology/v3.8/core#` govern the protocol's own facts, so the runtime holds itself to the identical gate it holds domain kernels to.

## The seal is full W3C SHACL Core

When a participant writes an instance, the runtime projects the candidate body to RDF, resolves each field to its declared property IRI, and validates the result against the shapes that target the body's class. Only a conforming body seals. The seal enforces the **full W3C SHACL Core** vocabulary:

| Constraint | Declares |
|---|---|
| `sh:minCount` / `sh:maxCount` | required and bounded cardinality of a property |
| `sh:datatype` | the literal datatype (`xsd:integer`, `xsd:string`, `xsd:dateTime`, …) |
| `sh:in` | a closed enumeration of admissible values |
| `sh:pattern` | a regular expression the lexical value must match |
| `sh:nodeKind` | whether the value is an IRI, a literal, or a blank node |

Because the seal runs the complete report, **validate is the seal**. The `instance.validate` verb runs the exact same SHACL evaluation the seal runs, so its verdict is the write's verdict:

> a body that `validate` reports conforming is a body the seal accepts, and a body that `validate` reports violating is a body the seal refuses.

This biconditional — validate ⟺ seal — is what lets a client check a body before committing to it and trust the answer completely.

## Validate returns the report; the seal returns the proof

`instance.validate` surfaces the full SHACL `ValidationReport` — every violation typed by its failing constraint, its focus path, and its severity. `task.create` runs the same gate and, on conformance, continues through the whole landing: seal → HMAC-chained ledger → verifiable proof, one transaction.

```js
import { CK } from 'cklib';
const k = await CK.activate('demo', { wssEndpoint: 'ws://host:9222' });

// validate predicts the seal — the full report, typed by constraint
await k.validate('Task', { target_kernel: 'demo', title: 'patrol sector 7' });
// → { conforms: true, violations: [] }

await k.validate('Task', { title: 'patrol sector 7' });
// → { conforms: false, violations: [
//       { path: 'https://conceptkernel.org/ontology/v3.8/core#target_kernel',
//         constraint: 'minCount', severity: 'Violation' } ] }

// create runs the identical gate at the seal
await k.create('Task', { target_kernel: 'demo', title: 'patrol sector 7' });
// → { id: 'task-…', ok: true, verified: true, proof_digest: '7c1387a6…' }   — sealed + proof-chained

await k.create('Task', { title: 'patrol sector 7' });
// → { ok: false }   — target_kernel is required; nothing lands
```

The report is typed: it names *why* a body failed — a missing required property, a wrong datatype, a value outside the enumeration — so a client can act on the specific violation.

## An unconstrained property is open by construction

SHACL validates only what a shape targets, so a property no shape constrains carries no obligation, and a body that omits it conforms. This is deliberate: a kernel constrains what it has chosen to constrain, and a dimension stays open until the kernel seals a constraint on it. Modelling is therefore additive — a kernel tightens its type through [governance](/v3.9/governance), and the very next write is bound by the new shape. First-class custom sealed types — beyond the shipped `Task` and `Goal` — are the next pgCK capability (CKP v3.9 §4); until then, a kernel shapes its Tasks and Goals and evolves those shapes by consensus.

::: tip
Validate before you commit, and trust the result. Because validate ⟺ seal, a `conforms: true` from `instance.validate` guarantees the subsequent create of the same body will land. There is no second, stricter gate waiting behind the seal.
:::

## Shapes in the whole

Shapes are one of three guarantees the runtime enforces at every landing. Shapes decide *what may land*; the proof chain records *that it landed provably*; the verb vocabulary decides *who may ask*. Together they are the seal.

- [Seal and Proof](/v3.9/seal-and-proof) — how a conforming body becomes an HMAC-chained, verifiable fact
- [Affordances](/v3.9/affordances) — the verb vocabulary that carries `instance.validate` and `task.create`
- [Governance](/v3.9/governance) — how a kernel seals and evolves its own shapes by consensus
