---
title: "Affordances: the Closed Verb Vocabulary (α)"
description: "The complete CKP verb set — a finite, named, grantable vocabulary carried through one door. Each verb has a known operation and a typed payload the engine validates before execution. A verb, not a query surface."
---

# Affordances: the Closed Verb Vocabulary (α)

Everything a participant can do to a concept kernel is a **verb**. The verb vocabulary — the α strand — is closed, named, and finite: you can print the whole of it on one screen. There is one door, `ckp.dispatch(verb, kernel_urn, payload, identity)`, and every verb passes through it. A verb the vocabulary does not contain does not exist; a read that cannot be named cannot be granted, so it cannot happen.

This is the deliberate opposite of a query surface. A query surface is an open grammar — an infinite space of expressions a caller composes at will. The α strand is a fixed set of operations, each with a known effect and a typed payload the engine validates. **A verb is a bound parameter, not an open surface — a stored procedure, not a `psql` prompt.**

## The vocabulary

Every verb below is dispatched through the single door. The payload is a typed body the engine validates against the verb's operation before execution; identity is server-derived from the connection and never appears in the payload.

### `instance.*` — act on the sealed facts

| Verb | Operation | Typed payload |
|---|---|---|
| `instance.create` | Seal a new instance of a declared type — validate → seal → ledger → proof, one transaction | `{ type, …fields }` |
| `instance.update` | Patch an instance by its type's declared properties and re-seal | `{ id, patch }` |
| `instance.get` | Return one sealed instance by id | `{ id }` |
| `instance.query` | Filter a type's instances over declared properties, closed operator set, bounded page | `{ type, filter, limit, offset }` |
| `instance.link` | Seal a declared-predicate edge between two instances | `{ source, predicate, target }` |
| `instance.reach` | Traverse a declared predicate transitively from an instance, depth-bounded | `{ from, via }` |
| `instance.transition` | Move an instance to a new state along its type's sealed transition map | `{ id, to_state }` |
| `instance.validate` | Return the full W3C SHACL `ValidationReport` for a candidate body | `{ type, …fields }` |
| `instance.verify` | Re-check an instance's proof chain independently | `{ id }` |
| `instance.provenance` | Return the PROV-O derivation, body, proof, and ledger for an instance | `{ id }` |
| `instance.snapshot` | Return the set of instances the requester is granted | `{ scope }` |
| `instance.retire` | Seal a retraction of an instance with a required reason | `{ id, reason }` |

### `kernel.*` — evolve the kernel's own types

| Verb | Operation | Typed payload |
|---|---|---|
| `kernel.propose_change` | Seal a Proposal from the closed op-set | `{ op, detail, requires_quorum }` |
| `kernel.vote` | Seal a Vote about a pending Proposal | `{ about, value }` |
| `kernel.apply` | Quorum-gated: translate the op into the kernel's shape graph and advance the epoch | `{ about }` |

### `concept.match` — governed search

| Verb | Operation | Typed payload |
|---|---|---|
| `concept.match` | Bind a search term into the kernel's sealed concept query and rank the matches | `{ term }` |

That is the vocabulary in full — twelve instance verbs, three governance verbs, and one governed search. A closed set, addressable only through `ckp.dispatch`.

## Each verb is a known operation over a typed payload

A verb is a specific operation, and the engine validates the payload against that operation's shape before it runs. `instance.create` routes its body against the kernel's own declared SHACL shape (see [Shapes](/v3.9/shapes)). `instance.query` accepts a closed operator enumeration, declared-property keys only, and a bounded `limit`/`offset` — an undeclared filter key is refused, and no expression position is reachable. `instance.link` and `instance.reach` accept only the kernel's **declared predicates**. Every verb's payload is a shape the engine checks, so a malformed request fails typed, with a named error, before it touches state.

## Even the read verbs bind parameters into sealed logic

The verbs that *look* like queries are the ones that prove the point. `instance.query` compiles from fixed per-operator templates and binds caller values positionally — a value that carries SQL or SPARQL metacharacters is bound as a literal, matching nothing, injecting nothing.

`concept.match` goes further: its query text is a **sealed fact**, authored at germination and compiled into the kernel's plan store. The caller supplies one thing — the `term` — which the runtime binds into the author's query. The caller never sees or authors the query text, and a stray query string smuggled into the payload is ignored while the sealed query runs.

```js
// The caller binds a typed parameter. The query is sealed; the caller never writes it.
await k.match('endurance');
// → [ { id, label, score }, … ]   — ranked matches from the kernel's sealed concept query
```

This is the α strand's core guarantee: a query-shaped verb is **a bound parameter into a sealed query**, authored once by the kernel and exposed as a named affordance. The full treatment lives at [A Verb, Not a Query Surface](/v3.9/verb-vs-query-surface).

## Enumerable, therefore grantable

Because the vocabulary is finite and each verb is a discrete named capability, the verb set is exactly the surface a [grant](/v3.9/grants) binds. A permission names a verb; a role holds a set of verbs. The role floor makes this concrete: `ck_participant` holds only `EXECUTE ckp.dispatch`, and every finer capability is a sealed grant over named verbs.

The contrapositive is the security model. A capability that cannot be enumerated cannot be named in a grant, so it cannot be authorized. An open query surface is unenumerable by construction — no one can list every query a grammar admits — so it can never be safely granted. The α strand is enumerable by construction, so every affordance is precisely grantable, and a read outside the vocabulary is a read that does not exist.

::: info
The verb is the surface. Application code names verbs, kernel URNs, and typed payloads — never NATS subjects, graph ids, or query strings. The transport and the engine are handled entirely below the door.
:::

## Related

- [A Verb, Not a Query Surface](/v3.9/verb-vs-query-surface) — the full argument for the closed vocabulary
- [Grants](/v3.9/grants) — how named verbs become per-role, per-participant capabilities
- [Shapes](/v3.9/shapes) — the SHACL gate `instance.create` and `instance.validate` run
- [Governance](/v3.9/governance) — how a kernel adds a governed query affordance to the vocabulary
