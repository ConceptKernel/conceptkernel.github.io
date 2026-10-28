---
title: "Epochs, Digests & Proof"
description: "How a concept kernel names the law each fact was judged under, how a graph is identified across stores, and what a stranger can re-derive from the record — epochs, materializations, the four digest planes, the ledger chain, and the engine identity triple."
---

# Epochs, Digests & Proof

A kernel's record is worth exactly what a stranger can re-derive from it. Three questions carry that weight: **under which law** was this fact judged, **which bytes** was that law, and **has anything in the record moved** since. v3.12 answers each with a resource you can read through the door and a digest you can recompute yourself.

> **A proof is re-derivable by someone who trusts nobody in it.** Anything that cannot be re-derived from the published law and the sealed record is the filer's word, not a proof.

## The epoch is a resource

An **Epoch** names one version of a kernel's meaning. It carries two values, and the root requires both:

```turtle
<urn:ckp:example/epoch/3> a ckp:Epoch ;
    ckp:epoch          3 ;                                    # the ordinal it names
    ckp:surfaceDigest  "2a1c…9f04" .                          # the enforcement surface in force
```

`ckp:EpochShape` gates the pair — `ckp:epoch` exactly once as an integer, `ckp:surfaceDigest` exactly once as 64 lowercase hex characters (`^[0-9a-f]{64}$`). An ordinal without its surface would name a position no one could check anything against, so the shape refuses it.

The kernel's **live position** lives in the epoch ledger, and the ledger carries the same `surfaceDigest` the sealed Epoch carries — written from one computation, so the table and the seal cannot drift apart. Every sealed instance points into this ledger through its third stamp:

| stamp | answers |
|---|---|
| `ckp:sealedAtEpoch` | the producing kernel's epoch at the moment of sealing |
| the Epoch at that ordinal | the `surfaceDigest` of the law that judged it |

A sealed Kernel carries **`ckp:germinatedAtEpoch`** — the epoch at which germination sealed it, immutable by meaning and named so a reader cannot mistake it for the live position. A sealed fact carries no value a reader could take for a live one: either it tracks, or its name says it does not.

## ε0 is a state

A freshly germinated kernel stands at **ε0**: its law is loaded and readable, nothing has been governed yet, and its epoch ledger row is seeded at germination. Every read reports `0` for it, and the kernel's first applied change is an honest **ε0 → ε1**.

A kernel at ε0 is complete, not degraded. `surface.check` reports it as a state — the never-pinned case — and reports no drift for it, because there is no pin to drift from. When a pin *does* exist and the actual surface differs, the finding fires and names both digests. Every finding the substrate emits is readable: a finding is never JSON `null`, in any state.

## Materialization — how an epoch comes to be

An epoch advances only through a **Materialization**: the completed derivation of the kernel's action set from its own meaning at that epoch. The root requires a completed one to name everything a stranger needs to recompute it:

| property | Materialization | FailedMaterialization |
|---|---|---|
| `ckp:materializes` | required | required |
| `ckp:fromEpoch` | required | required |
| `ckp:sourceDigest` | required, 64-hex | required, 64-hex |
| `ckp:toEpoch` | required | **refused** (`maxCount 0`) |
| `ckp:surfaceDigest` | required, 64-hex | **refused** |
| `ckp:producesEpoch` | required — the Epoch it seals | **refused** |
| `ckp:reason` | — | **required**, non-empty |

A derivation that does not complete seals as a **FailedMaterialization** — a sibling kind, not a subtype. It must say why, and it is refused a surface, an epoch and an advance. The epoch does not move, and the failure is a recorded, queryable outcome rather than an absence.

The governance plane's gate runs this re-derivation end to end: it applies a change, finds the Materialization the apply sealed, follows `producesEpoch` to the Epoch, re-derives the surface digest from the shapes, and asserts the sealed claim equals the fresh computation.

## The four digest planes

A graph can be identified four ways, and each answers a different question. They are **never comparable with each other** — every digest the substrate stores or returns names its method beside its value.

