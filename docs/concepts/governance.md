# Governance

CKP governance is the process by which the concept graph evolves over time. It is designed to be transparent, auditable, and resistant to semantic drift.

## Governance Lifecycle

```
DISCOVERY → PROPOSAL → VALIDATION → CONSENSUS → INTEGRATION → EVOLUTION
```

1. **Discovery** — Agents identify gaps, overlaps, or inconsistencies in the concept graph
2. **Proposal** — A formal change is submitted with schema, rationale, and impact analysis
3. **Validation** — Automated checks run against ontology, SHACL, and existing constraints
4. **Consensus** — Stakeholders review and vote on the proposal
5. **Integration** — Accepted changes are committed with cryptographic proofs
6. **Evolution** — The concept enters production and is monitored for downstream effects

## Dynamic ORBAC

CKP uses **Object Role-Based Access Control** with dynamic, scoped permissions:

- **Temporary roles** — Assigned with explicit time and scope bounds
- **Hierarchical access** — Roles inherit permissions from parent roles
- **Audit trail** — Every permission change is logged to the ledger
- **Revocation** — Permissions can be revoked at any time with immediate effect

```
Guardian("OntologyTeam")
  ├── can: PROPOSE, VALIDATE, VOTE
  ├── scope: concepts/biology/*
  ├── expires: 2025-06-01
  └── granted_by: CK_Core[tx892]
```

## Concept Admission

When a new concept is proposed, it goes through a structured admission workflow:

1. **Submission** — Agent submits concept with LinkML schema
2. **Semantic Check** — DSPy-driven analysis for duplicates and conflicts
3. **Ontology Validation** — LinkML and SHACL compliance checks
4. **Relationship Mapping** — Identify and validate connections to existing concepts
5. **Consensus** — If conflicts detected, stakeholders vote on resolution
6. **Commitment** — Concept is committed with proof and logged

Duplicate proposals trigger a **merge protocol** rather than rejection — the protocol assumes that convergent proposals indicate genuine need.

## Constraint Governance

Constraints themselves are governed:

- Constraints can be proposed, voted on, and versioned
- A constraint override requires consensus with explicit justification
- Override history is immutable and auditable
- Constraints aggregate during burst propagation across the concept graph

## Trust and Reputation

CKP tracks agent reliability through:

- **Proof history** — How many proposals were accepted vs. rejected
- **Consensus participation** — Voting consistency and timeliness
- **Constraint compliance** — How often an agent's actions pass validation

Trust scores inform but do not dictate governance decisions. The protocol is designed to be trust-minimized — verification over reputation.

---

<div style="text-align: center; padding: 2rem 0;">
  <a href="https://discord.gg/sTbfxV9xyU" style="display: inline-block; padding: 0.6rem 1.5rem; background: #5865F2; color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">Shape Governance on Discord</a>
</div>
