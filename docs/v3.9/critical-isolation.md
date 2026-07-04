---
title: "Critical Isolation"
description: "The three-ring architecture that makes the semantic engine unreachable while the meaning stays sovereign — the thesis of CKP v3.9.1."
---

# Critical Isolation

**Critical Isolation** is the thesis of CKP v3.9.1: a kernel's meaning is sovereign and provable *because* the engine that computes it is unreachable. A participant holds one capability — the ability to speak a [verb](/v3.9/verb-vs-query-surface) through one door — and from that single capability everything follows: sealed writes, re-verifiable proofs, governed evolution. Nothing else is exposed, and that absence is the guarantee.

## Three rings

A kernel is built as three concentric rings. Each ring is reachable only through the one outside it; the innermost is reachable by no one.

| Ring | What it is | Who can address it |
|------|-----------|--------------------|
| **Ring 2** | The named [affordances](/v3.9/affordances) — the closed verb vocabulary | Any participant holding a [grant](/v3.9/grants) for the verb |
| **Ring 1** | The frozen internal primitives — seal, ledger, proof, graph-apply | Only Ring 2 verbs, never a caller |
| **Ring 0** | The semantic engine — [pgRDF](https://github.com/styk-tv/pgRDF): SPARQL, SHACL, OWL-RL | No participant, role, or operator — a structural impossibility |

Ring 2 is the whole surface a caller sees: a finite set of verbs, each with a typed payload the engine knows before it runs. Ring 1 is the machinery those verbs invoke — the seal gate, the HMAC-chained ledger, the proof chain, the shape-mutation apply. Ring 0 is the RDF engine that actually stores and reasons.

The load-bearing fact is the third row: **Ring 0 is addressable by nothing**. There is no SPARQL endpoint, no SQL handle, no query surface that reaches it — not for a participant, not for an operator, not through any verb. A verb causes work in Ring 0 by naming a Ring 1 primitive that the engine already knows how to run. A caller never hands the engine a program. This is the meaning of [a verb, not a query surface](/v3.9/verb-vs-query-surface).

## The door and the role floor

The only opening in Ring 2 is one function: [`ckp.dispatch(verb, kernel_urn, payload, identity)`](/v3.9/the-door). Every browser, agent, and service reaches a kernel through exactly this four-tuple, carried over NATS-WSS. No REST endpoint, no SQL connection, no query engine is offered.

The isolation is enforced by the database's own role authority. A participant holds the role `ck_participant`, and that role holds **only** `EXECUTE` on `ckp.dispatch`. It cannot read a table, reach the `pgrdf.*` functions, or rewrite a shape. Storing a fact can never change the ontology; running a verb can never rewrite the rules. This is not a convention layered on top of the system — it is the grant set the database enforces on every connection.

::: info Enforced, not asserted
The role floor is a Postgres privilege, checked by the engine on every call. A participant cannot formulate a request for something it was not granted — the type system is the language, and the grammar rejects the sentence before it is spoken.
:::

## Why the isolation makes the guarantees real

Each of a kernel's guarantees is a consequence of the rings, not a feature bolted beside them.

- **Sealed by construction.** Because the only way in is a verb, every write passes the [seal gate](/v3.9/seal-and-proof): validate → seal → HMAC-chained ledger → verifiable proof, in one transaction. There is no side channel that writes without sealing.
- **Provable.** Every landing mints a proof anyone can re-verify and carries PROV-O provenance. Because no write bypasses the seal, the proof chain is whole.
- **Governed.** A kernel changes its own types only through the [governance plane](/v3.9/governance) — propose → vote → apply — because the only writes are verbs, and the type-changing verbs are the governance ones. The next write is always bound by the current sealed shape.
- **Grantable.** Access is a matrix of verbs over classes, which is enumerable precisely because the verb set is closed. An open engine would leave nothing to enumerate.

Take away the isolation — open a query surface into Ring 0 — and each of these falls at once: writes escape the seal, proofs develop holes, grants lose their meaning. The isolation is what the rest stands on.

## Sovereign meaning, invisible engine

The result is a kernel whose *meaning* is fully in the open — its types are [ontology](/v3.9/ontology), its every change is sealed and re-verifiable — while its *engine* is fully closed. A developer addresses meaning by [URN](/v3.9/naming) and speaks it through verbs; the database holds everything else and shows no seam a caller could reach through.

That is Critical Isolation: the engine stays invisible, the meaning stays sovereign, and the proof chain stays whole.

Continue with [the one door](/v3.9/the-door), or the distinction it rests on — [a verb, not a query surface](/v3.9/verb-vs-query-surface).