| plane | computed over | method | survives reload | equal means | compare across stores |
|---|---|---|---|---|---|
| **file** | the published `.ttl` bytes | `sha256` | — (it is the file) | byte-identical | yes |
| **structural** | the loaded graph; each blank node replaced by a signature of its incident triples | `pgrdf-fd1-sha256` | yes | **isomorphic-likely** — evidence, not proof; *unequal* is conclusive | yes |
| **canonical** | the loaded graph under RDF Dataset Canonicalization | `rdfc-1.0-sha256` | yes | **proof** of isomorphism | yes |
| **copy** | this store's rendered lines, blank-node labels included | `sha256` (copy) | **no** — moves on every reload | byte-identical in *this* store | **never** |

Two notes make the table usable:

- **Structural equality is strong evidence, not proof.** First-degree blank-node signatures collide on symmetric structures — a four-cycle and two two-cycles digest alike. An *unequal* structural digest proves two graphs differ; an equal one says they almost certainly do not. The canonical plane is where equality becomes proof.
- **The copy plane is local by construction.** Blank-node labels are minted per parse, so the copy digest is the right instrument for "did this store's graph change" and the wrong one for "do two stores hold the same graph".

The structural algorithm belongs to the graph engine: pgCK delegates to `pgrdf.structural_digest()` (pgRDF 0.6.34), keeps its own implementation only as a fallback for older engines, and its gate asserts the two agree on every graph where both exist. A second implementation of a digest that nothing compares is a divergence waiting to happen.

### A digest carries its method

A stored digest whose method is not stated is a number that looks like a pin. Adoption pins therefore record each plane under its own name — copy, structural, and canonical where the engine provides it — with a `methods` map naming the plane of every value. Pins taken before a plane existed carry nothing for that plane: computing it now would assert a historical fact nobody measured, and absence is an answer.

### The file plane and its sidecars

Every published `.ttl` carries at least one `<file>.<wave-tag>.sha256` sidecar. The file's own sha256 **is** its identity; the current sidecar is the one `shasum -c` passes; historical sidecars stay published and fail against current bytes by design, so old citations remain checkable. Zero passing sidecars is the drift signal.

```sh
curl -sO https://conceptkernel.org/ontology/v3.12/core.ttl
curl -sO https://conceptkernel.org/ontology/v3.12/core.ttl.wave-3.12-pass-3.sha256
shasum -a 256 -c core.ttl.wave-3.12-pass-3.sha256        # core.ttl: OK
```

The full set of revisions, with every sidecar, is on the [ontology page](/ontology/v3.12/) and in the [changelog](/v3.12/changelog).

### Reading the planes through the door

`surface.grounding` censuses the kernel's own ground — its composed surface, its kernel graph, and every adopted module — and returns, per graph, the copy and structural digests beside the existential census: ground triples, blank-node triples, distinct blank nodes, node shapes, property shapes and declared properties.

```js
const ground = await k.surface.grounding();   // the kernel's own world, every graph in it
```

`surface.check` compares what the kernel's epoch sealed against what is loaded now — `surface` and `source`, each as `{ pinned, actual, match }` — and reports adopted modules, findings and a `state`. An adopted module whose structural digest moved has drifted; one whose copy digest moved while its structural digest held was reloaded, and nothing in it changed.

## The chain — what `verified: true` means

Every write runs one transaction: **validate → seal → ledger entry → proof**. The ledger is hash-chained — each `ckp:LedgerEntry` carries the sha256 of the body it seals (`ckp:bodySha`), its signature (`ckp:sig`), a timestamp, and the position of the entry before it (`ckp:prev`) — and each `ckp:Proof` records its `ckp:method`, its digest and when it was verified.

`instance.verify` re-checks the chain for one instance and answers `{ verified, proof_digest }`. `instance.provenance` returns the chain itself.

**`verified: true` is the chain, not conformance.** It says the record is intact; it says nothing about which law judged the fact. That is the separate stamp `ckp:conformsToShape`. A fact whose type no shape selects is admitted, ledgered and chained — and judged by nothing, which shows as an absent `conformsToShape`. Read both. See [Stamps & Refusals](/v3.12/reading-a-reply).

The shipped proof method is `hmac+sha256`: the substrate verifies the chain on request, and a party without the substrate's key cannot recompute the signatures themselves. Ed25519-signed proofs are the trajectory that makes the chain stranger-verifiable end to end; until then the stranger-verifiable planes are the published law, the digests and the stamps.

## A proof a stranger can re-derive

Given one sealed fact, a third party with no account and no trust in the operator can establish:

