# Ontology Versions

The CKP ontology is published as a set of OWL/Turtle files under versioned paths on conceptkernel.org. Each version is a complete, self-contained ontology that can be imported by kernels, validators, and reasoning engines.

## v3.5 (alpha-3)

::: warning Alpha Status
v3.5 is under active development. Shapes and properties may change before the stable release.
:::

v3.5 extends v3.4 with base instance shapes, the proof model, and action composition semantics. The major additions are:

**Base instance shapes** (`base-instances.ttl`) define InstanceManifest, SealedInstance, and LedgerEntry as OWL classes grounded in BFO's GenericallyDependentContinuant. These are the shapes that every kernel's ontology inherits from when declaring its own instance types.

**Proof ontology** (`proof.ttl`) defines ProofRecord, ProofCheck, ProofOutcome, and CheckType. These classes model the verification records that compliance kernels produce when checking sealed instances.

**Action composition** formalises the EXTENDS and COMPOSES edge predicates from the edge graph. EXTENDS maps to BFO's `is_a` relation (action inheritance). COMPOSES maps to BFO's `has_continuant_part` (action delegation).

Namespace: `https://conceptkernel.org/ontology/v3.5-alpha3/`

### Files

| File | Description |
|------|-------------|
| [core.ttl](https://conceptkernel.org/ontology/v3.5-alpha3/core.ttl) | BFO mappings for Kernel, Edge, Instance, Ontology |
| [base-instances.ttl](https://conceptkernel.org/ontology/v3.5-alpha3/base-instances.ttl) | InstanceManifest, SealedInstance, LedgerEntry |
| [proof.ttl](https://conceptkernel.org/ontology/v3.5-alpha3/proof.ttl) | ProofRecord, ProofCheck, ProofOutcome, CheckType |
| [shapes.ttl](https://conceptkernel.org/ontology/v3.5-alpha3/shapes.ttl) | SHACL validation shapes for kernels, edges, instances |
| [relations.ttl](https://conceptkernel.org/ontology/v3.5-alpha3/relations.ttl) | Edge predicates and inter-kernel relations |
| [processes.ttl](https://conceptkernel.org/ontology/v3.5-alpha3/processes.ttl) | Action execution processes (BFO Occurrents) |
| [rbac.ttl](https://conceptkernel.org/ontology/v3.5-alpha3/rbac.ttl) | Role-based access control classes |
| [workflow.ttl](https://conceptkernel.org/ontology/v3.5-alpha3/workflow.ttl) | Goal, Task, and governance workflow classes |
| [kernel-metadata.ttl](https://conceptkernel.org/ontology/v3.5-alpha3/kernel-metadata.ttl) | Kernel metadata properties |
| [kernel-entity-template.ttl](https://conceptkernel.org/ontology/v3.5-alpha3/kernel-entity-template.ttl) | Template for new kernel entity declarations |
| [self-improvement.ttl](https://conceptkernel.org/ontology/v3.5-alpha3/self-improvement.ttl) | Self-improvement and evolution classes |
| [schema.yaml](https://conceptkernel.org/ontology/v3.5-alpha3/schema.yaml) | LinkML schema for the core ontology |
| [index.json](https://conceptkernel.org/ontology/v3.5-alpha3/index.json) | Machine-readable index of all files in this version |

## v3.4 (current stable)

v3.4 is the stable ontology version, migrated from the CK v1.3.21 Rust implementation. It covers the core BFO mappings, SHACL shapes, edge validation, and kernel metadata. v3.4 does not include base instance shapes or the proof model -- those were introduced in v3.5.

Namespace: `https://conceptkernel.org/ontology/v3.4/`

### Files

| File | Description |
|------|-------------|
| [core.ttl](https://conceptkernel.org/ontology/v3.4/core.ttl) | BFO mappings for Kernel, Edge, Instance, Ontology |
| [shapes.ttl](https://conceptkernel.org/ontology/v3.4/shapes.ttl) | SHACL validation shapes |
| [relations.ttl](https://conceptkernel.org/ontology/v3.4/relations.ttl) | Edge predicates and relations |
| [processes.ttl](https://conceptkernel.org/ontology/v3.4/processes.ttl) | Action execution processes |
| [rbac.ttl](https://conceptkernel.org/ontology/v3.4/rbac.ttl) | Role-based access control |
| [workflow.ttl](https://conceptkernel.org/ontology/v3.4/workflow.ttl) | Workflow classes |
| [kernel-metadata.ttl](https://conceptkernel.org/ontology/v3.4/kernel-metadata.ttl) | Kernel metadata properties |
| [kernel-entity-template.ttl](https://conceptkernel.org/ontology/v3.4/kernel-entity-template.ttl) | Template for kernel declarations |
| [self-improvement.ttl](https://conceptkernel.org/ontology/v3.4/self-improvement.ttl) | Self-improvement classes |
| [schema.yaml](https://conceptkernel.org/ontology/v3.4/schema.yaml) | LinkML schema |
| [index.json](https://conceptkernel.org/ontology/v3.4/index.json) | Machine-readable index |

## Migration

Kernels targeting v3.4 can upgrade to v3.5 by updating their `ontology.yaml` prefix from `v3.4` to `v3.5` and inheriting from the new base instance shapes. Existing SHACL shapes remain valid. The v3.5 shapes are additive -- they introduce new classes and properties without removing or renaming anything from v3.4.

---

<div style="text-align: center; padding: 2rem 0;">
  <a href="https://discord.gg/sTbfxV9xyU" style="display: inline-block; padding: 0.6rem 1.5rem; background: #5865F2; color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">Discuss Ontology on Discord</a>
</div>
