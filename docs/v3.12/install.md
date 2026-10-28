---
title: "Install & Run"
description: "Run the CKP v3.12 runtime: the attested ociger-ck-allinone bundle (PostgreSQL 18 + pgRDF 0.6.34 + pgCK 0.4.112 + NATS + cklib), delivered closed — a realm's JWKS document at start, a verified identity on every connection, one door over WebSocket."
---

# Install & Run

The v3.12 runtime ships as one attested container, **`ociger-ck-allinone`**: PostgreSQL with the pgRDF graph engine and the pgCK kernel runtime, NATS behind a WebSocket door, and the cklib client served from that same door. One `docker run`, no build — and every connection it admits carries a verified identity.

## The release pairing

Measured from the bundle's attestation-gated release record:

| layer | version |
|---|---|
| bundle | **`ghcr.io/sporaxis-com/ociger-ck-allinone:v0.7.45`** |
| index digest | `sha256:9d18e2b0d6ae1646f22582dbdd25e8e5c1cd9e99862b741e7a6d04f73092707d` |
| base image | `ociger-pg18-pgrdf-pgck-nats-micro` v0.2.13 |
| PostgreSQL | 18.6 (Debian trixie, glibc 2.41) |
| pgRDF | 0.6.34 — the RDF engine: SHACL, SPARQL, OWL-RL, the digest planes |
| pgCK | 0.4.112, `-nats` build — in-extension inbound dispatch, the NATS auth-callout responder, the outbox drain |
| NATS | 2.14.2 — core `4222`, WebSocket `9222` |
| cklib | 1.6.5, served at `/cklib/` |

Both architectures (`linux/amd64`, `linux/arm64`) are published under one index, with SLSA Build Provenance v1 attestations. Production deployments pin the **index digest**, never `latest`.

## The door ships closed

The image refuses unverified connections, and a bare `docker run` **does not boot** — closed with no realm means nothing could ever be verified, so the identity provisioner refuses before PostgreSQL starts and names the way out. You deliver a realm:

| variable | effect |
|---|---|
| `OCIGER_OIDC_ISSUER` | your realm's issuer |
| `OCIGER_OIDC_AUDIENCE` | a token whose `aud` does not carry this is refused |
| `OCIGER_OIDC_JWKS_FILE` | path to the JWKS **document** — preferred, and takes precedence |
| `OCIGER_OIDC_JWKS` | the document inline |
| `OCIGER_NATS_ACCOUNT_SEED` | an `SA…` seed that keeps the callout account stable across restarts (minted per boot otherwise) |
| `POSTGRES_PASSWORD` | the database superuser |
| `OCIGER_CK_PARTICIPANT_PASSWORD` | makes `ck_participant` a login role — set it before any external exposure |

Three rules hold for the realm:

- **The JWKS is a document, never a URL.** A URL is refused by name. Verification happens in memory against the document placed at container start; the live path makes no outbound request. Rotating keys means delivering a new document and restarting.
- **EdDSA (Ed25519) only.** The document must carry at least one Ed25519 key. A realm that signs only with RSA cannot ground this bundle and is refused at boot, rather than every token failing later at admission.
- **The boot log states the posture.** One block names the expected audience and the usable key count with their `kid`s, so a mismatch costs a `grep`, not a wire probe.

Boot refusals are deliberate and name their clause: a closed image with no realm, and realm materials that do not resolve (including a JWKS with zero usable Ed25519 keys).

## Run it

```bash
docker run -d --name ck-allinone \
  -v "$PWD/ck-data:/var/lib/postgresql/data" \
  -e POSTGRES_PASSWORD=… \
  -e OCIGER_OIDC_ISSUER=<your realm issuer> \
  -e OCIGER_OIDC_AUDIENCE=<the audience your tokens carry> \
  -e OCIGER_OIDC_JWKS_FILE=/run/jwks.json \
  -v /path/to/realm-jwks.json:/run/jwks.json:ro \
  -e OCIGER_CK_PROJECT=<your-kernel> \
  -p 18000:8000 -p 19222:9222 \
  ghcr.io/sporaxis-com/ociger-ck-allinone@sha256:9d18e2b0d6ae1646f22582dbdd25e8e5c1cd9e99862b741e7a6d04f73092707d
```

On a fresh volume the image is ready to use: extensions are created, the kernel's module Adoptions are sealed, and the in-extension relay is wired on first boot. No consumer SQL.

### A self-issued realm

A solo operator is a realm of one, not an exception to the rule. The contract is the same as any identity provider's:

1. **A key you hold** — an Ed25519 key pair.
2. **Its public half as a JWKS document** — an `OKP` key on curve `Ed25519`, `alg: "EdDSA"`, with a `kid`:

   ```json
   { "keys": [ { "kty": "OKP", "crv": "Ed25519", "alg": "EdDSA",
                 "kid": "my-key-1", "x": "<base64url public key>" } ] }
   ```

3. **Tokens you sign with it** — EdDSA JWTs whose `iss` equals `OCIGER_OIDC_ISSUER`, whose `aud` carries `OCIGER_OIDC_AUDIENCE`, with an expiry and a `sub` naming the participant.

