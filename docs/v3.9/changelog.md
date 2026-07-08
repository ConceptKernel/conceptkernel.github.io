---
title: "Changelog"
description: "The version history behind CKP v3.9.1 — the protocol epochs, the pgCK runtime release line, and the cklib client line."
---

# Changelog

This page tracks the version history behind CKP v3.9.1. It is the one place that speaks in comparisons and dates; the specification pages describe only the current model. The authoritative per-release detail lives in each repository's own changelog and `LATEST.md`.

## Protocol epochs

The protocol is versioned by epoch. The identity of the work never moved; the epoch did.

| Epoch | Theme |
|-------|-------|
| v3.4 | The grounding — every kernel a BFO 2020 Material Entity; the three loops named; the ontology published. |
| v3.5 | Three loops as Description Logic boxes — CK → TBox, TOOL → RBox, DATA → ABox. |
| v3.6 | The full specification — consensus governance, compliance, EXTENDS capability mounting. |
| v3.7 | The refined canon — five edge predicates, twenty compliance checks, PROV-O mandate. |
| v3.8 | The permanent vocabulary address — the core IRI `…/ontology/v3.8/core#`, the stable handle the runtime ships and every client dereferences. |
| **v3.9** | **Critical Isolation** — the kernel takes root in PostgreSQL on the pgRDF engine; one typed door; every landing sealed and proof-chained. |
| **v3.9.1** | **The client meets the server** — the dispatch-only client realizes the contract end to end; the `urn:ckp:` naming is proven on a live adopter. *(current)* |
| v3.10 | [CKN — the notation](/v3.10/), the carve chain, and the scoring loop. *(in design)* |

The earlier epochs remain browseable through the version switcher. The pages below document **v3.9.1**.

## The runtime — pgCK

[pgCK](https://github.com/styk-tv/pgCK) is the Concept Kernel runtime: a PostgreSQL extension composed on [pgRDF](https://github.com/styk-tv/pgRDF). The line from `v0.1.0` to the current **`v0.4.21`** is thirty-seven CI-built, provenance-attested releases. The milestones that built the v3.9.1 typed surface:

| Release | What it added |
|---------|---------------|
| `v0.4.4` | Generic typed `instance.create` — a uniform `{type, …fields}` body routed against the kernel's own declared SHACL shape. |
| `v0.4.5` | Governance `apply` mutates the kernel shape — a quorum-approved proposal now translates into the kernel graph before the epoch bump, so consensus actually evolves the type. |
| `v0.4.6` | `instance.reach` traverses participant-created links — `edge.create` writes the traversable quad. |
| `v0.4.7` | Governed query affordances — a kernel seals a parameterized SPARQL query as a verb; callers bind typed parameters only. |
| `v0.4.8` | `instance.query` derived QueryShape — filter keys validated against the type's declared properties. |
| `v0.4.9` | `instance.link` / `reach` gate on the kernel's declared predicate set. |
| `v0.4.10` | Per-kernel sealed transition map — `instance.transition` governed by the type's own sealed map. |
| `v0.4.11` | Declared-shape `instance.update` patch — re-sealed, the proof chain continues. |
| `v0.4.12` | Full SHACL `ValidationReport` via `instance.validate` — typed violations (datatype, cardinality, node-kind, pattern). |
| `v0.4.13` | Governed `concept.match` — label search served by a sealed governed plan; callers bind `term`. |
| `v0.4.14` | The authorized CK-loop writer and uniform instance id-form — enforcement is real through the dispatch door; the link → reach round-trip works on the ids clients hold. |
| `v0.4.15` | Provenance id-form symmetry — `provenance(bare)` and `provenance(@id)` return the same envelope. |
| `v0.4.16` | Per-session result routing. |
| `v0.4.17` | The seal gate honors full W3C SHACL Core — `validate` conforms if and only if `seal` accepts, across cardinality, `sh:in`, `sh:datatype`, `sh:maxCount`, `sh:pattern`, and `sh:nodeKind`. |
| `v0.4.18`–`v0.4.20` | Distribution coherence and stabilization on the shipped bundle, and the derived-read plane the scoring-loop direction builds on. |
| **`v0.4.21`** | `create_typed` files the core lifecycle key (`lifecycle_state`) at create, so a freshly created instance transitions cleanly — closing the create → transition path. |

Each release is verified against its GHCR digests by `gh attestation verify` before `LATEST.md` advances. The full per-release record is the pgCK [`CHANGELOG.md`](https://github.com/styk-tv/pgCK/blob/main/CHANGELOG.md).

## The client — cklib

[cklib](https://github.com/ConceptKernel/CK.Lib.Js) is the dispatch-only client, twenty-six releases from `v1.0.0` to the current **`v1.5.4`**.

| Release | What it added |
|---------|---------------|
| `v1.5.1` | The typed-edge forms — kernel-derived typed operations (`create`, `query`, `transition`, `update`, `validate`, `match`) mirroring the pgCK tracks, plus the canonical NATS wire-contract. |
| `v1.5.2` | `create` passes every caller field through — a kernel's declared shape can require any of them; verified against real enforcement. |
| `v1.5.3` | Public-surface hygiene; npm publish-on-tag wiring with Sigstore/OIDC provenance, flag-gated and deferred. |
| **`v1.5.4`** | The derived-read client surface — `doFresh` / `isRecomputing` handle the substrate's honest recompute-in-progress reply with backoff, never returning a stale value. The client-side groundwork the [v3.10 scoring loop](/v3.10/scoring-loop) direction builds on. |

::: info Distribution
cklib ships as an attested OCI bundle (`ghcr.io/conceptkernel/ck-lib-js`). The npm publish path is wired with provenance and gated on a repository flag; it is deferred until npm authentication lands.
:::

## The engine and the fleet

- **[pgRDF](https://github.com/styk-tv/pgRDF)** `v0.6.19` — the RDF/SPARQL/SHACL/OWL-RL substrate, proven by an 8.2-billion-triple Wikidata load in a single instance.
- **[sporaxis](https://github.com/sporaxis-com/sporaxis)** `v0.0.5` — the ontology-first OCI bundle assembler.
- **[oci-germination](https://github.com/sporaxis-com/oci-germination)** ck-allinone `v0.7.28` — the runnable bundle that composes PostgreSQL 17 + pgRDF 0.6.19 + pgCK 0.4.21 + NATS + cklib into one ~128 MB image, and the [hello-kernel](https://github.com/sporaxis-com/oci-germination/tree/main/examples/hello-kernel) example.

See the [ecosystem page](/v3.9/ecosystem) for the current fleet and roles.
