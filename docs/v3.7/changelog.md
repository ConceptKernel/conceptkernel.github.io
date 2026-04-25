---
title: Changelog
description: Full changelog for CKP v3.7 -- the nine-part specification covering identity, ontology, runtime, infrastructure, edges & composition, system kernels, and governance.
---

# Changelog

## v3.7 -- Full Specification Release

**Date:** 2026-04-06

CKP v3.7 is the consolidation of the protocol into a single normative specification organised as **nine parts**, covering every aspect of concept kernel design, deployment, and governance.

### What Is New vs v3.5-alpha6

v3.5-alpha6 was the last deployed incremental release. v3.7 adds:

| Area | v3.5-alpha6 | v3.7 |
|---|---|---|
| Specification | 8 delta specs across multiple files | Single unified nine-part spec |
| Governance | CK.Consensus kernel deployed | Part IX: consensus, task engine, graph, sessions, PROV-O |
| Compliance checks | 13 checks | 20 checks (added provenance, edge, topology, governance checks) |
| Ontological graph | 10 Turtle modules loaded | Published triples per project/kernel/edge, SPARQL query catalog |
| Provenance | Instance-level prov fields | Full PROV-O model with three-factor audit chain |

### Specification Scope -- Nine Parts

| Part | Scope |
|---|---|
| I | Foundations: purpose, conformance, terminology, namespaces, design principles |
| II | The Three Loops: CK identity, TOOL capability, DATA knowledge, system integration |
| III | Ontology: BFO 2020 grounding, four-layer model, published modules, SHACL |
| IV | Messaging: NATS transport and topics, message envelope |
| V | Security: loop isolation, authentication, namespace security |
| VI | Edges & Composition: edge predicates, EXTENDS |
| VII | System Kernels: taxonomy, CK.ComplianceCheck, CK.Operator, CK.Project & Libraries |
| VIII | Infrastructure: ConceptKernel + CKProject CRDs, evidence-based proof, reconciliation, versioning |
| IX | Governance & Accumulation: CK.Consensus, task engine, ontological graph, sessions, PROV-O provenance |

::: info Deferred (not part of the v3.7 normative specification)
Six chapters drafted during v3.5.x development -- *CK as Subagent*, *Streaming*, *Web Shell*, *CK Loop Evolution*, *Agent Teams*, *Dynamic Spawning* -- have been moved out of the normative v3.7 spec. They were authored around vendor-specific integrations and aspirational features that belong in tooling specs rather than the protocol specification. The consolidated content is preserved for future revisiting at `parked/3.7-deferred.md` in the source tree; it is intentionally not served on the website.
:::

---

## v3.7 -- serving-multiversion-unpack <Badge type="info" text="SPEC" />

**Date:** 2026-04-06 | **Implements:** CK.Operator v1.3.0

Version materialisation moves from `serving.json` on disk to the project's `.ckproject` manifest (held in [CK.Project](./project)'s DATA organ, reflected onto the cluster as a `CKProject` custom resource). The CK volume becomes purely immutable -- no write-through exceptions. Storage uses per-kernel bare repositories and three sibling directories per kernel version (Option A).

### What Changes