The verified `sub` becomes the identity the broker enforces on the connection and the substrate stamps into `ckp:createdBy` on every fact that connection seals. A client never asserts who it is; the door derives it.

## Kernel and roster

| variable | effect |
|---|---|
| `OCIGER_CK_PROJECT` | the kernel this door seals into — always first on the roster. One canonical segment: lowercase, dashes optional (`^[a-z0-9]+(-[a-z0-9]+)*$`) |
| `OCIGER_CK_KERNELS` | further kernels to roster. **Routing, not existence** — a rostered name still has to germinate |

The auth-callout builds each connection's publish grants from the roster, minted **per connection**. The effective roster is the configured list **unioned with every sealed `ckp:Kernel`**, refreshed every few seconds — so a kernel germinated through the door is reachable by the next connection with no configuration edit and no restart. Germination is existence; see [Germination & Naming](/v3.12/germination).

## Ports

| port | plane | publish it? |
|---|---|---|
| `8000` | the deployment's app at `/` and the client at `/cklib/` — static files only (GET/HEAD) | **yes** — consumer plane |
| `9222` | WebSocket → NATS: the data plane | **yes** — consumer plane |
| `5432` | PostgreSQL | operator plane — map it explicitly when you need it |
| `4222` | NATS core | operator plane — map it explicitly when you need it |

All kernel data flows over the WebSocket. Behind a TLS gateway, route `/wss` to `9222` and `/` with `/cklib/` to `8000` on one origin; the client's default endpoint is then `wss://<host>/wss` and needs no configuration. See [The Door](/v3.12/the-door).

## Connect a client

The door serves its own client, version-affine with the substrate behind it:

```js
import { CK } from '/cklib/ck.js';                    // served by the door, same origin

const k = await CK.activate('<your-kernel>', {
  wssEndpoint: 'ws://127.0.0.1:19222',                // direct run; omit behind a TLS gateway
  tokenProvider: async () => getToken(),              // your realm's EdDSA JWT, forwarded at CONNECT
});
```

`tokenProvider` is called by cklib when it connects; the token rides the NATS `CONNECT` frame, the broker's auth-callout verifies it in pgCK, and the verified subject scopes everything the connection may publish. From here, [Know Before You Act](/v3.12/know-before-you-act) walks the ladder every write climbs.

## Confirm what you are running

Three checks, each answerable without trusting the operator:

1. **The artifact.** Verify the build attestation — exit 0 means this digest was built by the publishing repository's CI from a specific commit:

   ```bash
   gh attestation verify oci://ghcr.io/sporaxis-com/ociger-ck-allinone:v0.7.45 \
     --repo sporaxis-com/oci-germination
   ```

2. **The engine.** `surface.check` carries `engineIdentity` — the loaded library's version, its build identifier and the catalog's extension version, with an agreement verdict:

   ```js
   const { engineIdentity, state } = await k.surface.check();
   ```

3. **The law.** `surface.check` and `surface.grounding` report the surface the kernel is judged against, with its digests on named planes. Compare the published root against its sidecar:

   ```sh
   curl -sO https://conceptkernel.org/ontology/v3.12/core.ttl
   curl -sO https://conceptkernel.org/ontology/v3.12/core.ttl.wave-3.12-pass-3.sha256
   shasum -a 256 -c core.ttl.wave-3.12-pass-3.sha256
   ```

   A law digest is a per-deployment declaration. A door pinned to a published artifact boots that artifact's law; read it from the door rather than assuming it. [Epochs, Digests & Proof](/v3.12/epochs-and-digests) explains each plane.

## The extension alone

Operators composing their own image consume pgCK as an attested OCI artifact — the extension files only, not a runnable image:

```bash
gh attestation verify oci://ghcr.io/styk-tv/pgck:0.4.112-pg18-amd64 --repo styk-tv/pgCK
oras pull ghcr.io/styk-tv/pgck:0.4.112-pg18-amd64      # or -arm64
#   lib/pgck.so · share/extension/pgck.control · share/extension/pgck--0.4.112.sql
```

The files install onto PostgreSQL 18 on a glibc ≥ 2.38 base (Debian trixie or Ubuntu noble) beside pgRDF 0.6.34, with both libraries in `shared_preload_libraries`. `CREATE EXTENSION pgck CASCADE` installs the governed door from zero, the role floor intact: `ck_participant` holds `EXECUTE` on `ckp.dispatch` and nothing else. The bundle's own bootstrap is the reference for grounding the root and sealing the first Adoptions.

::: tip Direct SQL is an operator ritual, not a door
Installing, upgrading and gating an extension happen in SQL. Acts against a kernel do not: a fact sealed over a direct database session carries no verified requester, and that emptiness stays on the record. Anything that must belong to a person or a kernel goes through the WebSocket door, where the stamps are server-derived.
:::

## Where to go next

- The surface the client talks to: [The Door](/v3.12/the-door)
- What a reply carries and how a refusal reads: [Stamps & Refusals](/v3.12/reading-a-reply)
- Bringing a kernel into existence: [Germination & Naming](/v3.12/germination)
- What changed in this release: [Changelog](/v3.12/changelog)
