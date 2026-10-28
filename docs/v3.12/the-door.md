---
title: "The Door"
description: "How a client reaches a concept kernel in CKP v3.12: one origin, three routes, a verified identity at CONNECT, a closed subject grammar, and replies published to everyone watching — over one capability and nothing else."
---

# The Door

A concept kernel has exactly one face. Every participant — a browser, an agent, a service, a command line — reaches it the same way, holds the same single capability, and is judged by the same law. The door does not ask what you are, only whether you can answer for what you say.

## One origin, three routes

A deployment serves a kernel from one origin:

| Route | Serves |
|---|---|
| `/wss` | WebSocket upgrade into NATS — **the one data plane**. Every act and every reply travels here. |
| `/cklib/` | The client — `ck.js`, `ck-client.js`, `ck-store.js`. Same origin as `/wss`, and version-affine with the substrate behind it: the deployment serves its own face. |
| `/` | The deployment's own application, optional. |

Every byte of kernel data flows over `/wss`. The door carries no REST path and no query surface, in either direction: a conformant client sends a bearer to its identity provider's token endpoint and nowhere else, and contains no data `fetch()`. The law a door enforces is confirmed over the wire — `surface.grounding` reports the digests of every graph in a kernel's world — and the published law itself lives at [conceptkernel.org/ontology](/ontology/v3.12/), where anyone can hash it.

## One capability: `ckp.dispatch`

Inside PostgreSQL, the substrate exposes one function:

```sql
ckp.dispatch(verb text, payload jsonb) RETURNS jsonb
```

It is **the substrate's one door**. The role a participant's acts run as holds `EXECUTE` on `ckp.dispatch` and nothing else — no table, no view, no engine function. That role floor is enforced by PostgreSQL itself, which is why no caller can author a query the engine runs, reach the graph store directly, or land a fact that skipped its gate.

Clients never call the function. The **relay** behind `/wss` — a background worker inside the extension — receives each act from the wire, binds the connection's verified identity, and calls `ckp.dispatch` on the participant's behalf. Two planes, kept distinct:

| Plane | What it is |
|---|---|
| the SQL function `ckp.dispatch(verb, payload)` | the substrate's one door, inside PostgreSQL |
| the wire | NATS over `/wss`, carrying the closed subject grammar below |

A client speaks the wire. The relay speaks SQL. Neither ever speaks the other's language.

## Identity is verified at CONNECT

Every connection presents a bearer token. The door verifies it **before** the connection is admitted: an EdDSA (Ed25519) JWT, checked in memory against a JWKS **document** the deployment provides at container start — a document, never a URL, so verification needs no network egress and cannot be redirected. A connection that presents no verifiable token is refused at CONNECT.

The verified subject then becomes part of the wire itself. The broker grants each connection permission to publish only under its own verified subject, so a client cannot speak as anyone else, and the relay stamps that subject onto every fact the participant seals as `createdBy`. Identity is never payload: a client does not claim who it is, and any stamp it places in a body is stripped before the seal.

A person, a bot and an agent differ only in whose key signed their token. The solo operator is a self-issued realm — their own key, their own JWKS document — and stands on the same floor as everyone else.

A conformant door runs with `pgck.admit_anonymous` off; the [all-in-one bundle](/v3.12/install) ships that way and refuses to boot without a realm. Admission grants reach, not authority: every kernel the door routes is reachable by every verified identity on it, and what an identity may do inside a kernel is decided by that kernel's law, its roles and its owner — see [Ownership & Authority](/v3.12/authority).

## The subject grammar is closed

| Direction | Subject | Carries |
|---|---|---|
| publish | `input.kernel.<gov>.id.<sub>.action.<verb>` | an act — the only publish form. `<sub>` is the connection's own verified subject |
| subscribe | `result.kernel.<kernel>.>` | replies |
| subscribe | `event.kernel.<kernel>.>` | sealed events |
| subscribe | `event.kernel.<kernel>.error` | the kernel's error channel |