- **`.ckproject` manifest introduced** -- one authoritative instance per project under CK.Project's DATA organ. Holds SHA1 commit pins for each of the 3 organs (`ck/`, `tool/`, `data/`) per kernel version. All other `.ckproject` paths (project-root, filer convenience) are symlinks to it. See [CK.Project](./project).
- **serving.json retired** -- no longer exists on disk. The three problems it created (write-through hack, inert file, decorative git refs) are dissolved by moving version state into the `.ckproject` manifest above.
- **Option A: Three sibling dirs** -- in-container mount layout uses `/ck/{kernel}/ck/`, `/ck/{kernel}/tool/`, `/ck/{kernel}/data/` as three sibling PVs under a kubelet-created namespace directory. No nested volume mounts. Driven by the runc constraint: `mkdirat` fails with EROFS in ReadOnly parent overlays before CSI volume content is visible.
- **Per-kernel bare repos** -- each kernel has its own isolated bare git repository at `/ck/{kernel}/` on the SeaweedFS filer. No monorepo. No `spec.repo`. CK and TOOL loops extract from the same bare repo to sibling `ck/` and `tool/` directories.
- **CKProject CRD** -- `ck.tech.games/v1` kind `CKProject` with `spec.versions` containing per-kernel `ck_ref` and `tool_ref`. `kubectl get ckp -A` shows Phase, Versions, and Checks.
- **kopf + NATS dual control plane** -- both kopf CRD watch and NATS message listener trigger the same `reconcile()` function. `kubectl apply` and `nats pub` produce identical results.
- **CKProject .status patching** -- operator patches `.status` after each reconcile with phase, per-version materialisation state, and aggregate proof.
- **`deploy.materialise` step** -- new reconciliation step between `deploy.namespace` and `deploy.storage`. Extracts CK loop to `/ck/{kernel}/{version}/ck/` and TOOL loop to `/ck/{kernel}/{version}/tool/` via `git archive` from per-kernel bare repos.
- **Three PVs per kernel per version** -- `ck-{project}-{kernel}-{version}-ck`, `ck-{project}-{kernel}-{version}-tool`, `ck-{project}-{kernel}-{version}-data`. CK and TOOL ReadOnlyMany, DATA ReadWriteMany.
- **Per-version deployments** -- each declared version gets its own Deployment and service. Multiple versions run simultaneously at different route prefixes.
- **Per-version HTTPRoutes** -- longest-prefix-first routing. Each version gets its own deployment and route rule.
- **`.git-ref` stamp** -- each materialised loop directory (`ck/` and `tool/`) contains the exact commit hash. Implements `prov:wasGeneratedBy` from Git2PROV.
- **Quick setup mode** -- no git required for bootstrapping. Omit `ck_ref`/`tool_ref` and upload files directly to the filer. Transition to git-managed later without changing PVs or mounts.
- **Garbage collection** -- version directories under `/ck/{kernel}/` not referenced by any CK.Project are deleted. Git internals (`HEAD`, `objects/`, `refs/`) are never GC'd.
- **Shared kernel optimisation** -- identical refs across versions share one filer copy, PVs point to existing path.
- **Backward compatible** -- no `spec.versions` means flat layout, existing projects unchanged.
- **Proven on live cluster** -- `hello-v1-0-0-proc` Running with three sibling PVs on AKS + SeaweedFS 3.93.

### Reconciliation Lifecycle (Versioned -- 12 Steps)

```
  1. deploy.namespace
  2. deploy.materialise          -- NEW
  3. deploy.storage.ck
  4. deploy.storage.tool         -- NEW (separate TOOL PVs)
  5. deploy.storage.data
  6. deploy.processors
  7. deploy.web
  8. deploy.routing
  9. deploy.conceptkernels
  10. deploy.auth
  11. deploy.graph
  12. deploy.endpoint
```

### Deficiencies Resolved

| Deficiency | Resolution |
|-----------|-----------|
| D1: No version materialisation | `git archive` from per-kernel bare repos, commit-pinned via `ck_ref`/`tool_ref` |
| D2: Per-kernel volume isolation | Resolved by three-PV model (ck, tool, data per kernel per version) |
| D3: No serving.json write-through | serving.json retired; version pins now live in `.ckproject` manifest (reflected to `CKProject` CR) |
| D6: No git integration on filer | Per-kernel bare repos on filer, `.git-ref` traceability |

### New CK.Project CRD Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec.versions` | array | SHOULD | Version declarations |
| `spec.versions[].name` | string | MUST | Version tag (used in PV names, filer paths, routes) |
| `spec.versions[].route` | string | MUST | URL path prefix on project hostname |
| `spec.versions[].data` | string | SHOULD | "isolated" or "shared" -- DATA directory scoping |
| `spec.versions[].kernels` | array | MUST | Per-kernel declarations |
| `spec.versions[].kernels[].name` | string | MUST | Concept kernel name |
| `spec.versions[].kernels[].ck_ref` | string | MAY | Git commit hash for CK loop extraction |
| `spec.versions[].kernels[].tool_ref` | string | MAY | Git commit hash for TOOL loop extraction |

### New Ontology Classes

- `VersionDeclaration` -- named version with per-kernel refs, mapped to a URL route
- `KernelVersionRef` -- per-kernel git refs for a specific version deployment

---

## Incremental Versions (v3.5.x)

All notable changes in the development increments that compose v3.7. Each version was an independently shippable increment. Versions marked DEPLOYED have running proof on the reference cluster.

