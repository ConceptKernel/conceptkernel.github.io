---
title: Changelog
description: All changes from v3.5.3 through v3.5.12 that comprise the v3.6 release.
---

# Changelog

All notable changes in the v3.6 release train. Each version is an independently shippable increment.

## [v3.5.12] -- 2026-04-06
### Added
- /ckp dataset on Jena Fuseki (jena.conceptkernel.dev)
- 2,797 triples loaded from 10 CKP v3.5-alpha6 Turtle modules
- Modules: core, proof, base-instances, kernel-metadata, processes, rbac, relations, self-improvement, shapes, workflow
- SPARQL endpoint: jena-fuseki.jena.svc:3030/ckp/sparql
### Notes
- kernel-entity-template.ttl: parse error (400), skipped
- 7 of 10 spec-declared modules (instance, action, identity, governance, lifecycle, economic, topology) are not yet published as Turtle

## [v3.5.11] -- 2026-04-06
### Added
- CK.Consensus kernel: ontological governance engine
- Actions: propose, evaluate, approve, decisions, review (EXTENDS CK.Claude strict-auditor)
- Proposal evaluation against ontology + SHACL + fleet topology
- Task generation for headless Claude execution
- Provenance: every decision is a prov:Activity
- spec-parts/consensus-loop.md: normative definition

## [v3.5.10] -- 2026-04-06
### Added
- EXTENDS predicate implementation in cklib/actions.py
- EXTENDS creates NEW actions on source kernel from edge config (not inherited from target)
- get_effective_actions() enriches EXTENDS actions with persona + constraints metadata
- CK.Claude kernel: agent-type with persona templates (analytical-reviewer, friendly-assistant, strict-auditor)
- CK.Claude processor.py: handles message/analyze/summarize via claude -p with persona loading
- spec-parts/extends-predicate.md: full normative definition
### Changed
- resolve_composed_actions(): COMPOSES inherits target actions, EXTENDS creates new from edge config

## [v3.5.9] -- 2026-04-06
### Added
- stream.{kernel} topic in NatsKernelLoop (cklib/nats_loop.py)
- stream_event() callback passed to handlers for per-token NATS publishing
- Structured JSON logging in NatsKernelLoop (replaces [rx]/[tx] print statements)
- _log() method for spec-compliant JSON output (ts, level, kernel, event)
### Changed
- Handler signature: handler_fn(body, nc=, trace_id=, stream=) -- stream is the new callback
- Backwards compatible: handlers that don't accept stream= still work

## [v3.5.8] -- 2026-04-06
### Added
- Updated ck-agent skill for CKP v3.5 layout
- CLAUDE.md at root (not llm/), SKILL.md loading, ontology.yaml summary
- Three-loop discipline enforced: CK read-only, TOOL read-only, DATA writable
- Memory persistence: storage/memory/MEMORY.md (DATA loop)
- Multi-root search: CK_CONCEPTS_DIR, ./concepts/, ~/git/delve_workspace/concepts/
- Fuzzy kernel resolution: CK.*, Delvinator.*, CS.*, Hello.*
- NATS bridge: optional dispatch to live kernel via nats pub
- storage/memory/ dirs created for all kernels

## [v3.5.7] -- 2026-04-05
### Added
- Hello.Greeter kernel: conceptkernel.yaml, CLAUDE.md, SKILL.md, ontology.yaml, processor.py
- hello.tech.games deployed via CK.Operator: own namespace (ck-hello), own Keycloak realm (hello)
- KeycloakRealmImport CR created: hello-realm with ck-web client, EdDSA keys, wildcard redirect
### Deployed
- hello.tech.games: HTTP 200, 15/15 checks, Hello.Greeter Running
- delvinator.tech.games: HTTP 200, 15/15 checks, 6 kernels Running
- kubectl get ck -A: 7 kernels across 2 namespaces
- Keycloak realms: techgames (reused by delvinator), hello (created by operator)
### Fixed
- RBAC: patch verb for namespaces, PVs, PVCs, keycloakrealmimports
- SeaweedFS filer upload: ?mode=0644 for world-readable permissions

## [v3.5.6] -- 2026-04-05
### Added
- CK.Lib.Js/console.html -- three-panel web console
- CK.Lib.Js/console.css -- dark theme, responsive layout
- CK.Lib.Js/console.js -- NATS subscriptions, kernel switching, auth via ck-client.js, view modes
- Operator index.html now links to /cklib/console.html for full UI
### Deployed
- https://delvinator.tech.games/cklib/console.html -- HTTP 200
### Fixed
- SeaweedFS filer upload permissions: ?mode=0644 for world-readable files

## [v3.5.6.1] -- 2026-04-06
### Fixed
- Console config: resolveConfig() tries window.__CK_CONFIG, fetch /, URL params
- CK.Operator always present in kernel list (control plane)
- Action discovery: sends {action:"status"} to each kernel on boot, parses actions from response
- Dynamic action sidebar with lock/lock_open icons per access level
- Material Icons for kernel types

## [v3.5.5] -- 2026-04-05
### Added
- AuthConfig class in CK.Project ontology.yaml (keycloak/none modes, reuse/create realm)
- deploy.auth step in reconcile.py (KeycloakRealmImport generator, OIDC verification)
- verify_oidc_discovery + verify_jwks in verify.py
- Auth env injection (KEYCLOAK_ISSUER, KEYCLOAK_CLIENT_ID) into processor deployments
- Clean minimal index.html with auth config passed to ck-client.js
- Keycloak RBAC (keycloakrealmimports: get, list, create)
### Deployed
- delvinator.tech.games: 15/15 checks (13 infra + 2 auth: oidc_discovery + jwks_reachable)
- Keycloak techgames realm verified: OIDC discovery 200, JWKS reachable
### Fixed
- kubectl apply --server-side --force-conflicts for idempotent deployment updates
- RBAC: added patch verb to configmaps, deployments, services, httproutes

## [v3.5.4] -- 2026-04-05
### Added
- SPEC.CKP.v3.5.4.delta.md: CK-as-subagent (D1-D4), Claude streaming (D5), LOCAL.ClaudeCode bridge (D6), Consensus loop (D7), EXTENDS predicate (D8)

## [v3.5.3] -- 2026-04-05
### Added
- SPEC.CKP.v3.5.3.delta.md: AuthConfig (D1), deploy.auth (D2), Web shell (D3), kernel.create via web (D4)
