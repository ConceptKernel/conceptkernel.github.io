---
title: "Signals, Scores & the Law of Weights"
description: "How a concept kernel notices what its participants care about: attributed Signals, derived Scores, weights that are law, and a threshold that drafts a proposal and decides nothing."
---

# Signals, Scores & the Law of Weights

A concept kernel listens. Every assent, every dissent, every look that lingered without a vote is evidence about a concept — and in CKP v3.12 that evidence is a sealed, attributed fact. The kernel weighs it under its own law, keeps a derived answer to *"what do we, together, currently believe?"*, and when that answer crosses a line the kernel's people drew, it **drafts a proposal**. It never decides.

> **Arithmetic suggests; agreement seals.**

```
   participants — human · agent · service (same door, different key)
        │
        │  assent · dissent · the dwell of someone who looked
        ▼
   SIGNAL      sealed, attributed, four stamps like any instance
        │
        │  score.tick — under the kernel's own law
        ▼
   SCORE       derived, never asserted · computedAtEpoch · wasGeneratedBy a Run
        │
        │  scoreValue ≥ thresholdPromote
        ▼
   PROPOSAL    proposalState "draft" — one standing draft per concept
        │
        │  a party takes it up · votes · quorum · the owner applies
        ▼
   EPOCH       the law moves one step, and everything is re-read under it
```

The loop runs entirely inside the core vocabulary. Every germinated kernel has it before any module is adopted.

## Signals — evidence with an author

A `ckp:Signal` is a sealed instance: attributed evidence about one concept. It is the general form of which a governance vote is one kind.

| Property | Constraint (`SignalShape`) | Meaning |
|---|---|---|
| `ckp:about` | exactly one, an IRI | the concept the evidence is about |
| `ckp:signalPolarity` | exactly one of `"assent"` · `"dissent"` · `"implicit"` | what kind of evidence |
| `ckp:dwellMillis` | at most one, `xsd:integer` | for implicit signals: how long the concept was in front of the participant |

Because a Signal is an Instance, it carries every server-derived stamp — `createdBy`, `producedBy`, `sealedAtEpoch`, `conformsToShape`, and `onBehalfOf` when an agent acted for someone. A Signal cannot be anonymous and cannot be ungated. See [Stamps & Refusals](/v3.12/reading-a-reply).

### Boundary heads — one seal per boundary, never one per event

Attention is noisy. A participant may see a concept forty times in a session; the raw presence trace is the participant's own data and stays in their own organ. What crosses into the shared record is **one** implicit Signal per boundary, carrying the aggregated dwell:

```json
{ "verb": "signal.boundary",
  "payload": { "about": "urn:ckp:<kernel>/concept/<name>", "dwellMillis": 8200, "events": 3 } }
```

The boundary head is chained by the same HMAC ledger that chains every seal — one chain for everything, never a second bespoke one. The reply names the sealed id and its `verified` state.

**Never-saw seals nothing, and answers as a success.** A payload with zero events or no dwell returns `{ ok: true, sealed: false, reason: "never_saw" }`. The absence of a Signal is the honest record of an encounter that did not happen; sealing a zero would manufacture evidence.

## Scores — derived, never asserted

A `ckp:Score` is what the kernel currently believes about a concept, computed from sealed Signals under the kernel's law and sealed as a fact of its own:

| Property | Constraint (`ScoreShape`) | Meaning |
|---|---|---|
| `ckp:about` | exactly one, an IRI | the concept scored |
| `ckp:scoreValue` | exactly one, `xsd:decimal` | the derived value |
| `ckp:computedAtEpoch` | exactly one, `xsd:integer` | the epoch whose law computed it |
| `ckp:wasGeneratedBy` | exactly one, an IRI | the `ckp:Run` that produced it |

`computedAtEpoch` is what makes staleness detectable rather than suspected: two scores computed under different law are never silently comparable. A reader of a Score needs no arithmetic — a Score is a plain read.

### The formula, as the tick computes it

For each concept `c` with Signals produced by the kernel:

```
score(c) = Σ  w(s)          over sealed Signals s with ckp:about = c
              s

w(s) = weightAssent                                    when polarity = "assent"
       weightDissent                                   when polarity = "dissent"
       weightImplicit · (1 − e^(−dwellMillis / τ))     when polarity = "implicit"

τ = tauImplicitMillis
```

The sum is rounded to four decimal places. An implicit signal is a **ceiling scaled by dwell**: a glance contributes almost nothing, a long look approaches `weightImplicit`, and nothing implicit ever outweighs an explicit vote.

### Every link resolves

A Score is re-derivable by someone who trusts nobody in it. Its provenance is a chain of sealed facts, each of which resolves:

```
Score ──wasGeneratedBy──► Run ──realizes──► Affordance (score.tick, sealed)
                           │
                           └──runOf──► urn:ckp:<kernel>/kernel/ck
```

The Run is sealed **first**, so every Score's `wasGeneratedBy` resolves the moment the Score lands. Given the sealed Signals and the sealed law, a third party recomputes the same value — or the Score is wrong, visibly.

## The weights are law

