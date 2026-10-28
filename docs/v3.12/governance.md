---
title: "Governance — propose, vote, apply"
description: "How a concept kernel changes its own law: by the agreement of those who live under it, counted as distinct accountable parties, enacted by its owner, and recorded as one epoch forward with a sealed Materialization."
---

# Governance — propose, vote, apply

**A kernel changes its own law only by the agreement of those who live under it.** No deploy, migration or administrator edits a kernel's meaning. A change is proposed as a sealed fact, agreed to by sealed votes, and enacted by a sealed apply — and the very next write is bound by the result.

```
  propose ──► Proposal (pending)      sealed on receipt, refused if it can change nothing
                  │
  vote ×n ──► Vote (approve · reject) one per accountable party; quorum = DISTINCT createdBy
                  │  quorum met
  apply ────► the owner enacts it     projector runs → epoch advances → Materialization sealed
                  │
                  ▼
           next seal is judged by the new law
```

Each step is a verb on the governance plane: `kernel.propose_change`, `kernel.vote`, `kernel.apply`. Each produces an Instance carrying the four stamps, so every change to a kernel's law names who proposed it, who agreed, who enacted it, and which epoch it produced.

## Proposing — only changes that can happen

A proposal carries an operation and its detail:

```json
{ "verb": "kernel.propose_change",
  "payload": { "op": "set_kernel_policy",
               "detail": { "field": "thresholdPromote", "value": 3.0 },
               "requires_quorum": 2 } }
```

The governed operations form a closed set. Each one has a **projector** — the code that turns an approved proposal into a change of law:

| Operation | What it changes |
|---|---|
| `add_class` | declares a new type in the kernel graph |
| `add_property` | declares a new property on a declared type |
| `add_affordance` | registers a governed query verb and seals its declaration — see [Affordances](/v3.12/affordances) |
| `add_proof_obligation` | registers a named check every future seal of a target type must satisfy |
| `set_kernel_policy` | sets one field of the kernel's own law — the scoring constants and the orbit |
| `set_transition_map` | seals the allowed lifecycle moves for a type |

An operation outside this set is refused at propose time (`op_has_no_projector`), and so is a detail that would project nothing. A proposal that cannot change the law is never sealed as an inert record. The refusal teaches the route that does exist: adopting a module, for example, is an `instance.create` of a `ckp:Adoption`, not a governance operation.

## Voting — agreement is counted in people

`requiresQuorum` is the count of **distinct accountable parties** a change must clear. The count reads `createdBy` on the sealed votes — the identity the substrate derived from each voter's verified connection — so one party voting twice counts once, and an unattributed vote counts for nothing.

```json
{ "verb": "kernel.vote",
  "payload": { "about": "ckp://Proposal#…", "value": "approve" } }
```

`voteValue` is `approve` or `reject`, closed by `VoteShape`. Votes are accepted on `pending` proposals only.

### The quorum floor follows the project kind

A kernel declares its kind at [germination](/v3.12/germination), and the kind sets the lowest quorum any of its proposals may declare:

| `projectKind` | Floor | Meaning |
|---|---|---|
| `shared` | 2 | declaring that you need a partner binds you — a quorum of one is refused, with the clause and the cure named |
| `personal` | 1 | quorum of one is the declared meaning of a personal project |
| undeclared | 1 | nothing is imposed on a project that never declared a kind |

**Quorum 1 is rehearsal.** It is legitimate — a personal kernel deciding alone is doing exactly what it declared — and it is never fleet agreement. The record shows the declared quorum on every proposal, so a reader always knows which of the two they are looking at.

## Applying — who may enact is a separate question

Quorum answers *did enough parties agree*. It does not answer *may this party enact it*. Those are two questions, and apply asks both.

- **Agreement:** the proposal is `pending` and its distinct approvals meet `requiresQuorum`.
- **Enactment:** if the target project seals `ckp:ownedBy`, the applier must be that owner. The check reads the target named in the **sealed proposal**, never the applier's word, and it holds on every path an apply can take. A non-owner receives `not_owner` (`42501`). A project that declares no owner imposes nothing.

```json
{ "verb": "kernel.apply",
  "payload": { "about": "ckp://Proposal#…" } }
```

### What an apply produces

An apply is one transaction. The projector changes the law, the kernel's epoch advances by one, the plan surface recompiles, and the rebuild is sealed as a first-class `ckp:Materialization` producing a `ckp:Epoch` that carries the digest of the new surface. If the Materialization or the Epoch fails its own shape gate, the entire apply rolls back: an epoch with no valid Materialization behind it cannot commit.

The question *"show me the act that produced this epoch, and re-derive the surface it named"* is therefore answerable from the seals alone. See [Epochs & Digests](/v3.12/epochs-and-digests).

