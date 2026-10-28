---
title: "Declaring Becomes Binding"
description: "The v3.11 thesis: a constraint is a gate or it is not written as a constraint. Measured enforcement, body locality, and the declared gap — the three authoring rules of the CKP root."
---

# Declaring Becomes Binding

The single design commitment underneath v3.11 is this: **a constraint appears in the root only if the engine that gates writes is measured to enforce it.** Everything else in the version — the authoring rules, the gap declarations, the digest discipline — is a consequence of taking that commitment seriously.

## The problem a constraint solves — and the one it can create

A shape constraint does one job: it makes an invalid write impossible. When it does that job, the declaration and the behaviour are the same fact — what the kernel says about itself is what the substrate does on its behalf. That is the whole promise of constraint-as-fact.

A constraint component the gate does not enforce inverts the promise. It still *reads* as protection — reviewers see it, documentation cites it, consumers rely on it — while enforcing nothing. Its cost is not the missing check; it is every decision built on the belief that the check exists. v3.11's answer is structural: the root is authored so that the gap between claimed and enforced **cannot be written**.

## Rule 1 — measured enforcement

The v3.11 root uses exactly the constraint components the gating engine is measured to enforce:

```
minCount · maxCount · datatype · nodeKind · in · pattern · minLength
disjoint · hasValue · qualifiedValueShape + qualifiedMinCount · class · closed
```

*Measured* is the operative word. The set was established by exercising the gate from both sides — writes that must seal, and writes that must be refused — component by component. A constraint need that falls outside the set has three honest paths:

1. **Express it inside the set.** Most needs compose from the twelve — enumerations are `sh:in`, arities are counts, formats are `pattern`, identity separations are `disjoint`, fixed bindings are `hasValue`.
2. **Move it to a governed store-level check** — where the need is about relationships across sealed rows rather than one candidate body (see Rule 3 and G-1 below).
3. **Declare it as a gap with a reason** — visible, owned, and costed at one ticket, instead of invisible and costed at every decision built on top of it.

## Rule 2 — classes are never property subjects

No class IRI in the root is the subject of a triple whose predicate carries an `rdfs:domain`. The mechanics are unforgiving: RDFS entailment (`rdfs2`) types the subject of a domain-carrying predicate into that domain. Assert a governed property *on a class*, and the class itself becomes an instance of the domain class — at which point the shape targeting that domain targets the ontology's own declarations, and the root fails its own validation.

This is why the organ write authorities — the Separation Axiom — live in the shapes and appear nowhere as class-level assertions. Where two classes legitimately share a property (a Kernel and a Module both declare types; a Materialization and the Epoch it produces both carry a surface digest), the property carries **no domain and says so in a comment**, so the omission reads as a decision rather than an oversight.

## Rule 3 — body locality

The seal gate judges one thing: the candidate in front of it. Its composition is fixed:

```
shapes graph  ←  core shapes + kernel shapes + generated admitted-set shape
data graph    ←  the candidate body + the parent closure stamped on the candidate
```

Two consequences follow, one permissive and one restrictive.

**A shape may target a superclass.** The substrate stamps the parent types onto the candidate at seal — `rdf:type ckp:Instance` alongside the declared type — so the provability spine targets directly and never depends on an inference pass having run.

**A shape may not reach through a reference.** A node the candidate merely points at contributes nothing to the data graph: its types are not composed, its properties are not present. A constraint that depends on them — `sh:class` over a remote node, any inverse-path construct asking who points *at* the candidate — evaluates against absence and **refuses conformant work**. The root therefore uses `sh:class` only where the value node carries a direct `rdf:type` inside the body, and uses inverse paths nowhere.

Locality is not a limitation to be engineered around; it is what makes a refusal *meaningful*. Under locality, every violation names something the caller sent or something the substrate stamped — a caller can always act on a refusal, because the refusal is always about their write.

## G-1 — the declared gap

One real property falls outside the gate under Rule 3: **cross-node kind integrity**. That a kernel's three organs are one of each kind, that a grant's target is an organ, that a membership's role is a role — each is a fact about a *referenced* node, and the gate cannot see it.

The root's response has three parts:

- **The ranges are stated** — `permTarget` ranges over `Organ`, `holdsRole` over `Role`, `hasOrgan` over `Organ` — so the check is *expressible* as a query over sealed rows.
- **The gap is declared, with a reason**, in the root's own header. Nobody reading the ontology can mistake silence for coverage.
- **The check runs where it is checkable** — at the store level, over sealed state, as a governed verification whose outcome is itself sealed.

The pattern generalizes. A system that can say *"this is enforced here, this is checked there, and this is a known gap with a reason"* is a system whose conformance claims mean something. A gap carrying a reason costs one ticket; a silent one costs every decision built on top of it.

## The digest discipline

Enforcement claims have one more failure mode: the right shapes, absent. A validator answers for the shapes graph it holds — and against an empty or partial graph it answers *conforms*. So v3.11 treats **which surface is in force** as a first-class fact with its own verification:

- The root is published with a **sha256 sidecar**; the loaded graph's digest is compared to it directly.
- Adoption is a sealed record naming the digest — a vocabulary present in a store but not adopted is not in force.
- Every **Epoch names its surface by digest**, so *valid at epoch ε* resolves to an exact enforcement surface, not to a counter.
- A conformant validation report is evidence of conformance **against a known graph** — the graph is established first, by digest, never inferred from the report.

## The self-test

The root practices what it declares: its final section is a shape per class, written under its own three rules, and the file validates against itself. The Separation Axiom gates (`organKind`, `writeAuthority` as `hasValue`), the counted dependency arities, the required instance chain, the sibling treatment of failed materialization — every structural commitment in the prose is a constraint in the file, and every constraint is one the gate enforces.

That is the version in one sentence: **the declaration and the enforcement surface are the same document.**

## Where to go next

- The full model: [Introduction to CKP v3.11](/v3.11/introduction)
- The file itself: [core.ttl](https://conceptkernel.org/ontology/v3.11/core.ttl) · [the ontology page](/ontology/v3.11/)
- The runtime it lands on: [v3.9.1 — Critical Isolation](/v3.9/introduction)
