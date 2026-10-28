---
title: "Affordances — Both Halves or Neither"
description: "A verb a kernel offers is two facts at once: a route that makes it callable and a sealed declaration that makes it true. CKP v3.12 keeps the two in one act — for built-in verbs, governed query verbs, delegated verbs, and the verbs one kernel uses from another."
---

# Affordances — Both Halves or Neither

An **affordance** is an act a kernel offers to others: a way to add to it, ask it, or link through it. Capability is always derived from meaning — a kernel offers what its declared world makes possible, and nothing beside it.

Every affordance has two halves:

| half | what it is | what it answers |
|---|---|---|
| **routed** | a row in the substrate's affordance registry: *(kernel, verb, inTopic, plane)* | *can this verb be called?* |
| **declared** | a sealed `ckp:Affordance`, `derivedBy` a Materialization at an epoch | *is this verb a fact — attributed, gated, discoverable, provable?* |

A route without a declaration is a capability nobody can account for. A declaration without a route is a promise the door cannot keep. **Both halves, or neither.**

```
           propose → vote → apply            (or: the substrate's own boot)
                          │
            ┌─────────────┴──────────────┐
            ▼                            ▼
   registry row (routed)        ckp:Affordance (declared)
   kernel · verb · inTopic      inTopic · outTopic · plane
   plane = handler selector     derivedBy ──► Materialization ──► Epoch
            │                            │
            └──────── one act ───────────┘
```

## The declared half — `AffordanceShape`

A sealed `ckp:Affordance` is gated like every instance, and carries:

| Property (`https://conceptkernel.org/ontology/v3.11/core#…`) | Constraint | Meaning |
|---|---|---|
| `inTopic` | at least one, string | where the call is addressed |
| `inShape` | at most one, IRI | the shape of the input — the contract a caller can learn without calling |
| `outTopic` | at most one, string | where the reply is published |
| `plane` | at most one of `"instance"` · `"governance"` · `"derived"` | which plane of meaning the act belongs to |
| `delegate` | at most one, boolean | served by a tool tier rather than in the kernel |
| `retiredAtEpoch` | at most one, integer | the epoch at which it is withdrawn from what is offered |
| `derivedBy` | **exactly one**, IRI | the Materialization that produced it |

`derivedBy` is required. An affordance is the output of an epoch's derivation from meaning, so it names the derivation — and the Materialization in turn names the Epoch it produced and the surface digest it ran under. Every verb a kernel offers traces back to a version of its law. See [Epochs & Digests](/v3.12/epochs-and-digests).

## Every routed verb is declared

When the core loads, the substrate seals a declaration for every routed verb of every germinated kernel that lacks one. It performs the full lawful act rather than a shortcut: the kernel's standing position seals as a real `ckp:Epoch` where none exists, one `ckp:Materialization` records the act, and each `ckp:Affordance` seals `derivedBy` that Materialization. The act is idempotent — re-running it seals nothing new — and attributed to a named service identity where no participant is acting.

The registry's `plane` column is the **routing** truth — it selects the handler (`instance` for the built-in verbs, `governance` for the three governance verbs, `query` for compiled plans). The sealed `plane` is the root's closed vocabulary; a routed `query` verb declares as `derived`.

## Discovering what is offered

```json
{ "verb": "affordances", "payload": {} }
```

The discovery verb is **derived from the sealed declarations** of the calling kernel, never from the registry alone:

- each entry carries its `inShape` resolved into a real input contract, its `derivedBy`, and the epoch it was sealed at;
- an affordance retired at or before the current epoch is omitted;
- any drift between routed and declared is reported separately, under `unsealed`, rather than merged into the answer.

A verb that is not routed for the calling kernel answers `unknown_affordance` (`42704`) — an honest absence, not a silent drop.

## The core verb surface

Every germinated kernel is reached through the same routed surface. Reads and checks are as governed as writes: each is a named, pre-declared operation with a typed payload, never a query position the caller authors.

| group | verbs |
|---|---|
| **instance — write** | `instance.create` · `instance.update` · `instance.link` · `instance.transition` · `instance.retire` · `kernel.germinate` · `participant.join` · `notify` |
| **instance — read & prove** | `instance.get` · `instance.query` · `instance.reach` · `instance.snapshot` · `instance.verify` · `instance.provenance` · `instance.validate` · `instance.explain` · `concept.match` |
| **governance** | `kernel.propose_change` · `kernel.vote` · `kernel.apply` |
| **discovery & checkers** | `affordances` · `kernels.list` · `surface.check` · `surface.declared` · `surface.typecheck` · `surface.unshaped` · `surface.refusals` · `surface.grounding` · `surface.explain` · `project.resolve` · `adoption.check` · `fleet.adoptions` · `integrity.check` · `authority.mine` |
| **signals, scores & the clock** | `signal.boundary` · `score.tick` · `orbit.next` |
| **module verbs** (answered only where the module is adopted) | `wave.signals` · `wave.project` |

A module verb dispatched by a kernel that has not adopted its module answers `module_not_adopted` (`55000`). Adoption, never osmosis. The checkers are described in [Know Before You Act](/v3.12/know-before-you-act).

