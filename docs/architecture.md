# Architecture

The Concept Kernel Protocol uses a layered architecture where every concept is an autonomous kernel participating in a governed protocol.

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                  Layer 3: User Concepts              │
│        Cat  ·  Invoice  ·  Gene  ·  Policy  · ...   │
├─────────────────────────────────────────────────────┤
│              Layer 2: CK-Protocol                    │
│     Messages  ·  Actions  ·  Routing  ·  Compliance  │
├─────────────────────────────────────────────────────┤
│              Layer 1: CK-Ontology                    │
│     LinkML  ·  SHACL  ·  Type Registry  ·  Validation│
├─────────────────────────────────────────────────────┤
│              Layer 0: CK-Core                        │
│     Orchestration  ·  Lifecycle  ·  RBAC  ·  Consensus│
└─────────────────────────────────────────────────────┘
```

## Core Kernels

The protocol is implemented through a set of core kernels, each with a distinct responsibility:

| Kernel | Role | Responsibility |
|--------|------|----------------|
| **CK_Core** | Orchestrator | Routes actions, manages registry, delegates to other kernels |
| **CK_Ontology** | Type System | Registers ontologies, validates actions, queries relationships |
| **CK_Admission** | Entrypoint | Receives requests, validates structure, routes to handlers |
| **CK_Proof** | Cryptographic Proofs | Generates and verifies proofs, logs events, supports rollback |
| **CK_Consensus** | Governance | Proposes consensus rounds, manages voting, validates decisions |
| **CK_Constraint** | Enforcement | Defines constraints, validates actions against SHACL shapes |
| **CK_Storage** | Persistence | Protocol-abstracted storage across disk, git, and triplestore backends |
| **CK_Concept** | Concept Kernel | Every concept is a kernel — defines, validates, and relates itself |

## Concept Kernel Structure

Every concept kernel maintains its own directory structure:

```
/concepts/{ConceptName}/
├── ontology.yaml          # LinkML schema + SHACL
├── kernel.js              # WASM-executable interface
├── io/
│   ├── input/             # Validated ingress
│   └── output/            # Audited egress
├── shacl/                 # SHACL constraint rules
└── var/
    ├── ledger/            # Immutable audit records
    └── jobs/              # Execution traces
```

## Protocol Actions

All operations are expressed as typed protocol actions:

| Action | Purpose |
|--------|---------|
| `REL` | Create or update relationships between concepts |
| `LINK` | Link concepts with type constraints |
| `MERGE` | Merge concepts with strategy selection |
| `UPDATE` | Update attributes with full auditability |
| `PROOF` | Generate or verify cryptographic proofs |
| `CONSENSUS` | Propose voting and governance decisions |

## Message Flow

Every protocol interaction follows a structured message flow:

```
SESSION[s25a8] (Cat Admission)
  → PROPOSE[tx1] : CK_ADM → propose → CK_ONT : cat
  → VALIDATE[tx2]:
    → GET[tx1a]: CK_ONT → get → CK_STO : constraints
    ← RETURN[tx1b]: CK_STO → return → CK_ONT : [5 rules]
  → VERIFY[tx1c]: CK_ONT → verify → CK_TAX : mammal
  → ASSIMILATE[tx3]: concept stored (version: 1)
  ← LOG[tx4]: protocol_log saved
```

## Storage Abstraction

All persistence flows through `CK_Storage`, which supports multiple backends:

- **Disk** — Local filesystem for development
- **Git** — Version-controlled concept storage with full history
- **Oxigraph** — RDF triplestore for ontology queries and SPARQL

No kernel may access storage directly. All reads and writes go through the storage protocol.

## Burst Propagation

When a concept changes, the protocol triggers a **burst propagation** — a wave that traverses ontological relationships:

1. Originates at the mutated concept
2. Traverses `REL` and `LINK` edges
3. Evaluates SHACL constraints at each hop
4. Handles locked kernels via consensus escalation
5. Converges proofs from all affected branches

This ensures that the full concept graph remains consistent after every mutation.

---

<div style="text-align: center; padding: 2rem 0;">
  <a href="https://discord.gg/sTbfxV9xyU" style="display: inline-block; padding: 0.6rem 1.5rem; background: #5865F2; color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">Discuss Architecture on Discord</a>
</div>
