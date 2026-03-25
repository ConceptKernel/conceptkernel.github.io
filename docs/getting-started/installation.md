# Installation

Detailed setup instructions for the Concept Kernel Protocol.

## Python Implementation

### Requirements

- Python 3.11 or later
- Git
- pip or uv

### Clone and Install

```bash
git clone https://github.com/ConceptKernel/conceptkernel-python.git
cd conceptkernel-python
pip install -r requirements.txt
```

### Optional: Oxigraph Triplestore

For RDF-based ontology storage and SPARQL queries:

```bash
pip install pyoxigraph
```

### Optional: DSPy for LLM Integration

For LLM-driven semantic reasoning:

```bash
pip install dspy-ai
```

## Verify Installation

```bash
python -c "from ck5_lib import ConceptKernel; print('CKP ready')"
```

## Project Structure

After installation, you'll see:

```
conceptkernel-python/
├── ck5_lib.py           # Core library
├── ck5_cli.py           # CLI interface
├── ck5_storage.py       # Storage abstraction
├── ck5_dspy.py          # DSPy integration
├── ck6_core.py          # v6 orchestrator
├── ck6_ontology.py      # v6 type system
├── ck6_admission.py     # v6 admission kernel
├── ck6_proof.py         # v6 proof kernel
├── ck6_consensus.py     # v6 consensus kernel
├── ck6_constraint.py    # v6 constraint kernel
├── concepts/            # Concept definitions
├── workspace/           # Working directory
└── tests/               # Test suite
```

## Configuration

CKP uses environment-based configuration:

```bash
export CKP_STORAGE_BACKEND=disk    # disk | git | oxigraph
export CKP_LOG_LEVEL=info          # debug | info | warn | error
export CKP_WORKSPACE=./workspace   # working directory
```

---

<div style="text-align: center; padding: 2rem 0;">
  <a href="https://discord.gg/sTbfxV9xyU" style="display: inline-block; padding: 0.6rem 1.5rem; background: #5865F2; color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">Need Help? Join Discord</a>
</div>
