---
title: "Introduction to CKP v3.11"
description: "Where Declaring Becomes Binding — the Concept Kernel Protocol v3.11: a self-contained, digest-established root ontology whose every constraint is one the engine is measured to enforce."
---

# Introduction to CKP v3.11

A Concept Kernel is a self-governing unit of meaning. It declares what may be true of it — its types, its predicates, its shapes, its affordances — and the substrate carries that declaration as an obligation at the moment of writing. **v3.11 is the version where a constraint stops being a sentence.** A shape in the v3.11 root is not a description that machinery elsewhere might honour; it is a gate, authored under rules that admit only what the gating engine is measured to enforce.

The thesis in one line:

> **You do not enforce your own shape. You declare it, and the ground refuses what violates it.**

v3.11 builds directly on [v3.9.1 — Critical Isolation](/v3.9/introduction), which remains the shipped runtime: one typed door, a closed verb vocabulary, every fact sealed and proof-chained, the engine invisible behind a role floor the database itself enforces. v3.11 supplies the other half of that architecture: **a root ontology that can only claim what the gate actually does.**

## The root

The protocol's operating definition lives in one self-contained file:

```
https://conceptkernel.org/ontology/v3.11/core#
```

**948 triples · 27 classes · 27 shapes · 80 properties**, published with a sha256 sidecar. Every `ckp:` term the root references, the root declares; `owl:priorVersion` records lineage to v3.9 without importing it. A substrate adopts the root by sealing an Adoption that names its digest — proximity is never adoption — and the surface in force is **established by digest**: a validator reports conformance against whatever shapes graph it holds, including an empty one, so the digest of what is loaded is checked directly, and a conformant report is read as a report, never as proof of enforcement.

