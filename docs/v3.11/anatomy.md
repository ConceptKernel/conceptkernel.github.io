---
title: "The Anatomy of a Kernel"
description: "The six clusters of the v3.11 root and the two adopted modules — what each one is defending, and what goes wrong where it is missing."
---

# The Anatomy of a Kernel

The root declares 27 classes. They are not a flat vocabulary: they fall into six clusters, each defending one sentence, and each failing in a characteristic way when it is absent. Two further modules — `wave` and `lexicon` — are not part of the root at all, and join a kernel's enforcement surface only by adoption.

This page is the map. [Processes](/v3.11/processes) walks the sequences that move through it.

---

## A · Identity and authority

> **You present who you are. You never claim it.**

`Participant` · `Agent` · `Delegation` · `Membership` · `Role` · `Grant`

A Participant is a verified identity. An Agent acts *for* a Participant — and the distinction is load-bearing, because `ckp:onBehalfOf` is present when an agent sealed for someone and absent when the participant acted directly. That is how an executor writing into a kernel it does not own is attributed, rather than by a caller-supplied field describing itself.

Authority is a traversal, not a flag: `Membership → holdsRole → Role → grant → Grant → permTarget → Organ`. Note where that chain terminates. **A permission targets an organ, not a kernel.** This is what makes the Separation Axiom enforceable by write authority instead of by convention — DATA cannot write CK because the grant does not reach it.

**Where it fails when it is absent:** identity becomes a payload field, and a payload field is a claim. A substrate that reads `from` or `created_by` out of the body has not recorded who acted; it has recorded who the caller said acted. The two are indistinguishable afterwards, which is the point at which provenance stops being evidence.

---

## B · Structure

> **A kernel declares its shape, and the ground refuses what violates it.**

`Project` · `Kernel` · `Organ` · `CK` · `TOOL` · `DATA`

A Kernel sits in a Project and has at least three Organs. The three organs are not roles by convention — they are distinguished by a **counted dependency**:

| organ | dependencies | write authority | holds |
|---|---|---|---|
| `CK` | 0 | `governed-only` | what you **mean** |
| `TOOL` | 1 — CK | `readonly-on-ontology` | what you can **do** |
| `DATA` | 2 — CK, TOOL | `readwrite` | what you have **done** |

Those counts are gated by `sh:hasValue`. **The count is the axiom.** Meaning cannot be edited by the thing that merely acts, and capability cannot rewrite the shape it was derived from — not because a document says so, but because a body claiming otherwise is refused.

`ckp:ownedBy` on a Project carries the same discipline as the instance stamps: a client may declare its own *structure* — a Kernel and three Organs — and may not declare **who owns it**. Ownership is stamped from the verified connection.

**Where it fails when it is absent:** a "kernel" becomes a namespace. Nothing distinguishes meaning from data, so a tool that can write results can also rewrite the definitions those results were judged against, and no seal made before that moment can be trusted afterwards.

---

## C · The sealed fact

> **Provenance is a consequence of sealing, never a claim inside it.**

`Instance` · `LedgerEntry` · `Proof` · `Supersession` · `Run`

Every sealed instance carries four stamps, and the substrate derives all four:

| stamp | answers |
|---|---|
| `createdBy` | **who** — the verified participant |
| `producedBy` | **whose meaning** — the kernel whose surface admitted it |
| `sealedAtEpoch` | **which surface version** |
| `conformsToShape` | **judged by what** |

A body arriving with any of these has them stripped before the gate. There is no path by which a caller supplies its own provenance.

A fifth property looks like these and belongs to the opposite category. `ckp:preEnforcementEpoch` is **a claim, not a derivation** — *"this row predates enforcement"* — and it is checkable by a second party against the epoch it names. It is deliberately **positive**: absence cannot distinguish a legitimate legacy row from a failure of the stamping path, so the fence asserts rather than omits, and a row carrying **neither** a judgement nor a fence remains detectable by query.