The constants that turn evidence into belief are not configuration. They are properties of the sealed `ckp:Kernel`, gated by `KernelShape`, and their governed route is agreement. Changing a weight is an epoch, not a deploy.

| Law (`https://conceptkernel.org/ontology/v3.11/core#…`) | Bound the ground enforces | Why the bound exists | Substrate default |
|---|---|---|---|
| `weightAssent` | `≥ 0` | assent must never lower a score | `1.0` |
| `weightDissent` | `≤ 0` | a positive value makes disagreement *raise* a score — the one sign error that inverts every Score without changing its shape | `−0.8` |
| `weightImplicit` | `0 ≤ w ≤ 1` | above 1, a look could outweigh a vote | `0.5` |
| `tauImplicitMillis` | `> 0` | the dwell time constant of the implicit curve | `60000` |
| `decayLambda` | `≥ 0` | a negative λ is exponential *growth*: old signals would gain weight forever | — |
| `thresholdDefer` | `≥ 0` | compared against `|score|`; a negative δ empties the stuck band | — |
| `thresholdPromote` | `xsd:decimal` | θ⁺ — the line a Score crosses to draft a proposal | none — absent means nothing drafts |
| `thresholdDiscard` | `< thresholdPromote` | θ⁻ ≥ θ⁺ inverts the bands: everything discards, nothing promotes, with both values individually legal | — |

Every clause carries `sh:maxCount 1` and no `sh:minCount`. **Absence is a real answer** — the substrate default governs — and a wrong *value* is what the ground refuses. The last row is the one cross-property invariant of the set, enforced by `sh:lessThan`; no per-property constraint could catch it.

A default is named, never invented per call: every `score.tick` reply carries a `law` object listing exactly the values it computed under.

### Changing the law

A weight moves through the same act as any change of meaning — `propose → vote → apply` — using the `set_kernel_policy` operation:

```json
{ "verb": "kernel.propose_change",
  "payload": { "op": "set_kernel_policy",
               "detail": { "field": "weightDissent", "value": -0.6 } } }
```

The projector that applies it checks that `field` is a declared Kernel property and checks **no ranges**. The ranges live in the law; the seal runs the gate; an out-of-range value is refused with the clause named. One rule, declared once, enforced by the ground — never a second copy of the bounds in code. See [Governance](/v3.12/governance).

## A crossing drafts, and decides nothing

When a Score reaches `thresholdPromote`, the tick seals a `ckp:Proposal` in `proposalState "draft"` carrying the reason in its detail — *which score crossed which threshold at which epoch*.

That is the whole of the tick's authority:

- **One standing draft per concept.** A concept that has already drafted does not draft again on every tick. A queue of identical drafts is pressure, not information.
- **The tick seals no vote, applies nothing, and advances no epoch.** Every `score.tick` reply reports `epochUnchanged: true`.
- **Taking it up is a party's own act.** A draft carries no votes and meets no quorum. It stands, visible, until a participant who agrees brings the change forward under their own name; parties vote; the quorum the project declared is met or it is not; the owner applies.

::: tip The constitutional limit
The kernel becomes a participant in its own evolution, never its own ruler. The limit is enforced in the substrate, where the gates measure it — not in a client, and not by convention.
:::

## Status in this release

| mechanism | law (declared in core) | gate (refuses) | runtime (pgCK 0.4.112) | proven by |
|---|---|---|---|---|
| `ckp:Signal`, three polarities | ✅ `SignalShape` | ✅ closed polarity set, cardinalities | ✅ sealed like any instance; implicit heads via `signal.boundary` | [s89](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s89_signal_score_orbit.sql) |
| Boundary head, never-saw seals nothing | ✅ | — | ✅ `signal.boundary` | [s89](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s89_signal_score_orbit.sql) |
| `ckp:Score`, derived with resolving provenance | ✅ `ScoreShape` | ✅ | ✅ `score.tick` (Run sealed first) | [s89](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s89_signal_score_orbit.sql) |
| Weights + τ as kernel law, bounds | ✅ `KernelShape` | ✅ every bound, incl. θ⁻ < θ⁺ | ✅ `set_kernel_policy` projector | [s81](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s81_kernel_policy_projector.sql) |
| Assent / dissent / implicit weights, τ | ✅ | ✅ | ✅ read by `score.tick` | [s89](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s89_signal_score_orbit.sql) |
| Crossing drafts, tick decides nothing | ✅ `"draft"` in the proposal state set | ✅ | ✅ one standing draft per concept; no vote, no apply, no epoch | [s89](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s89_signal_score_orbit.sql) |
| Promoting a draft to `pending` by a party's act | ✅ `"draft"` · `"pending"` | — | ⏳ no promoting verb yet — a party proposes the change under their own name | — |
| Decay (`decayLambda`) | ✅ | ✅ bound | ⏳ declared, not yet applied — scores are undecayed sums | — |
| Discard and defer bands | ✅ | ✅ bounds | ⏳ declared, not yet applied | — |
| Score read verbs (top / deferred / stuck / mine) | — | — | ⏳ not routed; Scores are read as sealed instances | — |

The weights themselves are the open experiment: the substrate defaults govern until a kernel's participants agree on better ones, on the record.
