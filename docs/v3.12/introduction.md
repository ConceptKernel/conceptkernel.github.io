---
title: "Introduction to CKP v3.12"
description: "Self-Moving, Never Self-Ruling — the Concept Kernel Protocol v3.12: a kernel that notices what its people care about, keeps its own clock and drafts its own next change, under law that refuses everything that violates it, including the kernel itself."
---

# Introduction to CKP v3.12

**A concept kernel is a place where meaning lives and is answerable for itself.**

A database stores what you tell it and does not care what it means. A service does what it is told and does not know why. A concept kernel is closer to a small, sovereign institution of meaning: it declares what kinds of things exist for it, it accepts only facts that honour those declarations, it remembers who said each thing and under which of its laws the thing was judged, and it changes its laws only by the agreement of those who live under them.

Three questions define it:

- **What can I mean?** Its declared world — the kinds, the shapes, the relations it recognises. This is its identity, and nothing outside it can write there.
- **What can I do?** The acts it offers others — ways to add to it, ask it, link through it. Capability is always *derived from* meaning, never invented beside it.
- **What have I done?** The sealed record. Every fact carries who said it, whose law governed it, which version of that law was in force, and which rule judged it.

The founding sentence holds all of it:

> **You do not enforce your own shape. You declare it, and the ground refuses what violates it.**

A kernel never argues. It declares, and the substrate beneath it refuses everything that violates the declaration — **including the kernel's own attempts**. That is what makes its record trustworthy to a stranger: the kernel cannot exempt itself from its own law. And it is sovereign: whole on its own, joined to others only by its own sealed choice. Everyone who can hold a key is a participant of the same standing — a person, an agent, whatever arrives next. The door does not ask what you are, only whether you can answer for what you say.

## What v3.12 adds

[v3.11](/v3.11/introduction) taught the kernel to refuse: a root ontology whose every constraint is one the gate is measured to enforce. v3.12 gives the kernel a **nervous system** and holds every floor beneath it to the same standard.

**A kernel that notices.** Attention becomes a fact. Assent, dissent, and the silence of someone who looked and said nothing are each a sealed, attributed **Signal**. The kernel weighs them under weights that are themselves bounded law, derives **Scores** anyone can re-derive, and when a score crosses its threshold the kernel does not act — it **drafts a Proposal**, and its people decide. The kernel becomes a participant in its own evolution, never its own ruler.

```
  participants — person · agent · whoever arrives (same door, different key)
        │  assent · dissent · the silence that watched
        ▼
  SIGNALS ─── sealed, attributed, one boundary at a time
        ▼
  SCORES ──── derived under the kernel's own law, re-derivable by a stranger
        │  a threshold crossed
        ▼
  DRAFT ───── the kernel suggests its next change; it seals no vote, applies nothing
        │  parties · quorum · the owner enacts
        ▼
  LAW ─────── meaning moves one epoch forward, and everything is judged under it
```

**A kernel that keeps time.** Each kernel declares its own orbit — period, lead, anchor — as law on its sealed record, so the next crossing is computable by anyone without asking. A crossing enqueues work; it never executes it. See [The Orbit & the Tick](/v3.12/the-clock).

**Floors that hold.** Ownership is stamped at germination and patchable by nobody. Quorum follows the project's declared kind. Only the owner enacts an agreed change. In-kernel roles narrow what a participant may do and never widen it. A rule can bind a **named set** of kernels and no others. Every refusal carries a registered code. Every routed verb carries a sealed declaration. Every stored digest names its method. And the checks that predict a seal run *before* the act and again *at* it.

## What carries from v3.11

