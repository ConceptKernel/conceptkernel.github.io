---
title: "CKP v3.10 — Concept Kernel Notation"
description: "The CKN design direction — a compact notation for an ontology that is live and governed, sitting above RDF/OWL/SHACL."
---

::: warning IN DESIGN — v3.10
CKN (Concept Kernel Notation) is the design direction beyond the shipped v3.9.1 runtime. This page describes intent, not shipped behaviour. It is meant to be argued with. The current runtime is documented at [/v3.9/introduction](/v3.9/introduction).
:::

# Concept Kernel Notation (CKN)

CKN is a compact way to say what a Concept Kernel *is* and what to lay down inside it. It describes a unit of meaning as a fixed alphabet of strands, evaluated at an epoch, read as a single declaration:

```
CK(K) ≜ ⟪ χ · ρ · σ · α · γ · π · δ · φ ⟫ ε
```

Eight strands read left to right — the classes, the properties, the shapes, the affordances, the grants, the proof chain, the dispatch tuple, the plane function — and one epoch `ε` that subscripts the whole kernel and moves when meaning moves. That single line is the whole idea: a kernel is a typed set of concepts, the verbs that act on them, the grants that gate those verbs, the proof chain that attributes every act, and the epoch that versions all of it at once.

## A notation above RDF, not another serialization

CKN does not compete with Turtle. The schema stays RDF/OWL/SHACL — classes in OWL, constraints in SHACL, instances as resolved URNs. CKN is the layer *above* that schema. It names the operational strands an ontology needs to be **live and governed**: the affordances over the classes, the grants that gate them, the proof chain that attributes them, and the epoch that versions the whole thing.

An OWL file tells you what a class *is*. CKN tells you what the kernel *does* with instances of that class, who may do it, and how each act is sealed. It is notation for an ontology that acts, under consensus — not a static vocabulary, but a governed system with a fixed grammar of moves.

## Two planes, honestly separated

CKN compiles into two planes, and the design is deliberate about which is buildable now and which is gated on future runtime work.

| Plane | What it lays down | Status on the shipped v3.9.1 runtime |
|---|---|---|
| **Instance assembly** | Instances, properties, edges, and transitions over an *already-declared* kernel | Buildable today — compiles to existing governed dispatches |
| **Genome declaration** | New classes, shapes, affordances, or grants declared *from* notation | Governed (`propose → vote → apply`), gated on future runtime stages |

Instance assembly rides primitives the runtime already ships: create a typed instance, fill its properties, link an edge, drive a shape-gated transition — each one a sealed, proof-chained dispatch. Genome declaration is a different act. Declaring that a kernel now *has* a new class or affordance is a multi-party, consented change, so it compiles to governance, never to a direct write. Where that governance plane is not yet live, the compiler degrades honestly — it emits the governed verb and reports the substrate's answer, and it never falls back to a workaround.

## The user surface: notation in, construct out

The person writing CKN never names a message subject, a connection, a trace identifier, or a sequence number. They write notation and receive a construct. One call:

```javascript
const construct = await CKN.assemble(`
  CK( Panel.Session ) ≜ ⟪
    χ : Position(A), Position(B), Synthesis(S), Decision(D)
    ρ : A.holds = "ship Friday"   B.holds = "ship after review"
    edges : A —contradicts→ B,  S —resolves→ (A∥B),  D —sealed_as→ S
    τ : Session → 'decided'
  ⟫`);
```

The compiler lexes the sentence, parses it to a dispatch plan, and emits an ordered sequence of governed dispatches over the existing door. What comes back is the finished construct — its resolved URNs and its proof digest — every step shape-validated and sealed. The notation is sugar over consent.

## Where to go next

- **[Concept Kernel Notation](/v3.10/concept-kernel-notation)** — the nine-symbol alphabet in full, how each strand maps onto RDF/OWL/SHACL, and the epoch as the subscript on the whole kernel.
- **[Notation In, Construct Out](/v3.10/assembled-constructs)** — the `CKN.assemble` surface, the compiler pipeline, the two planes, the anti-goals the compiler holds, and a worked `Panel.Session` example.
- **[The Scoring Loop](/v3.10/scoring-loop)** — seal the gesture, derive the weight; the genotype/phenotype split; ε-materialisation and the three movers of staleness.

## A note on versions

"v3.10" is the CKN/CKP *generation* — it tracks the protocol design line beyond v3.9.1. It is **not** an npm or OCI package version. The client library and the substrate carry their own version axes, released on their own cadence. Keep the two axes distinct: a generation names a design direction; a package version names a shipped artifact.

CKN is an early draft, offered for pressure. If the *seal-the-gesture* split, the *notation-in-construct-out* surface, or the *epoch-as-subscript* staleness model resonate, this is meant to be improved by people who have lived these problems. The shipped runtime it builds on is documented at [/v3.9/introduction](/v3.9/introduction).
