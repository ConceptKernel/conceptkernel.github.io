# Consensus

Consensus is the governance mechanism that prevents unilateral mutations to the concept graph. Any change that could affect other kernels must go through consensus.

## When is Consensus Required?

| Operation | Consensus? | Reason |
|-----------|-----------|--------|
| Reading a concept | No | Read-only, no side effects |
| Proposing a new concept | No | Proposal is not commitment |
| Updating a concept's attributes | **Yes** | Affects downstream dependents |
| Merging two concepts | **Yes** | Structural change to the graph |
| Unlocking a locked kernel | **Yes** | Security-critical operation |
| Overriding a constraint | **Yes** | Relaxes validation guarantees |

## How Consensus Works

```
PROPOSER                VOTERS                 PROTOCOL
   │                      │                       │
   ├─── propose ──────────┤                       │
   │                      ├─── validate ──────────┤
   │                      │◄── constraints ───────┤
   │                      │                       │
   │◄──── votes ──────────┤                       │
   │                      │                       │
   ├─── proof ────────────┼───────────────────────┤
   │                      │                       │
   │◄─────────────────────┼──── commit/reject ────┤
```

1. **Proposal** — A kernel proposes a change with justification
2. **Validation** — The protocol checks the proposal against constraints
3. **Voting** — Relevant stakeholders (affected kernels, guardians) vote
4. **Proof** — Votes are aggregated with cryptographic proofs
5. **Decision** — The protocol commits or rejects based on the outcome

## Stakeholder Types

- **Agents** — Autonomous processes that propose and vote on changes
- **Guardians** — Designated stewards of specific concept domains
- **Participants** — Observers with advisory but non-binding input

## Deadlock Resolution

When consensus cannot be reached:

1. **Escalation** — The decision is escalated to a higher governance tier
2. **Timeout** — After a configurable period, a default action is taken
3. **Override** — A guardian with sufficient authority can override, with full protocol logging

All overrides are logged with provenance. There is no silent override.

## Cryptographic Proofs

Every consensus round produces a proof chain:

- Each vote is individually signed
- Votes are aggregated into a Merkle-like proof structure
- The final proof is stored in the concept's ledger
- Proofs support rollback — you can verify any historical state

---

<div style="text-align: center; padding: 2rem 0;">
  <a href="https://discord.gg/sTbfxV9xyU" style="display: inline-block; padding: 0.6rem 1.5rem; background: #5865F2; color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">Discuss Governance on Discord</a>
</div>
