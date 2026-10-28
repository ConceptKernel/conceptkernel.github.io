---
title: "Processes"
description: "The three sequences that move through the v3.11 model — germinating a kernel, changing meaning, and telling another kernel something — and the failure each step exists to prevent."
---

# Processes

[The Anatomy of a Kernel](/v3.11/anatomy) is the map. This page walks it: three sequences that move through the model, and at each step, the failure the step exists to prevent.

Every step below is a place where something can pass while achieving nothing. That is the failure mode this protocol is arranged against, and it is worth naming once at the start: **the dangerous outcome is never a refusal. It is a success that selected nothing.**

---

## 1 · Germinating a kernel

Creating a concept kernel is a governed act, not a setup step.

```
client ──▶ transport ──▶ door ──▶ germinate ──▶ seal ──▶ ledger
```

**The identity arrives with the connection, not the payload.** The transport verifies the token at connect, and the caller's verified subject is bound to the request before any handler runs. Nothing in the body influences it. A germination from an unverified connection is refused rather than attributed to nobody — a project owned by an anonymous nonce is worse than no project, because it looks like a record.

**The name is a transport segment.** A kernel is addressed on a subject, and subjects are case-sensitive with a restricted character set. A name that cannot be addressed produces a kernel nothing can ever reach — so the door refuses it up front and names the form to use instead. This is the cheapest possible refusal: it costs one round trip, where the alternative costs a kernel that exists and is unreachable.

**Structure is declared; ownership is stamped.** The caller supplies the shape it wants — a Kernel and its three organs, with their counted dependencies. The substrate supplies `ownedBy`, from the verified connection. That single division is what separates a kernel from a forgery, and it generalises: *a client may declare what a thing is; it may not declare whose it is.*

**One transaction.** The graph, the sealed Project and the sealed Kernel land together or not at all. A gate refusal anywhere rolls the whole germination back — there is no half-created kernel to clean up, and no partially-attributed record to interpret later.

::: tip What the shape actually catches
`Kernel` requires at least three organs. That constraint is doing real work: a serializer that silently drops multi-valued properties makes the type *unsealable*, and the refusal names `hasOrgan` rather than the serializer. A refusal that names a clause the payload plainly satisfies is a signal to look **below** the gate, not at the body.
:::

---

## 2 · Changing meaning

Meaning changes through the governed plane. Nothing else may change it.

```
propose ──▶ vote ──▶ apply ──▶ epoch + Materialization ──▶ surface
```

**Propose refuses what cannot project.** An operation with no projector is rejected here, before anything is sealed. So is an operation whose *detail* is empty — and that second check is the one usually missing. Without it, a well-formed proposal with nothing in it seals as `applied`, advances the epoch, registers nothing, and reports success. The result is an epoch that logged nothing while claiming to have changed something, and it is indistinguishable in the record from an epoch that worked.

**Vote establishes quorum, not truth.** The quorum is a declared property of the proposal.

::: warning A quorum of one is rehearsal
One party proposing, voting and applying declares *shape*, not consensus. It exercises the mechanism honestly and proves the path works. It is not agreement — and a record that does not say which one it was is misleading in precisely the direction that flatters whoever wrote it.
:::

**Apply must seal its own record.** Applying bumps the epoch, recompiles the plan surface, and seals a `Materialization` producing an `Epoch` that carries the surface digest — in the same transaction. If either fails its shape gate, the whole apply rolls back. This is what makes the epoch auditable rather than incremental: *"show me the Materialization that produced this epoch, and re-derive the surface at that epoch"* is answerable from the seals.

**The affordance appears because it was derived.** For a query-plane change, the sealed SPARQL is compiled into a plan keyed to `(kernel, verb, epoch)` and registered — so the verb exists at that epoch and not before. This is how a self-check becomes a first-class affordance: it is not a script someone remembers to run, it is a sealed capability whose verdict anyone can re-derive.

**Resolution is two-layered, and both halves matter.** A verb resolves against the calling kernel's own registered surface first, then falls back to the surface seeded at install — which belongs to no kernel, because installation happens before any kernel exists. Resolving only the caller makes the seeded verbs unreachable for everyone; resolving only a fixed name makes every kernel share one surface, so a verb a kernel proposed, voted through and applied is invisible to its own owner.

::: danger The failure that hides
Two independently maintained representations of one fact — a registry and a derivation, a writer and a reader — will agree by accident for as long as both are wrong in the same direction. Correcting one is what makes the divergence visible, which means the first symptom of the fix looks like a regression. Assert the agreement, or it is not a property; it is a coincidence.
:::

---

## 3 · Telling another kernel something

There is no `Notify` type in v3.11, and there should not be one. Coordination is `wave` vocabulary.

```
sender seals a Finding ──▶ event on the target's subject ──▶ recipient decides
```

**A notification is a `Finding`, not a `Ticket`.** A Ticket is *assigned work*, owned by one component for one pass; a component holds one at a time, so creating a Ticket in someone else's kernel both conscripts them and displaces whatever they were doing. A Finding is *measured, and is not work* — unowned, unscheduled, and becoming work only by explicit promotion. **Promotion is the recipient's act.**

**The sender is derived, not supplied.** There is no `from` field. The sender is `ckp:createdBy`, stamped from the verified connection — so there is nothing to forge, and no way for a message to arrive claiming to be from someone else. A `from` field in a message body is the same defect as a `created_by` field in a sealed instance; it looks like provenance and is a claim.

**The diagnosis rides along.** `lexicon:symptom` says what kind of wrong it is, `lexicon:defectIn` says where, `lexicon:blocks` says what it stops. Urgency is an edge to the thing that is blocked, not a priority field that means whatever the sender wants it to mean.

**The recipient has three lawful answers**, and none of them is silence:

| response | meaning |
|---|---|
| `promotedTo` → a Ticket | accepted as work — and it displaces the current ticket |
| `findingState: closed-by-ruling` | out of scope, permanently — *"the cheapest close available"* |
| a `Confirmation` | measured and confirmed, with re-runnable evidence |

**A confirmation is a recheck, not an opinion.** It comes from a second component measuring something it does not own, and its evidence is the exact command anyone can re-run. This is why self-report cannot close a ticket, and why the identity of the confirmer matters less than the reproducibility of what they ran.

**Delivery names the producing kernel.** An event is published on a subject naming the kernel whose seal produced the fact, with the derived sender in the headers. This direction fails more quietly than any other: an inbound message to a wrong subject is refused immediately and loudly, while an outbound publish to a subject nobody listens on **succeeds**, and is indistinguishable from having nothing to say.

---

## The property all three share

Each sequence ends in something a third party can re-run: a sealed kernel whose organs and dependencies are queryable, an epoch whose surface can be re-derived from its Materialization, a finding whose evidence is a command.

That is the whole design goal. Sovereign fragments of meaning can federate without trusting each other, because a fact carries who made it, under whose meaning, at which surface version, and judged by which shape — and anyone can check. **The recheck carries the weight, not the author.** A claim anyone can re-run does not need a trustworthy source, which is precisely why none of the four stamps is ever supplied by the party that benefits from it.