## Governed query affordances

A kernel grows a read verb of its own through governance. The `add_affordance` operation carries the verb name, the query text and the names of its parameters:

```json
{ "verb": "kernel.propose_change",
  "payload": { "op": "add_affordance",
               "detail": { "verb": "board.open_items",
                           "query": "…",
                           "params": ["owner"] } } }
```

The verb name and every parameter name must match `^[a-z][a-z0-9_.]*$`. When the proposal is applied, in one act:

1. the query compiles into the plan for *(kernel, verb, epoch)*;
2. the registry routes the verb on the `query` plane, with its `inTopic` and its `outTopic` (`result.kernel.<kernel>.<verb>`);
3. a `ckp:Affordance` seals `derivedBy` the Materialization that same apply produced.

If the declaration is refused, the apply fails loudly. A capability that cannot declare itself does not go live half-made. Parameters are supplied by name in the payload when the verb is called; the query text itself is the governed fact.

## Executable affordances — capability as data

The v3.12 law gives an affordance a way to carry its own behaviour as data, so a capability can travel inside a module and arrive or vanish with that module's adoption:

| Property | Constraint (`ExecutableAffordanceShape`) | Meaning |
|---|---|---|
| `affordanceName` | exactly one, matching `^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$` | the dotted verb name the affordance answers to |
| `sparqlBody` | at most one, string — **the selector** | a read-only SPARQL body |
| `resultShape` | exactly one, IRI | the shape of the reply rows, learnable without calling |

The shape targets the subjects of `ckp:sparqlBody`: an affordance that carries a body claims to be executable and must carry the rest of the trio; an affordance without one is simply not executable. A module declares verb names only under its own prefix; the core keeps `instance.*`, `surface.*`, `kernel.*` and `score.*`. Writes never travel this way — they stay behind the governed core verbs.

::: warning Declared, executor pending
The law and its gate are in force: an executable affordance missing its name or result shape is refused. The generic read-only executor that runs a `sparqlBody` at dispatch is **not yet built**. Today, read verbs a kernel adds run through the governed `add_affordance` path above.
:::

## Delegated affordances — the tool tier

Some capabilities are not served inside the kernel at all: compute beyond a read, run by a tool on the same wire. Such an affordance is routed with `delegate: true`. Dispatching it answers `ok: false` with `delegate: true` and sqlstate `0A000` — registered as `verb_delegated`: a marker that the verb is served by the tool tier, not a refusal by law. The declared `inTopic` and `outTopic` name where the tool listens and answers.

## Retirement

`ckp:retiredAtEpoch` withdraws an affordance — or any instance — from what is offered, without unsealing it. A retired fact stays sealed and true as of its epoch; the record of what was once offered is never rewritten. Discovery omits an affordance retired at or before the current epoch.

## Using another kernel's affordance

A `ckp:AffordanceUse` is a sealed statement that one kernel uses an affordance another kernel declares:

| Property | Constraint (`AffordanceUseShape`) |
|---|---|
| `consumer` | exactly one IRI, **disjoint** from `provider` — a kernel's use of its own affordance is declaration |
| `provider` | exactly one IRI |
| `uses` | exactly one IRI — the Affordance |
| `pinnedEpoch` | exactly one integer — the provider epoch the use was agreed against |

A provider's TOOL organ is rebuilt at every epoch, so a cross-kernel dependency names the epoch it was agreed at and is re-agreed when the provider advances past it.

## Status in this release

| mechanism | law (declared in core) | gate (refuses) | runtime (pgCK 0.4.112) | proven by |
|---|---|---|---|---|
| Every routed verb carries a sealed Affordance | ✅ `AffordanceShape` (`derivedBy` required) | ✅ | ✅ boot backfill, idempotent, full Epoch → Materialization → Affordance act | [s85](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s85_affordance_both_halves.sql) |
| Discovery derived from declarations | ✅ | — | ✅ `affordances` (retirement honoured, drift under `unsealed`) | — |
| Governed query affordances | ✅ | ✅ name pattern, declaration in the same act | ✅ `add_affordance` → compiled plan + route + seal | [s41](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s41_governed_query_affordance.sql) |
| Module verbs gated by adoption | ✅ | ✅ `module_not_adopted` | ✅ | [s67](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s67_closed_shape_and_118.sql) |
| Delegated affordances | ✅ `delegate` | — | ✅ answered `0A000`, registered `verb_delegated` | [s20](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s20_ci_b1_routing_authority.sql) · [s86](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s86_typed_refusals.sql) |
| Executable affordance trio | ✅ `ExecutableAffordanceShape` | ✅ | ⏳ declared, executor pending — no `sparqlBody` runs at dispatch | — |
| `ckp:AffordanceUse` | ✅ `AffordanceUseShape` | ✅ consumer ≠ provider | ✅ sealable; re-agreement on provider advance is the caller's act | — |
| Retirement | ✅ `retiredAtEpoch` | ✅ | ✅ honoured by discovery | — |