Every `<kernel>` and `<gov>` segment is **one lowercase transport segment**, `^[a-z0-9]+(-[a-z0-9]+)*$`. The rule is law — `ckp:transportSegment`, gated by `ckp:KernelShape` — so a client learns it from `surface.declared` and a bad spelling is refused with the clause named. NATS matches subject tokens exactly, with no case folding: a name that differs only by case would be a second kernel nothing can seal into.

The publish set and the subscribe set are disjoint. `result.*` and `event.*` are the substrate's output, and only the substrate publishes there.

**Clients do not type subjects.** cklib selects by meaning — kind, type, verb, `mine`, `by` — and keeps subject strings out of the consumption path entirely, so a consumer cannot express a forged reply:

```js
import { CK } from '/cklib/ck.js';

const k = await CK.activate('orders', { tokenProvider: () => getToken() });

const r = await k.next({ kind: 'result', verb: 'instance.create' });
for await (const e of k.stream({ mine: false })) render(e);   // what others sealed
```

## Replies are published, not returned

A reply is **published to every subscriber of the kernel's result subjects**, not returned to the caller's private inbox. That is what makes several participants co-observe one working surface live — every party sees every sealed outcome as it happens, attributed — and it is why correlation is a contract:

1. Correlation ids are at least 128 bits.
2. A reply resolves a pending act only when the **id, the verb and the subject** all agree.
3. **A write is never retried automatically.** A timed-out act means the reply was lost, not that the write was: query, then decide.
4. A reply arriving after its act timed out is surfaced as a late signal carrying the original verb.
5. `by` on every frame is attributed by the server and passes through untouched; `mine` is a comparison of two server-attributed values, never an assertion.

## Routing follows existence

A kernel becomes addressable by being **germinated** — sealed as a `ckp:Kernel` through the door. The set of routable kernels is the deployment's configured roster joined with every sealed kernel's transport segment, refreshed within seconds: germination is existence, and it routes itself. The configured roster is bootstrap and override, and only ever adds. See [Germination & Naming](/v3.12/germination).

Address the name you mean. `project.resolve` answers which kernel a segment denotes, under which clause, and `kernels.list` answers which kernels exist — ask them before diagnosing the door.

## What the door excludes

| Excluded | Why |
|---|---|
| a REST or API data path | the door is the whole surface; a second path is a second law |
| an ontology mount on the door | the law is confirmed over the wire (`surface.grounding`) and published for hashing at conceptkernel.org |
| package-registry delivery of the client | the client is served by the door at `/cklib/`, or pinned by digest from the attested OCI bundle |
| failover on a refusal | a refusal reaches the caller verbatim — `refused`, `sqlstate`, clause. An empty array in place of a refusal is a lie about the refusal |
| defaults that carry wire meaning | a client never defaults a kernel id, a governance kernel, an identity or a path; a missing value throws locally, naming what was missing |

## Status in this release

| Mechanism | Law | Gate | Runtime (pgCK 0.4.112) | Proven by |
|---|---|---|---|---|
| One SQL door, role floor `EXECUTE ckp.dispatch` only | — | PostgreSQL grants | ✅ | [s11 role floor](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s11_ci_a4_role_floor.sql) · [s13 dispatch only](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s13_ci_a2_dispatch_only.sql) |
| In-extension relay behind `/wss` | — | — | ✅ `-nats` build | [s3 NATS round trip](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s3_nats_roundtrip.sh) |
| Verified identity at CONNECT, JWKS as a document | — | auth callout | ✅ `-nats` build | [s66 identity evidence](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s66_identity_evidence.sql) |
| `createdBy` and `by` from the verified connection; payload stamps stripped | `InstanceShape` | ✅ | ✅ | [s60 msg by](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s60_msg_by.sql) · [s87](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s87_agents_and_roles.sql) |
| One lowercase transport segment | `ckp:transportSegment` | `KernelShape` pattern | ✅ | [s74](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s74_germinate_stamps_segment.sql) · [s63](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s63_kernel_resolution.sql) |
| Germination routes itself (roster ∪ sealed kernels) | — | — | ✅ | no dedicated gate in this release |
| Published replies, semantic selection, correlation contract | — | — | ✅ cklib | [CK.Lib.Js tests](https://github.com/ConceptKernel/CK.Lib.Js/tree/main/tests) |
