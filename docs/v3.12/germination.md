---
title: "Germination & Naming"
description: "How a concept kernel comes into existence through the door — what the caller declares, what the substrate stamps, why the project kind is permanent, and the naming law that gives every kernel exactly one spelling."
---

# Germination & Naming

**Germination is the one act that brings a concept kernel into existence.** It runs through the door like every other act, it is attributed like every other act, and it happens once per kernel. Before germination a name is only a name. After it, there is a sealed `ckp:Kernel` in the ledger, a sealed `ckp:Project` that says who owns it, three organs with gated write authorities, and a transport segment the wire can route.

The verb is `kernel.germinate`:

```json
{ "verb": "kernel.germinate",
  "payload": { "project": "orders", "label": "Orders", "projectKind": "shared" } }
```

Three fields, and the caller supplies nothing else. Everything that answers *who* and *where* is derived by the substrate. Because `kernel.germinate` refuses an unverified caller, germinating proves an identity rather than bypassing one.

## What the caller declares, what the substrate stamps

The caller declares **structure and intent**: the kernel's id, a human label, and the kind of project it is. The substrate stamps **everything a stranger must be able to trust**:

| Fact | Who supplies it | Where it lands |
|---|---|---|
| the kernel id (one transport segment) | caller, validated against the naming law | `ckp:transportSegment` on the sealed Kernel |
| `rdfs:label` | caller | Kernel and Project |
| `ckp:projectKind` (`personal` · `shared`) | caller — required | the sealed Project |
| `ckp:ownedBy` | **substrate**, from the verified connection | the sealed Project |
| `ckp:germinatedAtEpoch` | **substrate** | the sealed Kernel |
| the three organs and their write authorities | **substrate** | `ckp:hasOrgan` on the Kernel |
| the four stamps on each sealed fact | **substrate** | every Kernel, Project and Organ seal |

`ckp:ownedBy` is the triple a client cannot write. It is derived from the verified identity exactly as `ckp:createdBy` is, and a germination without a verified identity is refused (`42501`): an owner is never invented, and a project nobody owns is never minted.

## What one germination produces

```
urn:ckp:project:orders            ckp:Project   — label, projectKind, ownedBy (stamped)
urn:ckp:orders/kernel             ckp:Kernel    — label, inProject, transportSegment,
                                                  germinatedAtEpoch, hasOrgan ×3
urn:ckp:orders/organ/ck           ckp:CK        — organKind "ck",   writeAuthority "governed-only"
urn:ckp:orders/organ/tool         ckp:TOOL      — organKind "tool", writeAuthority "readonly-on-ontology",
                                                  dependsOn the CK organ
urn:ckp:orders/organ/data         ckp:DATA      — organKind "data", writeAuthority "readwrite",
                                                  dependsOn the CK and TOOL organs
```

The kernel's meaning lives in its kernel graph, `urn:ckp:orders/kernel/ck`. Its sealed instances are mirrored into `urn:ckp:orders/instances`, and the surface it is judged against is composed into `urn:ckp:orders/shapes/composed` — core, the kernel graph, and every module the kernel has adopted.

The organ structure is not a convention. `KernelShape` requires exactly three organs, and each organ shape pins its kind and write authority with `sh:hasValue`, so a CK organ claiming `readwrite` is refused at the gate. The dependency order is counted in each organ's own body: CK depends on nothing, TOOL on exactly one organ, DATA on exactly two.

## The epoch a kernel starts from

A kernel's epoch ledger is seeded at germination, at position **0**. ε0 is a state, not an absence: a freshly germinated kernel reads 0 on every plane, and its first governed change advances it honestly from 0 to 1.

The germination moment is sealed as `ckp:germinatedAtEpoch` — a name chosen so that no reader mistakes it for the kernel's live position. It is immutable by meaning. The kernel's *current* position lives in its sealed `ckp:Epoch` facts and the epoch ledger, which move forward one governed act at a time. See [Epochs & Digests](/v3.12/epochs-and-digests).

## Project kind sets the quorum floor

`ckp:projectKind` is required at germination — `ProjectShape` refuses a Project without it and names the clause. It takes one of two values, and the choice sets the kernel's quorum floor:

| `projectKind` | Meaning, as the core declares it | Quorum floor |
|---|---|---|
| `personal` | one owner, who is quorum of one | 1 |
| `shared` | several members, where governed change clears a quorum | 2 |

A `shared` kernel refuses any proposal declaring a quorum of one, and says why. A `personal` kernel may decide alone — that is its declared meaning — and every such decision is **rehearsal**, never fleet agreement. The ledger carries the kind, so anyone reading the record can tell which they are looking at.

Only the declared owner may change `projectKind` after germination, and the change is a sealed, attributed re-seal of the Project. See [Governance](/v3.12/governance) for how the floor is applied and [Ownership & Authority](/v3.12/authority) for why the owner gate exists.

