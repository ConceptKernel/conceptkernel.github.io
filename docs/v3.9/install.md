---
title: "Install & Run"
description: "Run the whole CKP v3.9.1 substrate with one docker run — the attested ck-allinone image, its SLSA provenance, what it composes, and the GitHub releases."
---

# Install & Run

The whole substrate is a single, attested image. One `docker run` stands up PostgreSQL 17, the pgRDF graph engine, the pgCK runtime, NATS, and the browser client — about 128 MB, scratch base, no Python. The only prerequisite is Docker.

## One `docker run`

```sh
docker run --rm -d --name ckp \
  -e OCIGER_CK_PARTICIPANT_PASSWORD='choose-a-password' \
  -p 5432:5432 -p 8000:8000 -p 4222:4222 -p 9222:9222 \
  ghcr.io/sporaxis-com/ociger-ck-allinone:v0.7.28
```

That single command gives you a complete **CKP v3.9.1 — Critical Isolation** substrate:

```
PostgreSQL 17  +  pgRDF (graph engine)  +  pgCK (concept-kernel runtime)
NATS core :4222  +  NATS WebSocket :9222   (the only door for apps)
busybox httpd :8000  serving /cklib/ (the browser client) + a landing probe
```

- **Set `OCIGER_CK_PARTICIPANT_PASSWORD`.** Without it the participant role exists but cannot log in, so the isolation floor is never cosmetic.
- **Open `http://localhost:8000/`** — the landing page runs a live round-trip in your browser and shows ✓ when the wire is alive.
- **Persist `/var/lib/postgresql/data`** with a volume to keep sealed data across restarts.

Then [drive it with cklib](/v3.9/quickstart) — activate a kernel, land a sealed task, verify its proof.

## The image is attested

The bundle publishes with SLSA Build Provenance v1. Pull it, then verify the provenance before you trust it:

```sh
docker pull ghcr.io/sporaxis-com/ociger-ck-allinone:v0.7.28

gh attestation verify \
  oci://ghcr.io/sporaxis-com/ociger-ck-allinone:v0.7.28 \
  --repo sporaxis-com/oci-germination
```

| | |
|---|---|
| **Image** | `ghcr.io/sporaxis-com/ociger-ck-allinone:v0.7.28` |
| **Digest** | `sha256:c652647fed8e433a4668b3cac590175ddbb65a1bf9472e04504ca19b0d9a1dfa` |
| **Provenance** | SLSA Build Provenance v1 — verified before publication |
| **Pull** | public, anonymous |

## What it composes

The image is a tested composition of the fleet, pinned to exact versions:

| Layer | Version |
|-------|---------|
| PostgreSQL | 17.10 (pgcrypto auto-installed on first boot) |
| [pgRDF](https://github.com/styk-tv/pgRDF) — the graph engine | 0.6.19 |
| [pgCK](https://github.com/styk-tv/pgCK) — the concept-kernel runtime | 0.4.21 |
| [cklib](https://github.com/ConceptKernel/CK.Lib.Js) — the client, served at `/cklib/` | 1.5.3 |
| NATS core / WebSocket | 2.14.2 (`:4222` / `:9222`) |

The protocol is **CKP v3.9.1**; the door is `ckp.dispatch(verb, kernel_urn, payload, identity)`.

## GitHub releases

Every release below is CI-built and provenance-attested, with a `LATEST.md` in each repository confirming the verified head.

- **The bundle** — [sporaxis-com/oci-germination releases](https://github.com/sporaxis-com/oci-germination/releases) (`ck-allinone`, the runnable image above)
- **The runtime** — [styk-tv/pgCK releases](https://github.com/styk-tv/pgCK/releases) (the PostgreSQL extension; also an `oras`-pullable OCI artifact)
- **The client** — [ConceptKernel/CK.Lib.Js releases](https://github.com/ConceptKernel/CK.Lib.Js/releases) (`cklib`, dispatch-only)
- **The engine** — [styk-tv/pgRDF releases](https://github.com/styk-tv/pgRDF/releases) (RDF/SPARQL/SHACL/OWL-RL)

## Behind a gateway

The bundle's NATS WebSocket is on `:9222`. On a direct `docker run` an app opens `ws://<host>:9222`. Behind a TLS gateway, route `/wss` → `:9222` and apps open `wss://<host>/wss`. The bundled landing page auto-detects which case it is from its own URL.

::: warning Alpha-trust today
Identity is currently the participant role's shared password, not a per-user verified claim. The isolation floor is real — the role can call `ckp.dispatch` and nothing else — but treat a deployment as alpha-trust and do not expose it to untrusted users as-is. Per-user verified-JWT identity is an inherited upstream prerequisite (CKP v3.9 §10).
:::

## Continue

- [Quickstart](/v3.9/quickstart) — drive the running substrate with cklib.
- [The client: cklib](/v3.9/client) — the handle and its verb map.
- [The fleet](/v3.9/ecosystem) — the runtime, client, engine, and bundle behind the image.
