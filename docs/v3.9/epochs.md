---
title: "Epochs: the ε Strand"
description: "The epoch is the subscript on the whole kernel — it advances with every governance apply and defines the evaluation context in which derived values are read."
---

# Epochs: the ε Strand

The epoch (ε) is the subscript on the whole kernel. It names the version of the kernel's meaning: the classes, the shapes, the transition maps, the compiled plans — all of it, at once. When meaning moves, ε moves. A kernel read is always a read at an epoch, and the epoch is the context that makes the read well-defined.

## Every apply advances ε

Meaning moves through one path: [governance](/v3.9/governance) — `propose → vote → apply`. A change is sealed as a `ckp:Proposal`, votes accumulate against its `ckp:requiresQuorum` threshold, and `kernel.apply` runs a single transaction:

1. gate on quorum,
2. translate the approved op into the kernel graph (the type actually changes),
3. **advance ε** — bump the epoch, recompile the kernel's plans, and clear the engine plan cache,
4. seal the `applied` fact.

The epoch counter and the recompile-and-invalidate step are one atomic move. There is no window in which the type has changed but the compiled plans still answer to the old meaning.

Because ε advances *before* the applied fact seals, a quorum-approved change **binds the very next write.** Propose a required `crew_size` on `Ship`, carry it to quorum, apply it — and the next `instance.create` for a `Ship` without `crew_size` is rejected at the seal. The new shape is a fact in the kernel graph the moment the epoch turns.

## The proof chain from proposal to applied epoch

Every step in that path is a sealed, proof-chained fact. The `Proposal`, each `Vote`, and the `applied` seal all land through `validate → seal → HMAC-chained ledger → verifiable proof`. The result is a continuous chain: *this epoch* was reached because *these votes* met *that quorum* on *this proposal*. The epoch is not a bare integer — it is the head of a provenance chain anyone can re-verify, from the change that was proposed to the epoch it produced.

## ε is the evaluation context

Compiled plans are keyed by `(kernel, verb, epoch)`. A read served at epoch ε₄ is served by the plans compiled for ε₄; when ε advances to ε₅, those plans are recompiled and the stale ones retire. A value derived under one epoch is a value derived under one fixed meaning of the kernel — which is exactly what lets a client reason about whether what it holds is current.

::: tip STALENESS IS A QUESTION ABOUT ε
"Is this derived value current?" is the question "was it computed at the current epoch, over the current evidence, at a fresh enough moment?" A derived view carries the epoch it was computed under, so a client can compare that subscript against the kernel's live ε and know whether to recompute.
:::

## Three movers of staleness

A derived value — a score, a ranking, a rollup projected from sealed facts — can fall out of date for exactly three reasons. Naming them separately is what makes staleness a decidable comparison:

| Mover | What changed | How it is tracked |
|---|---|---|
| **the rule** | the kernel's meaning — a shape, a plan, a re-grounding | ε bump (the epoch subscript advances) |
| **the evidence** | a score-affecting fact was sealed in the view's scope | evidence watermark = `MAX(ledger seq)` over that scope |
| **time** | the value's freshness window elapsed | wall-clock against the value's computed-at timestamp |

The **rule** mover is ε itself: if the view was computed at ε₄ and the kernel is now ε₅, the rule beneath it moved and the value must be recomputed.

The **evidence** mover is the ledger. Every seal appends to the HMAC-chained ledger and carries a monotonic sequence number. The high-water mark — `MAX(seq)` over the facts in a view's scope — is the evidence watermark. A derived value records the watermark it was computed against; a later seal in scope pushes the watermark past it, and the value is stale on evidence even though ε has not moved.

The **time** mover is wall-clock: some derived values carry a freshness window, and elapsed time alone can retire them independent of rule or evidence.

A derived value that pins all three — its epoch, its evidence watermark, and its computed-at time — is a value whose currency is decidable by comparison, with no recomputation needed to *ask the question.*

## Toward the scoring loop

These three movers are the bridge to the [v3.10 scoring loop](/v3.10/scoring-loop), where a derived score is a first-class, governed value with an explicit currency contract. The scoring loop treats ε, the evidence watermark, and the freshness window as the score's declared inputs: a score is re-derived precisely when one of the three movers says it must be, and its provenance names which mover triggered the recompute.

::: warning IN DESIGN
The v3.10 scoring loop is in design. The staleness model above — ε as evaluation context, the ledger-sequence evidence watermark, and the time window — is the v3.9.1 substrate it builds on. The scoring loop's own contract is specified as that work lands.
:::

## Related

- [Governance](/v3.9/governance) — `propose → vote → apply`, the one path that advances ε.
- [Naming](/v3.9/naming) — the epoch versions the kernel's meaning; the IRI names the meaning it versions.
- [The Scoring Loop](/v3.10/scoring-loop) — derived scores with a declared currency contract *(in design)*.
