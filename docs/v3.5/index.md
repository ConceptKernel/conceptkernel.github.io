---
title: CKP v3.5
description: Concept Kernel Protocol v3.5 — Three Loops as Description Logic Boxes
---

# Concept Kernel Protocol v3.5

The Concept Kernel Protocol (CKP) v3.5 defines how a Concept Kernel exists, wakes into being, executes its purpose, and accumulates knowledge. A Concept Kernel is a Material Entity (BFO:0000040) -- a persistently-identified, spatially-bounded computational object with a single unified filesystem tree and three independently-versioned repositories.

The Three Loops are three modes of being of the same Material Entity -- each loop a different answer to a different existential question.

| Loop | Question | DL Box | BFO Grounding |
|------|----------|--------|---------------|
| **CK** | Who am I and why am I? | TBox | BFO:0000040 (Material Entity) |
| **TOOL** | What can I do? | RBox | bfo:Occurrent |
| **DATA** | What have I produced? | ABox | bfo:Object |

## Specification Sections

### Foundations

- [Introduction](./introduction) -- Executive summary and the Material Entity foundation
- [Three Loops as DL Boxes](./three-loops) -- The key insight: CK/TOOL/DATA as TBox/RBox/ABox
- [Ontology Layering](./ontology-layering) -- Four-layer import chain from BFO 2020 through domain ontologies

### The Three Loops

- [CK Loop](./ck-loop) -- Identity and awakening: who the kernel is and why it exists
- [TOOL Loop](./tool-loop) -- Executable capability: what the kernel can do
- [DATA Loop](./data-loop) -- Knowledge and production: what the kernel has produced

### System Architecture

- [System](./system) -- The three loops as one system, plus action composition via edges
- [Topology](./topology) -- Unified tree, physical volumes, versioning, and gateway routing
- [SPIFFE and Security](./spiffe) -- Workload identity, grants, and loop isolation

## What Changed in v3.5

v3.5 integrates the Ontological Autonomous Operations v1.1 white paper, mapping the autonomous operations's three operational loops onto the CK model. Key additions:

- **Mid-level ontology layer** -- IAO, CCO, PROV-O, and ValueFlows imported between BFO 2020 and CKP
- **Formal task descriptions** -- Machine-executable task specifications replacing human-interpretable tickets
- **Capability advertisement** -- Kernels advertise services via `spec.actions` and `capability:` blocks
- **PROV-O provenance** -- Every instance traces to its action, operator, and kernel
- **ODRL-to-grants mapping** -- The grants block is the ODRL Policy for the kernel
- **ValueFlows/REA** -- Economic events modelled as sealed instances
- **SHACL reactive rules** -- Business logic via SHACL Advanced Rules
- **Four kernel archetypes** -- Concept, predicate, system, and agent kernels
- **Direction governance** -- Goal-to-task hierarchy with build-dependency sequencing
