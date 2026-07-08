---
title: "Grants and the Role Floor"
description: "The live access model is a Postgres role floor: a participant reaches exactly one function. The Grant class is the governed vocabulary that keys a legal move to identity, verb, class, and target."
---

# Grants and the Role Floor

Access to a concept kernel rests on a floor enforced by the database itself. A connection is issued the Postgres role `ck_participant`, and that role holds exactly one capability: `EXECUTE` on [`ckp.dispatch`](/v3.9/the-door). Above that floor the protocol defines a governed grant vocabulary — the `ckp:Grant` class — that keys a legal move to an identity, a verb, a class, and a target.

## The role floor

The bundle provisions two Postgres roles at first boot:

| Role | Capability |
|---|---|
| `ck_substrate` | owns every table, shape, and function; never logs in |
| `ck_participant` | the role apps connect as; may `EXECUTE ckp.dispatch` and nothing else |

`ck_participant` cannot read a table, cannot reach `pgrdf.*`, and cannot rewrite a shape. Storing a fact never changes the ontology; running a verb never rewrites the rules. The separation is write authority enforced by Postgres, not convention.

::: tip THE FLOOR IS NEVER COSMETIC
The participant role logs in only when `OCIGER_CK_PARTICIPANT_PASSWORD` is set. Absent that password, `ck_participant` exists yet holds no login — by design, so the one-capability floor is always load-bearing.
:::

The [ring architecture](/v3.9/the-door) makes the floor structural. Ring 2 is the named affordances a participant may speak; Ring 1 is the frozen set of primitives that touch the engine; Ring 0 is the pgRDF engine, addressable from no door. A grant grants a verb in Ring 2 — the only surface there is. A grant carries no coordinate that could name a table, a SPARQL string, or a graph id, because those live below the floor.

## The grant vocabulary

The core ontology defines `ckp:Grant`, which binds a role to a permission expressed as domain × action × target. A grant is a sealed sentence in the kernel's own vocabulary: a given identity may speak a given verb over a given class within a given target scope. Every grant carries four fields, and the seal gate requires all four:

| Coordinate | Property | Meaning |
|---|---|---|
| identity | `ckp:role` | the identity class the grant speaks for |
| verb | `ckp:permAction` | the closed-vocabulary verb it authorizes |
| class | `ckp:permDomain` | the RDF class the verb ranges over |
| target | `ckp:permTarget` | the scope within that class |

```turtle
@prefix ckp: <https://conceptkernel.org/ontology/v3.8/core#> .

[] a ckp:Grant ;
   ckp:role       "contributor" ;
   ckp:permAction "task.create" ;
   ckp:permDomain "ckp://Kernel#demo" ;
   ckp:permTarget "ckp://Kernel#demo" .
```

This grant reads straight off the page: the `contributor` identity may `task.create` in the `demo` kernel. Read its coordinates back the other way and you have the question a kernel can always answer — which identity, which verb, which class, which target.

## Why the matrix is enumerable

A grant matrix is a table: identities down the side, verbs across the top, each cell a class-and-target scope.

| identity | `instance.create` | `instance.transition` | `instance.query` | `kernel.apply` |
|---|---|---|---|---|
| `crew` | `Ship` | `Ship` | `Ship` | — |
| `viewer` | — | — | `Ship` | — |
| `steward` | `Ship` | `Ship` | `Ship` | `demo/*` |

This table exists because the verb vocabulary is **closed**. CKP v3.9.1 exposes a small, fixed set of verbs — `instance.{create, update, transition, link, query, get, reach, verify, provenance, snapshot, validate, retire}`, `kernel.{propose_change, vote, apply}`, and `concept.match`. A finite, sealed set of verbs is a finite set of columns, so the grant matrix has a shape that can be written down, audited, and enforced row by row.

"Zero query surfaces" is therefore the **precondition** that lets grants exist at all. A grant means "this identity may speak this verb over this class" — a claim that carries force only when the set of verbs is fixed and the semantics of each are sealed. An open expression position — a SPARQL string, a WHERE clause, a raw query — leaves no finite column set to grant against; one reachable surface swallows every distinction a grant is meant to draw. Closing the verb set turns access control into an enumerable, enforceable matrix.

This is the load-bearing point: grants depend on the door being [a verb, not a query surface](/v3.9/verb-vs-query-surface). Because there is nothing to query, everything can be granted.

## Identity and fine-grained enforcement

Enforcing a grant per identity asks the server to know, at seal time, who the caller is. Today a deployment authenticates participants with the `ck_participant` SCRAM password — a shared secret. That makes the isolation floor real for every connection while holding participant identity at a single trust level; a published ck-allinone v0.7.28 deployment is **alpha-trust** on that basis.

Verified-JWT identity with seal-time, per-user claim checking is the capability that makes fine-grained per-verb and per-class grants meaningful: the identity coordinate a grant keys on becomes a verified claim the server reads from the token, sealed and out of the caller's reach. That identity layer is an inherited upstream prerequisite (CKP v3.9 §10). When it lands, the grant matrix above becomes enforceable per participant, and two participants on the same shared kernel discover the different [affordances](/v3.9/affordances) their grants allow.

::: warning IDENTITY ROADMAP
The role floor is live and enforced by Postgres. Fine-grained grant enforcement keyed on a verified per-user identity rides on the verified-JWT identity prerequisite (CKP v3.9 §10). Treat participant identity as a shared secret until that layer publishes.
:::

## Related

- [The Door](/v3.9/the-door) — one typed capability, `ckp.dispatch`, and the ring floor beneath it.
- [A Verb, Not a Query Surface](/v3.9/verb-vs-query-surface) — why the closed vocabulary is the precondition for enforceable access.
- [Affordances](/v3.9/affordances) — the sealed registry a participant discovers through their grants.