## The naming law — one kernel, one spelling

A kernel id is **one lowercase transport segment**, dashes optional:

```
^[a-z0-9]+(-[a-z0-9]+)*$
```

The pattern is law, carried by `ckp:transportSegment` in `KernelShape`, so a client learns it from `surface.declared` rather than hardcoding it, and a bad spelling is refused at the shape gate with the clause named.

The reason is the transport. NATS matches subjects token by token, with no character classes and no case folding: `orders` and `Orders` are two different tokens. A name that differs only by case would mint a second kernel nothing can ever seal into. A dotted name, or one carrying `:` or `/`, could never be granted at all. Germination refuses each of these at the door (`22023`) and names the canonical slug to use instead.

The transport segment is **stored, not derived**: the substrate stamps it from the id the caller named and validated, so the wire form and the sealed form can never disagree.

### `project.resolve` — which kernel does this name mean?

Every act names a kernel, and `project.resolve {segment}` answers which one, under which clause, from the same resolver every verb uses:

| Clause | Answer |
|---|---|
| canonical, with its own sealed `ckp:Kernel` | resolves to itself |
| a non-canonical spelling with exactly one canonical sealed kernel behind it | resolves onto that canonical kernel |
| two canonical sealed kernels answering to one name | **refused** — a genuine conflict, never a guess |
| canonical, with nothing sealed or graphed behind it yet | resolves; the germination path stays open |
| no kernel named at all | the law is readable; sealing refuses until a kernel is named |

A non-canonical name with neither a seal nor a graph behind it has nothing to resolve onto and is refused with the slug it should use. A refusal here *is* the result: the reply carries `refused: true` and the reason, from the resolver itself rather than a copy of its rules.

## Germination is existence

Routing follows the seal. The set of kernels the door routes is the configured roster **united with** every sealed `ckp:Kernel`'s transport segment, refreshed within seconds. A newly germinated kernel becomes addressable with no configuration edit; the configured roster serves as bootstrap and override, and the union only ever adds.

`surface.check` reports the roster as the door computes it, in named populations:

| Population | Meaning |
|---|---|
| `union` | everything the door routes |
| `ledger` / `ledgerOnly` | sealed kernels, and those sealed but never configured |
| `guc` / `gucOnly` | configured names, and those configured but never sealed — germination is their next act |
| `ghosts` | graphs under a kernel-shaped IRI with no sealed `ckp:Kernel` behind them — a surface that can judge but cannot be reached, owned or re-germinated |

Every population is a fact a third party can read through the door. None is inferred from silence.

## Re-germination is the owner's act alone

Germination writes the kernel graph from its declared structure. A second germination of the same kernel therefore resets that graph — which makes it a destructive act, and a destructive act is refused unless the actor owns the kernel. The owner may re-germinate; anyone else receives a refusal naming the owner. An existing kernel whose owner the ledger cannot name refuses too: the destructive path fails closed.

## Status in this release

| Mechanism | Law (declared in core) | Gate (refuses) | Runtime (pgCK 0.4.112) | Proven by |
|---|---|---|---|---|
| `kernel.germinate` through the door | `Kernel`, `Project`, three organ shapes | `KernelShape`, `ProjectShape`, organ shapes | routed and implemented | [s74](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s74_germinate_stamps_segment.sql) |
| `ownedBy` stamped from the verified connection | `ProjectShape` requires `ownedBy` | anonymous germination refused (`42501`) | implemented | [s76](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s76_germinate_ownership_guard.sql) |
| re-germination owner-only | — | non-owner refused, owner admitted | implemented | [s76](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s76_germinate_ownership_guard.sql) |
| `projectKind` required, binds the quorum floor | `sh:in ("personal" "shared")`, minCount 1 | missing or illegal kind refused | implemented | [tdd01](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/tdd/tdd01_obligations.sql) |
| transport segment pattern | `ckp:transportSegment` + `sh:pattern` | shape gate + germinate guard (`22023`) | implemented | [s74](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s74_germinate_stamps_segment.sql), [s70](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s70_kernel_planes_agree.sql) |
| one kernel, one spelling | — | two canonical matches refused | `project.resolve` | [s63](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s63_kernel_resolution.sql) |
| `germinatedAtEpoch`; ε0 is a state | `germinatedAtEpoch`, maxCount 1 | — | seeded at germination; first apply 0 → 1 | [s84](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s84_epoch_rename_honest_stamp.sql), [s77](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s77_epsilon_zero_is_a_state.sql) |
| germination is existence (routing union) | — | — | configured roster ∪ sealed kernels | [tdd01](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/tdd/tdd01_obligations.sql) |
| roster populations reported | — | — | `surface.check` → `roster` | [tdd01](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/tdd/tdd01_obligations.sql) |

Continue with [Governance](/v3.12/governance), or read how a germinated kernel is reached in [The Door](/v3.12/the-door).
