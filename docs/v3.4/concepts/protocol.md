# Protocol

The CKP protocol defines how kernels communicate, how actions are structured, and how every interaction is logged and verified.

## Protocol Messages

Every interaction in CKP is expressed as a typed protocol message:

```python
ProtocolMessage(
    session_id="s25a8",
    transaction_id="tx1",
    source="CK_Admission",
    target="CK_Ontology",
    action="propose",
    payload={"concept": "Cat", "schema": {...}},
    timestamp="2024-12-01T12:00:02.000Z"
)
```

Messages are immutable once dispatched. The protocol guarantees:
- **Ordering** — Messages within a session are strictly ordered
- **Traceability** — Every message has a session and transaction ID
- **Auditability** — All messages are logged to the ledger

## Action Types

| Action | Description | Requires Consensus |
|--------|-------------|-------------------|
| `PROPOSE` | Submit a new concept or change | No |
| `VALIDATE` | Run ontology and SHACL checks | No |
| `REL` | Create/update relationships | No |
| `LINK` | Link concepts with type constraints | No |
| `UPDATE` | Mutate concept attributes | Yes |
| `MERGE` | Merge overlapping concepts | Yes |
| `PROOF` | Generate/verify cryptographic proof | No |
| `CONSENSUS` | Initiate governance vote | Yes |

## Protocol Logging

CKP uses a minimal, hierarchical log format that captures the full call stack:

```
12:00:02.000 | CK_ADM → propose → CK_ONT : cat
  └── tx1a: CK_ONT → get → CK_STO : constraints
  └── tx1b: CK_STO → return → CK_ONT : [5 rules]
12:00:02.050 | CK_ONT → verify → CK_TAX : mammal
12:00:02.100 | CK_ADM → assimilate → CK_STO : cat v1
```

Logs are deterministic and replayable — you can reconstruct the exact sequence of events from any session.

## Ingress and Egress

Every kernel controls its boundaries through validated channels:

- **Ingress** — All input is validated against the kernel's schema before acceptance
- **Egress** — All output is audited and logged before emission

No data enters or leaves a kernel without protocol validation. This is enforced at the protocol level, not by convention.

## LLM Integration

CKP integrates language models through [DSPy](https://dspy.ai/) — a framework for composable LLM reasoning chains:

- LLM access is **read-only** within the protocol
- All LLM calls are mapped to explicit **DSPy Signatures**
- Input and output are **validated** against the protocol
- Results are **idempotent** within transaction scope
- Failures trigger explicit **fallback protocols**

The LLM never mutates state directly. It provides semantic reasoning that the protocol validates and commits.

---

<div style="text-align: center; padding: 2rem 0;">
  <a href="https://discord.gg/sTbfxV9xyU" style="display: inline-block; padding: 0.6rem 1.5rem; background: #5865F2; color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">Explore the Protocol on Discord</a>
</div>
