---
title: Introduction to CKP v3.6
description: Overview of the v3.6 release train -- auth, web shell, subagent, streaming, EXTENDS, consensus.
---

# Introduction to CKP v3.6

## What is v3.6?

CKP v3.6 consolidates the v3.5.x delta train into a coherent release. Where v3.5 established the foundation (spec, three-loop model, BFO ontology), v3.6 delivers the **runtime**: operator + auth + web UI + Claude integration + consensus governance.

The release is built from independently-shippable increments (v3.5.5 through v3.5.12), each building on the previous. The full v3.6 release is their sum.

## Release Train

| Increment | Feature | Status |
|-----------|---------|--------|
| v3.5.5 | AuthConfig + deploy.auth | Deployed |
| v3.5.6 | Web shell (console.html in CK.Lib.Js) | Deployed |
| v3.5.7 | Hello.Greeter kernel + deploy | Deployed |
| v3.5.8 | CK as Claude Code subagent | Deployed |
| v3.5.9 | Claude streaming via NATS | Deployed |
| v3.5.10 | EXTENDS predicate + CK.Claude kernel | Deployed |
| v3.5.11 | Consensus loop | Deployed |
| v3.5.12 | Jena Fuseki CKP ontology dataset | Deployed |

## What's New

### Authentication and Web Shell

CK.Operator now creates projects with working login and a kernel-driven web UI. OIDC via Keycloak (reuse existing realm or create a new one). A three-panel console: action sidebar, parameter form, results panel. Kernel lifecycle from the browser -- `kernel.create` via authenticated NATS. [Read more](/v3.6/auth)

### CK as Claude Code Subagent

Every Concept Kernel is a Claude Code subagent. The `/ck` skill loads the kernel's CK loop (CLAUDE.md, SKILL.md, conceptkernel.yaml, ontology.yaml, memory) as agent context. Three-loop discipline enforced: CK read-only, TOOL read-only, DATA writable. [Read more](/v3.6/subagent)

### Claude Streaming via NATS

`stream.{kernel}` topic carries per-token Claude output. The `claude_agent_sdk` event stream maps to NATS payloads. Browser renders progressive chat bubbles. Same SDK works locally and in cluster. [Read more](/v3.6/streaming)

### EXTENDS Predicate + CK.Claude

Any kernel can mount Claude capability via an `EXTENDS` edge. Persona templates control behavior per-kernel. Actions created by EXTENDS live on the source kernel, not on CK.Claude. The ontology shapes the output. [Read more](/v3.6/extends)

### Consensus Loop

Changes to concept kernels go through ontological governance. Developer talks to kernel via `/ck`, proposes changes through consensus. The ontology, SHACL rules, and fleet topology evaluate the proposal. Approved changes become tasks executed by headless Claude Code. [Read more](/v3.6/consensus)

## Architecture

v3.6 does not change the foundational architecture from v3.5. The three-loop model, BFO grounding, and four-layer ontology import chain remain unchanged:

| Loop | Existential Question | DL Box | Volume |
|------|---------------------|--------|--------|
| **CK** | Who am I? | TBox | `ck-{guid}-ck` (ReadOnly) |
| **TOOL** | What can I do? | RBox | `ck-{guid}-tool` (ReadOnly) |
| **DATA** | What have I produced? | ABox | `ck-{guid}-storage` (ReadWrite) |

What v3.6 adds is the **runtime interaction layer**: how humans and agents talk to kernels, how kernels evolve through conversation, and how Claude capability is mounted onto the ontological graph.

## Proof

The v3.6 features are deployed and verified:

- **Auth**: `delvinator.tech.games` and `hello.tech.games` both accept login via Keycloak
- **Web shell**: `delvinator.tech.games/cklib/console.html` serves the three-panel UI
- **Subagent**: `/ck Operator` spawns a subagent with CK.Operator identity
- **Streaming**: `stream.{kernel}` events render as progressive bubbles in browser
- **EXTENDS**: `Delvinator.Core` gains `analyze` action via CK.Claude
- **Consensus**: `/ck Core "add quality scoring"` goes through ontological governance
- **Fuseki**: `jena.conceptkernel.dev/ckp/sparql` serves 2,797 triples from 10 Turtle modules
- **Cluster**: `kubectl get ck -A` shows 7 kernels across 2 namespaces
