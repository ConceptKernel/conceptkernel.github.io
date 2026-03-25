# Installation

::: warning Coming Soon
The CK.Lib Python package is under active development and not yet published to PyPI. Follow the [GitHub org](https://github.com/ConceptKernel) for release announcements, or join [Discord](https://discord.gg/sTbfxV9xyU) for early access.
:::

Detailed setup instructions for running concept kernels with CK.Lib. The instructions below preview what installation will look like once the package is released.

## Requirements

Python 3.11 or later is required. CK.Lib is a pure Python package with minimal dependencies.

## Install from PyPI (when available)

```bash
pip install cklib
```

Verify the installation:

```bash
python3 -c "from cklib import KernelProcessor; print('cklib ready')"
```

## Optional: NATS Server

For inter-kernel messaging, install and run a local NATS server:

```bash
# macOS
brew install nats-server
nats-server

# Linux
curl -L https://github.com/nats-io/nats-server/releases/latest/download/nats-server-linux-amd64.tar.gz | tar xz
./nats-server
```

CK.Lib connects to `nats://localhost:4222` by default. Override with the `NATS_URL` environment variable.

## Optional: Keycloak for Auth

For kernels with `access: auth` actions, CK.Lib validates JWT tokens against a Keycloak realm. Set the environment variables:

```bash
export KEYCLOAK_URL=http://localhost:8080
export KEYCLOAK_REALM=ckp
export KEYCLOAK_CLIENT_ID=cklib
```

Without Keycloak configured, `access: auth` actions will reject all requests. `access: anon` actions work without any auth setup.

## Kernel Directory Structure

A complete kernel directory follows the Three Loops layout:

```
MyKernel/
    conceptkernel.yaml        # CK loop — genome
    README.md                 # CK loop — human summary
    CLAUDE.md                 # CK loop — agent instructions
    SKILL.md                  # CK loop — action catalog
    CHANGELOG.md              # CK loop — version history
    ontology.yaml             # CK loop — LinkML schema
    rules.shacl               # CK loop — SHACL constraints
    serving.json              # CK loop — serving config
    tool/
        processor.py          # TOOL loop — action handlers
    storage/
        instances/            # DATA loop — sealed instances
        ledger/               # DATA loop — event log
        proof/                # DATA loop — verification records
```

Not all files are required to start. The minimum is `conceptkernel.yaml` and `tool/processor.py`. CK.Lib will create `storage/` subdirectories as needed when instances are sealed.

## Configuration

CK.Lib reads configuration from environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `NATS_URL` | `nats://localhost:4222` | NATS server connection |
| `KEYCLOAK_URL` | none | Keycloak server URL |
| `KEYCLOAK_REALM` | `ckp` | Keycloak realm name |
| `KEYCLOAK_CLIENT_ID` | `cklib` | OIDC client ID |
| `CKP_LOG_LEVEL` | `info` | Logging verbosity (debug, info, warn, error) |

## Running the Processor

The processor supports three modes:

```bash
# CLI mode — single action, exit
python3 tool/processor.py --status
python3 tool/processor.py --action greet --payload '{"name": "world"}'

# Listener mode — subscribe to NATS, process messages
python3 tool/processor.py --listen

# Serve mode — HTTP endpoint (if serving.json is configured)
python3 tool/processor.py --serve
```

---

<div style="text-align: center; padding: 2rem 0;">
  <a href="https://discord.gg/sTbfxV9xyU" style="display: inline-block; padding: 0.6rem 1.5rem; background: #5865F2; color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">Need Help? Join Discord</a>
</div>
