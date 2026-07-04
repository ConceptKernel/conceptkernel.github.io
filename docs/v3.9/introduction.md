---
title: "Introduction to CKP v3.9.1"
description: "Sovereign, semantic, self-governing state reached through one typed door — the Concept Kernel Protocol v3.9.1, Critical Isolation."
---

# Introduction to CKP v3.9.1

A Concept Kernel is a self-governing unit of meaning. Its types are ontology — RDF classes, SHACL shapes, OWL-RL rules, not hand-rolled columns. Every change it makes is **shape-gated, sealed, and proof-chained** the moment it lands, and it answers the world through a single typed verb carried over NATS-WSS. Meaning is the schema; the door is the whole surface.

It runs inside PostgreSQL, but the engine stays out of sight: no REST endpoint, no SQL handle, no query surface is exposed. The meaning is sovereign, every step it has taken is provable, and the only thing that crosses the boundary is one verb and its typed payload. This is **CKP v3.9.1 — Critical Isolation**: the engine stays invisible, the meaning stays sovereign, and the proof chain stays whole.

It is shipped, attested, and runnable today — the runtime is [pgCK](https://github.com/styk-tv/pgCK) `v0.4.17` on the [pgRDF](https://github.com/styk-tv/pgRDF) semantic engine; the client is [cklib](https://github.com/ConceptKernel/CK.Lib.Js) `v1.5.3`, which speaks the protocol and nothing else.

## The claim, in one paragraph

A participant — a browser, an agent, a service — reaches a kernel through exactly one capability: [`ckp.dispatch(verb, kernel_urn, payload, identity)`](/v3.9/the-door). It names a [verb from a closed set](/v3.9/affordances) and hands it a typed payload. The engine validates the payload against the kernel's [declared shape](/v3.9/shapes), and if it conforms the fact **seals** — validate → seal → HMAC-chained ledger → verifiable proof, in [one transaction](/v3.9/seal-and-proof). A kernel changes its *own* types only by [consensus](/v3.9/governance) — propose → vote → apply — so the very next write is bound by a quorum-approved shape. No REST endpoint, no SQL handle, no query engine is ever exposed. The door is the whole surface.

## The distinction it all rests on

The single design choice underneath everything is this: a caller reaches a kernel through **a verb, not a query surface**.

A query surface — a SQL connection, a SPARQL endpoint, a resolver that builds arbitrary filters — lets the caller author logic the engine then runs. Its power is unbounded and unenumerable. A **verb** is the opposite: a finite, named, pre-declared operation with a typed signature the engine knows before it runs. CKP ships a closed vocabulary of roughly seventeen verbs and **no** query surface. Even the query-shaped verbs bind typed parameters into logic sealed at germination; the caller never supplies query text.

This is not a detail. It is the precondition that makes [grants](/v3.9/grants) enumerable and [shapes](/v3.9/shapes) unbypassable — the whole of [Critical Isolation](/v3.9/critical-isolation). Read [A Verb, Not a Query Surface](/v3.9/verb-vs-query-surface) first; the rest of the specification is its consequences.

## What a kernel is

A [Concept Kernel](/v3.9/concept-kernel) is a Material Entity in the sense of BFO 2020 — a bounded, independently-existing thing with a stable [URN](/v3.9/naming) identity. Its types are RDF classes with SHACL shapes and OWL-RL rules, designed to ground into upper ontologies rather than hand-rolled columns. Its anatomy is nine strands, the alphabet of [Concept Kernel Notation](/v3.10/):

| | Strand | Carries |
|---|---|---|
| **χ** | class chromosome | the classes |
| **ρ** | property ribbon | raw gestures and governed constants, held apart |
| **σ** | [shape strand](/v3.9/shapes) | the SHACL shapes — the seal gate |
| **α** | [affordance alphabet](/v3.9/affordances) | the verbs |
| **γ** | [grant matrix](/v3.9/grants) | who may invoke which verb on which class |
| **π** | [proof chain](/v3.9/seal-and-proof) | every act sealed, hash-linked |
| **δ** | [dispatch tuple](/v3.9/the-door) | the single call shape |
| **φ** | plane function | routes each dispatch to instance or governance |
| **ε** | [epoch](/v3.9/epochs) | the subscript on the whole kernel; it moves when meaning moves |

## Feature status

Markers: ✅ shipped · 🔄 partial. All grounded in the pgCK [changelog](/v3.9/changelog).

- ✅ **The kernel-derived typed surface is built and attested.** Generic typed `create`, declared-property `query`, declared-predicate `link`/`reach`, per-kernel sealed transition maps, declared-shape `update`, full SHACL `validate`, governed `concept.match` — the typed hot loop, live end to end.
- ✅ **Governance has real effect.** A quorum-approved `apply` translates the sealed op into the kernel's SHACL graph and advances the epoch, so consensus actually evolves the type — the next write is bound by the new shape.
- ✅ **The seal gate honors full W3C SHACL Core** (as of `v0.4.17`): `validate` conforms if and only if `seal` accepts, across cardinality, `sh:in`, `sh:datatype`, `sh:maxCount`, `sh:pattern`, and `sh:nodeKind`.
- ✅ **A conforming dispatch-only client exists.** cklib realizes the contract with no RDF, no quad store, and no SPARQL — its only outbound atom is `ckp.dispatch`.
- 🔄 **The scoring loop** — signal.cast, concept.score, and ε-materialisation — is the [v3.10 design direction](/v3.10/scoring-loop), advanced in collaboration with pgRDF's growing algebra surface.

## Where to go next

- New to the protocol: [A Verb, Not a Query Surface](/v3.9/verb-vs-query-surface) → [Critical Isolation](/v3.9/critical-isolation) → [What a Concept Kernel Is](/v3.9/concept-kernel).
- Want to run it: [Quickstart — zero to sealed state](/v3.9/quickstart).
- Building a client: [The Client: cklib](/v3.9/client) and [Naming](/v3.9/naming).
- Tracking what shipped: [Changelog](/v3.9/changelog).
