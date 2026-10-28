---
title: "Know Before You Act"
description: "The validation ladder of CKP v3.12: learn a kernel's contract without writing, judge the exact body without sealing, receive the same checks again at the act, and audit afterwards — every rung a verb, every verb calling the same internal the gate calls."
---

# Know Before You Act

Validation is cheap. A seal is forever. So a participant learns the law first, runs the exact body through the gate without sealing it, and only then acts — and the substrate repeats the same checks **at** the act and reports what it found beside the receipt. Learning by failing writes a wrong fact into a shared graph; learning by asking writes nothing.

Every rung of the ladder is a **verb** — a check that is not a verb is unreachable by the people who need it — and every checker calls **the same internal the gate calls**. A probe that re-implements the gate tests the probe.

```
  LEARN        surface.declared · surface.explain · surface.typecheck · surface.unshaped
    │          what may I write, what does it mean, is it admitted, is anything unjudged?
    ▼
  PRE          instance.validate — the full gate on the exact body, nothing sealed
    │          + for an Adoption: the reference checks against the store
    ▼
  ACT          instance.create · instance.update · kernel.propose_change …
    │          the same reference checks ride the receipt as warnings
    ▼
  AFTER        instance.verify · instance.provenance · adoption.check · fleet.adoptions
               surface.check · surface.grounding · integrity.check
```

## Learn — the contract, without writing

| Verb | Payload | Answers |
|---|---|---|
| `surface.declared` | `{ type }` | the property contract of a type in this kernel's composed surface — the names a body may carry |
| `surface.explain` | `{ type }` | the type's own prose — its class comment and every declared property with its comment, read from the same surface the gate judges |
| `surface.typecheck` | `{ type }` | **admitted?** **shaped?** via which graph, against which `surfaceDigest`, at which epoch |
| `surface.unshaped` | — | the classes this kernel's surface declares that no shape targets |
| `project.resolve` | `{ segment }` | which kernel a name denotes, and under which clause |

`surface.declared` lists property **names**. Cardinality, closed value sets, patterns and every other constraint component are learned the reliable way: by asking the gate about a candidate body (below). A property attached by `rdfs:domain` rather than by a targeting shape is law without appearing in that list.

::: warning Admitted is not judged
A type can be **admitted** — the kernel accepts instances of it — while **no shape targets it**. Such a body validates vacuously: `conforms: true`, judged by nothing. `surface.typecheck` reports both halves separately, and `surface.unshaped` lists every class in that state. Check before trusting a green report.
:::

## Pre — the gate, without the seal

`instance.validate` takes the exact body you intend to seal and runs **the full SHACL gate** on it against the kernel's composed surface. It seals nothing, mints nothing, and returns the W3C validation report verbatim:

```js
const report = await k.validate({
  type: 'https://conceptkernel.org/ontology/v3.11/core#Project',
  label: 'quarterly review',
  projectKind: 'shared',
});
// → { conforms: false, violations: [ { focusNode, resultPath, sourceConstraintComponent, resultMessage }, … ] }
```

The report is the shape gate's own verdict on that exact body, against the surface in force — the same gate the seal runs. The body is flat: the type's IRI under `type`, each property beside it. A procedural refusal — a missing argument, an unknown kernel — carries no `violations` array, so "the shape said no" and "the call could not be judged" never look alike.

### Adoptions get a second band

Adopting a module is the act most worth knowing about in advance, because its correctness depends on the **store** as well as the law. For a `ckp:Adoption` body, `instance.validate` adds the **reference checks** beside the SHACL report:

| Check | Asks |
|---|---|
| `sourceDigestMatch` | does the cited `sourceDigest` match the bytes the store actually loaded? |
| `sourceRecorded` | is a source digest recorded for that module at all? |
| `moduleResolves` | does the adopted module resolve to a graph that exists? |
| `targetHasGraphs` | does the receiving project hold graphs to compose into? |

The two bands are never folded. `conforms` stays **shape-only** — a body citing the wrong digest is perfectly well-shaped, so it is `conforms: true` with `sourceDigestMatch: false` beside it. A client that reads only `conforms` would adopt the wrong module; a client that reads both bands knows before it acts.

## At — the same checks, on the receipt

The act repeats what the pre-check measured. An `instance.create` of an Adoption returns its receipt with the same reference checks attached — a `reference` object and any `warnings` — so the record of the act carries what was known at the moment it happened. These checks **report**; the refusal itself belongs to the law and to the obligations a kernel has adopted. See [Governance](/v3.12/governance).

## After — audit what stands

| Verb | Answers |
|---|---|
| `instance.verify` | re-checks a fact's place in the hash chain, independently |
| `instance.provenance` | the full chain behind a fact |
| `adoption.check` | per adopted module: the cited digest against the loaded bytes, the pinned structural digest against today's, drift named |
| `fleet.adoptions` | the census of every sealed Adoption — including ones whose module or target project no longer resolves |
| `surface.check` | the surface in force against the digests its epoch sealed, plus the roster, per-kernel storage and the engine's identity triple — a read, never a gate; empty findings is a pass |
| `surface.grounding` | every graph in the kernel's world on each digest plane |
| `integrity.check` | the store-level audit of what body locality places beyond the instance gate (G-1) |
| `authority.mine` | your authority here, resolved by traversal over sealed facts — an empty chain reported as empty |

These answer with the same discipline as every other reply: a count carries its completeness verdict, and a finding names what was measured. See [Epochs, Digests & Proof](/v3.12/epochs-and-digests).

## The ladder, as a habit

1. **Declared** — `surface.declared` for the names, `surface.explain` for the meaning.
2. **Typecheck** — admitted *and* shaped, against the digest you expect.
3. **Validate** — the exact body; for an Adoption, read both bands.
4. **Act** — and read the receipt's stamps and warnings individually.
5. **Read back** — `instance.get`, `instance.verify`; for anything you will cite, `instance.provenance`.

A receipt is not proof. The read-back is what turns one into the other.

## Status in this release

| Mechanism | Law | Gate | Runtime (pgCK 0.4.112) | Proven by |
|---|---|---|---|---|
| Learn verbs — declared, explain, typecheck, unshaped, resolve | — | — | ✅ | [s61](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s61_undeclared_type_refused.sql) · [s63](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s63_kernel_resolution.sql) · [s75](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s75_required_properties_have_emitters.sql) |
| `instance.validate` — full report, nothing sealed | all shapes in the composed surface | ✅ | ✅ | [s4 validate](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s4_validate.sql) · [s18](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s18_ci_b3_validate_report.sql) |
| Adoption reference checks before the act (PRE) and on the receipt (AT) | `AdoptionShape` | reports, never gates | ✅ | [s91 adoption prevalidation](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s91_adoption_prevalidation.sql) |
| Census flags an orphaned module or target project | — | — | ✅ `fleet.adoptions` | [s90 adoption orphaned](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s90_adoption_orphaned.sql) |
| Post-hoc adoption audit with drift named | — | — | ✅ `adoption.check` | [s67](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s67_closed_shape_and_118.sql) · [s79](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s79_engine_surface_adopted.sql) |
| Surface health, roster, storage, engine identity in one read | — | — | ✅ `surface.check` | [s72 state is not health](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s72_state_is_not_health.sql) · [s83](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s83_identity_and_attribution.sql) |
| G-1 store-level audit | ranges declared in core | — | ✅ `integrity.check` | no dedicated gate in this release |
