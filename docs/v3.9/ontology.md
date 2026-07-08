---
title: "The Core Vocabulary"
description: "The CKP core ontology — 11 classes and 8 SHACL seal-gate shapes at a stable IRI, shipped inside the runtime and enforced at every sealed write."
---

# The Core Vocabulary

The CKP core vocabulary is the set of classes and shapes the protocol uses to govern its **own** operations. It lives at a stable IRI:

```
https://conceptkernel.org/ontology/v3.8/core#
```

This IRI is the contract. It resolves to a Turtle document — [`core.ttl`](https://conceptkernel.org/ontology/v3.8/core.ttl) — and you can read it interactively in [the ontology browser](https://conceptkernel.org/browse/index.html). Every term below is addressed under this prefix, e.g. `https://conceptkernel.org/ontology/v3.8/core#Kernel`.

## Shipped inside the runtime

The core vocabulary travels with the runtime. When a database runs `CREATE EXTENSION`, the core Turtle loads into the pgRDF graph `urn:ckp:core`, and from that moment every governed write is validated against these shapes at commit. The vocabulary is enforcement, present at the seal — a fact that violates a core shape cannot land.

## The 11 classes

| Class | Governs |
|---|---|
| `Kernel` | A versioned, ontology-defined unit of behaviour. |
| `Organ` | A part of a kernel — `ck`, `tool`, or `data`. |
| `Affordance` | Binds an inbound topic to an action — a routable verb. |
| `LedgerEntry` | An append-only, HMAC-authenticated audit record. |
| `Proof` | A verifiable, HMAC-backed attestation about an instance. |
| `Provenance` | A PROV-O subset describing derivation. |
| `Proposal` | A proposed governed type change, pending until quorum applies it. |
| `Vote` | A sealed vote about a Proposal. |
| `QuorumLevel` | A named quorum requirement for a governed change. |
| `Grant` | Binds a role to a permission — domain × action × target. |
| `Transition` | A sealed allowed `(from → to)` edge in a kernel's transition map. |

The first six describe the anatomy and audit of a kernel: what it is, what it exposes, and the sealed record every change leaves behind. The last five are the **governance type plane** — the vocabulary a kernel uses to change its own types by consensus.

## The governance type plane

A kernel evolves its own shape through governed types. A `Proposal` names a type change and carries a `proposalState` of `pending`, `applied`, or `rejected`. A `Vote` seals an identity's `approve` or `reject` about that proposal. A `QuorumLevel` states how many approvals a change requires. A `Grant` binds a role to a permission — a domain, an action, and a target. A `Transition` records one allowed move in a kernel's lifecycle state machine.

Because these are ontology classes with their own shapes, a proposal, a vote, and an applied epoch each seal into the ledger with a proof chain. The path from proposal to applied type is itself governed, sealed, and provable. See [governance](/v3.9/governance) for the `propose → vote → apply` cycle in full.

## The 8 seal-gate shapes

Eight SHACL node shapes bind the core classes. Each is a target the seal checks before a write of that class can land:

| Shape | Requires |
|---|---|
| `KernelShape` | an `rdfs:label`; a `dataSubstrate` of `jsonb`, `age`, or `jsonb,age`. |
| `AffordanceShape` | an `inTopic`; an optional IRI `inShape`; a `plane` of `instance` or `governance`; an integer `epoch`. |
| `LedgerEntryShape` | an IRI `about`; a 64-hex `bodySha`; a signature of length ≥ 16; a `dateTime` timestamp. |
| `ProofShape` | an IRI `about`; a `method` of `hmac+sha256`; a 64-hex `digest`; a `verifiedAt` timestamp. |
| `ProposalShape` | an IRI `about`; a `proposalState` in the allowed set; an optional integer `requiresQuorum`. |
| `VoteShape` | an IRI `about`; a `voteValue` of `approve` or `reject`. |
| `GrantShape` | a `role`, a `permDomain`, a `permAction`, and a `permTarget`. |
| `TransitionShape` | a `fromState` and a `toState`. |

These shapes are the reason a `Proof` always carries a real digest and a `LedgerEntry` always carries a real signature: the shape gate requires them at commit. The full shape mechanics live in [shapes and the seal gate](/v3.9/shapes).

## Domain kernels compose alongside

The core vocabulary governs the protocol. A project's own meaning composes beside it as domain types under a `urn:ckp:` prefix:

```turtle
urn:ckp:acme/type/Invoice     # a domain class
urn:ckp:acme/prop/amount_due  # a domain property
urn:ckp:acme/shape/Invoice    # a domain SHACL shape
```

This `urn:ckp:<project>/type|prop|shape/<Name>` scheme is the naming for a kernel's first-class domain types — a domain class, its properties, and its SHACL shape, each addressed and checked exactly as the core terms are. The substrate ships the `Task` and `Goal` shapes armed today; declaring a fully custom first-class type and landing it through a generic typed create is the roadmap step (CKP v3.9 §4). Storing a domain fact leaves the core vocabulary untouched, and running a governed verb leaves it unrewritten — the two planes are held apart by write authority. The [naming](/v3.9/naming) page gives the full addressing scheme for both the stable core IRI and domain URNs.

## Continue

- [Naming](/v3.9/naming) — the core IRI and the `urn:ckp:` domain scheme.
- [Shapes and the seal gate](/v3.9/shapes) — how a shape gates a write.
- [Governance](/v3.9/governance) — the `propose → vote → apply` cycle over the type plane.
