---
title: "Governance: propose → vote → apply"
description: "A concept kernel changes its own types by consensus. Propose a typed op, reach quorum, apply — the op is translated into the kernel's SHACL graph, the epoch advances, and the very next write is bound by the new shape."
---

# Governance: propose → vote → apply

A concept kernel governs its **own** ontology. The classes it recognises, the properties it requires, the transitions it permits, and the query affordances it exposes are all changed by the same three-verb cascade: `kernel.propose_change` → `kernel.vote` → `kernel.apply`. A quorum gates the apply, the apply translates a sealed op into the kernel's SHACL graph, and the epoch advances — so the next write is bound by a quorum-approved shape, carried by a proof chain that runs from the proposal to the applied epoch.

This is the governance plane, and it is a plane apart. Storing a fact can never change the ontology, and running an instance verb can never rewrite a shape. Type change lands **only** through this cascade, on its own dispatch plane, gated by consensus.

::: info
This cascade is demonstrated on the `ck-allinone` v0.7.28 bundle — pgCK 0.4.21, cklib 1.5.3, pgRDF 0.6.19 — on the substrate finalized at CKP v3.9.
:::

## The three verbs

`kernel.propose_change` seals a `Proposal` from a **closed op-set**. The op names what kind of change is intended, and the runtime builds the shape graph from the typed detail — the caller authors an op, the runtime authors the Turtle.

| Op | Effect on the kernel graph |
|---|---|
| `add_class` | Register a new type — `<C> a owl:Class` |
| `add_property` | Constrain a type — a `sh:NodeShape` with `sh:targetClass <C>` and a `sh:property` for the path |
| `set_transition_map` | Seal a type's allowed `(from → to)` state edges |
| `add_affordance` | Seal a parameterized query as a named verb |

`kernel.vote` seals a `Vote` about a pending Proposal — `approve` or `reject`, each sealed by an identity. Quorum is met when the count of approvals reaches the Proposal's `requires_quorum`.

`kernel.apply` runs one transaction: it checks quorum, translates the sealed op into the kernel's shape graph, and advances the epoch. Every interpolated value in the op is IRI- or integer-gated before it reaches the graph, so no caller value can escape into raw Turtle. Below quorum, the apply is refused; a re-apply is refused. The proposal and the votes are themselves **sealed, proof-chained instances** — the consensus mechanism is made of the same substrate it governs.

## The worked loop

Here is the whole cascade — a `demo` kernel that boots armed with the `Task`/`Goal` shapes at epoch 1, gains a required property by consensus, and advances to epoch 2. Every call goes through the one door, `ckp.dispatch(verb, payload)`.

```js
// 1 — propose: add a crew_size integer property to the Kernel type.
//     add_property carries detail.targetClass (the class the property attaches
//     to) and detail.path (the property IRI) — both IRIs.
dispatch('kernel.propose_change', {
  op: 'add_property',
  requires_quorum: 1,
  detail: {
    targetClass: 'ckp://Kernel#demo',
    path:        'ckp://Kernel#crew_size',
    datatype:    'xsd:integer',
    minCount:    1,
  },
});
// → { ok: true, proposal_iri: 'ckp://Proposal#proposal-…', state: 'pending' }

// 2 — vote (the proposal IRI from step 1)
dispatch('kernel.vote', { about: 'ckp://Proposal#proposal-…', value: 'approve' });
// → { ok: true, quorum_met: true, approvals: 1 }

// 3 — apply: translate the sealed op into the kernel's shape graph, advance the epoch
dispatch('kernel.apply', { about: 'ckp://Proposal#proposal-…' });
// → { ok: true, state: 'applied', epoch: 2 }
```

The type changed by consensus. Step 3's `apply` translated `add_property` into a `sh:NodeShape` in the kernel graph, and every instance sealed after it is bound by that shape. The change is a fact in the kernel graph with a full proposal-to-epoch proof chain, and the epoch bump recompiles the kernel's plans so no stale shape survives the transition. See [Epochs](/v3.9/epochs) for how the epoch versions the whole kernel.

## Apply mutates the shape

The consequential verb is `kernel.apply`, because it changes meaning. `add_property` produces:

```turtle
@prefix sh:  <http://www.w3.org/ns/shacl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

[] a sh:NodeShape ;
  sh:targetClass <ckp://Kernel#demo> ;
  sh:property [
    sh:path     <ckp://Kernel#crew_size> ;
    sh:minCount 1 ;
    sh:datatype xsd:integer ;
  ] .
```

The runtime stages this Turtle through the engine under a meta-fence that admits only `rdf`/`rdfs`/`owl`/`sh` predicates (and, for `set_transition_map`, the sealed transition predicates), copies it into the kernel's shape graph, and materializes — one transaction, before the epoch bumps. Consensus therefore has a real effect on the type, not merely a recorded intent: the shape graph the seal validates against is exactly the graph the apply wrote.

::: warning
A shaped type rejects the very next write that violates its new shape — including writes in flight from clients that were valid a moment earlier. Coordinate an `add_property` that tightens cardinality the way you would any breaking schema change: the epoch bump is the cut-over point, and every write after it is bound by the new shape.
:::

## Governed query affordances

The same cascade adds a **read** to the vocabulary. Through `add_affordance`, a kernel seals a parameterized SPARQL query and exposes it as a named verb. Callers bind typed parameters; the query text is authored once, at germination, and is never caller input.

```sparql
PREFIX ckp:  <https://conceptkernel.org/ontology/v3.8/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?task ?title WHERE {
  ?task a ckp:Task ;
        ckp:part_of_goal $goal$ ;
        rdfs:label ?title .
}
```

```js
// propose the query as an affordance, reach quorum, apply
dispatch('kernel.propose_change', {
  op: 'add_affordance',
  requires_quorum: 1,
  detail: {
    verb:   'task.by_goal',
    query:  '…sealed SPARQL text…',
    params: ['goal'],
  },
});
// vote + apply as above; apply compiles the sealed query into the kernel's plan store at the new epoch

// callers bind the typed parameter only — never the query text
dispatch('task.by_goal', { goal: 'ckp://Goal#backlog-demo' });
```

At apply, the sealed query compiles into the kernel's plan store keyed by `(kernel, verb, epoch)`, and a query-plane affordance row is added. At dispatch, the runtime validates the caller's parameter **values** — a value carrying a quote, brace, backslash, or SPARQL variable is refused — and binds the safe values into the author's placeholders. A raw query smuggled into the payload is ignored; the sealed query runs. This is the [verb vocabulary](/v3.9/affordances) growing by consensus: a new named verb, backed by sealed logic, bound by typed parameters.

## Related

- [Epochs](/v3.9/epochs) — how the epoch versions the kernel and invalidates stale plans on every apply
- [Grants](/v3.9/grants) — how a new verb becomes a per-role, per-participant capability
- [Shapes](/v3.9/shapes) — the shapes that `apply` writes and the seal enforces
