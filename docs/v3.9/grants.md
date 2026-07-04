---
title: "Grants: the γ Strand"
description: "A grant binds an identity to a verb, a class, and a target — an enumerable matrix of legal moves, sealed as a fact and enforced at the one door."
---

# Grants: the γ Strand

Grants are language. A grant (γ) is a sealed sentence in the kernel's own vocabulary: it states that a given identity may speak a given verb over a given class within a given target scope. It declares an affordance an identity holds, and it is honoured at the single door every participant reaches through — [`ckp.dispatch`](/v3.9/the-door).

## A grant is four coordinates

The `ckp:Grant` class binds a role to a permission expressed as domain × action × target. Every grant carries four fields, and the seal gate requires all four:

| Coordinate | Property | Meaning |
|---|---|---|
| identity | `ckp:role` | the identity class the grant speaks for |
| verb | `ckp:permAction` | the closed-vocabulary verb it authorizes |
| class | `ckp:permDomain` | the RDF class the verb ranges over |
| target | `ckp:permTarget` | the scope within that class |

```turtle
@prefix ckp: <https://conceptkernel.org/ontology/v3.8/core#> .

[] a ckp:Grant ;
   ckp:role       "crew" ;
   ckp:permAction "instance.transition" ;
   ckp:permDomain "urn:ckp:demo/type/Ship" ;
   ckp:permTarget "urn:ckp:demo/ship/*" .
```

This grant reads straight off the page: the `crew` identity may `instance.transition` a `Ship` in the `demo` project. Read its coordinates back the other way and you have the enumerable question a kernel can always answer — *which identity, which verb, which class, which target.*

## Identity is server-derived

The four-tuple that reaches the door is ⟨ verb, kernel_urn, payload, identity ⟩. Three coordinates travel in the request. The fourth — identity — the server derives from the verified JWT the connection carries. The payload names URNs and typed fields; the identity is the connection's own, established at login and reissued as NATS permissions when the JWT is presented.

That placement is what makes a grant enforceable. Because identity is read from the verified token, a grant that names the `crew` role applies to exactly the connections that authenticated as crew — the coordinate the grant keys on is the coordinate the server already holds, sealed and out of the caller's reach.

## Two participants, one kernel, different legal moves

The kernel's affordances live in a sealed registry — the sole routing authority for `ckp.dispatch`. A participant's legal moves are the intersection of two sealed sets: the affordance rows the kernel exposes, and the grants the participant's identity holds.

```
legal moves = sealed affordance rows  ∩  grants(identity)
```

Because the second set is keyed on identity, two participants acting on the *same* shared kernel see *different* [affordances](/v3.9/affordances). A crew identity discovers `instance.transition` on `Ship`; a viewer identity discovers `instance.get` and `instance.query` and nothing that writes. The kernel is one governed truth; the door each participant sees is cut to their grants. Discovery and enforcement are the same computation — a participant is offered exactly the moves the seal would accept from them.

## The role floor

Beneath every grant sits a floor enforced by Postgres role authority, so no grant can widen past it. A connection is issued the role `ck_participant`, and `ck_participant` holds exactly one capability: `EXECUTE` on `ckp.dispatch`.

::: tip THE FLOOR
`ck_participant` cannot read a table, cannot reach `pgrdf.*`, and cannot rewrite a shape. Storing a fact can never change the ontology; running a verb can never rewrite the rules. The separation is enforced by the database's own role authority — write authority, not convention.
:::

The [ring architecture](/v3.9/the-door) makes this structural. Ring 2 is the named affordances a participant may speak; Ring 1 is the frozen set of primitives that touch the engine; Ring 0 is the pgRDF engine itself, which is never addressable from the door. A grant grants a verb in Ring 2 — the only surface there is. There is no coordinate in a grant that could name a table, a SPARQL string, or a graph id, because those live below the floor.

## Why the matrix is enumerable

A grant matrix is a table: identities down the side, verbs across the top, each cell a class-and-target scope.

| identity | `instance.create` | `instance.transition` | `instance.query` | `kernel.apply` |
|---|---|---|---|---|
| `crew` | `Ship` | `Ship` | `Ship` | — |
| `viewer` | — | — | `Ship` | — |
| `steward` | `Ship` | `Ship` | `Ship` | `demo/*` |

This table exists because the verb vocabulary is **closed**. CKP v3.9.1 exposes roughly sixteen verbs — `instance.{create, update, transition, link, query, get, reach, verify, provenance, snapshot, validate, retire}`, `kernel.{propose_change, vote, apply}`, and `concept.match`. A finite, sealed set of verbs is a finite set of columns, so the grant matrix has a shape that can be written down, audited, and enforced row by row.

"Zero query surfaces" is therefore the **precondition** that lets grants exist at all. A grant means "this identity may speak this verb over this class" — a claim that carries force only when the set of verbs is fixed and the semantics of each are sealed. Give a caller an open expression position — a SPARQL string, a WHERE clause, a raw query — and there is no finite column set to grant against; a single reachable surface swallows every distinction a grant is meant to draw. Closing the verb set is what turns access control from aspiration into an enumerable, enforceable matrix.

This is the load-bearing link between the strands: **γ depends on the door being [a verb, not a query surface](/v3.9/verb-vs-query-surface).** Because there is nothing to query, everything can be granted.

## Related

- [The Door](/v3.9/the-door) — one typed capability, `ckp.dispatch`, and the ring floor beneath it.
- [A Verb, Not a Query Surface](/v3.9/verb-vs-query-surface) — why the closed vocabulary is the precondition for enforceable access.
- [Affordances](/v3.9/affordances) — the sealed registry a participant discovers through their grants.