1. **The law.** Fetch the published `core.ttl`, hash it, and check its sidecar.
2. **Who and whose law.** Read the fact's stamps — `createdBy` (server-derived from the verified connection), `producedBy` (the kernel whose law governs it), `sealedAtEpoch`, `conformsToShape`.
3. **Which version of that law.** Resolve the Epoch at `sealedAtEpoch` and read its `surfaceDigest`.
4. **How that epoch came to be.** Follow the Materialization whose `producesEpoch` is that Epoch: its `sourceDigest`, `surfaceDigest`, `fromEpoch` and `toEpoch`.
5. **That the record holds.** Ask `instance.verify` and compare the `proof_digest`.

Each step is a read through the door or a hash over published bytes. None of them asks anyone to vouch for anything.

## The engine identity triple

A door answers for its own build. `surface.check` carries **`engineIdentity`** — three planes read independently, then compared by one pure rule:

| plane | what it is |
|---|---|
| `version` | what the loaded library reports — the code the server process is running |
| `build_id` | the build identifier stamped into that library (`git describe` of the commit it was built from) |
| `extversion` | the extension version in the database catalog — the law surface the SQL side carries |

The verdict is `agree`, `diverged` (naming both planes and the cure), or `unmeasurable` — an unreadable plane is reported as `null`, never guessed, and agreement is never asserted where it cannot be shown. A new library reaches a running server only on restart, so `version` can trail `extversion`; the triple makes that divergence a reading instead of a mystery.

## Status in this release

| mechanism | law (declared in core) | gate (refuses) | runtime (pgCK 0.4.112) | proven by |
|---|---|---|---|---|
| Epoch = ordinal + surfaceDigest | `ckp:Epoch`, `ckp:EpochShape` | an Epoch missing either, or a malformed digest | the live position carries the same surfaceDigest as the sealed Epoch | [s62](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s62_epoch_materialization.sql), [TDD ledger](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/tdd/tdd01_obligations.sql) |
| Materialization / FailedMaterialization | both shapes | a failure claiming a surface, epoch or advance; a failure with no reason | apply seals the Materialization and re-derives its surface | [s62](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s62_epoch_materialization.sql) |
| ε0 is a state | — | — | seeded at germination; first apply 0→1; never-pinned is not drift; no `null` findings | [s77](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s77_epsilon_zero_is_a_state.sql), [s78](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s78_outstanding_list.sql) |
| `germinatedAtEpoch` | `ckp:KernelShape` (`maxCount 1`) | a second or non-integer value | germination stamps by the law actually loaded | [s84](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s84_epoch_rename_honest_stamp.sql) |
| Structural plane | — (engine algorithm) | — | delegated to `pgrdf.structural_digest()`; agreement with the fallback asserted | [s65](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s65_structural_grounding.sql), [s73](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s73_structural_digest_conformance.sql), [s79](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s79_engine_surface_adopted.sql) |
| Canonical plane (RDFC-1.0) | — | — | recorded on adoption pins where the engine provides it; not yet carried in `surface.grounding` | [TDD ledger](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/tdd/tdd01_obligations.sql) |
| Every stored digest carries its method | — | — | `methods` map on every pin; planes never compared to each other | [s79](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s79_engine_surface_adopted.sql), [TDD ledger](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/tdd/tdd01_obligations.sql) |
| Ledger chain + proof | `ckp:LedgerEntryShape`, `ckp:ProofShape` | an entry or proof missing its digest, signature or link | `hmac+sha256`; `instance.verify`, `instance.provenance` | [s4_verify](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s4_verify.sql) |
| Engine identity triple | — | — | `surface.check` → `engineIdentity` (`agree` · `diverged` · `unmeasurable`) | [s83](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s83_identity_and_attribution.sql) |
| Adoption pins and the census | `ckp:AdoptionShape` | an Adoption without `sourceDigest` (64-hex) or `intoProject` | pins byte + structural planes; `fleet.adoptions` flags a dangling module or target project | [s90](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s90_adoption_orphaned.sql), [s91](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s91_adoption_prevalidation.sql) |

::: tip Call it bare
Call `surface.grounding` with no argument: it censuses exactly the kernel's own graphs. Naming an explicit `{ iri }` for a graph that does not exist yet can register an empty graph row for it in this release.
:::
