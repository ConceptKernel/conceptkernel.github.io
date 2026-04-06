---
title: Changelog
description: Full version-by-version changelog for CKP v3.6, covering every increment from v3.5.1 through v3.5.16.
---

# Changelog

All notable changes in the CKP v3.6 release train. Each version is an independently shippable increment. Versions marked DEPLOYED have running proof on the reference cluster.

## v3.5.12 -- Jena Fuseki /ckp Dataset <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-06

- Loaded 10 CKP v3.5-alpha6 Turtle modules into `/ckp` dataset on Jena Fuseki
- 2,797 triples across core, proof, base-instances, kernel-metadata, processes, rbac, relations, self-improvement, shapes, workflow modules
- SPARQL endpoint live at `jena-fuseki.jena.svc:3030/ckp/sparql`
- `kernel-entity-template.ttl` skipped (parse error, HTTP 400)
- 7 of 10 spec-declared modules not yet published as Turtle (instance, action, identity, governance, lifecycle, economic, topology)

## v3.5.11 -- CK.Consensus Kernel <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-06

- CK.Consensus kernel: ontological governance engine
- Five actions: propose, evaluate, approve, decisions, review
- Review action EXTENDS CK.Claude with `strict-auditor` persona
- Proposal evaluation against ontology + SHACL + fleet topology
- Task generation for headless Claude execution
- Every decision is a `prov:Activity` with full audit chain
- `spec-parts/consensus-loop.md`: normative definition

## v3.5.10 -- EXTENDS Predicate + CK.Claude <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-06

- EXTENDS predicate implementation in `cklib/actions.py`
- EXTENDS creates NEW actions on source kernel from edge config (not inherited from target)
- `get_effective_actions()` enriches EXTENDS actions with persona + constraints metadata
- CK.Claude kernel: agent-type with persona templates (analytical-reviewer, friendly-assistant, strict-auditor)
- CK.Claude `processor.py`: handles message/analyze/summarize via `claude -p` with persona loading
- `resolve_composed_actions()`: COMPOSES inherits target actions; EXTENDS creates new from edge config
- `spec-parts/extends-predicate.md`: full normative definition

## v3.5.9 -- Claude Streaming via NATS <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-06

- `stream.{kernel}` topic added to NatsKernelLoop (`cklib/nats_loop.py`)
- `stream_event()` callback passed to handlers for per-token NATS publishing
- Handler signature extended: `handler_fn(body, nc=, trace_id=, stream=)` -- backwards compatible
- Structured JSON logging replaces `[rx]`/`[tx]` print statements
- `_log()` method for spec-compliant JSON output (ts, level, kernel, event)
- `spec-parts/structured-logging.md`: stream topic definition + conformance

## v3.5.8 -- CK as Claude Code Subagent <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-06

- Updated ck-agent skill (`~/.claude/skills/ck-agent/SKILL.md`) for CKP v3.5 layout
- CLAUDE.md at root (not llm/), SKILL.md loading, ontology.yaml summary
- Three-loop discipline enforced: CK read-only, TOOL read-only, DATA writable
- Memory persistence: `storage/memory/MEMORY.md` (DATA loop)
- Multi-root search: `$CK_CONCEPTS_DIR`, `./concepts/`, `~/git/delve_workspace/concepts/`
- Fuzzy kernel resolution: `CK.*`, `Delvinator.*`, `CS.*`, `Hello.*`
- NATS bridge: optional dispatch to live kernel via `nats pub`
- `storage/memory/` directories created for all kernels

## v3.5.7 -- Hello.Greeter Kernel <Badge type="tip" text="DEPLOYED" />

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

## v3.5.6.1 -- Console Config Fix <Badge type="info" text="PATCH" />

**Date:** 2026-04-06

- `resolveConfig()` tries `window.__CK_CONFIG` -> fetch `/` -> URL params
- CK.Operator always present in kernel list (control plane)
- Action discovery: sends `{action: "status"}` to each kernel on boot, parses actions from response
- Dynamic action sidebar with `lock`/`lock_open` icons per access level
- Clicking action fills JSON template with params
- No inline HTML -- all DOM via `el()` helper
- Material Icons for kernel types (`admin_panel_settings` for operator, `memory` for domain)

## v3.5.6 -- Web Shell <Badge type="tip" text="DEPLOYED" />

**Date:** 2026-04-05

- `CK.Lib.Js/console.html` -- three-panel web console (proper HTML/CSS/JS, not inline Python)
- `CK.Lib.Js/console.css` -- dark theme, responsive layout
- `CK.Lib.Js/console.js` -- NATS subscriptions, kernel switching, auth via `ck-client.js`, view modes
- Operator `index.html` now links to `/cklib/console.html` for full UI
- Live at `https://delvinator.tech.games/cklib/console.html` -- HTTP 200
- SeaweedFS filer upload permissions: `?mode=0644` for world-readable files
- `spec-parts/part-iv-vii.md`: Section 32.8 Web Console reference, Section 33 CK.Lib.Js note

## v3.5.5 -- AuthConfig + deploy.auth <Badge type="tip" text="DEPLOYED" />

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

## v3.5.4 -- CK-as-Subagent Delta Spec <Badge type="info" text="SPEC" />

**Date:** 2026-04-05

- `SPEC.CKP.v3.5.4.delta.md`: CK-as-subagent (D1-D4), Claude streaming (D5), LOCAL.ClaudeCode bridge (D6), Consensus loop (D7), EXTENDS predicate (D8)
- Consensus services integration: `PLAN.v002.md`, updated CLAUDE.md + README.md in `ref-consensus-services/`

## v3.5.3 -- Auth/Web Shell Delta Spec <Badge type="info" text="SPEC" />

**Date:** 2026-04-05

- `SPEC.CKP.v3.5.3.delta.md`: AuthConfig (D1), deploy.auth (D2), Web shell (D3), kernel.create via web (D4)
- `spec-parts/auth-config.md`, `spec-parts/web-shell.md`

## v3.5.2 -- CRD + Proof + Namespace Isolation <Badge type="tip" text="DEPLOYED" />

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

## v3.5.1 -- Full Specification <Badge type="info" text="SPEC" />

**Date:** 2026-04-05

- `SPEC.CKP.v3.5.final.md` (4,069 lines, W3C-style, 50 chapters)
- `SPEC.CKP.v3.5.implementation.md` (technology-specific companion)
- `spec-parts/` directory (8 files: skeleton, part-i-iii, part-iv-vii, part-viii-x, chapters-30-32-33, ontology-reference, roast-findings, logic-findings)
- `spec-parts/proof-verification-model.md`

---

## Upcoming

| Version | Feature | Status |
|---------|---------|--------|
| v3.5.13 | Ontological graph materialisation (deploy.graph step) | Planned |
| v3.5.14 | Multi-user NATS sessions | Planned |
| v3.5.15 | Task execution engine (headless Claude) | Planned |
| v3.5.16 | Agent Teams (multi-kernel coordination) | Planned |
| **v3.6** | **Full release -- sum of v3.5.5 through v3.5.16** | **Target** |
