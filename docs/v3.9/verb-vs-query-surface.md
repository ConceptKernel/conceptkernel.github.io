---
title: "A Verb, Not a Query Surface"
description: "The distinction the whole protocol rests on — a closed set of named verbs instead of an open query surface, and why grants and shapes depend on it."
---

# A Verb, Not a Query Surface

Everything about Concept Kernel Protocol turns on a single distinction: an outside caller reaches a kernel through **verbs**, never through a **query surface**. This is the α strand of a kernel — the [affordance alphabet](/v3.9/affordances) — and it is what makes the [ring architecture](/v3.9/critical-isolation) hold, what makes [grants](/v3.9/grants) enumerable, and what makes [shapes](/v3.9/shapes) unbypassable. It is worth stating precisely, because it is the precondition for the rest.

## Two ways to let a caller cause work

There are two fundamentally different ways to let an outside caller cause work in a data system.

A **query surface** is an opening where the caller authors the logic and the engine runs it: a SQL connection, a SPARQL endpoint, a GraphQL resolver, an ORM that builds arbitrary `WHERE` clauses. The caller supplies a *program*. The surface's power is unbounded because the program space is unbounded. You cannot enumerate what someone can do through it, and you cannot validate it at the door — the door does not know what any given query will touch until it runs.

A **verb** is the opposite: a finite, named, pre-declared operation. The caller does not supply logic — they name one of a closed set and hand it a typed payload. The engine already knows, before execution, exactly what that verb does and what shape its input must take. A verb is a stored procedure with a typed signature; a query surface is a `psql` prompt.

CKP exposes verbs. It exposes no query surface.

## The closed α — a vocabulary you can print on one screen

The entire caller-visible vocabulary is a closed set of roughly seventeen verbs. Every operation a participant, agent, or browser can name is one of these:

```
instance.create · update · transition · link · query · get · reach ·
verify · provenance · snapshot · validate · retire ·
kernel.propose_change · vote · apply · concept.match
```

That is the whole surface. There is no seventeenth thing waiting behind it, no expression position, no place to inject logic. A caller selects a verb and passes a typed body; the engine validates the body's shape and runs the named operation. Higher layers compose these — a [notation sentence](/v3.10/assembled-constructs), however elaborate, decomposes into an ordered sequence drawn only from this closed list — but nothing reaches past it.

::: info The count is not the point
Whether you count sixteen or seventeen depends on how you fold aliases (`list` is an alias of `query`) and the governance verbs. The point is that the set is **closed and nameable** — you can hold all of it in your head.
:::

## Zero query surfaces — the caller never hands the engine a program

This is the claim's teeth. Nowhere in CKP does a caller supply query text. Two verbs *look* query-shaped, and neither is a surface:

- **`instance.query`** reads by a derived QueryShape: a filter is a set of declared property keys and values with a closed operator set and a bounded limit — a typed parameter object, never a query string.
- **`concept.match`** runs a SPARQL query that was **authored at germination, sealed into the kernel as a governed fact, and gated by a grant**. The caller binds a typed `term` into that sealed query; the caller never sees or alters the query text. An injection-shaped term is bound as a literal, matches nothing, and injects nothing.

The caller supplies *arguments to a sealed operation*, never the operation. That is a bound parameter, not an open surface — the difference between calling a stored procedure and being handed a database connection. This is why the front page can say "no REST endpoints, SQL handles, or query engines exposed" in the same breath as shipping a query verb. **The verb is the surface's absence made usable.**

## Where a compiler could break it — and does not

A notation compiler is specifically tempted toward a query surface. The natural-seeming design is: parse notation into RDF triples, hold them in a local quad store, and run SPARQL to "evaluate" a sentence before dispatching. The moment a compiler builds that store it *becomes* a query surface — a client-side engine — and the property is broken from the inside, on the caller's side of the wire.

The [CKN compiler](/v3.10/assembled-constructs) does not build that store. Its AST is a **dispatch plan** — a list of `{verb, typed-body}` objects — and its output is an ordered array of dispatch tuples. It never constructs a triple, never runs a match, never holds graph state. It emits only δ, the [dispatch tuple](/v3.9/the-door), which is the one atom allowed to cross the membrane. It is pure sugar above the verb layer, adding no new surface below it. Keeping the compiler on the verb side of that line is what the design protects.

## Why the property is load-bearing

Zero query surfaces is not an aesthetic. It is the precondition that lets the other strands exist.

This maps directly to the [ring architecture](/v3.9/critical-isolation). Ring 2 is the named affordances a caller can see. Ring 1 is the frozen internal primitives. Ring 0 is the [pgRDF](https://github.com/styk-tv/pgRDF) engine — SPARQL, SHACL, OWL — which is never addressable by any participant, role, or operator. An open query surface would be a hole straight through Ring 2 and Ring 1 into Ring 0.

If that hole existed, two strands collapse:

- **[Grants (γ)](/v3.9/grants) become unenforceable.** Grants work because access is expressed as *which verbs on which classes* — an enumerable matrix. Against an open query surface there is nothing to enumerate; a crafted query reads or joins whatever it reaches, and per-verb grants mean nothing.
- **[Shape validation (σ)](/v3.9/shapes) becomes bypassable.** Shapes gate writes *through verbs*, at the seal. A direct query surface that could write would sidestep the seal gate entirely, and σ would no longer be real.

So zero query surfaces is not a feature sitting beside grants and shapes. It is what lets grants and shapes exist at all. It is the isolation the protocol is named for: **Critical Isolation**. The verb layer makes a kernel usable without making the engine reachable.

## In one line

> A verb is a named operation with a typed signature the engine knows before it runs. A query surface is an opening for caller-authored logic the engine cannot know until it runs. CKP ships the first and none of the second — and that single choice is what every other guarantee stands on.

Next: the [affordance alphabet](/v3.9/affordances) in full, or the [ring architecture](/v3.9/critical-isolation) that this precondition protects.
