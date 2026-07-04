---
title: "The Scoring Loop"
description: "Seal the gesture, derive the weight — the genotype/phenotype split, ε-materialisation, and the three movers of staleness."
---

::: warning IN DESIGN — v3.10
CKN is the design direction beyond the shipped v3.9.1 runtime. This page describes intent, not shipped behaviour. It is meant to be argued with. The current runtime is documented at [/v3.9/introduction](/v3.9/introduction).
:::

# The Scoring Loop

One design rule carries the whole loop:

> **Seal the gesture, never the weight.**

A signal records what a participant *did*. It never records a derived score. Weight, decay, and the final score are derived — always by the *current* sealed policy, always at the current epoch. Change the policy by consensus, and every past gesture re-derives under the new epoch. That single discipline dissolves a familiar bug: history scored against a grounding that no longer exists.

## Signals record raw gestures

A signal (`signal.cast`) seals the gesture and nothing more:

```
signal.cast ⟶ ⟨ polarity ∈ {assent, dissent, abstain},
                dwell_ms, presence, cast_epoch, → resolved-URN ⟩
```

It carries polarity, dwell, presence, and the epoch it was cast in, and it points at a **resolved URN**, never a surface label. Attaching evidence to the resolved entity — and making resolution a governed, epoch-stamped act — is what lets a later grounding merge stack evidence automatically: two signals that resolve to the same entity contribute to the same score without anyone re-writing them.

What a signal does *not* carry is any weight. There is no `weight` field, no `score` field. Those are computed downstream, and only downstream.

## Weight and score are derived

The score is a function of the raw signals and the current sealed policy:

- **Weight** — how much a gesture counts — is read from governed constants, not stored on the gesture.
- **Decay** — how a gesture's weight fades with time — is applied by the policy at read time.
- **Score** — the aggregate — is the weighted, decayed sum over the in-scope signals.

Because the policy is sealed and the gestures are raw, the score is never frozen. Refine the rule and the same corpus yields a new score, correctly, everywhere it is read.

### Governed constants change by consensus

Thresholds, half-life, and per-polarity weights are not configuration. They are **governed constants** in the property ribbon (ρ), held apart from the raw gestures. Changing one is `propose → vote → apply`, and the apply advances the epoch. The rule that drives the board evolves only by consensus — governed all the way down, and self-revising all the way down.

## Genotype and phenotype

The split has a name. The sealed raw — the policy plus the signal corpus — is the **genotype 𝒢**. The score surface derived from it at a given epoch is the **phenotype 𝒫**. The phenotype is the genotype evaluated through the current sealed policy at epoch ε:

```
𝒫 = 𝒢 evaluated through the sealed policy at ε
```

The genotype is what is sealed and permanent. The phenotype is a regenerated, **disposable** expression of it — thrown away and rebuilt whenever the inputs move. Genotype is the sealed raw; phenotype is its regenerated expression; the epoch is the evaluation context.

## ε-materialisation

A weighted, decayed sum does not evaluate inside a sealed read directly, so the phenotype is built explicitly. **ε-materialisation** computes each contribution and writes a set of disposable derived contribution facts — a materialized phenotype — which a simple sealed read then aggregates.

Two properties make it safe:

- **Atomic committed-complete swap.** The materialized phenotype is published by a single pointer swap, and only once the build is complete. A reader never sees a half-built surface — the phenotype is either the old complete one or the new complete one, never a torn intermediate.
- **Request-driven, not a daemon.** There is no background loop. Recompute happens only when a read needs a fresh phenotype, scoped to the one concept being read — zero cost when idle, and never in the path of unrelated work.

## The three movers of staleness

A derived value is stale for **exactly three reasons**, and a correct system watches all three.

| Mover | What makes the phenotype stale | How it is detected |
|---|---|---|
| **Rule** | The policy changed — a supersession or a re-grounding | the epoch `ε` advanced |
| **Evidence** | A score-affecting fact was sealed within the same epoch | the **evidence watermark** moved |
| **Time** | A time-dependent term (decay) advanced past the phenotype's validity | the phenotype's `valid_until` passed |

The **evidence** mover is the one most systems forget, and forgetting it is the classic silent failure. A freshly cast signal bumps neither the epoch nor the clock — yet it is often the single most decisive fact, the one that tips a decision. A staleness model built on "rule or time" alone would serve a confident, wrong value on exactly the read that matters most.

The evidence mover is tracked by an **evidence watermark**: the maximum ledger sequence over the derivation's declared source scope.

```
evidence-watermark = MAX(ledger_seq) over the source scope
```

The maximum sequence, not a count — a retract-then-reassert correction can leave a count unchanged while the value moves, but the sequence always advances. The watermark is stamped onto the phenotype at build time; a later read compares the current watermark against the stamp and rebuilds if evidence has moved. The guarantee is only as complete as the declared source scope, so that scope must capture every score-affecting fact — dissent, abstention, the dwell and presence facts that weight abstentions, and retractions.

## Advanced in unified collaboration with pgRDF

The scoring loop is being advanced together with [pgRDF](https://github.com/styk-tv/pgRDF), the PostgreSQL RDF extension whose algebra surface carries the weighted, decayed arithmetic. Two capabilities on that surface are what the phenotype build needs:

- **aggregate-over-expression** — summing a computed contribution, not only a stored value; and
- **`IF → CASE` plus numeric functions** — so signed dissent, dwell-weighted abstention, and decay evaluate as the phenotype is materialized.

The scoring-loop verbs (`signal.cast`, `concept.score`) and the pgRDF algebra they depend on are tracked in public issues, and the higher-fidelity decay path is gated on future substrate work — the shipped runtime carries an honest approximation under an identical surface, so the client sees the same `{ score, band }` either way and upgrades with no change.

## The loop, closed

The board is driven by the score; the score is derived from sealed signals; the rule that drives it evolves only by consensus. Seal the gesture, derive the weight — and let the epoch keep every derivation honest. The epoch model this builds on is documented for the shipped runtime at [/v3.9/epochs](/v3.9/epochs); how the signals get sealed in the first place is [Notation In, Construct Out](/v3.10/assembled-constructs).