## The kernel's own law: `set_kernel_policy`

A kernel carries law about itself — the weights and thresholds of its [score loop](/v3.12/signals-and-scores) and the period, lead, seat and anchor of its [orbit](/v3.12/the-clock). Each is an override of a substrate default, and its governed route is `set_kernel_policy` through propose → vote → apply — an apply that advances the kernel one epoch. Changing a weight is an epoch, never a deploy.

The projector carries **no copy of the bounds**. It patches one field of the sealed `ckp:Kernel`, and the composed surface judges the result:

| Attempt | Outcome |
|---|---|
| an in-range value | conforms; the law moves one epoch |
| `weightDissent` positive · `weightImplicit` above 1 · `decayLambda` negative | refused by `KernelShape`, clause named |
| `thresholdDiscard` ≥ `thresholdPromote` | refused — the cross-property invariant, caught by `sh:lessThan` |
| an undeclared field | refused by name (`undeclared_patch_key`) |

A refused policy returns `policy_apply_refused` with the nested refusal verbatim, so the caller sees exactly which clause spoke. *You do not enforce your own shape; you declare it, and the ground refuses what violates it.*

## Obligations — agreement that refuses future writes

A **proof obligation** extends the seal's exit by agreement. Registered through `add_proof_obligation`, it names a target type and one check from a fixed registry of pure-read checks the substrate implements:

| Check | What it requires of every future seal of the target type |
|---|---|
| `adopts-resolves` | an Adoption names a module that resolves |
| `digest-match` | the cited digest matches the bytes |
| `structural-pin` | the adopted graph is structurally the graph first pinned under that IRI |
| `no-warnings` | the candidate seals clean — guidance becomes law for kernels that adopt it |

From the next seal on, a candidate that fails the obligation is **refused**, and each satisfaction lands as an additional proof naming the agreement. An obligation carries no code of its own; it can only name a check the substrate already implements. Deactivation is the same governed road out that led in, and the registration row remains, so which obligation guarded which epochs stays answerable.

An obligation binds seals of exactly its target type. An obligation bound to a [Scope](/v3.12/authority#scope) binds every member kernel of that scope and no other.

## Drafts — the kernel's own suggestions

The [score loop](/v3.12/signals-and-scores) may produce proposals of its own: a Score crossing the kernel's `thresholdPromote` **drafts** a `ckp:Proposal` in state `draft`. A draft carries no votes, meets no quorum, and changes nothing. The tick that drafts it seals no vote, applies nothing, and advances no epoch — arithmetic suggests; agreement seals. One standing draft exists per concept, so repeated crossings never pile up as pressure. In this release a draft stays a draft until a party brings the change forward as their own proposal.

## Status in this release

| Mechanism | Law (declared in core) | Gate (refuses) | Runtime (pgCK 0.4.112) | Proven by |
|---|---|---|---|---|
| propose → vote → apply | `Proposal`, `Vote`, `proposalState`, `voteValue` | `ProposalShape`, `VoteShape` | routed on the governance plane | [s25](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s25_ci_d5_propose_change.sql), [s26](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s26_ci_d4_vote_quorum.sql), [s27](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s27_ci_d3_apply_cascade.sql) |
| ops without a projector refused | `proposalOp` | `op_has_no_projector` | implemented | [s25](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s25_ci_d5_propose_change.sql) |
| quorum floor from `projectKind` | `projectKind`, `requiresQuorum` | `shared` + quorum 1 refused | implemented | [tdd01](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/tdd/tdd01_obligations.sql) |
| owner-only apply, on every path | `ownedBy` | `not_owner` (`42501`) | implemented | [s82](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s82_ownership_patch_guard.sql), [tdd01](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/tdd/tdd01_obligations.sql) |
| apply seals Materialization + Epoch, atomically | `MaterializationShape`, `EpochShape` | whole apply rolls back on failure | implemented | [s27](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s27_ci_d3_apply_cascade.sql) |
| `set_kernel_policy` | seven constants + orbit on `KernelShape` | bad value and bad field refused by the law | implemented | [s81](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s81_kernel_policy_projector.sql) |
| proof obligations | — | a violating seal is refused | implemented | [s64](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s64_proof_obligation.sql) |
| scope-bound obligations | `Scope`, `includesKernel` | members refused, non-members untouched | enforced at seal; registering an obligation *against a Scope* through the door is declared, not yet built | [s88](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s88_scope_and_orbit.sql) |
| drafts from the score loop | `"draft"` in `proposalState` | — | the tick drafts only | [s89](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s89_signal_score_orbit.sql) |
| promoting a draft to `pending` | the law names it a party's own sealed act | — | declared, not yet built | — |

Continue with [Ownership & Authority](/v3.12/authority).
