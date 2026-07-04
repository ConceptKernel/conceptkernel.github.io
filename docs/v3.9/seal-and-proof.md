---
title: "Seal, Ledger, Proof"
description: "Every landing runs validate → seal → HMAC-chained ledger → verifiable proof in one transaction. The seal gate enforces full W3C SHACL Core, and every write is provable and re-verifiable by anyone."
---

# Seal, Ledger, Proof

Every write to a concept kernel runs one atomic sequence:

```
validate → seal → HMAC-chained ledger → verifiable proof
```

in a single transaction. A fact that satisfies its shape lands, seals, chains, and mints a proof — all or nothing. This is what *provable by construction* means.

## The seal is the gate

The **seal** validates the candidate body against the kernel's own SHACL shape and admits only what conforms. As of pgCK v0.4.17 the seal gate enforces full **W3C SHACL Core** — datatype, cardinality, node-kind, and pattern constraints — so what the `validate` verb predicts is exactly what the seal accepts: **validate ⟺ seal**.

A complete body lands:

```js
const ship = await k.create('urn:ckp:demo/type/Ship', {
  name: 'Endurance', crew_size: 28,
});
// → { ok: true, id, verified: true, proof_digest: '…' }
```

A body that misses a shape-required property is refused at the seal:

```js
await k.create('urn:ckp:demo/type/Ship', { name: 'Endurance' });
// crew_size is required by the Ship shape
// → { ok: false }
```

The reply is honest: `ok:true` carries an `id`, a `verified:true` flag, and a `proof_digest`; `ok:false` means the shape was violated and nothing landed. See [/v3.9/shapes](/v3.9/shapes) for the shape contract the seal reads.

## Validate predicts the seal

The `validate` verb runs the same W3C SHACL Core check the seal runs, without writing anything. It returns the full `ValidationReport` — every violation typed by path, constraint, and severity — so a participant can confirm a body before landing it:

```js
await k.validate({ type: 'urn:ckp:demo/type/Ship', name: 'Endurance' });
// → { conforms: false, violations: [{ path: '…/crew_size', message: '…', severity: 'Violation' }] }
```

Because validate and seal read the same shape, `conforms:true` guarantees the seal accepts and `conforms:false` names exactly what the seal would refuse. Validate is the dry run; the seal is the commit.

## The ledger: append-only, HMAC-chained

Each seal appends one `LedgerEntry` to the kernel's append-only ledger. Every entry carries:

- `about` — the IRI of the instance it records,
- `bodySha` — the SHA-256 of the sealed body,
- `sig` — an HMAC signature over the entry,
- `ts` — the seal timestamp,
- `prev` — a pointer to the previous entry.

The `prev →` links chain the entries: each entry's signature commits to the one before it, so the ledger is tamper-evident end to end. Any reorder, edit, or drop breaks the chain from that point forward.

## The proof: re-verifiable by anyone

Each seal also mints a `Proof` — an `hmac+sha256` digest bound to the instance's IRI and a verified-at timestamp. The proof is re-verifiable independently: the `verify` verb — one of the kernel's named [affordances](/v3.9/affordances) — recomputes the digest against the ledger and confirms the chain.

```js
await k.verify(ship.id);
// → { verified: true, proof_digest: '…' }
```

Anyone holding the door can re-run the verification. The proof depends only on the ledger and the shared method — a reader confirms it independently of the writer.

::: tip
`proof_digest` on the create reply and on the `verify` reply are the same value. A client can pin the digest at write time and re-check it at any later point.
:::

## Provenance on every write

Every sealed instance carries **W3C PROV-O** provenance — three mandatory facts:

- **activity** — the governed operation that produced the fact,
- **agent** — the participant that acted, derived from the connection's verified identity,
- **time** — when the fact was sealed.

The acting agent is resolved from the connection — see [/v3.9/the-door](/v3.9/the-door). The `provenance` verb returns the chain for an instance:

```js
await k.provenance(ship.id);
// → the activity / agent / time chain for this instance, with its proof
```

## Retire seals a retraction

Retiring an instance seals a new `retired:true` fact with a required reason. The ledger grows, the proof verifies, and the original facts remain in the chain forever. History is additive: every state a kernel has held stays provable.

## One transaction

Validate, seal, ledger, and proof share a single transaction boundary. A body that fails validation halts before the ledger; a ledger append that fails rolls the whole write back. Every landing is all-or-nothing. The kernel's meaning and the proof that guards it commit together — which is what lets many participants write concurrently and still converge on one governed, verifiable truth. This atomic boundary is the heart of [/v3.9/critical-isolation](/v3.9/critical-isolation).