- **One door.** The SQL function `ckp.dispatch(verb, payload)` is the substrate's only entry, and the role a participant connects as holds `EXECUTE` on it and nothing else. Clients reach it over `/wss`; the relay behind the door calls it. See [The Door](/v3.12/the-door).
- **The stamps, per fact, never aggregated** — `createdBy` · `producedBy` · `sealedAtEpoch` · `conformsToShape`, joined in v3.12 by `onBehalfOf`. `verified: true` is the hash chain, never conformance. See [Stamps & Refusals](/v3.12/reading-a-reply).
- **The composed surface.** A kernel is judged against `core ∪ its own kernel graph ∪ every module a sealed Adoption names`. Adoption is per project; proximity is never adoption. The admitted-type gate and the shape gate read the same surface.
- **Governance** — `propose → vote → apply`, quorum counted over distinct accountable parties. Quorum one is rehearsal, and says so. See [Governance](/v3.12/governance).
- **The three authoring rules** — measured enforcement, classes never property subjects, body locality — and the declared gap **G-1**, served through the door as `integrity.check`.

## The surface a kernel is judged against

```
                 ┌──────────────────────────────────────────────┐
  core.ttl ─────►│                                              │
  (the root)     │   composed surface of kernel K               │──► the shape gate
  kernel graph ─►│   = core ∪ K's graph ∪ adopted modules       │──► the admitted-type gate
  of K           │                                              │      (one surface,
  modules named ►│                                              │       two gates)
  by K's sealed  └──────────────────────────────────────────────┘
  Adoptions
```

A module sitting in the same database governs nothing until a kernel adopts it by a sealed act naming its digest. The surface in force is **established by digest**: a validator reports conformance against an empty shapes graph too, so the loaded surface is checked by its digest, and a conformant report is read as a report.

## This release

| Plane | Artifact | Identity |
|---|---|---|
| **Law** | [`ontology/v3.12/core.ttl`](/ontology/v3.12/) — 30 classes · 31 NodeShapes · 102 properties | sha256 `2e90a651…` (sidecar `wave-3.12-pass-3`) |
| **Namespace** | `https://conceptkernel.org/ontology/v3.11/core#` | stable across the revision — the law carries the version |
| **Runtime** | [pgCK 0.4.112](https://github.com/styk-tv/pgCK/releases/tag/v0.4.112) — PostgreSQL 18 extension | SLSA build provenance, `amd64` + `arm64` |
| **Engine** | [pgRDF 0.6.34](https://github.com/styk-tv/pgRDF) — RDF, SHACL, SPARQL, OWL-RL inside PostgreSQL | SLSA build provenance |
| **Client** | [cklib](https://github.com/ConceptKernel/CK.Lib.Js), served by every door at `/cklib/` | version-affine with the door behind it |
| **Bundle** | [`ociger-ck-allinone` v0.7.45](https://github.com/sporaxis-com/oci-germination) — all of the above plus NATS, one container | index `sha256:9d18e2b0…` |

Start at [Install & Run](/v3.12/install).

## Reading the status tables

Every mechanism page closes with a status table that separates three things a reader must never conflate:

| Column | Means |
|---|---|
| **law** | the term or constraint is declared in the published root |
| **gate** | the substrate refuses a write that violates it |
| **runtime** | the released substrate performs the mechanism |

A mechanism can be declared and not yet performed — the decay term of the score law is one. Each such row says so plainly, so silence is never mistaken for coverage. Every claim cites the gate in the [public test suite](https://github.com/styk-tv/pgCK/tree/v0.4.112/sql/test) that a third party can re-run without trusting anyone in it.

## Where to go next

- How a client reaches a kernel: [The Door](/v3.12/the-door)
- How to read what comes back: [Stamps & Refusals](/v3.12/reading-a-reply)
- How to know before you write: [Know Before You Act](/v3.12/know-before-you-act)
- How a kernel comes to exist: [Germination & Naming](/v3.12/germination)
- How meaning moves: [Governance](/v3.12/governance) · [Ownership & Authority](/v3.12/authority)
- The living kernel: [Signals & Scores](/v3.12/signals-and-scores) · [The Orbit & the Tick](/v3.12/the-clock) · [Affordances](/v3.12/affordances)
- Proof: [Epochs, Digests & Proof](/v3.12/epochs-and-digests)
- What changed: [Changelog](/v3.12/changelog)
