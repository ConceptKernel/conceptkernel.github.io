---
title: "Ownership & Authority"
description: "Who may do what inside a concept kernel: ownership that cannot be moved by a patch, in-kernel roles that narrow and never widen, agents attributed by the substrate rather than by their own claim, and scopes that bind a named set of kernels together."
---

# Ownership & Authority

**Authority in a concept kernel is a traversal over sealed facts.** Nobody holds authority by asserting it. A participant's standing is read from the ledger — who owns the project, which Membership binds them, which Role it holds, which Grant that Role carries — at the moment an act needs it. Four rules follow; the status table at the end of this page states exactly how far each is enforced in this release:

1. **The owner is fixed.** A germinated project's owner is stamped from the verified connection, and no patch can change it.
2. **Authority narrows, never widens.** In-kernel roles can only restrict what a participant may do.
3. **Acting for someone is a server-derived fact.** An agent's claim about whom it serves is never taken from its payload.
4. **Rules can bind a named set of kernels.** A Scope binds its members and nobody else.

## The identity chain

The core declares the chain end to end, so every hop is a typed, IRI-valued edge a store-level query can walk:

```
Participant —(memberIs)— Membership —(holdsRole)— Role —(grant)— Grant —(permTarget)— Organ
                              │                                     │
                          (memberOf)                           permAction
                              ▼                                permDomain
                           Project —(ownedBy)— Participant
```

A `ckp:Participant` is a person or a process with a verified identity; which one is a fact the ledger carries (`participantKind`). A `ckp:Role` bears at least one Grant — `RoleShape` refuses a role that grants nothing. A `ckp:Grant` binds a permission over a domain, an action and a target organ, and each of the three is required.

`authority.mine` resolves this chain for the calling identity, through the door:

```json
{ "verb": "authority.mine", "payload": {} }
```

The reply names the identity, its tier, its Memberships and the Grants they resolve to. An identity with no chain receives an empty chain **reported as empty**, with a note saying so — never a confident zero that reads like an answer.

## The owner is fixed

Every project has exactly one owner, sealed as `ckp:ownedBy` on the `ckp:Project` at [germination](/v3.12/germination) and derived from the verified connection that germinated it. Two gates read it:

- **re-germination** — germination resets the kernel graph, so only the owner may repeat it;
- **apply** — quorum says enough parties agreed; ownership says who may enact. See [Governance](/v3.12/governance).

A patchable owner would void both gates in one step, so `ckp:ownedBy` is **not patchable by anyone, the owner included**. An `instance.update` naming it is refused with `ownership_not_patchable` (`42501`), and the refusal names both gates a movable owner would open. The same protection covers the quorum floor: `ckp:projectKind` may be changed only by the declared owner.

::: warning The honest edge
There is **no ownership-transfer verb** in this release. A lawful hand-over must itself be a governed act — agreed, attributed and sealed — and until that verb exists, ownership does not move. Its absence is recorded as a standing gap, not hidden behind a patch path.
:::

::: warning What a door's participants share
In this release, the verified participants of one door are **peers inside every kernel the door routes**. Roles narrow governance — who may propose, vote and apply — and the owner gates enactment, re-germination and the ownership fields. Instance writes are not yet owner-gated: any verified participant may create, update, retire or transition instances in any routed kernel, and every such seal is attributed to whoever made it. Per-row ownership of those writes is the next floor. Run a door for people who may write to each other's kernels, or one door per trust boundary.
:::

## Authority narrows, never widens

The door already decides which verbs an identity can reach. In-kernel roles sit beneath that floor and can only **add refusals** to it. They are consulted by `kernel.propose_change`, `kernel.vote` and `kernel.apply`, against the project the act targets — for vote and apply, the target named in the **sealed proposal**, never the actor's word.

Three clauses, applied in order:

| Clause | Rule |
|---|---|
| 1 | A project with **no sealed Memberships** imposes nothing. Roles bind only a project that declared them. |
| 2 | The **declared owner** is never narrowed. The owner sets the roles; a lock the keyholder can close on themselves is a foot-gun, not a floor. |
| 3 | Everyone else needs a **Membership in this project** holding a **Role** whose **Grant** carries `permAction` equal to the act (`propose`, `vote`, `apply`). |

A participant failing clause 3 receives `role_required` (`42501`), naming the action and the project. A member granted `propose` alone can propose and cannot vote.

**Memberships are the owner's to seal.** Whoever binds roles binds themselves in, so a Membership into an owned project sealed by anyone other than its owner is refused (`42501`).

## Agents and `onBehalfOf`

A `ckp:Agent` is tooling acting for a participant — distinct from the participant by design, so the record can tell a person acting through an agent from a person acting directly. The distinction is carried by a **fifth server-derived stamp**:

| Stamp | Meaning |
|---|---|
| `ckp:createdBy` | the identity whose verified connection sealed the fact |
| `ckp:onBehalfOf` | the participant that identity acted for — **present only when an agent acted for someone else** |

`ckp:onBehalfOf` is a sub-property of `prov:actedOnBehalfOf`. The seal derives it from the trusted ingress, beside `createdBy`, and never from the payload: a body that carries its own `onBehalfOf` claim has it **stripped** before the seal runs, exactly as a claimed `createdBy` is. Absence is the signal — a fact without `onBehalfOf` was sealed by its author directly — and "on behalf of myself" is acting directly, so a value equal to the actor is never stamped.

`ckp:Delegation` is the sealed record that a delegation was used: a `delegator` participant and a `delegatee` agent, both required.

See [Stamps & Refusals](/v3.12/reading-a-reply) for how the stamps arrive on every result.

## Scope — kernels that turn together {#scope}

A rule can live in core, where it binds every kernel forever, or in one kernel's graph, where it binds that kernel alone. A **`ckp:Scope`** is the layer between: a named set of kernels that turn together.

```json
{ "type": "https://conceptkernel.org/ontology/v3.11/core#Scope",
  "http://www.w3.org/2000/01/rdf-schema#label": "settlement",
  "https://conceptkernel.org/ontology/v3.11/core#includesKernel":
    [ "urn:ckp:orders/kernel", "urn:ckp:ledger/kernel" ] }
```

`ScopeShape` requires a label and at least one member — a Scope with no members binds nobody and is refused. A rule bound to a Scope binds every member kernel and leaves every other kernel untouched. Membership is read **at seal time** from the sealed Scope, so changing the set rebinds immediately, and a Scope that does not resolve binds nobody.

The first rules a Scope carries are [proof obligations](/v3.12/governance): an obligation bound to a Scope refuses a violating seal in any member kernel. The binding is enforced at seal time in this release; registering an obligation against a Scope through the door is not yet built.

::: warning The open gap — consent
Being listed in a Scope is not yet a consented act. Who may seal a Scope that names another party's kernel is a recorded design gap, stated in the law itself, and it remains open in this release.
:::

## How authority reaches a fact

Everything on this page converges on the record. Each sealed fact names who sealed it, whose law governed it, and — when an agent acted — whom it acted for. Each governed change names who proposed, who agreed, and who enacted. A third party re-derives every one of these answers from the ledger, without asking anyone in it.

## Status in this release

| Mechanism | Law (declared in core) | Gate (refuses) | Runtime (pgCK 0.4.112) | Proven by |
|---|---|---|---|---|
| identity chain resolved by traversal | `Membership`, `Role`, `Grant`, `memberIs`/`holdsRole`/`grant`/`permTarget` | `MembershipShape`, `RoleShape`, `GrantShape` | `authority.mine`; empty chain reported as empty | [s69](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s69_authority_join.sql) |
| `ownedBy` not patchable by anyone | `ProjectShape` requires `ownedBy` | `ownership_not_patchable` (`42501`) | implemented | [s82](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s82_ownership_patch_guard.sql) |
| `projectKind` patchable by the owner only | `projectKind` | non-owner patch refused | implemented | [s82](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s82_ownership_patch_guard.sql) |
| ownership transfer | — | — | declared gap, no verb | — |
| per-row ownership of instance writes (update, retire, transition) | — | — | not yet gated — every verified participant on a door may write instances in every routed kernel, attributed | — |
| roles narrow per action; owner never narrowed | `permAction` on `GrantShape` | `role_required` (`42501`) | consulted by propose, vote, apply | [s87](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s87_agents_and_roles.sql) |
| Memberships owner-sealed | `MembershipShape` | stranger's Membership refused (`42501`) | implemented | [s87](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s87_agents_and_roles.sql) |
| `onBehalfOf` derived at seal, payload claims stripped | `onBehalfOf` on `InstanceShape` | forged claims stripped | the seal stamps it from the trusted ingress; the wire relay naming an agent's principal from its verified token is declared, not yet built | [s87](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s87_agents_and_roles.sql) |
| `Delegation` record | `DelegationShape` | delegator + delegatee required | declared, not yet emitted by any verb | — |
| Scope binds members, not others | `Scope`, `includesKernel`, `ScopeShape` | member refused by a scope-bound obligation; non-member lands | enforced at seal time | [s88](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s88_scope_and_orbit.sql) |
| Scope consent | recorded as open in the law | — | declared gap | — |

Continue with [Signals & Scores](/v3.12/signals-and-scores), or return to [Governance](/v3.12/governance).