Two properties of the ledger deserve stating plainly, because they are what make correction possible at all:

**Sealing appends. Nothing is mutated.** The digest covers the body, and verification compares the stored body to the *latest* entry. A correction therefore cannot be an update — that would change the digest and make every corrected row read as tampered. It is a re-seal, which appends: the original entry stands as what was true then, the new one as what is true now, and `Supersession` makes the retraction traversable rather than silent.

**`verified` and `conformsToShape` are different facts.** `verified` says the HMAC chain is intact — the bytes are what they were. `conformsToShape` says a shape actually looked. A record that shows the first beside a blank second is not a contradiction; it is the substrate reporting that the gate selected no focus node and passed vacuously. Rendering them as equals is how "sealed" comes to look like "gated".

---

## D · Surface and execution

> **What a kernel may do is derived from what was materialized — never registered by hand.**

`Affordance` · `Materialization` · `Epoch` · `AffordanceUse` · `Run` · `FailedMaterialization`

An `Affordance` is the unit of "you may call this". Its only lawful origin is `Materialization → producesAffordance`. An affordance written by hand comes back with no `producedBy`, no `sealedAtEpoch` and no `conformsToShape` — the substrate declining to attribute what it did not derive.

Each affordance names a **plane**, which decides how it executes: `instance` for ordinary verbs, `query` for SPARQL sealed as a plan and compiled against a specific epoch, `derived` for a computed value, `governance` for propose/vote/apply — which never execute as ordinary verbs.

`inTopic` and `outTopic` declare where a call arrives and where its answer goes. An `outTopic` left blank does not mean there is no answer; it means a subscriber has to read the transport implementation to find out. Declaring it is what makes the surface discoverable by asking rather than by reading source.

`AffordanceUse` is the half most substrates never build: `uses` plus `consumer`, `provider`, and **`pinnedEpoch`**. It records *which surface version a consumer relied on*, so that after a provider has moved on, "what was I promised?" still has an answer.

**Where it fails when it is absent:** the set of verbs becomes a registry someone maintains, and a registry and a derivation drift apart silently. The failure is asymmetric and worth knowing: a verb that is *registered but not derived* answers and is unattributable; a verb that is *derived but not registered* is visible in the surface and cannot be called.

---

## E · The governed plane

> **A change to meaning is proposed, voted and applied — and the apply must seal its own record.**

`Proposal` · `Vote` · `Transition`

The epoch is not a counter. Applying a proposal bumps it, recompiles the plan surface, and seals a first-class `Materialization` producing an `Epoch` that carries the **surface digest** — all in one transaction. If either the Materialization or the Epoch fails its shape gate, the whole apply rolls back.

**A bumped epoch with no valid Materialization cannot commit.** That is what makes *"show me the Materialization that produced this epoch, and re-derive the surface at that epoch"* answerable from the seals rather than from a changelog.

An operation that cannot project a change is refused **at propose**, never sealed as an inert *applied* that advances the epoch and alters nothing. Two things follow, and both are easy to get wrong:

- Checking that the **operation** has a projector is not enough. The **detail** must carry something to project. An operation with an empty detail otherwise seals as applied, advances the epoch, registers nothing, and reports success — an epoch that logged nothing while claiming to.
- A declaration that admits a type without constraining it is worse than a rejected one. It does not produce an unusable type; it produces a type whose instances **nothing judges**.

::: warning Quorum of one is rehearsal
A proposal proposed, voted and applied by a single party declares *shape*, not consensus. It is a legitimate and useful exercise of the mechanism. It is not agreement, and a record that does not distinguish the two is misleading in exactly the direction that flatters its author.
:::

---

## F · Adoption

> **Proximity is not adoption.**

`Adoption` · `Module`