### v3.5.12 -- Jena Fuseki /ckp Dataset <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-06

- Loaded 10 CKP v3.5-alpha6 Turtle modules into `/ckp` dataset on Jena Fuseki
- 2,797 triples across core, proof, base-instances, kernel-metadata, processes, rbac, relations, self-improvement, shapes, workflow modules
- SPARQL endpoint live at `jena-fuseki.jena.svc:3030/ckp/sparql`
- `kernel-entity-template.ttl` renamed to `kernel-entity-template.ttl.template` — it's a scaffolding template with placeholder tokens, not valid Turtle. The new suffix keeps it out of the `*.ttl` glob used by the ontology loader, so Jena Fuseki no longer attempts to parse it (previously returned HTTP 400).
- 7 of 17 spec-declared modules not yet published as Turtle (instance, action, identity, governance, lifecycle, economic, topology)

### v3.5.11 -- CK.Consensus Kernel <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-06

- CK.Consensus kernel: ontological governance engine
- Five actions: propose, evaluate, approve, decisions, review
- Review action EXTENDS a capability provider (deployment-specific) with a strict-auditor-style template
- Proposal evaluation against ontology + SHACL + fleet topology
- Task generation for downstream execution by an authorised executor
- Every decision is a `prov:Activity` with full audit chain
- `spec-parts/consensus-loop.md`: normative definition

### v3.5.10 -- EXTENDS Predicate <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-06