Browse the vocabulary at [the ontology page](/ontology/v3.11/), or read [core.ttl](https://conceptkernel.org/ontology/v3.11/core.ttl) directly — the authoring rules are in its header, and the file governs itself: the shapes in its final section gate the root's own constructs.

## The three authoring rules

Every rule was earned by measurement before it was written down.

**1 — Measured enforcement.** Every constraint uses a component the gating engine is measured to enforce: `minCount · maxCount · datatype · nodeKind · in · pattern · minLength · disjoint · hasValue · qualifiedValueShape+qualifiedMinCount · class · closed`. A component outside that set is a candidate path by another name — it reads as protection and protects nothing.

**2 — Classes are never property subjects.** No class IRI appears as the subject of a triple whose predicate carries an `rdfs:domain` — RDFS entailment would pull the class into the domain, the shape targeting that class would then target the ontology's own declarations, and the ontology would fail itself. Where a property legitimately serves two classes, it carries no domain and says so.

**3 — Body locality.** A constraint reads only what the candidate body carries, plus the parent closure the substrate stamps onto the candidate itself. The gate composes two graphs:

```
shapes graph  ←  core shapes + kernel shapes + generated admitted-set shape
data graph    ←  the candidate body + its stamped parent closure
```

A shape may target a superclass — the stamp supplies the parent type on the candidate. A shape may not reach a node the candidate merely references: that node's types are not composed, and a constraint depending on them refuses conformant work.

[Declaring Becomes Binding](/v3.11/declaring-becomes-binding) walks through each rule and its consequences.
[The Anatomy of a Kernel](/v3.11/anatomy) maps the root's 27 classes onto the six clusters they form, and
[Processes](/v3.11/processes) walks the sequences that move through them.

## Declared gaps — honesty as a construct

Body locality places one property beyond the instance gate: that a *referenced* node is of the kind the reference intends — a kernel bearing one organ of each kind, a grant targeting an organ, a membership holding a role. These are checkable — by a store-level query over sealed rows, run as a governed verification — and the root states every range so the check is expressible. What the root refuses to do is carry a constraint that reads as enforcement and refuses valid writes. That is **G-1, the declared gap**: stated, reasoned, and owned, so silence is never mistaken for coverage. A gap carrying a reason is declarable; a silent one is not.

## The kernel: three organs, formally grounded

Every kernel carries three organs, and in v3.11 the model is stated in the root with formal (BFO) grounding rather than described alongside it:

| Organ | What it is | Write authority (gated) |
|---|---|---|
| **CK** | the kernel's meaning — declared types, predicates, shapes, affordances | `governed-only` |
| **TOOL** | the capability rebuilt from meaning at each epoch — a disposition, realized in a Run | `readonly-on-ontology` |
| **DATA** | the sealed instances of the kernel's work | `readwrite` |

*A kernel self-governs a shape (CK) so a tool (TOOL) can produce instances of it (DATA).* The separation is enforced in the shapes: organ kind and write authority are `sh:hasValue`-gated, so a CK organ claiming `readwrite` is **refused at the gate**. The dependency order is counted — CK depends on nothing, TOOL on exactly its one CK, DATA on exactly both — in the organ's own body, where it is readable.

A **Run** is the process that realizes the TOOL organ's disposition: sealed at spawn rather than at completion, carrying its state through `spawned · running · completed · failed · abandoned` — because a run recorded only on success is invisible precisely when it matters.

## The instance chain

Every sealed instance carries, stamped by the substrate at seal:

- `producedBy` — the kernel that processed it into being
- `createdBy` — the participant whose **verified** connection sealed it, server-derived, returned unconditionally
- `sealedAtEpoch` — the producing kernel's epoch at seal
- `conformsToShape` — the shape it was gated against

All four are required by the root's `InstanceShape`. An instance that cannot say who made it, under which shape, at which epoch, is not provable work — and with `conformsToShape` and `sealedAtEpoch` together, the output contract is checkable after the fact: the gating shape resolves at the version it held when the seal ran. Retraction is first-class: a **Supersession** seals a withdrawal without mutating the original, so what holds now is resolvable by query.

## Epochs and materialization

An **Epoch** is a resource: it carries the ordinal that orders it and the sha256 digest of the enforcement surface it names. A **Materialization** is the completed derivation of an epoch's action set from that epoch's own meaning — gated by the materialization shape as declared at the prior epoch, so the engine that advances meaning is subject to the same gate as everything meaning produces. A completed materialization names its surface and produces its epoch, and is refused if it claims neither.

A derivation that does not complete seals as a **FailedMaterialization** — a sibling of Materialization, not a subtype. It is required to carry a reason, and refused a surface, an epoch, and an advance. Failure is a recorded, queryable outcome; the epoch does not move.

## Identity and authority

The root carries a complete, traversable identity chain:

```
Participant —(memberIs)— Membership —(holdsRole)— Role —(grant)— Grant —(permTarget)— Organ
                              |(memberOf)
                              ▼
                           Project
```

Every hop is a gated, IRI-valued edge, which is what makes authority a **traversal over sealed facts** rather than a claim. A `Participant` is a person or a process — which one is a fact the ledger carries. An `Agent` is tooling acting for a participant, distinct by design: `onBehalfOf` and a sealed `Delegation` record who acted for whom, so a participant acting through an agent and one acting directly are distinguishable forever. Roles resolve to grants; a role granting nothing confers nothing, and the shape enforces it.

## Modules and adoption

A **Module** is a versioned, digest-named vocabulary unit. It is loaded because a sealed **Adoption** names its digest — attributed, digest-fixed, epoch-pinned. Adoption is also the unit of sharing between projects, and it gates the type system itself: the admitted type set is a **generated shape**, rebuilt each epoch from the declared types of adopted modules, closed over `rdf:type`. Fail-closed lives in the validator, in one place, as a shape — never as a procedural lookup beside it.

## Where v3.11 stands

The root ontology is published, digest-pinned, and self-governing — and it is in force: [v3.12](/v3.12/introduction) carries this root verbatim, binds its namespace, and is the law the current runtime enforces. Every `ckp:` IRI on this page is the IRI a v3.12 kernel writes.

## Where to go next

- The thesis and its consequences: [Declaring Becomes Binding](/v3.11/declaring-becomes-binding)
- The published vocabulary: [the root ontology](/ontology/v3.11/) · [core.ttl](https://conceptkernel.org/ontology/v3.11/core.ttl)
- The shipped runtime this builds on: [v3.9.1 — Critical Isolation](/v3.9/introduction)
