---
title: "Epochs"
description: "A governance apply advances the kernel's epoch — the version of the kernel's meaning. Proposal, votes, and applied fact are sealed and proof-chained, and a read is always a read at an epoch."
---

# Epochs

The epoch names the version of a kernel's meaning: the classes, the shapes, the transition maps — the whole type, at once. When meaning moves, the epoch advances. A kernel read is always a read at an epoch, and the epoch is the context that makes the read well-defined.

## Every apply advances the epoch

Meaning moves through one path: [governance](/v3.9/governance) — `propose → vote → apply`. A change is sealed as a `ckp:Proposal`, votes accumulate against its `ckp:requiresQuorum` threshold, and `kernel.apply` commits the approved change and advances the epoch in a single transaction. The published image demonstrates this directly — applying a proposal returns the new epoch:

```sh
SELECT ckp.dispatch('kernel.apply', '{"about":"ckp://Proposal#proposal-…"}'::jsonb);
-- → {"ok":true,"state":"applied","epoch":2}
```

Because the epoch turns as the change commits, a quorum-approved change binds the next write. Propose a required `crew_size`, carry it to quorum, apply it — and the next instance that omits `crew_size` is rejected at the seal. The new shape is a fact in the kernel graph the moment the epoch advances.

## The proof chain from proposal to applied epoch

Every step in that path is a sealed, proof-chained fact. The `Proposal`, each `Vote`, and the `applied` seal all land through `validate → seal → HMAC-chained ledger → verifiable proof`. The result is a continuous chain: this epoch was reached because these votes met that quorum on this proposal. The epoch is the head of a provenance chain anyone can re-verify, from the change that was proposed to the epoch it produced. The consensus mechanism is made of the same sealed substrate it governs — a human approval is a vote sealed by a human identity, indistinguishable in the audit trail from any other fact.

## The epoch is the evaluation context

A value derived from a kernel is derived under one epoch — one fixed meaning of the kernel. Carrying the epoch a value was computed under lets a client compare that epoch against the kernel's live epoch and know whether what it holds was computed under the current meaning.

::: tip A READ IS A READ AT AN EPOCH
"Is this derived value current?" begins with "was it computed at the current epoch?" A derived view that records the epoch it was computed under makes the first half of that question a direct comparison.
:::

## Toward the v3.10 staleness and scoring model

The epoch answers the *rule* half of currency: whether the meaning beneath a value has moved. The in-design v3.10 set extends this into a full staleness model and a governed scoring loop:

- **A three-mover staleness model** — a derived value can age because the *rule* moved (the epoch advanced), because the *evidence* moved (a score-affecting fact was sealed in scope, tracked by a ledger-sequence evidence watermark), or because *time* elapsed (a freshness window).
- **The scoring loop** — a derived score becomes a first-class, governed value with an explicit currency contract, re-derived precisely when one of the three movers says it must be, its provenance naming which mover triggered the recompute.

::: warning IN DESIGN
The three-mover staleness model, the evidence watermark, and the [scoring loop](/v3.10/scoring-loop) are the in-design v3.10 set. The v3.9.1 foundation they build on is the epoch: advanced by every governance apply, proof-chained from proposal to applied fact, and carried as the evaluation context of a read.
:::

## Related

- [Governance](/v3.9/governance) — `propose → vote → apply`, the one path that advances the epoch.
- [Naming](/v3.9/naming) — the epoch versions the kernel's meaning; the IRI names the meaning it versions.
- [The Scoring Loop](/v3.10/scoring-loop) — derived scores with a declared currency contract *(in design)*.
