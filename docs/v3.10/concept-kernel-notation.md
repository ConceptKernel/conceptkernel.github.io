---
title: "Concept Kernel Notation"
description: "The nine-symbol CKN alphabet — eight strands and an epoch — and how it names the live, governed operational layer above RDF/OWL/SHACL."
---

::: warning IN DESIGN — v3.10
CKN is the design direction beyond the shipped v3.9.1 runtime. This page describes intent, not shipped behaviour. It is meant to be argued with. The current runtime is documented at [/v3.9/introduction](/v3.9/introduction).
:::

# Concept Kernel Notation

A Concept Kernel is written as one declaration: a fixed alphabet of nine symbols — eight strands read left to right, and the epoch that subscripts them all.

```
CK(K) ≜ ⟪ χ · ρ · σ · α · γ · π · δ · φ ⟫ ε
```

Read it aloud: *kernel K is the classes, their properties, their shapes, the affordances over them, the grants that gate those affordances, the proof chain that seals every act, the dispatch tuple that carries each act, and the plane that routes it — all evaluated at epoch ε.* The strands are ordered as an ontology reads: what exists, what it looks like, what can happen, who may make it happen, and how each move is proven.

## The alphabet

| Glyph | Strand | Carries |
|---|---|---|
| **χ** | class chromosome | the classes — the typed concept set |
| **ρ** | property ribbon | the **raw** gestures and the **governed** constants, held apart |
| **σ** | shape strand | the SHACL shapes — the constraints the seal enforces |
| **α** | affordance alphabet | the verbs: `signal.cast`, `concept.score`, `instance.transition`, `kernel.{propose, vote, apply}` |
| **γ** | grant matrix | who may invoke which verb, on which class |
| **π** | proof chain | `HMAC(sha256) ∘ LedgerEntry(prev→)` — every act sealed, hash-linked |
| **δ** | dispatch tuple | the single call shape `⟨verb, urn, payload, identity⟩` |
| **φ** | plane function | `δ → { instance \| governance }` |
| **ε** | epoch | the subscript on the *whole kernel*; it moves when meaning moves |

Each glyph is a strand of the same molecule. Together they say everything an ontology needs in order to *do things* rather than merely *describe things*.

### χ · ρ · σ — the schema strands

The first three strands are the shape of the data, and they map directly onto RDF/OWL/SHACL. **χ** is the class chromosome — the OWL classes a kernel instantiates. **ρ** is the property ribbon — data properties (fields) and object properties (edges) — and it holds two kinds of value carefully apart: the **raw gestures** a participant records, and the **governed constants** a policy reads. That separation is load-bearing, and the [scoring loop](/v3.10/scoring-loop) is built on it. **σ** is the shape strand — the SHACL shapes the seal enforces at the boundary, so an instance that violates its contract never lands.

### α · γ — the operational strands

The next two strands are what CKN adds *above* the schema. **α** is the affordance alphabet: the fixed verb set. There is no open-ended API — a kernel offers a small, named grammar of moves. `signal.cast` records a gesture. `concept.score` derives a value. `instance.transition` drives a shape-gated state change. `kernel.{propose, vote, apply}` evolves the kernel's own rules under consensus. **γ** is the grant matrix — the rows that decide who may invoke which verb on which class. A participant's legal moves are the affordance rows intersected with their identity grants, so two participants can share one structure and each see a different, governed set of moves over it.

### π · δ · φ — the execution strands

The last three strands are how an act crosses the membrane and gets sealed. **δ** is the dispatch tuple `⟨verb, urn, payload, identity⟩` — the single atom that any action reduces to. There is one door; every move is a `δ` through it. **φ** is the plane function: it routes each dispatch to either the **instance** plane (laying down data over a declared kernel) or the **governance** plane (`propose → vote → apply`, changing the kernel's rules). **π** is the proof chain: `HMAC(sha256)` composed over a hash-linked `LedgerEntry(prev→)`, so every act is sealed, attributed, and re-verifiable — you can prove who did what, in what order, at any later time.

## Above RDF: the live, governed layer

CKN is not a serialization competing with Turtle. The schema stays RDF/OWL/SHACL. What CKN names is the operational layer that an ontology needs to become **live and governed**:

- the **affordances** (α) that act over the classes,
- the **grants** (γ) that gate who may act,
- the **proof chain** (π) that attributes every act,
- and the **epoch** (ε) that versions the whole thing.

An OWL ontology can say *a Position contradicts another Position*. CKN says *who may assert that edge, how the assertion is sealed and attributed, and under which epoch of the rules it holds*. It is the notation for an ontology that acts, under consensus.

## ε — the epoch subscripts the whole kernel

The epoch is written outside the brackets, subscripting `CK(K)` in full, because it is a property of the *kernel*, not of any one strand. It is the evaluation context — the generation of meaning under which every strand is read.

`ε` moves when meaning moves. Refine a class, change a governed constant in ρ, re-ground a term to a different URN — each is a governance act (`kernel.apply`) that advances the epoch. Because the epoch subscripts the whole kernel, advancing it re-frames *everything derived from the kernel at once*: nothing stays pinned to a superseded generation of the rules. This is the same idea the runtime already carries for versioned meaning at [/v3.9/epochs](/v3.9/epochs), lifted into notation as the subscript on the declaration.

## The declaration form

A kernel declaration names the strands it fills. A minimal instance-plane sentence over an already-declared `Panel.Session` kernel:

```
CK( Panel.Session ) ⟦instance⟧ ≜
  χ : Position(A), Position(B), Synthesis(S), Decision(D)
  ρ : A.holds = "ship Friday"        B.holds = "ship after review"
  edges :
      A —contradicts→ B                  ; the sealed conflict edge
      S —resolves→ (A∥B)                 ; the synthesis over both positions
      D —sealed_as→ S                    ; the decision seals the synthesis
  τ : Session → 'decided'                ; σ DecisionShape gates this transition
  π : verify(D)                          ; the decision is re-verifiable
```

Every line is a strand at work: `χ` names what exists, `ρ` fills its properties, `edges` populate the object-property ribbon, `τ` drives a shape-gated transition, and `π` makes the result provable. How that sentence becomes an ordered sequence of governed dispatches — and how the two planes are kept honestly apart — is the subject of [Notation In, Construct Out](/v3.10/assembled-constructs).
