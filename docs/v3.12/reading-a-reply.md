---
title: "Stamps & Refusals"
description: "How to read what a concept kernel answers in CKP v3.12: the five server-derived stamps reported one by one, the completeness verdict on every read, and the typed refusal — a registered code, its sqlstate and what it teaches."
---

# Stamps & Refusals

Every answer a kernel gives is evidence, and evidence is read one mechanism at a time. A kernel never folds its answer into a single green tick: it reports **who** sealed a fact, **whose law** governed it, **which version** of that law was in force and **which rule** judged it — separately, because each can fail on its own, and a reader who sees only "ok" cannot tell which one did.

## Five kinds of reply

| Reply | Recognised by | Read it as |
|---|---|---|
| **Sealed result** | `ok: true` with an `id`, `verified`, `proof_digest` and the stamps | a fact that passed its gate and joined the hash chain |
| **Read** | `ok: true` with rows and a `completeness` object | an answer, plus how much of the answer it is |
| **Refusal** | `ok: false, refused: true` with a registered `error` code and `sqlstate` | the law, or the code path, said no — and named why |
| **Delegation** | `ok: false, delegate: true`, sqlstate `0A000` | the verb is served at another tier; the declared topics carry the call |
| **Fault** | `ok: false` with no `refused` flag | something broke. A fault is never a verdict |

## The stamps

The substrate stamps every sealed instance. None of these values comes from the caller: each is derived on the server, and **any of them placed in a payload is stripped before the seal**.

| Stamp | Answers | Derived from | Absent means |
|---|---|---|---|
| `ckp:createdBy` | who sealed this version of it | the connection's verified identity | — required on every instance. An update re-seals, so it names whoever sealed the current version |
| `ckp:producedBy` | whose law governs it | the kernel the act was addressed to | — required; a session that names no kernel cannot seal |
| `ckp:sealedAtEpoch` | against which version of that law | the kernel's position at seal time | — required |
| `ckp:conformsToShape` | under which shape it was gated | the shape the gate selected for the body | — required by the root; a reply withholds the key rather than faking it |
| `ckp:onBehalfOf` | for whom an agent acted | the trusted ingress, beside `createdBy` | the participant acted **directly** — never "unknown" |

All five ride the sealed body; a seal reply echoes the first four as top-level keys. Read them individually:

```json
{
  "ok": true,
  "id": "project-1788…",
  "type": "https://conceptkernel.org/ontology/v3.11/core#Project",
  "verified": true,
  "proof_digest": "9202c6…",
  "createdBy": "urn:ckp:participant:…",
  "producedBy": "urn:ckp:orders/kernel/ck",
  "sealedAtEpoch": 3,
  "conformsToShape": "https://conceptkernel.org/ontology/v3.11/core#ProjectShape"
}
```

::: warning `verified: true` is the hash chain
`verified` reports that the fact's ledger entry chains correctly — HMAC over the previous head. It says nothing about conformance. Which shape judged the fact is a separate stamp, `conformsToShape`. A body that no shape selected can be admitted, ledgered and proof-digested while judged by nothing — so read both, every time.
:::

**`ownedBy` is not a stamp.** It is a declared property of a project — the party who owns it. On a germinated kernel's project the substrate writes it from the verified connection; on a project you create, it is domain data you designate. Either way, once sealed, **nobody can patch it** — see [Ownership & Authority](/v3.12/authority).

## Reads carry their completeness

A row count without its completeness is not a count. Listing, query and traversal replies carry one verdict, computed on the server:

```json
"completeness": { "returned": 50, "limit": 50, "verdict": "possibly_truncated" }
```

| Verdict | Means |
|---|---|
| `complete` | the total is known and every row came back |
| `truncated` | the total is known and the answer is short of it |
| `possibly_truncated` | only a limit is known, and the answer filled it |

An empty read is an answer. A refused read is a refusal. The two are never interchangeable.

## Refusals are results

A refusal is the kernel's law, or its code path, speaking. It always arrives as a typed result — never as silence, an empty array, a `null` or a dropped connection:

```json
{
  "ok": false,
  "refused": true,
  "error": "ownership_not_patchable",
  "sqlstate": "42501",
  "key": "https://conceptkernel.org/ontology/v3.11/core#ownedBy",
  "hint": "ckp:ownedBy is server-derived at germination and no transfer verb exists — …"
}
```

- **`error`** is a code from a **closed registry**. Every refusal the substrate constructs carries a registered code.
- **`sqlstate`** is the code's typed class, so a caller branches on *why* without parsing prose.
- **`hint`** teaches the cure. Where the refusal site carries no hint of its own, the registry's teaching is attached.
- Context keys — the offending `key`, `value`, a `floor`, the `module` — name exactly what was refused.

The registry is itself learnable through the door. `surface.refusals` returns every code with its sqlstate, what it teaches and its **plane** — `declared` (the law refused: a shape, an undeclared term) or `procedural` (the code path refused: a missing argument, a privilege, a lifecycle state), left empty where the classification is genuinely mixed. A `registryDigest` over the ordered code set lets a client cache the registry and re-read it only when it moves.

| sqlstate class | Typically means |
|---|---|
| `42501` | not permitted — owner gates, role narrowing, unpatchable ownership |
| `22023` · `22004` | an invalid or missing value |
| `42704` | an undefined object — an unknown kernel, type or module |
| `55000` | an object not in the prerequisite state — a module not adopted, a policy that did not apply |
| `2BP01` | a dependent object blocks the act |
| `0A000` | not served at this tier — a delegated verb |
| `XX…` | **a fault**, never a refusal |

**The classification rule:** an `ok: false` reply carrying `refused: true` and a registered code is a refusal; anything in class `XX`, or without the flag, is fault-shaped. A client never degrades a refusal into anything else, and never retries one as though it were a fault.

## A validation report is the gate's own answer

`instance.validate` runs the full SHACL gate on an exact body and seals nothing. Its reply is the W3C validation report, verbatim: `conforms`, and every violation with its focus node, path, constraint component and message. A procedural refusal of the same call carries no `violations` array — so "the shape said no" and "the call could not be judged" stay distinguishable. See [Know Before You Act](/v3.12/know-before-you-act).

## Status in this release

| Mechanism | Law | Gate | Runtime (pgCK 0.4.112) | Proven by |
|---|---|---|---|---|
| Four stamps required on every instance | `InstanceShape` | ✅ | ✅ echoed in seal replies | [s4 seal](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s4_seal_ok.sql) · [s6 SHACL gate](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s6_seal_shacl_gate.sql) |
| Stamps stripped from payloads | — | ✅ | ✅ all five | [s87](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s87_agents_and_roles.sql) · [tdd01](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/tdd/tdd01_obligations.sql) |
| `onBehalfOf` stamped at seal | `ckp:onBehalfOf` | ✅ | ✅ at seal; **the wire ingress does not yet set it** — seals over `/wss` carry none in this release | [s87](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s87_agents_and_roles.sql) |
| Completeness verdict on reads | — | — | ✅ listings, query, reach | no dedicated gate in this release |
| Every refusal site typed; registry learnable | — | ✅ | ✅ `surface.refusals` | [s86 typed refusals](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s86_typed_refusals.sql) |
| Validation report verbatim | — | ✅ | ✅ `instance.validate` | [s18 validate report](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s18_ci_b3_validate_report.sql) · [s46](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s46_validation_report.sql) |
