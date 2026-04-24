---
title: CK.Project, CK.Lib.Py, and CK.Lib.Js
description: Project declaration via CK.Project, the 18-module Python runtime (CK.Lib.Py), and the 12-module JavaScript client (CK.Lib.Js).
---

# CK.Project, CK.Lib.Py, and CK.Lib.Js

## CK.Project -- Project Declaration

### Purpose

A CK.Project declares the existence, scope, and configuration of a project -- a coherent collection of kernels under a shared domain. It answers: "What kernels exist, what domain do they serve, how are they stored, and how are users authenticated?"

CK.Project is a `static` kernel because it holds only declarations; it has no processor that executes actions at runtime. [CK.Operator](./operator) COMPOSES it to access project data.

| Property | Value |
|----------|-------|
| URN | `ckp://Kernel#CK.Project:v1.0` |
| Type | `static` |
| Governance | `STRICT` |
| Archetype | Declarator |

### The `.ckproject` Manifest

CK.Project's DATA organ holds one **`.ckproject` manifest** per tracked project, keyed by the project's hostname. The hostname is the project's identity -- it determines DNS routing, namespace naming, and filer path prefixes.

The `.ckproject` manifest is the authoritative record of the project's frozen deployment *intent* -- which kernels, which versions, which commits. [CK.Operator](./operator) reads it to materialize kernels at their pinned versions. Note that "frozen" applies to the CK and TOOL organs (ReadOnlyMany at runtime); the DATA organ still drifts at runtime by design -- see [Pin Semantics](#pin-semantics-pins-ck-pins-tool-pins-data) below for the asymmetry.