A module joins a kernel's enforcement surface only through a sealed `Adoption` naming its **`sourceDigest`** — 64 hex characters. A file on disk is not an enforcement surface. A graph loaded into the store is not one either. This is why a kernel can hold a vocabulary in its store and still be unable to seal an instance of it.

Composition is materialized **once**: core, plus the kernel's own graph, plus every adopted module, copied into a composed surface where the entailment closure is computed. Validators do not entail, and entailment is per-graph — so a candidate's type closure is invisible to `sh:targetClass` resolution unless the closure was computed where the validation happens. Skipping that step does not produce an error. It produces conformance.

Composition **fails closed**: if an adopted module's graph is absent or empty, composing raises rather than proceeding. A vanished module silently narrowing the gate is un-enforcement that nothing would report.

Adoption is per-project and per-epoch. One kernel may adopt a module at a given epoch while another never adopts it, and both statements remain true and queryable.

---

## The two modules

Neither is part of the root. Both are adopted by digest, and a kernel that has not adopted them cannot seal their types.

### `wave` — coordination

`Wave` · `Pass` · `Component` · `Ticket` · `Finding` · `Confirmation` · `Defect` · `Ruling` · `Operation` · `Index` · `Statement`

Two distinctions in this module carry most of its weight.

**A Ticket is assigned work** — owned by exactly one Component for exactly one Pass, and *"closes on confirmation, never on completion"*. **A Finding is measured, and is not work** — unowned and unscheduled, becoming a ticket only by explicit promotion. Since a component holds one ticket, promoting a finding **displaces** whatever it was doing.

That distinction decides what a *notification* can be. Creating work in someone else's kernel conscripts them and silently evicts their current task; recording a finding says *I measured this, it is not yours to do, and it becomes work only if you promote it.* Promotion is the recipient's act.

**Confirmation is not a vote.** It is *"a second component measuring a ticket it does not own — the only thing that closes a ticket, and the reason self-report cannot"*, and its `evidence` is *"the exact command anyone can re-run, and its output. A confirmation that cannot be re-run is an opinion."* That is recheck rather than quorum: it does not matter who says it, it matters that anyone can run it again.

The closed sets are much of the value. `defectKind` — `hole · gap · collision · omission · stale-overwrite · vacuity · misattribution`. `opKind` names fourteen acts, and *"an act outside it is an act the process has not yet learned to see"*.

### `lexicon` — symptoms

`Symptom` · `Pattern` · `Rule` · `Outcome`, and a vocabulary of named failure modes: `VacuousGate` · `FalseGate` · `UnreadGate` · `Misattribution` · `StaleCitation` · `UncountedClaim` · `UnmeasuredConsequence` · `BrokenSequence` · `HeldAct` · `RefutedAct` · `BenchOnly`.

The names are specific, which is what makes them useful. `VacuousGate` is not "a bug" — it is precisely *a gate that ran, passed, and selected nothing*. Once the failure has a name, the remedy is obvious: assert that a check **selected** something, not merely that it did not fail.

`lexicon:recurrenceOf` is the edge that pays for the module. Any single defect looks like circumstance; the fourth instance of one pattern is a design problem — but only if something counted. `StaleCitation` is the one to watch across several kernels: a rationale recorded when a limitation was real, cited long after the limitation was lifted.

Paired with `wave`: a `Finding` carries what was measured, `lexicon:symptom` says what *kind* of wrong it is, `lexicon:defectIn` says where it lives, and `lexicon:blocks` says what it stops.

---

## What the root does not declare

There is no `Notify`, `Message`, `Signal`, `Ask`, `Goal` or `Task` in v3.11 — not in the root, and not in either module. This is deliberate rather than an omission: coordination is expressed in `wave`'s vocabulary, where a notification is a **Finding**, its sender is the derived `createdBy`, and its acknowledgement is a `Confirmation` carrying re-runnable evidence.

A substrate that grows its own message type outside the root gets a type nothing targets — which seals, verifies, and is judged by nothing.