- EXTENDS predicate implementation in `cklib/actions.py`
- EXTENDS creates NEW actions on source kernel from edge config (not inherited from target)
- `get_effective_actions()` enriches EXTENDS actions with the edge's `template` and `constraints` metadata
- First capability-provider kernel deployed (vendor-specific; not part of the protocol — see [parked deferred chapters](https://github.com/ConceptKernel/conceptkernel.github.io/blob/main/parked/3.7-deferred.md))
- `resolve_composed_actions()`: COMPOSES inherits target actions; EXTENDS creates new from edge config
- `spec-parts/extends-predicate.md`: full normative definition

### v3.5.9 -- Stream Topic Added <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-06

- `stream.{kernel}` topic added to NatsKernelLoop (`cklib/nats_loop.py`) for progressive output from `agent`-type kernels
- `stream_event()` callback passed to handlers for per-token NATS publishing
- Handler signature extended: `handler_fn(body, nc=, trace_id=, stream=)` -- backwards compatible
- Structured JSON logging replaces `[rx]`/`[tx]` print statements
- `_log()` method for spec-compliant JSON output (ts, level, kernel, event)
- `spec-parts/structured-logging.md`: stream topic definition + conformance

### v3.5.8 -- Subagent Tooling <Badge type="info" text="DEFERRED" />

**Date:** 2026-04-06

This increment landed a vendor-specific subagent integration (talking to a kernel through an external IDE-style assistant). The chapter is preserved at [parked/3.7-deferred.md](https://github.com/ConceptKernel/conceptkernel.github.io/blob/main/parked/3.7-deferred.md) for future revisiting; it is not part of the v3.7 normative specification.

### v3.5.7 -- Hello.Greeter Kernel <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-05

- Hello.Greeter kernel: `conceptkernel.yaml`, `CLAUDE.md`, `SKILL.md`, `ontology.yaml`, `processor.py`
- Deployed to `hello.tech.games` via CK.Operator: own namespace (`ck-hello`), own Keycloak realm (`hello`)
- `KeycloakRealmImport` CR created: `hello-realm` with ck-web client, EdDSA keys, wildcard redirect
- `hello.tech.games`: HTTP 200, 15/15 checks, Hello.Greeter Running
- `delvinator.tech.games`: HTTP 200, 15/15 checks, 6 kernels Running
- `kubectl get ck -A`: 7 kernels across 2 namespaces
- Keycloak realms: `techgames` (reused by delvinator), `hello` (created by operator)
- RBAC fix: patch verb for namespaces, PVs, PVCs, keycloakrealmimports
- SeaweedFS filer upload: `?mode=0644` for world-readable permissions

### v3.5.6.1 -- Console Config Fix <Badge type="info" text="PATCH" />

**Date:** 2026-04-06

- `resolveConfig()` tries `window.__CK_CONFIG` -> fetch `/` -> URL params
- CK.Operator always present in kernel list (control plane)
- Action discovery: sends `{action: "status"}` to each kernel on boot, parses actions from response
- Dynamic action sidebar with `lock`/`lock_open` icons per access level
- Clicking action fills JSON template with params
- No inline HTML -- all DOM via `el()` helper
- Material Icons for kernel types (`admin_panel_settings` for operator, `memory` for domain)

### v3.5.6 -- Web Shell <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-05

- `CK.Lib.Js/console.html` -- three-panel web console (proper HTML/CSS/JS, not inline Python)
- `CK.Lib.Js/console.css` -- dark theme, responsive layout
- `CK.Lib.Js/console.js` -- NATS subscriptions, kernel switching, auth via `ck-client.js`, view modes
- Operator `index.html` now links to `/cklib/console.html` for full UI
- Live at `https://delvinator.tech.games/cklib/console.html` -- HTTP 200
- SeaweedFS filer upload permissions: `?mode=0644` for world-readable files
- `spec-parts/part-iv-vii.md`: Section 32.8 Web Console reference, Section 33 CK.Lib.Js note

### v3.5.5 -- AuthConfig + deploy.auth <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-05

- `AuthConfig` class in CK.Project `ontology.yaml` (keycloak/none modes, reuse/create realm)
- `deploy.auth` step in `reconcile.py` (KeycloakRealmImport generator, OIDC verification)
- `verify_oidc_discovery` + `verify_jwks` in `verify.py`
- Auth env injection (`KEYCLOAK_ISSUER`, `KEYCLOAK_CLIENT_ID`) into processor deployments
- Clean minimal `index.html` with auth config passed to `ck-client.js`
- Keycloak RBAC: `keycloakrealmimports: get, list, create`
- `delvinator.tech.games`: 15/15 checks (13 infra + 2 auth: oidc_discovery + jwks_reachable)
- `kubectl apply --server-side --force-conflicts` for idempotent deployment updates
- RBAC fix: added patch verb to configmaps, deployments, services, httproutes
- `spec-parts/auth-config.md` implemented

### v3.5.4 -- CK-as-Subagent Delta Spec <Badge type="info" text="SPEC" />

**Date:** 2026-04-05

- `SPEC.CKP.v3.5.4.delta.md`: subagent (D1-D4, deferred), stream topic (D5), local-bridge (D6, deferred), Consensus loop (D7), EXTENDS predicate (D8)
- Consensus services integration: `PLAN.v002.md`, updated CLAUDE.md + README.md in `ref-consensus-services/`

### v3.5.3 -- Auth/Web Shell Delta Spec <Badge type="info" text="SPEC" />

**Date:** 2026-04-05

- `SPEC.CKP.v3.5.3.delta.md`: AuthConfig (D1), deploy.auth (D2), Web shell (D3), kernel.create via web (D4)
- `spec-parts/auth-config.md`, `spec-parts/web-shell.md`

### v3.5.2 -- CRD + Proof + Namespace Isolation <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-05

- `SPEC.CKP.v3.5.2.delta.md`: Evidence-based proof (D1), ConceptKernel CRD (D2), Namespace isolation (D3), Structured logging (D4)
- ConceptKernel CRD: `conceptkernel.org/v1`, shortname `ck`
- CK.Operator deployed to `ck-system`, connected to NATS
- 6 delvinator kernels: Running, 13/13 checks, chain valid
- `delvinator.tech.games`: HTTP 200, three-loop separation (ROX + RWX)
- `deploy/02-crd-conceptkernel.yaml` -- ConceptKernel CRD definition
- `deploy/05-operator.yaml` -- CK.Operator deployment manifest
- GitHub release: `ConceptKernel/CK.Operator v1.0.0`
- Cleaned stale `ontosys.io` CRDs + resources (146d old)
- Removed all "enterprise" terminology from spec-parts (replaced with "fleet", "economic", "protocol")

### v3.5.1 -- Full Specification <Badge type="info" text="SPEC" />

**Date:** 2026-04-05

- `SPEC.CKP.v3.5.final.md` (4,069 lines, W3C-style, 50 chapters)
- `SPEC.CKP.v3.5.implementation.md` (technology-specific companion)
- `spec-parts/` directory (8 files: skeleton, part-i-iii, part-iv-vii, part-viii-x, chapters-30-32-33, ontology-reference, roast-findings, logic-findings)
- `spec-parts/proof-verification-model.md`