**Canonical path** (inside CK.Project's DATA organ on the SeaweedFS filer):

```
/ck-data/<project-hostname>/CK.Project/<version>/instances/.ckproject
```

**Every other `.ckproject` you see is a symlink**, including:

| Location | Typical use |
|---|---|
| `/ck-data/<project-hostname>/.ckproject` | Convenience entry point at the project's DATA root on the filer |
| `<project-root>/.ckproject` | Symlinked into the project's git working tree (via filer-backed volume mount) so developers and CI see the same manifest the cluster does |

The symlink contract means there is exactly one authoritative manifest; the other paths are readable views of the same file.

### Manifest Contents

A `.ckproject` manifest declares:

1. **Project identity** -- `domain`, `serving.subdomain`, hostname, namespace naming
2. **Version pins per kernel** -- a SHA1 commit hash for each of the 3 organs (`ck/`, `tool/`, `data/`) per kernel version the project should deploy. These pins are what freeze a deployment: CK.Operator mounts exactly the commits named here
3. **AuthConfig** (optional) -- OIDC identity provider configuration (see [Auth](./auth))
4. **Gateway binding** -- Kubernetes Gateway API `parentRef`
5. **Backends** -- NATS endpoint, WSS endpoint, filer prefix

```yaml
# .ckproject manifest: delvinator.tech.games
domain: tech.games
serving:
  subdomain: delvinator
  hostname: delvinator.tech.games
storage: volume
gateway:
  parentRef:
    name: multi-domain-gateway
    namespace: gateway-system
backends:
  nats:
    endpoint: nats://nats.nats.svc:4222
    wssEndpoint: wss://stream.tech.games

# SHA1 pins per kernel (materialization intent)
versions:
  Delvinator.Core:
    version: v1.3.19
    pins:
      ck:   "abc123f..."  # SHA1 of ck/ organ at this version
      tool: "bbb222..."   # SHA1 of tool/ organ at this version
      data: "ccc333..."   # SHA1 of initial data/ seed at this version
  Hello.Greeter:
    version: v1.3.2
    pins:
      ck:   "..."
      tool: "..."
      data: "..."
```

Rolling back a kernel means editing its pin in the manifest and re-reconciling -- no git history rewriting, no container mutation. See [Versioning](./versioning) for the filer layout these pins resolve against, and [Operator](./operator) for how reconciliation consumes the manifest.

### Pin Semantics (`pins.ck`, `pins.tool`, `pins.data`)

Each pin is a SHA1 commit hash from the kernel's per-organ bare repository on the SeaweedFS filer (see [Versioning](./versioning) for the per-kernel bare-repo layout). The three pins are not symmetric:

| Pin | Role | Lifetime on DATA organ | Required |
|---|---|---|---|
| `pins.ck` | Identity materialisation — CK.Operator runs `git archive <pin>` from `/ck/{kernel}/` to produce `/ck/{kernel}/{version}/ck/`. The commit is stamped into `.git-ref`. | Immutable at runtime (CK organ is ReadOnlyMany). | **REQUIRED** |
| `pins.tool` | Capability materialisation — same mechanism, extracts to `/ck/{kernel}/{version}/tool/`. | Immutable at runtime (TOOL organ is ReadOnlyMany). | **REQUIRED** |
| `pins.data` | Initial seed — records the commit that populates `/ck-data/{hostname}/{kernel}/{version}/` at first reconcile. Kernels that start from an empty DATA organ can omit this. | The pin captures *seed* state. Runtime drift is expected and correct — DATA is ReadWriteMany. The seed `.git-ref` stays stamped as provenance of where the data organ started, not what it contains now. | OPTIONAL |

At materialisation time, `deploy.materialise` verifies that each extracted organ's `.git-ref` matches its declared pin. If it doesn't, the reconcile fails and the kernel is not promoted.

### Required Fields

A conformant `.ckproject` manifest MUST declare:

| Field | Type | Description |
|-------|------|-------------|
| `domain` | string | DNS domain for all kernels in the project |
| `serving.subdomain` | string | Subdomain prefix; namespace derived as `ck-{subdomain}` |
| `storage` | enum | Deployment method: `volume`, `filer`, or `configmap` |
| `gateway.parentRef.name` | string | Kubernetes Gateway API gateway name |
| `gateway.parentRef.namespace` | string | Gateway namespace |
| `versions.<kernel>.version` | semver | Kernel version tag the project should deploy |
| `versions.<kernel>.pins.{ck,tool,data}` | SHA1 string | Commit hash pinning each organ for the declared version |

### AuthConfig (manifest-level binding)

A `.ckproject` manifest MAY include an `auth` block that binds the project to an OIDC identity provider. Identity is project-scoped: each project has its own realm, client, and access policies.

```yaml
# .ckproject (fragment)
auth:
  provider: keycloak
  realm: realm-name
  client_id: ck-web
  issuer_url: https://id.example.com/realms/realm-name
  # see auth.md for the full schema and create_realm semantics
```

The canonical treatment of AuthConfig -- full schema, reuse vs. create-realm modes, the `deploy.auth` reconciliation step, JWT verification, token refresh, and grants enforcement -- lives in **[Auth](./auth)**. This section lists only the manifest-level rules that CK.Project's instance data must satisfy:

- If `auth` is omitted, the project operates anonymous-only. All actions declared `access: auth` become unreachable.
- If `auth.provider == keycloak`, the fields `realm`, `client_id`, and `issuer_url` MUST be present.
- If `auth.create_realm == true`, the fields `redirect_uris` and `web_origins` MUST be present.
- On project teardown, any `KeycloakRealmImport` CR created by `deploy.auth` is RETAINED -- identity outlives compute.

### Ontology Publishing

Each project SHOULD publish a Layer 2 ontology importing CKP Layer 1:

```yaml
id: https://example.org/ontology/v1/{project-name}
prefixes:
  ckp: https://conceptkernel.org/ontology/v3.7/
  bfo: http://purl.obolibrary.org/obo/BFO_
  prov: http://www.w3.org/ns/prov#
  proj: https://example.org/ontology/v1/

classes:
  ProjectKernel:
    is_a: ckp:Kernel
    attributes:
      project_name: { range: string, required: true }
      kernel_count: { range: integer }
```

### CK.Project Conformance

| Criterion | Level |
|-----------|-------|
| Each project MUST have exactly one authoritative `.ckproject` manifest under CK.Project's DATA organ | REQUIRED |
| All other `.ckproject` entries (project-root, filer convenience) MUST be symlinks to the authoritative manifest | REQUIRED |
| `.ckproject` MUST declare `domain`, `serving.subdomain`, `storage`, `gateway.parentRef` | REQUIRED |
| Each kernel listed in `versions` MUST declare SHA1 pins for `ck`, `tool`, and `data` organs | REQUIRED |
| Each project SHOULD publish a Layer 2 ontology | RECOMMENDED |
| Project `ontology.yaml` MUST import CKP Layer 1 | REQUIRED |
| If `auth.provider` is `keycloak`, `realm`, `client_id`, `issuer_url` MUST be present | REQUIRED |
| If `create_realm` is `true`, `redirect_uris` and `web_origins` MUST be present | REQUIRED |

---

## CK.Lib.Py -- Python Runtime

### Purpose

CK.Lib.Py (`conceptkernel` on PyPI) is the canonical Python runtime library for CKP. Every Python-based Concept Kernel MUST use CK.Lib.Py (or a compatible implementation) to participate in the CKP ecosystem. The library codifies the CKP contract -- three-loop separation, instance lifecycle, PROV-O provenance, edge composition, RBAC -- as executable code.

| Property | Value |
|----------|-------|
| Package | `conceptkernel` on PyPI |
| Import | `import cklib` |
| Python | >= 3.11 |
| Dependencies | `pyyaml`, `nats-py`, `httpx`, `pyjwt`, `fastapi`, `uvicorn` |
| License | MIT |

### Architecture

CK.Lib.Py implements the server-side CKP runtime. It runs on cluster nodes or local machines, connects to NATS via `nats-py` (native TCP or WSS), has filesystem access to `data/`, and writes instances, proofs, and ledger entries.

```
CLUSTER / LOCAL MACHINE (Python, nats-py)
  KernelProcessor          -- ckp:Kernel
  NatsKernelLoop           -- ckp:NATSListening
  instance.py              -- ckp:InstanceManifest, ckp:SealedInstance
  prov.py                  -- prov:Activity chain
  actions.py               -- ckp:Edge + ckp:RelationshipType
```

### 18 Modules

| # | Module | Ontology Class | Purpose | Key Exports |
|---|--------|---------------|---------|-------------|
| 1 | `processor.py` | `ckp:Kernel` | Base class for all kernel processors | `KernelProcessor` |
| 2 | `events.py` | `ckp:Action` | Action handler decorator and typed event emission | `on()`, `emit()` |
| 3 | `instance.py` | `ckp:InstanceManifest`, `ckp:SealedInstance` | Instance lifecycle: create, seal, ledger, proof | `create_instance()`, `seal_instance()`, `append_ledger()` |
| 4 | `ledger.py` | `ckp:LedgerEntry` | Kernel-wide append-only JSONL action log | `log_action()`, `read_ledger()` |
| 5 | `schema.py` | `ckp:SealedInstance` validation | LinkML ontology.yaml loading and validation | `load_schema()`, `validate_instance()`, `has_schema()` |
| 6 | `context.py` | N/A | Three-loop-aware context builder | `build_context()` |
| 7 | `capacity.py` | N/A | Concurrency control via file-based capacity management | `check_capacity()`, `acquire()`, `release()` |
| 8 | `occurrent.py` | `ckp:Occurrent` (BFO:0000015) | Action substeps with PROV-O proof and hash chains | `ActionOccurrent`, `StepRecord` |
| 9 | `edges.py` | `ckp:Edge`, `ckp:RelationshipType` | Edge subscription materialisation for NATS | `materialise_edge_subscriptions()` |
| 10 | `actions.py` | `ckp:Action`, rbac.ttl | Action type resolution, composition, RBAC | `resolve_action_type()`, `check_access()`, `get_effective_actions()` |
| 11 | `dispatch.py` | `ckp:EdgeCommunication` | Local inter-kernel action dispatch and FIFO queue | `send_action()`, `queue_action()`, `run_queue()` |
| 12 | `serve.py` | `ckp:WebServing`, `ckp:APIServing` | FastAPI HTTP server wrapping @on handlers | `KernelServer` |
| 13 | `auth.py` | rbac.ttl | Keycloak JWT verification + API token fallback | `CKAuth` |
| 14 | `urn.py` | CKP URN scheme | CKP URN parser, validator, builder (17 entity types) | `parse_urn()`, `validate_urn()`, `build_urn()` |
| 15 | `prov.py` | `prov:Activity` | PROV-O session recording for any kernel | `ProvChain`, `Session`, `verified_action()` |
| 16 | `execution.py` | `ckp:ProofRecord`, `ckp:ProofCheck` | Multi-step execution proofs with hash chains | `hash_step()`, `build_execution_proof()`, `verify_chain()` |
| 17 | `entities.py` | N/A | In-memory entity store with code-based lookup | `EntityManager` |
| 18 | `nats_loop.py` | `ckp:NATSListening` | NATS subscriber loop implementing CK processing cycle | `NatsKernelLoop` |

### KernelProcessor Base Class

`KernelProcessor` is the base class that every Python kernel subclasses. On construction it reads `conceptkernel.yaml` (CK loop), resolves paths, and prepares the handler dispatch table.

| Member | Kind | Description |
|--------|------|-------------|
| `KernelProcessor(ck_dir=None)` | constructor | Initialise; loads identity from `conceptkernel.yaml` |
| `.identity` | property | Lazy-loaded parsed identity dict |
| `.name` | property | `metadata.name` from identity |
| `.urn` | property | `metadata.urn` from identity |
| `.kernel_type` | property | `qualities.type` (e.g., `node:hot`) |
| `.governance` | property | `qualities.governance_mode` |
| `.handle_message(msg)` | method | Dispatch to @on handler; resolution: own -> built-in -> composed -> error |
| `.listen()` | method | Start `NatsKernelLoop` subscriber (blocking) |
| `.serve(port=8901)` | method | Start FastAPI HTTP server via `KernelServer` |
| `KernelProcessor.run()` | classmethod | CLI entry point: `--status`, `--listen`, `--serve`, `--action`, `--data` |

### NatsKernelLoop

The NATS processing cycle enforces three-loop separation at the message level:

1. Connect to NATS (TCP or WSS)
2. Subscribe to `input.{KernelName}`
3. For each message:
   - Parse headers (`Trace-Id`, `X-Kernel-ID`, `X-User-ID`, `Authorization`)
   - Verify JWT if `Authorization: Bearer` present; fallback to anonymous
   - RBAC grants check via `check_access()`
   - Dispatch to `handler_fn(body)` (supports sync and async handlers)
   - Write instance record to `data/instances/i-{trace}-{ts}/message.json`
   - Publish result to `result.{KernelName}` with headers
   - Publish event to `event.{KernelName}`

The handler returns data; the platform writes it. This is the three-loop contract in action.

### Processor Pattern

```python
from cklib import KernelProcessor, on, emit

class MyKernel(KernelProcessor):
    @on("my.action")
    def handle(self, data):
        result = {"answer": 42}
        return emit("ActionCompleted", result=result)

if __name__ == "__main__":
    MyKernel.run()
    # CLI modes: --status, --action, --listen, --serve
```

### CK.Lib.Py Conformance

| Criterion | Level |
|-----------|-------|
| CK.Lib.Py MUST enforce three-loop separation | REQUIRED |
| Handlers MUST NOT write to `data/` directly | REQUIRED |
| JWT verification MUST occur before handler dispatch | REQUIRED |
| PROV-O provenance MUST be generated for every instance | REQUIRED |
| Edge composition MUST derive from `conceptkernel.yaml` declarations | REQUIRED |
| Kernel processors MUST output structured JSON logs to stdout | REQUIRED |
| All 18 modules MUST be importable from the `cklib` package | REQUIRED |

---

## CK.Lib.Js -- JavaScript Client

### Purpose

CK.Lib.Js (`@conceptkernel/cklib` on npm) is the canonical JavaScript client library for CKP. It runs in browsers and Node.js environments, connecting to NATS via WebSocket Secure (WSS). CK.Lib.Js provides no filesystem access -- it is a pure messaging client.

The browser is an isolated client, like any CLI tool. It publishes action messages to `input.*` topics and subscribes to `result.*` and `event.*` topics. All mutations happen server-side in kernel processors. The client never reads or writes kernel filesystems.

| Property | Value |
|----------|-------|
| Package | `@conceptkernel/cklib` on npm |
| Main entry | `ck-client.js` |
| Type | ESM module |
| Dependencies | `nats.ws` ^1.30.3 |
| License | MIT |

### 12 Modules

| # | Module | Export Path | Ontology Grounding | Purpose |
|---|--------|------------|-------------------|---------|
| 1 | `ck-client.js` | `.` / `./client` | `ckp:NATSBrowserClient` | Core NATS WSS client; connection, auth, send, subscribe |
| 2 | `ck-page.js` | `./page` | `ckp:InlineKernel` | Page harness; auto-detects kernel, renders chrome |
| 3 | `ck-bus.js` | `./bus` | `ckp:EdgeCommunication` | In-browser event bus for decoupled component communication |
| 4 | `ck-kernel.js` | `./kernel` | -- | Kernel-specific CSS variables and theming |
| 5 | `ck-registry.js` | `./registry` | `ckp:Project` | Kernel registry for multi-kernel page composition |
| 6 | `ck-runtime.js` | `./runtime` | -- | Client-side runtime utilities |
| 7 | `ck-materializer.js` | `./materializer` | -- | Client-side resource materialisation |
| 8 | `ck-store.js` | `./store` | -- | Client-side state persistence (localStorage + server filer) |
| 9 | `ck-shapes.js` | `./shapes` | `sh:NodeShape` | SHACL shape rendering and validation UI |
| 10 | `ck-anim.js` | `./anim` | -- | Animation engine for kernel visualisations |
| 11 | `ck-anim-grammar.js` | (internal) | -- | Animation grammar parser |
| 12 | `ck-sound.js` | `./sound` | -- | Web Audio API integration for kernel sound effects |

### CKClient API

CKClient is the core NATS WSS client. It manages connection lifecycle, authentication escalation, and message send/receive.

```javascript
const ck = new CKClient({
  kernel: "Delvinator.Core",
  wssEndpoint: "wss://stream.tech.games",
  authEndpoint: "https://id.tech.games",
  realm: "techgames",
  clientId: "ck-web"
})
```

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | `Promise<boolean>` | Connect to NATS WSS, auto-subscribe to `result.{kernel}` and `event.{kernel}` |
| `send(data)` | `Promise<string>` | Publish to `input.{kernel}`; returns `traceId` |
| `login(username, password)` | `Promise<string>` | Keycloak password grant; returns userId |
| `logout()` | `void` | Downgrade to anonymous identity |
| `disconnect()` | `Promise<void>` | Unsubscribe all, drain connection |
| `on(event, fn)` | `void` | Subscribe to: `"result"`, `"event"`, `"status"`, `"error"` |
| `off(event, fn)` | `void` | Unsubscribe from event |

### Authentication Lifecycle

1. **Anonymous connect:** Generate `anon_{random_hex}` identity, connect to WSS, subscribe to result/event topics
2. **Login escalation:** POST to Keycloak token endpoint (`grant_type=password`), upgrade identity, attach JWT to all subsequent messages
3. **Token refresh:** Auto-refresh when access token is within 30 seconds of expiry. On failure, revert to anonymous
4. **Logout:** Downgrade to anonymous identity without NATS reconnect

### CKPage -- Web Console

CKPage is the unified page harness (`console.html`) that auto-detects the kernel from `/ontology.yaml`, connects NATS via CKClient, and renders the standard CKP chrome.

**Three-panel layout:**

| Panel | Width | Content |
|-------|-------|---------|
| Action sidebar | 160px | Actions from kernel's `spec.actions`, NATS topics, message history |
| Parameter form | 280px | Per-action input fields, JSON preview, send button |
| Results | flex | NATS messages in chat, body, or envelope view |


### CK.Lib.Js Conformance

| Criterion | Level |
|-----------|-------|
| CKClient MUST implement anonymous-first connection | REQUIRED |
| CKClient MUST include all specified NATS headers on every message | REQUIRED |
| Control data MUST reside in headers, not in body payloads | REQUIRED |
| Token refresh MUST occur automatically before expiry | REQUIRED |
| CKClient MUST handle NATS reconnection transparently | REQUIRED |
| CKPage MUST load from CK.Lib.Js on the CK volume, not from CDN at runtime | REQUIRED |
