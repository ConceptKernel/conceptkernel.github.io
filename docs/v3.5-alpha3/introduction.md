# What is the Concept Kernel Protocol?

The **Concept Kernel Protocol (CKP)** is an open protocol for defining, governing, and evolving autonomous computational entities called concept kernels. Each kernel carries its own identity, capability, and production history in a self-describing directory structure that any agent can read and operate within.

## The Problem

Autonomous agents are spawned in the billions. Each one needs to know what it is, what it can do, and how to prove what it has done. Today these concerns are scattered across configuration services, external registries, and ad-hoc conventions. There is no standard way for an agent to acquire identity from a directory, produce verifiable output, or participate in governed evolution of its own capabilities.

The result is fragile integration, opaque provenance, and semantic drift at scale.

## The Solution

CKP solves this with **concept kernels** -- persistent entities organised around three independently versioned loops:

The **CK Loop** carries identity. A `conceptkernel.yaml` file declares the kernel's name, version, governance mode, edges to other kernels, and the order in which an agent reads files to "awaken" inside the kernel. By the time the awakening sequence is complete, the agent knows who it is.

The **TOOL Loop** carries capability. A `processor.py` file imports CK.Lib, registers action handlers, and turns the identity into running behaviour. The tool reads the CK loop but never writes to it. This one-way dependency keeps identity stable while capabilities evolve.

The **DATA Loop** carries production history. Sealed instances, ledger entries, and proof records accumulate in `storage/`. Every action execution materialises as an immutable instance with SHA-256 hashes and PROV-O provenance. The DATA loop proves the CK loop, closing a verifiable accountability cycle.

## Core Principles

**Self-describing.** A kernel directory is self-contained. Drop it on disk and any agent can become it. No external configuration service, schema registry, or bootstrap endpoint is needed.

**Ontology-first.** Every kernel declares its data shapes in LinkML and validates them with SHACL. The ontology IS the type definition. Instances are typed individuals, not generic blobs. BFO alignment grounds everything in a principled upper ontology.

**Verifiable.** Every sealed instance carries cryptographic hashes. Compliance kernels produce proof records that can be verified offline, on a different machine, at any point in the future. Provenance chains link every instance to the kernel and action that created it.

**Governed.** Kernels declare governance modes (STRICT, RELAXED, AUTONOMOUS) that determine how changes are approved. The governance loop runs from Goal through Task, Agent, Instance, and Deploy, with consensus gates placed according to the mode.

**Composable.** Kernels interact through typed edges declared in their genome. EXTENDS edges inherit actions. COMPOSES edges delegate to them. TRIGGERS edges notify. The edge graph IS the integration -- no message bus configuration, no glue code.

## What Can You Build?

CKP is designed for systems where agents need verifiable identity and auditable output. Production use cases include AI agent orchestrators that spawn sub-agents with declared capabilities, knowledge graphs where every mutation is sealed with provenance, multi-kernel organisms where governance evolves through consensus, and compliance systems where proof records provide post-hoc verification without runtime overhead.

---

<div style="text-align: center; padding: 2rem 0;">
  <a href="https://discord.gg/sTbfxV9xyU" style="display: inline-block; padding: 0.6rem 1.5rem; background: #5865F2; color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">Join the Discussion on Discord</a>
</div>
