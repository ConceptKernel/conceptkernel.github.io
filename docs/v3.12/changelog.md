---
title: "Changelog — v3.12"
description: "What CKP v3.12 changed relative to v3.11: six revisions of the root law with every sidecar and structural pin, the module set, and the pgCK runtime releases 0.4.82 → 0.4.112 that carried them — grouped by theme, each with the gate that proves it."
---

# Changelog — v3.12

v3.12 **revises the law without renaming it.** The root still binds the `https://conceptkernel.org/ontology/v3.11/core#` namespace, so every IRI a client wrote against v3.11 keeps resolving; the version lives in the law's bytes and digests, not in the namespace. v3.12 is v3.11 plus signal processing as core mechanics, the kernel's own clock, the named set between core and one kernel, and the floors that make ownership, quorum and attribution mean what the root says they mean.

This page is the one place on the v3.12 site that compares versions. The runtime is **pgCK**, the PostgreSQL extension at [styk-tv/pgCK](https://github.com/styk-tv/pgCK); every runtime line below names the version that introduced it and the gate under [`sql/test/`](https://github.com/styk-tv/pgCK/tree/v0.4.112/sql/test) that proves it, each shipped with its negative control.

## The law

### Root revisions — `ontology/v3.12/core.ttl`

| revision | date | file sha256 (sidecar) | structural (`pgrdf-fd1-sha256`) | shapes / properties | change |
|---|---|---|---|---|---|
| `wave-3.12-rc1` | 2026-08-20 | `f36961d1…` | — | 30 / — | v3.11 core verbatim + `ckp:Signal`, `ckp:Score`, their properties (polarity, dwell, score value, computed-at epoch), the seven law constants, the executable-affordance trio (`affordanceName`, `sparqlBody`, `resultShape`) and three shapes: `SignalShape`, `ScoreShape`, `ExecutableAffordanceShape` |
| `wave-3.12-rc2` | 2026-08-22 | `7de02b35…` | `6e38f7bb…` | 30 / 94 | the seven constants **gated** on `KernelShape` with their bounds (`weightDissent ≤ 0`, `decayLambda ≥ 0`, `weightImplicit ∈ [0,1]`, `thresholdDiscard < thresholdPromote`); `retiredAtEpoch` widened from Affordances to every Instance; `ExecutableAffordanceShape` selects by `sh:targetSubjectsOf ckp:sparqlBody`; Supersession gains `intoProject` |
| `wave-3.12` (FINAL) | 2026-08-26 | `7de02b35…` | `6e38f7bb…` | 30 / 94 | rc2's bytes promoted unchanged — two sidecars legitimately pin one digest |
| `wave-3.12-pass-1` | 2026-08-28 | `97f97cb2…` | `47d24485…` | 30 / 95 | `ckp:transportSegment`, required on `KernelShape` with pattern `^[a-z0-9]+(-[a-z0-9]+)*$` — the lowercase kernel-id rule moves from procedure into the composed surface |
| `wave-3.12-pass-2` | 2026-09-02 | `a6cc1ce8…` | `5761473d…` | 30 / 96 | `ckp:germinatedAtEpoch` declared; `KernelShape` no longer demands `ckp:epoch` on the sealed Kernel — `ckp:epoch` stays on `ckp:Epoch`, where it is honest forever |
| **`wave-3.12-pass-3`** | 2026-09-02 | **`2e90a651…`** | **`2a7b14d8…`** | **31 / 102** | `ckp:Scope` + `ScopeShape` (31st shape) + `ckp:includesKernel`; the orbit law (`orbitPeriodSeconds`, `orbitLeadSeconds`, `orbitSeat`, `orbitAnchor`) and `tauImplicitMillis` on `KernelShape`; `"draft"` joins the `proposalState` closed set — **current** |

v3.11's own root is `e5f7d1e5…` (27 shapes / 80 properties). Full values, each published beside the file it pins:

```text
f36961d1a94f76bace685235b7beafcb09d88acd085ee1344671297e91211d40  core.ttl.wave-3.12-rc1.sha256
7de02b35fd1fbc2ecfd32e6e53162704be2791a2d41280102849ddb605eb9297  core.ttl.wave-3.12-rc2.sha256
7de02b35fd1fbc2ecfd32e6e53162704be2791a2d41280102849ddb605eb9297  core.ttl.wave-3.12.sha256
97f97cb22baa6e710bd088226728aef693c32ff33d0380105c4a9174f3f4857e  core.ttl.wave-3.12-pass-1.sha256
a6cc1ce8a14c518f495e2c6b4b1bbbb12baca90e698feefd1ed9ce2fb07b6463  core.ttl.wave-3.12-pass-2.sha256
2e90a6512c7aae567714be69b92b37af4393e8da8d65a05c047c5d51e1bed07b  core.ttl.wave-3.12-pass-3.sha256   ← current
```

Structural pins of the published revisions (survive reload; compare across stores):

```text
6e38f7bb631875b4fcacb086219d862bbe08cfc7209ee9c96967222e9c0225a7  FINAL (= rc2)
47d24485627e459f44aa5cb1fd414089cb63690b47ad1aabb610575acd096f4a  pass-1
5761473d1a45f7b0c5240240e427b9c1d332de6229fd9b83acf8d976b2d81a7e  pass-2
2a7b14d81aab303708097eee8acef56c9ebd0f59506539f559c01eafec82c034  pass-3
```

Historical sidecars stay published and fail against the current bytes by design, so every earlier citation remains checkable. See [Epochs, Digests & Proof](/v3.12/epochs-and-digests) for what each plane proves.

### The module set

Modules adopt by digest, so an Adoption keeps governing the exact bytes it cites; a revision is taken by adopting its new digest.

| module | file | sha256 | change |
|---|---|---|---|
| `wave` (v3.12 shelf) | `v3.12/modules/wave.ttl` | `ad887db2…` | a Finding requires `rdfs:label`; ruled-at-pass retyped |
| `lexicon` | `v3.11/modules/lexicon.ttl` | `5def86ba…` | the closed sets gain teeth: `lex:symptom` / `lex:outcome` / `lex:recurrenceOf` value-gated against their sets, and the five derived properties refused when asserted — 6 shapes = 4 + 2 |
| `recon` (re-issue) | `v3.11/modules/recon.ttl` | `b2b11f1b…` | the smallest module that packages an affordance, namespace corrected to track the line |
| `recon` (superseded) | `v3.12/modules/recon.ttl` | `6a7c199e…` | retained only because sealed Adoptions cite it; composition fails closed on an absent adopted graph |

The original lexicon (`ce9f20f4…`) and the v3.11 wave module (`f4ad27ce…`) keep their sidecars and keep governing every Adoption that cites them.

## The runtime — pgCK 0.4.82 → 0.4.112

Tagged releases in this span: 0.4.82 – 0.4.91, 0.4.101 – 0.4.109, 0.4.111 and **0.4.112**. Versions 0.4.92 – 0.4.100 and 0.4.110 are steps whose changes first shipped in the tagged releases 0.4.101 and 0.4.111. Gates are linked at the [v0.4.112 tag](https://github.com/styk-tv/pgCK/tree/v0.4.112/sql/test); `TDD` refers to the [obligation ledger](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/tdd/tdd01_obligations.sql), which at 0.4.109 became a gate itself — a non-green row refuses the report.

### The root comes into force
- **0.4.82** — `ckp.boot()` defaults to the v3.12 root; aligned to pgRDF 0.6.34, whose attested tarball the smoke suites run against. Existing v3.11-booted databases are untouched: re-grounding a live kernel is a governed act, never an upgrade side effect.

### Naming and germination
- **0.4.88** — germination stamps `ckp:transportSegment` from the already-validated id; the shape and its emitter ship in one act. *s74*
- **0.4.89** — the effective roster is the configured list **∪ every sealed `ckp:Kernel`**: germination is existence, and a germinated kernel routes with no configuration edit. Re-germination by anyone but the owner is refused. *s76*
- **0.4.100** — the roster reconciles all three populations — sealed, rostered and graph-bearing — and names the two kinds of stranger: rostered-but-never-sealed, and graphs with no sealed Kernel behind them. *TDD*
- **0.4.104** — germination stamps `ckp:germinatedAtEpoch` according to the law actually loaded. *s84*

### Ownership and authority
- **0.4.99** — apply is the declared owner's act: quorum answers *did enough parties agree*; ownership answers *may this party enact it*. *TDD*
- **0.4.102** — `ckp:ownedBy` is patchable by **no one**, owner included; `projectKind` only by the declared owner; one id vocabulary for reads and writes; the apply gate covers every spelling of a proposal. *s82*
- **0.4.107** — the seal stamps `ckp:onBehalfOf` from the trusted ingress and strips any payload claim (the wire relay setting it from an agent's verified token is not yet built); in-kernel roles **narrow** per action and never widen the substrate floor; the owner is never narrowed; Memberships are the owner's to seal. *s87*
- **0.4.108** — a rule bound to a `ckp:Scope` binds the member kernels and no others, read at seal time. *s88*

### Governance floors
- **0.4.95** — `set_kernel_policy`: the governed route to the seven law constants, through propose → vote → apply. The law's own bounds refuse a bad value; the projector carries no copy of them. *s81*
- **0.4.96** — an undeclared property is refused in every key form, bare or full IRI. *s81*
- **0.4.98** — `projectKind` sets the quorum floor: `shared` requires two distinct accountable parties, `personal` is quorum of one by declaration, an undeclared kind imposes nothing. *TDD*
- **0.4.90** — apply's success reply carries `approvals` with the `quorum` it cleared, and states plainly when quorum 1 is rehearsal. Re-adopting an adopted module is idempotent. *s78*

### Signals, scores and the clock
- **0.4.108** — the orbit law: a kernel declares its period, lead, seat and anchor; `orbit.next` computes the next crossing from sealed law alone, and a kernel with no orbit is refused by name. *s88*
- **0.4.109** — `signal.boundary` seals one implicit Signal per boundary as one hash-chained head, and seals nothing for an encounter that never happened. `score.tick` derives Scores from sealed Signals under the kernel's own law, every provenance link resolving (Score → Run → Affordance); a Score crossing `thresholdPromote` **drafts** a Proposal, and the tick seals no vote, applies nothing and moves no epoch. Crossings **enqueue** and never execute; the drain is bounded, fair across kernels, and parks a job that fails five times. *s89*

### Affordances — both halves or neither
- **0.4.85** — a governed-in affordance seals its `ckp:Affordance` in the same transaction as its route, `derivedBy` the Materialization that apply sealed.
- **0.4.105** — every routed verb carries a sealed `ckp:Affordance`; boot backfills built-in routes through the full lawful act. *s85*

### Refusals are results
- **0.4.83** — one refusal envelope: a declared registry of refusal codes, each with its SQLSTATE class and what it teaches; `surface.refusals` makes the registry learnable through the door.
- **0.4.84** — replies carry the stamps their seal wrote, and reads carry a completeness verdict (`complete` · `truncated` · `possibly_truncated`).
- **0.4.86** — a module-carried read on a kernel that never adopted the module refuses `module_not_adopted` instead of answering empty.
- **0.4.90** — every emitted id form resolves, and an unresolvable one refuses instead of answering `null`; the registry gains a digest to cache on and the plane of each code. *s78*
- **0.4.97** — dependency-state refusals (class `2B`) registered. *TDD*
- **0.4.106** — every refusal site on the governed path carries a registered code and SQLSTATE; a fault keeps the real SQLSTATE of the exception it caught. *s86*

### Epochs, digests and identity instruments
- **0.4.89 / 0.4.90** — ε0 is a state: the epoch ledger is seeded at germination, the first apply is an honest 0 → 1, a never-pinned kernel is not drifting, and no finding is ever `null`. *s77, s78*
- **0.4.91** — the structural digest delegates to pgRDF's own `structural_digest()`, agreement asserted; `ckp.storage()` reports storage as state. *s79*
- **0.4.92 / 0.4.93** — validation scratch graphs are reaped at the point of use, and a failed reap warns instead of passing silently. *s80*
- **0.4.94** — every stored digest carries its method; adoption pins gain the canonical plane where the engine provides it. *TDD*
- **0.4.97** — the epoch ledger carries the `surfaceDigest` its sealed Epoch carries, written from one computation. *TDD*
- **0.4.101** — the method and surface-digest columns join the fresh-install floor, so an upgraded and a freshly installed database mean the same thing. *TDD*
- **0.4.103** — storage is reported per kernel, with shared weight in a named substrate bucket; `surface.check` carries the engine identity triple. *s83*

### Know before you act
- **0.4.110 / 0.4.111** — `fleet.adoptions` flags an Adoption whose module or target project no longer resolves. *s90*
- **0.4.112** — the adoption reference checks run **before** the act (`instance.validate` answers `sourceDigestMatch`, `moduleResolves`, `targetHasGraphs`) and **at** the act (the create reply carries the same checks as warnings). They report and never gate. *s91*

## The edge — declared, not yet built

Each item below is stated in the law or the record and is not yet delivered by the runtime. It is listed here so silence is never mistaken for coverage.

- **No ownership-transfer verb.** `ckp:ownedBy` cannot move; a lawful hand-over must itself be governed, and until that verb exists ownership does not change hands.
- **Scope consent.** Being listed in a `ckp:Scope` binds a kernel; being listed is not yet a consented act. The gap is recorded in the law itself.
- **Decay and the discard/defer bands.** `decayLambda`, `thresholdDiscard` and `thresholdDefer` are declared and gated; the tick at 0.4.112 does not yet apply them. Scores are the weighted sum of sealed Signals under `weightAssent`, `weightDissent`, `weightImplicit` and `tauImplicitMillis`, with drafting at `thresholdPromote`.
- **Score read verbs.** `score.top`, `score.deferred`, `score.stuck` and `signals.mine` are specified and not yet routed; Scores are read as sealed instances today.
- **The `sparqlBody` executor.** `ExecutableAffordanceShape` gates an affordance that carries its own read-only SPARQL body; nothing executes that body yet. Governed query verbs run as plans compiled at apply.
- **Spores and governed ingestion.** Capability that travels as a sealed, digest-pinned parcel — adopted mid-flight, shed by supersession — is the trajectory of the line.
- **`onBehalfOf` over the wire.** The seal stamps it and strips forged claims; the relay does not yet set it from an agent's verified token, so seals arriving over `/wss` carry none.
- **Draft promotion.** A drafted Proposal stays a draft; there is no verb yet that promotes it to `pending` — a party brings the change forward as their own proposal.
- **Stranger-verifiable signatures.** The shipped proof method is `hmac+sha256`; Ed25519 proofs are planned.

## Earlier lines

- [v3.11 — Where Declaring Becomes Binding](/v3.11/): the self-contained root, the three authoring rules, the declared gap.
- [v3.9.1 — Critical Isolation](/v3.9/introduction): one door, the role floor, the closed verb vocabulary.
