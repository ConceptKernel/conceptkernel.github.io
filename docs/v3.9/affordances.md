---
title: "Affordances: the Verb Vocabulary"
description: "The live CKP verb set — a finite, named, grantable vocabulary carried through one door. Each verb has a known operation and a typed payload the engine validates before execution. A verb, not a query surface."
---

# Affordances: the Verb Vocabulary

Everything a participant can do to a concept kernel is a **verb**. The verb vocabulary is closed, named, and finite: you can print the whole of it on one screen. There is one door, `ckp.dispatch(verb, payload)`, and every verb passes through it. The kernel a verb acts on is named in the payload; identity is derived by the server from the connection. A verb the vocabulary does not contain does not exist; a read that cannot be named cannot be granted, so it cannot happen.

This is the deliberate opposite of a query surface. A query surface is an open grammar — an infinite space of expressions a caller composes at will. The verb vocabulary is a fixed set of operations, each with a known effect and a typed payload the engine validates. **A verb is a bound parameter, not an open surface — a stored procedure, not a `psql` prompt.**

::: info
The vocabulary below is what the `ck-allinone` v0.7.28 bundle ships — pgCK 0.4.21, cklib 1.5.3, pgRDF 0.6.19 — on the substrate finalized at CKP v3.9.
:::

## The vocabulary

Every verb below is dispatched through the single door. The payload is a typed body the engine validates against the verb's operation before execution; identity is carried by the connection, never in the payload.

### `kernel.*` — open a kernel and evolve its types

| Verb | Operation | Typed payload |
|---|---|---|
| `kernel.create` | Open a named domain kernel | `{ name }` |
| `kernel.propose_change` | Seal a Proposal from the closed op-set | `{ op, detail, requires_quorum }` |
| `kernel.vote` | Seal a Vote about a pending Proposal | `{ about, value }` |
| `kernel.apply` | Quorum-gated: translate the op into the kernel's shape graph and advance the epoch | `{ about }` |

### `task.*` / `goal.*` — land sealed work objects

| Verb | Operation | Typed payload |
|---|---|---|
| `task.create` | Seal a governed task targeting a kernel — validate → seal → ledger → proof, one transaction | `{ task: { target_kernel, title, … } }` |
| `task.update` | Patch a task by its declared properties and re-seal | `{ id, … }` |
| `goal.create` | Seal an objective a kernel works toward | `{ goal: { target_kernel, … } }` |

A `task.create` returns `{ id: "task-…", ok: true, verified: true, proof_digest }` — the sealed id, the proof digest, and the seal-time verification in one reply. `instance.create` today routes only to Task and Goal, so `task.create` and `goal.create` are the live create verbs. First-class custom sealed types — each with its own create verb and SHACL shape — are the next pgCK capability (CKP v3.9 §4).

### `instance.*` / `instances.*` — read, verify, and audit the sealed facts

| Verb | Operation | Typed payload |
|---|---|---|
| `instances.list` | List the sealed instances in a kernel | `{ kernel }` |
| `instance.get` | Return one sealed instance by id | `{ id }` |
| `instance.verify` | Re-check an instance's proof chain independently | `{ id }` |
| `instance.provenance` | Return the PROV-O derivation, body, proof, and ledger for an instance | `{ id }` |
| `instance.validate` | Return the full W3C SHACL `ValidationReport` for a candidate body | `{ type, …fields }` |

`instances.list` returns `{ ok: true, count, instances }`; `instance.verify` returns `{ id, ok: true, verified: true }`. Every sealed fact is re-verifiable this way, long after it landed.

### Relational and search verbs — driven through the client

The bundled cklib client drives the relational and search verbs over NATS-WSS; the `hello-kernel` example runs `create → verify → query → link → reach` end to end.

| Verb | Operation | Typed payload |
|---|---|---|
| `instance.link` | Seal a declared-predicate edge between two instances | `{ source, predicate, target }` |
| `instance.reach` | Traverse a declared predicate from an instance, depth-bounded | `{ from, via }` |
| `instance.query` | Filter a type's instances over declared properties, closed operator set, bounded page | `{ type, filter, limit, offset }` |
| `concept.match` | Bind a search term into the kernel's sealed concept query and rank the matches | `{ term }` |

That is the live vocabulary — a small, closed set, addressable only through `ckp.dispatch`.

## Each verb is a known operation over a typed payload

A verb is a specific operation, and the engine validates the payload against that operation's shape before it runs. `task.create` routes its body against the kernel's own declared SHACL shape (see [Shapes](/v3.9/shapes)). `instance.query` accepts a closed operator enumeration, declared-property keys only, and a bounded `limit`/`offset` — an undeclared filter key is refused, and no expression position is reachable. `instance.link` and `instance.reach` accept only the kernel's **declared predicates**. Every verb's payload is a shape the engine checks, so a malformed request fails typed, with a named error, before it touches state.

## Even the read verbs bind parameters into sealed logic

The verbs that *look* like queries are the ones that prove the point. `instance.query` compiles from fixed per-operator templates and binds caller values positionally — a value that carries SQL or SPARQL metacharacters is bound as a literal, matching nothing, injecting nothing.

`concept.match` goes further: its query text is a **sealed fact**, authored at germination and compiled into the kernel's plan store. The caller supplies one thing — the `term` — which the runtime binds into the author's query. The caller never sees or authors the query text, and a stray query string smuggled into the payload is ignored while the sealed query runs.

```js
// The caller binds a typed parameter. The query is sealed; the caller never writes it.
await k.match('endurance');
// → [ { id, label, score }, … ]   — ranked matches from the kernel's sealed concept query
```

This is the verb vocabulary's core guarantee: a query-shaped verb is **a bound parameter into a sealed query**, authored once by the kernel and exposed as a named affordance. The full treatment lives at [A Verb, Not a Query Surface](/v3.9/verb-vs-query-surface).

## Enumerable, therefore grantable

Because the vocabulary is finite and each verb is a discrete named capability, the verb set is exactly the surface a [grant](/v3.9/grants) binds. A permission names a verb; a role holds a set of verbs. The role floor makes this concrete: `ck_participant` holds only `EXECUTE ckp.dispatch`, and every finer capability is a sealed grant over named verbs.

The contrapositive is the security model. A capability that cannot be enumerated cannot be named in a grant, so it cannot be authorized. An open query surface is unenumerable by construction — no one can list every query a grammar admits — so it can never be safely granted. The verb vocabulary is enumerable by construction, so every affordance is precisely grantable, and a read outside the vocabulary is a read that does not exist.

::: info
The verb is the surface. Application code names verbs, kernel names, and typed payloads. The transport and the engine are handled entirely below the door.
:::

## Related

- [A Verb, Not a Query Surface](/v3.9/verb-vs-query-surface) — the full argument for the closed vocabulary
- [Grants](/v3.9/grants) — how named verbs become per-role, per-participant capabilities
- [Shapes](/v3.9/shapes) — the SHACL gate `task.create` and `instance.validate` run
- [Governance](/v3.9/governance) — how a kernel adds a governed query affordance to the vocabulary
