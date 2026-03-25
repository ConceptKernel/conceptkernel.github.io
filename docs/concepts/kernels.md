# Concept Kernels

A **Concept Kernel** is the fundamental unit of the protocol. Every concept — from `Cat` to `Invoice` to `Gene` — is an autonomous kernel process that owns and governs its own semantic definition.

## What Makes a Kernel?

A kernel is not just data. It is a **self-governing process** with:

- **Identity** — A unique name and version within the protocol
- **Ontology** — A LinkML schema defining its structure, slots, and enums
- **Constraints** — SHACL shapes that validate all mutations
- **Relationships** — Typed edges to other kernels (`REL`, `LINK`)
- **Ingress/Egress** — Validated input and audited output channels
- **Ledger** — Immutable record of all protocol interactions
- **Lifecycle** — States including proposed, active, locked, and archived

## Kernel Lifecycle

```
PROPOSED → VALIDATING → ACTIVE → [LOCKED] → ARCHIVED
              ↓                      ↑
           REJECTED              CONSENSUS
                                  UNLOCK
```

1. **Proposed** — A new concept is submitted for admission
2. **Validating** — Ontology and SHACL checks run; LLM semantic validation
3. **Active** — Kernel is live and accepting protocol interactions
4. **Locked** — Mutations are paused pending consensus resolution
5. **Archived** — Kernel is retired but its ledger is preserved

## Kernel Isolation

Each kernel is isolated by design:

- No kernel can directly mutate another kernel's state
- Cross-kernel interactions flow through the protocol
- A locked kernel cannot be unlocked without consensus
- Every mutation produces a cryptographic proof

This isolation ensures that even in a fleet of millions of kernels, semantic integrity is maintained through the protocol rather than through trust.

## Duplicate Handling

When a duplicate concept is proposed, the protocol does **not** reject it. Instead:

1. DSPy-driven semantic comparison identifies the overlap
2. A merge protocol is initiated
3. Consensus determines whether to merge, fork, or reject
4. The decision is logged with full provenance

---

<div style="text-align: center; padding: 2rem 0;">
  <a href="https://discord.gg/sTbfxV9xyU" style="display: inline-block; padding: 0.6rem 1.5rem; background: #5865F2; color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">Ask Questions on Discord</a>
</div>
