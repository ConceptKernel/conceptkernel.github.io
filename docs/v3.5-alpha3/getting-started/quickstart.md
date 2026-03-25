# Quickstart

Get a concept kernel running in minutes. This guide walks through creating a kernel directory, writing a processor, and executing your first action.

## Prerequisites

You need Python 3.11 or later and pip. NATS is optional for local development -- the processor can run in CLI mode without it.

## Install CK.Lib

```bash
pip install cklib
```

## Create a Kernel Directory

A kernel is a directory with a genome file and a processor. Create the minimal structure:

```bash
mkdir -p MyKernel/tool MyKernel/storage/instances MyKernel/storage/ledger
```

Write the genome:

```yaml
# MyKernel/conceptkernel.yaml
apiVersion: conceptkernel/v3.5
kind: ConceptKernel

metadata:
  name: MyKernel
  version: "0.1"
  type: cold
  governance: AUTONOMOUS

spec:
  description: "My first concept kernel"
  urn: "ckp://Kernel#MyKernel:v0.1"

actions:
  unique:
    - name: status
      access: anon
    - name: greet
      access: anon
```

Write the processor:

```python
# MyKernel/tool/processor.py
from cklib import KernelProcessor, on

class MyKernel(KernelProcessor):

    @on("status")
    def handle_status(self, msg):
        return {"status": "ok", "kernel": self.name, "version": self.version}

    @on("greet")
    def handle_greet(self, msg):
        name = msg.get("payload", {}).get("name", "world")
        instance = self.create_instance("greet", msg)
        instance["data"]["greeting"] = f"Hello, {name}"
        return self.seal_instance(instance)

if __name__ == "__main__":
    MyKernel.main()
```

## Run It

Check the kernel status:

```bash
cd MyKernel
python3 tool/processor.py --status
```

Execute the greet action:

```bash
python3 tool/processor.py --action greet --payload '{"name": "CKP"}'
```

This creates a sealed instance under `storage/instances/` with a `manifest.json`, `data.json`, and computed hashes. The instance is immutable after sealing.

## Listen on NATS

If you have a NATS server running locally, start the kernel in listener mode:

```bash
python3 tool/processor.py --listen
```

The kernel subscribes to `input.MyKernel` and publishes results to `result.MyKernel`.

## Next Steps

Read the [Architecture](/v3.5-alpha3/architecture) to understand the Three Loops model that organises your kernel. Explore [Kernels](/v3.5-alpha3/concepts/kernels) to learn about the genome structure and instance lifecycle. See the [Proof Model](/v3.5-alpha3/spec/proof-model) to understand how sealed instances are verified.

---

<div style="text-align: center; padding: 2rem 0;">
  <a href="https://discord.gg/sTbfxV9xyU" style="display: inline-block; padding: 0.6rem 1.5rem; background: #5865F2; color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">Get Help on Discord</a>
</div>
