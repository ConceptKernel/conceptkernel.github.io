---
title: "Shapes: the σ Strand"
description: "SHACL shapes are the seal gate. A domain kernel declares shapes against its types, and every candidate body is validated against them before it lands — validate is the seal, and the seal is full W3C SHACL Core."
---

# Shapes: the σ Strand

A concept kernel's types are RDF classes, and their constraints are **SHACL shapes**. The shape strand — σ — is the kernel's contract about which bodies are well-formed. It is the gate every write passes through: a body that satisfies the kernel's declared shapes lands, and a body that violates them is refused at the seal, in the same transaction, before any fact reaches the ledger.

Shapes are what make a kernel *semantic*. A column tolerates whatever you put in it; a shape declares what a `crew_size` **is** — a single integer, required — and enforces that meaning on every participant, at every write, forever.

## A kernel declares its shapes

A domain kernel authors a `sh:NodeShape` for each type it constrains, names it in the project namespace `urn:ckp:<project>/shape/<Name>`, and points it at the type through `sh:targetClass`. The shape lives in the kernel's own shape graph, sealed there through the [governance plane](/v3.9/governance).

```turtle
@prefix sh:  <http://www.w3.org/ns/shacl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<urn:ckp:demo/shape/Ship>
  a sh:NodeShape ;
  sh:targetClass <urn:ckp:demo/type/Ship> ;
  sh:property [
    sh:path     <urn:ckp:demo/prop/crew_size> ;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    sh:datatype xsd:integer ;
  ] ;
  sh:property [
    sh:path     <urn:ckp:demo/prop/name> ;
    sh:minCount 1 ;
    sh:datatype xsd:string ;
    sh:pattern  "^[A-Z]" ;
  ] ;
  sh:property [
    sh:path <urn:ckp:demo/prop/status> ;
    sh:in   ( "planned" "crewed" "deployed" ) ;
    sh:nodeKind sh:Literal ;
  ] .
```

The `sh:targetClass` is the binding: this shape governs exactly the instances typed `urn:ckp:demo/type/Ship`. The kernel's core types carry the same discipline — `KernelShape`, `AffordanceShape`, `LedgerEntryShape`, `ProofShape` at the stable core namespace `https://conceptkernel.org/ontology/v3.8/core#` govern the protocol's own facts, so the runtime holds itself to the identical gate it holds domain kernels to.

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

`instance.validate` surfaces the full SHACL `ValidationReport` — every violation typed by its failing constraint, its focus path, and its severity. `instance.create` runs the same gate and, on conformance, continues through the whole landing: seal → HMAC-chained ledger → verifiable proof, one transaction.

```js
import { CK } from 'cklib';
const k = await CK.activate('demo', { wssEndpoint: 'wss://host/wss' });

const Ship = 'urn:ckp:demo/type/Ship';

// validate predicts the seal — the full report, typed by constraint
await k.validate({ type: Ship, crew_size: 12, name: 'Endurance', status: 'crewed' });
// → { conforms: true, violations: [] }

await k.validate({ type: Ship, crew_size: 'twelve', name: 'endurance' });
// → { conforms: false, violations: [
//       { path: 'urn:ckp:demo/prop/crew_size', constraint: 'datatype', severity: 'Violation' },
//       { path: 'urn:ckp:demo/prop/name',      constraint: 'pattern',  severity: 'Violation' } ] }

// create runs the identical gate at the seal
await k.create(Ship, { crew_size: 12, name: 'Endurance', status: 'crewed' });
// → { ok: true, id, proof_digest, verified: true }   — sealed + proof-chained

await k.create(Ship, { name: 'Endurance', status: 'crewed' });
// → { ok: false }   — crew_size is required; nothing lands
```

The report is typed: it names *why* a body failed — a missing required property, a wrong datatype, a value outside the enumeration — so a client can act on the specific violation.

## An unshaped type is valid silence

A type that no shape targets has no `sh:targetClass` match, so SHACL finds nothing to violate and the body **conforms**. This is deliberate: a kernel constrains what it has chosen to constrain, and an undeclared type is open by construction until the kernel seals a shape for it. Modelling is therefore additive — a kernel can create instances of a new type immediately and tighten the σ strand later through governance, at which point the very next write is bound by the new shape.

::: tip
Validate before you commit, and trust the result. Because validate ⟺ seal, a `conforms: true` from `instance.validate` guarantees the subsequent `instance.create` of the same body will land. There is no second, stricter gate waiting behind the seal.
:::

## The strand in the whole

Shapes are one of three strands the runtime weaves at every landing. The σ strand decides *what may land*; the proof strand decides *that it landed provably*; the α strand decides *who may ask*. Together they are the seal.

- [Seal and Proof](/v3.9/seal-and-proof) — how a conforming body becomes an HMAC-chained, verifiable fact
- [Affordances](/v3.9/affordances) — the closed verb vocabulary that carries `instance.validate` and `instance.create`
- [Governance](/v3.9/governance) — how a kernel seals and evolves its own shapes by consensus
