---
title: "The Fleet"
description: "The public implementations of CKP v3.9.1 Critical Isolation — the runtime, client, substrate, composer, and runnable bundle, with their shipped versions and repositories."
---

# The Fleet

CKP v3.9.1 *Critical Isolation* is implemented by a small fleet of public projects. Each owns one role — the runtime, the client, the substrate, the composer, the bundle — and together they take an adopter from an empty database to sealed, governed, provable state over one door.

*Critical Isolation* names the property the fleet is built around: a participant holds exactly one capability, `ckp.dispatch`, and reaches meaning through it and nothing else. Every project below preserves that boundary — the runtime enforces it in the database's own role authority, and the client is shaped so a single governed dispatch is its only outbound atom.

## The implementations

| Project | Version | Role | Repository |
|---|---|---|---|
| **pgCK** | v0.4.21 | The Concept Kernel runtime — the governed door, seal, ledger, and NATS bridge, as a PostgreSQL extension. | [styk-tv/pgCK](https://github.com/styk-tv/pgCK) |
| **cklib** | v1.5.4 | The dispatch-only JavaScript client — a handle whose methods each map to one governed verb; the `ck-allinone` bundle pins and serves `1.5.3`. | [ConceptKernel/CK.Lib.Js](https://github.com/ConceptKernel/CK.Lib.Js) |
| **pgRDF** | v0.6.19 | The RDF substrate — RDF, SPARQL, SHACL, and OWL-RL as a native PostgreSQL extension. | [styk-tv/pgRDF](https://github.com/styk-tv/pgRDF) |
| **sporaxis** | v0.0.5 | The composer — an ontology-first OCI bundle assembler. | [sporaxis-com/sporaxis](https://github.com/sporaxis-com/sporaxis) |
| **oci-germination** `ck-allinone` | v0.7.28 | The runnable bundle and examples — including the [`hello-kernel`](https://github.com/sporaxis-com/oci-germination/tree/main/examples/hello-kernel) walkthrough. | [sporaxis-com/oci-germination](https://github.com/sporaxis-com/oci-germination) |

## How the roles compose

**pgCK** is the runtime an adopter integrates against. It exposes exactly one capability — `ckp.dispatch(verb, kernel_urn, payload, identity)` — over NATS-WSS, and behind that door it validates, seals, ledgers, and proves every write. It runs on PostgreSQL 14 through 17 and ships as an attested OCI artifact (`ghcr.io/styk-tv/pgck`) built for both `amd64` and `arm64`, pulled with `oras`.

**cklib** is the JavaScript side of that door. It attaches to a kernel by name and returns a handle; the handle's only outbound atom is a governed dispatch. It is zero-dependency and air-gapped, and its live channel is the attested OCI bundle `ghcr.io/conceptkernel/ck-lib-js`, copied into a consumer image and byte-verified from its tag. See [the client](/v3.9/client) for the full surface and its verb map.

**pgRDF** is the semantic substrate pgCK composes: it holds the ontology and runs SHACL, SPARQL, and OWL-RL inside the same PostgreSQL transaction boundary, so a kernel's meaning and the authority that protects it commit together. pgRDF is proven at scale — a single instance has carried an 8.2-billion-triple Wikidata load.

**sporaxis** is the ontology-first composer that assembles OCI bundles from a declaration, turning a set of named artifacts into a by-digest bundle with an RDF bill of materials. It is the machinery that takes the attested pieces of the fleet and composes them into a single, pinned, reproducible artifact.

**oci-germination** publishes the runnable `ck-allinone` bundle and the worked examples. `ck-allinone` v0.7.28 composes pgRDF, pgCK, NATS, and cklib into one ~128 MB image — PostgreSQL 17, a scratch base, s6-overlay supervising every process, no Python — so a single `docker run` stands up the whole substrate. Its `hello-kernel` example is the canonical zero-to-sealed walkthrough — see the [quickstart](/v3.9/quickstart).

## Versioning convention

This site names the public repositories and the shipped versions of the fleet. Per-repo release detail — the exact per-arch digests, the attestation, and the change log for a given tag — lives in each repository's own `LATEST.md`, which is the CI-written source of truth for that project. The site states the version; the repo states the receipt.

## Built and attested

Every runtime and client release is CI-built and provenance-attested. pgCK and cklib each publish under SLSA build provenance, and the attestation is verified before the release is published — a tag is only current once `gh attestation verify` accepts its digest and the repository's `LATEST.md` advances to it.

```sh
gh attestation verify oci://ghcr.io/styk-tv/pgck:0.4.21-pg17-amd64 --repo styk-tv/pgCK              # exit 0
gh attestation verify oci://ghcr.io/conceptkernel/ck-lib-js:1.5.4 --repo ConceptKernel/CK.Lib.Js    # exit 0
```

A successful verify binds the published digest to the CI workflow run that built it, recorded in a public transparency log. That is what "attested" means here: the artifact you pull is the artifact CI built, provably. The runnable bundle inherits the same discipline — `oci-germination` composes attested pieces into the `ck-allinone` image, so an adopter running `hello-kernel` is running verified builds end to end.

## Continue

- [Quickstart: zero to sealed state](/v3.9/quickstart) — run the fleet end to end with Docker.
- [Changelog](/v3.9/changelog) — version history across the protocol and the fleet.
