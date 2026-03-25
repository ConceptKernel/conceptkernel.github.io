# Architecture

The Concept Kernel Protocol v3.4 is the **Three Loops System**. Every concept kernel is a BFO:0000040 Material Entity -- an autonomous, boundary-isolated unit with identity, capability, and knowledge managed as three independently-versioned repositories.

## Three Loops

A concept kernel's lifecycle is organised into three loops, each stored as a separate SeaweedFS volume:

| Loop | Volume | Contains |
|------|--------|----------|
| **CK** (identity) | `ck-{guid}-ck` | Genome, instructions, ontology, constraints, changelog |
| **TOOL** (capability) | `ck-{guid}-tool` | Processor, entrypoint, action handlers |
| **DATA** (knowledge) | `ck-{guid}-storage` | Sealed instances, ledger, proofs, indexes |

Each loop is versioned independently. A kernel can update its processor (TOOL) without touching its identity (CK), or accumulate instances (DATA) without changing either.

## Directory Structure

```
{KernelName}/
    conceptkernel.yaml     # CK loop
    README.md
    CLAUDE.md
    SKILL.md
    CHANGELOG.md
    ontology.yaml
    rules.shacl
    serving.json
    tool/
        processor.py       # TOOL loop
    storage/
        instances/         # DATA loop
        ledger/
        proof/
        index/
```

## Awakening Sequence

When a kernel is instantiated, it reads its CK loop files in order:

1. **conceptkernel.yaml** -- genome: name, version, type, governance, actions, edges
2. **README.md** -- human-readable summary
3. **CLAUDE.md** -- agent instructions (what it is, what it does, how to operate)
4. **SKILL.md** -- action catalog with access levels
5. **CHANGELOG.md** -- version history
6. **ontology.yaml** -- type definitions (BFO-aligned)
7. **rules.shacl** -- constraint shapes
8. **serving.json** -- HTTP/NATS serving configuration

This sequence gives the kernel full self-awareness before it processes any action.

## Governance Modes

Every kernel declares a governance mode in its genome:

| Mode | Meaning |
|------|---------|
| **STRICT** | All mutations require consensus vote before execution |
| **RELAXED** | Mutations are logged and auditable but not gated by vote |
| **AUTONOMOUS** | Kernel self-governs; mutations produce sealed instances as proof |

## Edges

Kernels declare typed relationships to other kernels via edges:

| Edge Type | Semantics |
|-----------|-----------|
| **TRIGGERS** | Executing an action on this kernel triggers an action on the target |
| **EXTENDS** | This kernel inherits actions or ontology from the target |
| **COMPOSES** | This kernel calls the target's actions as part of its own |
| **REQUIRES** | This kernel cannot operate without the target being available |

Edges are declared in `conceptkernel.yaml` and are the wiring that connects kernels into an organism.

## Protocol Actions

Every interaction with a kernel is an action. Actions are declared in the genome with access levels (`anon` or `auth`) and executed by the processor in the TOOL loop. Each action execution produces a sealed instance in the DATA loop with cryptographic hashes, timestamps, and provenance links.

## Instance Lifecycle

1. Action is received (via NATS message or CLI invocation)
2. Processor creates an instance directory under `storage/instances/`
3. Instance is populated with `manifest.json`, `data.json`, and action output
4. Instance is sealed -- hashes computed, provenance recorded
5. Ledger entry appended to `storage/ledger/`

Sealed instances are immutable. They are the proof that work was done.

---

<div style="text-align: center; padding: 2rem 0;">
  <a href="https://discord.gg/sTbfxV9xyU" style="display: inline-block; padding: 0.6rem 1.5rem; background: #5865F2; color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">Discuss Architecture on Discord</a>
</div>
