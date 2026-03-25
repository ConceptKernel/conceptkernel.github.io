# Quickstart

Get up and running with the Concept Kernel Protocol in minutes.

## Prerequisites

- Python 3.11+
- Git

## Install

```bash
git clone https://github.com/ConceptKernel/conceptkernel-python.git
cd conceptkernel-python
pip install -r requirements.txt
```

## Define a Concept

Create a concept definition using LinkML:

```yaml
# concepts/Cat/ontology.yaml
id: https://conceptkernel.org/concepts/Cat
name: Cat
classes:
  Cat:
    description: A domesticated feline
    is_a: Mammal
    slots:
      - name
      - breed
slots:
  name:
    range: string
    required: true
  breed:
    range: string
```

## Propose a Concept

Submit your concept to the protocol:

```python
from ck5_lib import ConceptKernel

ck = ConceptKernel()

# Propose a new concept
result = ck.propose_concept(
    name="Cat",
    schema_path="concepts/Cat/ontology.yaml"
)

print(result)
# → PROPOSED[tx1]: Cat submitted for admission
```

## Watch the Protocol

The protocol logs every step:

```
SESSION[s001] (Cat Admission)
  → PROPOSE[tx1] : CK_ADM → propose → CK_ONT : Cat
  → VALIDATE[tx2]: ontology check passed
  → VALIDATE[tx3]: SHACL check passed (5 constraints)
  → ASSIMILATE[tx4]: concept stored (version: 1)
  ← LOG[tx5]: protocol_log saved
```

## Next Steps

- Read the [Architecture](/architecture) to understand the system design
- Explore [Core Concepts](/concepts/kernels) to learn about kernels, ontology, and consensus
- Browse the [GitHub repositories](https://github.com/ConceptKernel) for source code

---

<div style="text-align: center; padding: 2rem 0;">
  <a href="https://discord.gg/sTbfxV9xyU" style="display: inline-block; padding: 0.6rem 1.5rem; background: #5865F2; color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">Get Help on Discord</a>
</div>
