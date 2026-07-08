---
title: "Introduction to CKP v3.9.1"
description: "Sovereign, semantic, self-governing state reached through one typed door — the Concept Kernel Protocol v3.9.1, Critical Isolation, running today as the ck-allinone bundle."
---

# Introduction to CKP v3.9.1

<div class="ck-cta">
  <a class="ck-cta-btn" href="/v3.9/install">⬇&nbsp; Download &amp; run</a>
  <a class="ck-cta-alt" href="https://github.com/sporaxis-com/oci-germination/releases">GitHub releases</a>
  <span class="ck-cta-note">one <code>docker run</code> · ~128&nbsp;MB · Docker only</span>
</div>

<style>
.ck-cta{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;margin:1.1rem 0 1.6rem}
.ck-cta-btn{display:inline-block;background:var(--vp-c-brand-1);color:var(--vp-c-white)!important;font-weight:600;padding:.5rem 1.15rem;border-radius:8px;text-decoration:none;transition:background .2s;white-space:nowrap}
.ck-cta-btn:hover{background:var(--vp-c-brand-2)}
.ck-cta-alt{display:inline-block;border:1px solid var(--vp-c-divider);color:var(--vp-c-text-1)!important;padding:.5rem 1rem;border-radius:8px;text-decoration:none;transition:border-color .2s;white-space:nowrap}
.ck-cta-alt:hover{border-color:var(--vp-c-brand-1)}
.ck-cta-note{font-size:.8rem;color:var(--vp-c-text-2)}
.ck-cta-note code{font-size:.78rem}
</style>

A Concept Kernel is a self-governing unit of meaning. Its types are ontology — RDF classes, SHACL shapes, OWL-RL rules, not hand-rolled columns. Every change it makes is **shape-gated, sealed, and proof-chained** the moment it lands, and it answers the world through a single typed verb carried over NATS-WSS. Meaning is the schema; the door is the whole surface.

It runs inside PostgreSQL, but the engine stays out of sight: no REST endpoint, no SQL handle, no query surface is exposed. The meaning is sovereign, every step it has taken is provable, and the only thing that crosses the boundary is one verb and its typed payload. This is **CKP v3.9.1 — Critical Isolation**: the engine stays invisible, the meaning stays sovereign, and the proof chain stays whole.

It is shipped, attested, and runnable today. The whole substrate is one image — [`ck-allinone`](/v3.9/quickstart) `v0.7.28` — composing PostgreSQL 17, the [pgRDF](https://github.com/styk-tv/pgRDF) graph engine `v0.6.19`, the [pgCK](https://github.com/styk-tv/pgCK) runtime `v0.4.21`, NATS, and the [cklib](https://github.com/ConceptKernel/CK.Lib.Js) client `v1.5.4` into a ~128 MB container. One `docker run` and the door is open.

## The claim, in one paragraph

An app — a browser, an agent, a service — reaches a kernel through exactly one function: [`ckp.dispatch`](/v3.9/the-door). It names a [verb from a closed set](/v3.9/affordances) and hands it a typed payload. The runtime validates the payload against the kernel's [declared shape](/v3.9/shapes), and if it conforms the fact **seals** — validate → seal → HMAC-chained ledger → verifiable proof, in [one transaction](/v3.9/seal-and-proof). A kernel changes its *own* types by [consensus](/v3.9/governance) — propose → vote → apply — and each applied change advances the kernel's epoch. No REST endpoint, no SQL handle, no query engine is ever exposed. The door is the whole surface.

## The distinction it all rests on

The single design choice underneath everything is this: an app reaches a kernel through **a verb, not a query surface**.

A query surface — a SQL connection, a SPARQL endpoint, a resolver that builds arbitrary filters — lets the caller author logic the engine then runs. Its power is unbounded and unenumerable. A **verb** is the opposite: a finite, named, pre-declared operation with a typed payload the runtime knows before it runs. CKP exposes a closed vocabulary of verbs and **no** query surface. This is the precondition that makes access [enumerable](/v3.9/grants) and [shapes](/v3.9/shapes) unbypassable — the whole of [Critical Isolation](/v3.9/critical-isolation). Read [A Verb, Not a Query Surface](/v3.9/verb-vs-query-surface) first; the rest of the specification is its consequences.

## What a kernel holds

A [Concept Kernel](/v3.9/concept-kernel) is a named domain — a match, an experiment, a service, any bounded universe you open with `kernel.create`. Inside it you land sealed instances:

- **Tasks** — governed, sealed work-or-state objects that target a kernel: a lifecycle, a priority, a queue position, each a proof-chained seal.
- **Goals** — the objectives and backlogs a kernel works toward.

You read them back with typed reads — `instances.list`, `instance.get`, `instance.verify`, `instance.provenance` — each re-verifiable against its proof. And you evolve what a kernel's instances must carry through [governance](/v3.9/governance), not a migration: propose a change, seal it as data, apply it once its votes clear, and the kernel's epoch advances. That shape — kernels holding governed tasks and goals, evolvable by consensus — maps onto games, experiments, and software systems alike.

## What is live, and what is next

The published bundle gives you a **governed, sealed, consensus-evolvable substrate today**:

- ✅ **Kernels** — named domains created on the fly (`kernel.create`).
- ✅ **Tasks and Goals** — sealed, proof-chained instances targeting a kernel, with full typed reads and re-verifiable proofs.
- ✅ **Governance** — evolve a kernel's type through `propose → vote → apply`, consensus-gated and epoch-advancing; proposals and votes are themselves sealed instances.
- ✅ **The isolation floor** — the participant role can call `ckp.dispatch` and nothing else; every write passes the SHACL seal gate and mints a proof.
- 🔜 **First-class custom types** — modeling your own sealed type (a `Ship`, a `Sample`) with its own create verb and shape. `instance.create` today routes to Task and Goal; generic typed create is the next pgCK capability (CKP v3.9 §4).
- 🔜 **Per-user verified identity** — today the participant role authenticates with a shared password (treat a deployment as alpha-trust; the isolation floor is real, but identity is a shared secret). Verified-JWT identity with seal-time claim checking is an inherited upstream prerequisite (CKP v3.9 §10).

The [changelog](/v3.9/changelog) tracks each of these against the release that ships it.

## Where to go next

- New to the protocol: [A Verb, Not a Query Surface](/v3.9/verb-vs-query-surface) → [Critical Isolation](/v3.9/critical-isolation) → [What a Concept Kernel Is](/v3.9/concept-kernel).
- Want to run it: [Quickstart — one `docker run` to sealed state](/v3.9/quickstart).
- Building an app: [The Client: cklib](/v3.9/client) and [Naming](/v3.9/naming).
- The notation direction (χ, ρ, σ … the strands, the scoring loop): the in-design [v3.10 set](/v3.10/) — conceptual, not part of the shipped v3.9.1 surface.
