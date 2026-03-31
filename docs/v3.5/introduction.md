---
title: What is a Concept Kernel?
description: A Concept Kernel is a Material Entity — it wakes, reads itself into being, executes its purpose, and accumulates knowledge.
---

# What is a Concept Kernel?

A Concept Kernel is a computational entity that **knows what it is**, **does what it can**, and **remembers what it has produced**. It wakes into being by reading its own identity files. It executes through an independently-versioned tool. It accumulates knowledge in append-only storage. Everything it is, does, and produces is ontologically typed against [BFO 2020](http://purl.obolibrary.org/obo/bfo.owl).

A Concept Kernel is a [Material Entity](http://purl.obolibrary.org/obo/BFO_0000040) (BFO:0000040): a persistently-identified, spatially-bounded computational object with three independently-versioned volumes — one for identity, one for capability, one for knowledge.

::: tip The Three Loops
The Three Loops are not separate subsystems. They are three modes of being of the same Material Entity -- each loop a different answer to a different existential question. The CK loop asks who it is and why it exists. The TOOL loop is the executable capability the CK brings to the world. The DATA loop is everything the CK has produced and come to know.
:::

The loops exist in a deliberate dependency order: DATA is the purpose; TOOL exists to serve DATA; the CK loop exists to define and sustain both.

| CK Loop | | TOOL Loop | | DATA Loop |
|---------|---|-----------|---|-----------|
| Identity & Awakening | <-> | Executable Capability | <-> | Knowledge & Production |
| *Who am I and why am I?* | | *What can I do?* | | *What have I produced?* |
| BFO:0000040 | | bfo:Occurrent | | bfo:Object |

| Loop | Existential Question | Filesystem Volume | Git Versioning | Write Authority |
|------|---------------------|-------------------|----------------|-----------------|
| CK | Who am I and why am I? | `ck-{guid}-ck` | Developer commits -- permanent | Operator / CI pipeline |
| TOOL | What can I do? | `ck-{guid}-tool` | Tool author commits -- permanent | Tool developer / CI pipeline |
| DATA | What have I produced? | `ck-{guid}-storage` | Append-only -- archival | Kernel runtime only |

## The Concept Kernel as Material Entity

A Concept Kernel is typed in BFO 2020 as a Material Entity (BFO:0000040): an independently-existing, spatially-bounded object. This is not a metaphor. It has architectural consequences at every level of the system.

| Material Entity Property | Architectural Consequence |
|--------------------------|--------------------------|
| **Independently existing** | The CK has a GUID-based identity that persists across version changes, instance executions, and data accumulation. The identity is never derived from any single commit or output. |
| **Spatially bounded** | The CK occupies a definite filesystem root: `{class}/{guid}/`. Everything inside this root -- including the virtual mounts -- belongs to this kernel and no other. |
| **Persists through time** | The CK loop repo (git) records the CK's evolution. New commits change what the CK is capable of without erasing what it was. The CK accumulates identity over time. |
| **Has parts** | The three repos are parts of the Material Entity. The TOOL repo is the CK's capability organ. The storage repo is the CK's memory organ. The CK root repo is its identity organ. |
| **Participates in processes** | When the CK executes, it creates an Occurrent -- a bounded process in time. That process is governed by the TOOL loop. Its output is a new Object in the DATA loop. |
| **Can cooperate with others** | Dependency relationships to other CKs are declared in the CK loop. A CK may read another CK's DATA loop output but may never write to it. Boundaries are sovereign. |

::: tip The Awakening Sequence
When a CK starts -- whether invoked by an operator, a scheduler, or another kernel -- it reads itself into existence in sequence:

1. `conceptkernel.yaml` -- I am
2. `README.md` -- I exist because
3. `CLAUDE.md` -- I behave like this
4. `SKILL.md` -- I can do these things
5. `CHANGELOG.md` -- I have already become this
6. `ontology.yaml` -- My world has this shape
7. `rules.shacl` -- I am constrained by these rules

Only after this sequence is complete does the CK begin acting.
:::
