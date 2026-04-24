---
title: Dynamic Kernel Spawning
description: How the CKP fleet grows organically through kernel.spawn, with auto-linking via co-occurrence and full provenance chains.
---

# Dynamic Kernel Spawning

## Why Kernels Spawn

When a classification action discovers a new concept (e.g., `sqlite-connection-leak-patterns`), the system MUST be able to create a new Concept Kernel to represent that concept. The spawned kernel becomes a living typed container that accumulates instances -- every occurrence of that concept across all conversations. Dynamic spawning is how the CKP fleet grows organically in response to discovered knowledge.

Unlike manual kernel creation, spawning is driven by data: a kernel discovers a pattern, determines it warrants a persistent concept, and requests its creation. The fleet evolves from observed reality, not upfront design.

## The kernel.spawn Action

Any kernel with the `kernel.spawn` grant MAY request creation of a new Concept Kernel. The action is handled by `CK.Operator`.

### Input Structure

```yaml
action: kernel.spawn
data:
  kernel_class: "Delvinator.Concept.SqliteConnectionLeakPatterns"
  template: concept
  metadata:
    slug: "sqlite-connection-leak-patterns"
    domain: "data-layer"
    description: "Identifying database connection lifecycle mismanagement"
    discovered_by: "ckp://Kernel#Delvinator.IntentMapper:v1.0"
    discovered_in: "session:5cd8887c"
```

| Field | Required | Description |
|---|---|---|
| `kernel_class` | MUST | Fully qualified kernel class name |
| `template` | MUST | Template type (`concept`, `processor`, `agent`) |
| `metadata.slug` | MUST | URL-safe identifier for the concept |
| `metadata.domain` | SHOULD | Domain classification for fleet organization |
| `metadata.description` | MUST | Human-readable description of the concept |
| `metadata.discovered_by` | MUST | URN of the kernel that discovered the concept |
| `metadata.discovered_in` | SHOULD | Session or trace ID of the discovery context |

## Spawned Kernel Structure

The spawn action MUST create a CKP-compliant kernel directory with all **eight awakening files**. No file may be omitted -- a kernel without any of these files is not a valid Concept Kernel.

### Required Files

| # | File | Content |
|---|---|---|
| 1 | `conceptkernel.yaml` | Identity, URN, type (`node:cold`), governance, actions, edges |
| 2 | `CLAUDE.md` | Behavioral instructions for subagent interaction |
| 3 | `SKILL.md` | Action catalog with parameters and examples |
| 4 | `ontology.yaml` | Data schema defining the occurrence instance type |
| 5 | `rules.shacl` | Validation constraints for instances |
| 6 | `tool/processor.py` | Action handler implementation |
| 7 | `data/memory/MEMORY.md` | Empty initial memory (DATA loop) |
| — | _(version tracking)_ | Recorded at the project level in `.ckproject` (SHA1 pins per organ), not inside the kernel's CK loop |

### Spawned Kernel Properties

The spawned kernel MUST satisfy these constraints:

1. **Unique `kernel_id`** -- UUID v4, generated at spawn time
2. **Type `node:cold`** -- concept kernels are cold by default (no active processing until activated)
3. **Standard actions** -- every concept kernel ships with:
   - `occurrence.add` -- record a new occurrence of this concept
   - `occurrence.list` -- list all recorded occurrences
   - `concept.describe` -- return the concept's description and metadata
   - `concept.relate` -- create a bidirectional edge to another concept kernel
4. **Ontology** -- `ontology.yaml` MUST define the occurrence instance type with fields for source, context, and timestamp
5. **COMPOSES edge** -- the spawned kernel MUST declare a `COMPOSES` edge to the concept registry kernel
6. **Provenance** -- metadata MUST include `prov:wasGeneratedBy` linking to the discovering kernel

### Example conceptkernel.yaml (spawned)

```yaml
apiVersion: conceptkernel.org/v1
kind: ConceptKernel
metadata:
  name: delvinator-concept-sqlite-connection-leak-patterns
  namespace: ck-delvinator
spec:
  kernel_class: Delvinator.Concept.SqliteConnectionLeakPatterns
  kernel_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  urn: "ckp://Kernel#Delvinator.Concept.SqliteConnectionLeakPatterns:v1.0"
  qualities:
    type: "node:cold"
  governance_mode: RELAXED
  actions:
    - name: occurrence.add
      type: mutate
      access: auth
    - name: occurrence.list
      type: query
      access: anon
    - name: concept.describe
      type: query
      access: anon
    - name: concept.relate
      type: mutate
      access: auth
  edges:
    outbound:
      - target_kernel: CK.ConceptRegistry
        predicate: COMPOSES
  prov:
    wasGeneratedBy: "ckp://Action#Delvinator.IntentMapper/classify-1712345678"
    wasAttributedTo: "ckp://Kernel#Delvinator.IntentMapper:v1.0"
    generatedAtTime: "2026-04-05T16:37:25Z"
```

## URN Generation for Spawned Kernels

Spawned kernels receive a URN following the standard CKP scheme:

```
ckp://Kernel#{Project}.Concept.{PascalCaseName}:v1.0
```

For example:
- `ckp://Kernel#Delvinator.Concept.SqliteConnectionLeakPatterns:v1.0`
- `ckp://Kernel#Delvinator.Concept.RecursiveSchemaDetection:v1.0`

The URN is deterministic from the kernel class name. Two spawn requests for the same concept class produce the same URN, enabling idempotent spawning.

## Auto-Linking via Co-occurrence

When two concept kernels co-occur in the same exchange, the system SHOULD send `concept.relate` actions to both, creating bidirectional edges.

### How It Works

```
Exchange contains references to both:
  - SqliteConnectionLeakPatterns
  - DatabasePoolExhaustion

System detects co-occurrence and sends:
  1. concept.relate to SqliteConnectionLeakPatterns:
     { related_kernel: "DatabasePoolExhaustion", context: "exchange-xyz" }
  2. concept.relate to DatabasePoolExhaustion:
     { related_kernel: "SqliteConnectionLeakPatterns", context: "exchange-xyz" }

Both kernels add edges to their conceptkernel.yaml:
  edges:
    outbound:
      - target_kernel: Delvinator.Concept.DatabasePoolExhaustion
        predicate: PRODUCES
```

These edges are ontological -- declared in each kernel's `conceptkernel.yaml` and visible to the fleet. They appear in the [ontological graph](./graph) as RDF triples and can be queried via SPARQL.

::: info Self-Organizing Concept Graph
Co-occurrence linking is how the concept graph self-organizes: related concepts discover their relationships through the data, not through upfront design. Over time, heavily co-occurring concepts form clusters that represent domain knowledge structures.
:::

## Conformance Requirements

| Criterion | Level |
|---|---|
| Spawn MUST create all eight awakening files | REQUIRED |
| Spawn MUST generate a valid `conceptkernel.yaml` | REQUIRED |
| Spawn MUST record the action as an occurrent with proof chain | REQUIRED |
| Spawned kernels MUST include `prov:wasGeneratedBy` linking to the discoverer | REQUIRED |
| Co-occurrence linking SHOULD create bidirectional edges | RECOMMENDED |
| Spawned kernels MUST have type `node:cold` by default | REQUIRED |
| Spawned kernels MUST declare standard concept actions | REQUIRED |
