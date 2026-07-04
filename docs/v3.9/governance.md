---
title: "Governance: propose → vote → apply"
description: "A concept kernel changes its own types by consensus. Propose a typed op, reach quorum, apply — the op is translated into the kernel's SHACL graph, the epoch advances, and the very next write is bound by the new shape."
---

# Governance: propose → vote → apply

A concept kernel governs its **own** ontology. The classes it recognises, the properties it requires, the transitions it permits, and the query affordances it exposes are all changed by the same three-verb cascade: `kernel.propose_change` → `kernel.vote` → `kernel.apply`. A quorum gates the apply, the apply translates a sealed op into the kernel's SHACL graph, and the epoch ε advances — so the next write is bound by a quorum-approved shape, carried by a proof chain that runs from the proposal to the applied epoch.

This is the governance plane, and it is a plane apart. Storing a fact can never change the ontology, and running an instance verb can never rewrite a shape. Type change lands **only** through this cascade, on its own dispatch plane, gated by consensus.

## The three verbs

`kernel.propose_change` seals a `Proposal` from a **closed op-set**. The op names what kind of change is intended, and the runtime builds the shape graph from the typed detail — the caller authors an op, the runtime authors the Turtle.

| Op | Effect on the kernel graph |
|---|---|
| `add_class` | Register a new type — `<C> a owl:Class` |
| `add_property` | Constrain a type — a `sh:NodeShape` with `sh:targetClass <C>` and a `sh:property` for the path |
| `set_transition_map` | Seal a type's allowed `(from → to)` state edges |
| `add_affordance` | Seal a parameterized query as a named verb |

`kernel.vote` seals a `Vote` about a pending Proposal — `approve` or `reject`, each sealed by an identity. Quorum is met when the count of approvals reaches the Proposal's `requiresQuorum`.

`kernel.apply` runs one transaction: it checks quorum, translates the sealed op into the kernel's shape graph, and advances the epoch. Every interpolated value in the op is IRI- or integer-gated before it reaches the graph, so no caller value can escape into raw Turtle. Below quorum, the apply is refused; a re-apply is refused. The reply reports `{ graph_changed, epoch }`.

## The worked loop

Here is the whole cascade — a type that starts open, gains a required property by consensus, and immediately enforces it.

```js
import { CK } from 'cklib';
const k = await CK.activate('demo', { wssEndpoint: 'wss://host/wss' });

const Ship = 'urn:ckp:demo/type/Ship';

// 1 — an unshaped Ship seals; no shape targets the type yet, so the body conforms
await k.create(Ship, { name: 'Endurance' });
// → { ok: true, id, proof_digest }

// 2 — propose the constraint, reach quorum, apply it
const p = await k.propose('add_property', {
  targetClass: Ship,
  path:        'urn:ckp:demo/prop/crew_size',
  minCount:    1,
  datatype:    'http://www.w3.org/2001/XMLSchema#integer',
});
await k.vote(p.about, 'approve');   // quorum reached
await k.apply(p.about);
// → { ok: true, graph_changed: true, epoch: 7 }

// 3 — the identical create is now bound by the evolved shape
await k.create(Ship, { name: 'Resolution' });
// → { ok: false }   — crew_size is required at the seal; nothing lands

// 4 — a Ship carrying crew_size seals under the new type
await k.create(Ship, { name: 'Resolution', crew_size: 24 });
// → { ok: true, id, proof_digest }
```

The type changed by consensus. Step 2's `apply` translated `add_property` into a `sh:NodeShape` in the kernel graph, and step 3 — the same call that succeeded in step 1 — is now refused because the [seal](/v3.9/shapes) reads the new shape. The change is a fact in the kernel graph with a full proposal-to-epoch proof chain, and the epoch bump recompiles the kernel's plans so no stale shape survives the transition. See [Epochs](/v3.9/epochs) for how ε versions the whole kernel.

## Apply mutates the shape

The consequential verb is `kernel.apply`, because it changes meaning. `add_property` produces:

```turtle
<urn:ckp:demo/shape/Ship>
  a sh:NodeShape ;
  sh:targetClass <urn:ckp:demo/type/Ship> ;
  sh:property [
    sh:path     <urn:ckp:demo/prop/crew_size> ;
    sh:minCount 1 ;
    sh:datatype xsd:integer ;
  ] .
```

The runtime stages this Turtle through the engine under a meta-fence that admits only `rdf`/`rdfs`/`owl`/`sh` predicates (and, for `set_transition_map`, the sealed transition predicates), copies it into the kernel's shape graph, and materializes — one transaction, before the epoch bumps. Consensus therefore has a real effect on the type, not merely a recorded intent: the shape graph the seal validates against is exactly the graph the apply wrote.

::: warning
A shaped type rejects the very next write that violates its new shape — including writes in flight from clients that were valid a moment earlier. Coordinate an `add_property` that tightens cardinality the way you would any breaking schema change: the epoch bump is the cut-over point, and every write after it is bound by the new σ strand.
:::

## Governed query affordances

The same cascade adds a **read** to the vocabulary. A kernel authors a parameterized SPARQL query, seals it through `add_affordance`, and exposes it as a named verb. Callers bind typed parameters; the query text is authored once, at germination, and is never caller input.

```sparql
SELECT ?ship ?name WHERE {
  ?ship a <urn:ckp:demo/type/Ship> ;
        <urn:ckp:demo/prop/name>   ?name ;
        <urn:ckp:demo/prop/status> $status$ .
}
```

```js
// propose the query as an affordance, reach quorum, apply
const q = await k.propose('add_affordance', {
  verb:   'ship.by_status',
  query:  '…sealed SPARQL text…',
  params: ['status'],
});
await k.vote(q.about, 'approve');
await k.apply(q.about);   // compiles the sealed query into the kernel's plan store at the new epoch

// callers bind the typed parameter only — never the query text
await k.do('ship.by_status', { status: 'deployed' });
```

At apply, the sealed query compiles into the kernel's plan store keyed by `(kernel, verb, epoch)`, and a query-plane affordance row is added. At dispatch, the runtime validates the caller's parameter **values** — a value carrying a quote, brace, backslash, or SPARQL variable is refused — and binds the safe values into the author's placeholders. A raw query smuggled into the payload is ignored; the sealed query runs. This is the [closed verb vocabulary](/v3.9/affordances) growing by consensus: a new named verb, backed by sealed logic, bound by typed parameters.

## Related

- [Epochs](/v3.9/epochs) — how ε versions the kernel and invalidates stale plans on every apply
- [Grants](/v3.9/grants) — how a new verb becomes a per-role, per-participant capability
- [Shapes](/v3.9/shapes) — the σ strand that `apply` writes and the seal enforces
