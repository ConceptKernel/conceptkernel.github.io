---
title: Filesystem Topology
description: Unified tree, physical volumes, version materialisation, and gateway routing -- the physical realisation of the three-loop model.
---

# Filesystem Topology

## Unified Tree -- What the CK Sees

Every Concept Kernel presents a single unified filesystem tree to all processes working inside it. From inside the CK, there is no visible seam between the three volumes. From the distributed filesystem, each root is an independently-mounted volume with its own git history, retention policy, and write authority.

::: info Platform Standard
The mount convention is applied identically to every Concept Kernel on mint. It is never declared in `conceptkernel.yaml` -- that file carries identity only. The platform routes paths to volumes automatically.
:::

```
{ns}/{project}/concepts/{KernelName}/{guid}/
|
|  -- IDENTITY & AWAKENING FILES (OPS root) --
|
|- conceptkernel.yaml          <- I am
|- .ck-guid                    <- canonical SPID UUID
|- README.md                   <- Why I am
|- CLAUDE.md                   <- How I am (OPS root -- agent reads here)
|- SKILL.md                    <- What I can do
|- CHANGELOG.md                <- What I have become
|- ontology.yaml               <- Shape of my world
|- rules.shacl                 <- My constraints
|- serving.json                <- Which version of me is active
+- .policy                     <- Local governance rules
|
|  -- TOOL (virtual mount) --
|
|- tool/                       <- TOOL loop root (volume: ck-{guid}-tool)
|   |- run.sh                    . shell script
|   |- app.py                    . web service
|   |- index.jsx                 . frontend project
|   |- main.rs / Cargo.toml      . compiled / Wasm
|   +- [system pointer]          . reference to system-installed binary
|
|  -- STORAGE (virtual mount) --
|
+- storage/                    <- DATA loop root (volume: ck-{guid}-storage)
    |- instance-<short-tx>/     <- sealed instances
    |- i-task-{conv_guid}/      <- task instances
    |- proof/
    |- ledger/
    |- index/
    |- llm/                     <- runtime memory (NOT where CLAUDE.md lives)
    +- web/
```

## Physical Volume Layout

Three volumes are provisioned per CK on mint. Each has an independent git history.

```
filesystem://
|
+- {class}/
    +- {guid}/
        |
        |- [CK loop volume]         ck-{guid}-ck
        |     path:      /{class}/{guid}/
        |     git:       yes -- developer commits, permanent
        |     retention: permanent (identity never expires)
        |     write:     operator / CI pipeline
        |
        |- tool/  [TOOL loop volume] ck-{guid}-tool
        |     path:      /{class}/{guid}/tool/
        |     git:       yes -- tool author commits, permanent
        |     retention: permanent (tool history is audit trail)
        |     write:     tool developer / CI pipeline
        |
        +- storage/  [DATA loop volume] ck-{guid}-storage
              path:      /{class}/{guid}/storage/
              git:       yes -- append-only, archival
              retention: policy-governed (configurable per class)
              write:     kernel runtime only
```

### Volume Comparison

| Property | CK Loop | TOOL Loop | DATA Loop |
|----------|---------|-----------|-----------|
| Contents | Identity files, schema, rules, serving.json | Executable artifact -- any form | Instances, proof, ledger, index, llm, web |
| Git semantics | Append DAG -- branch + merge model | Append DAG -- branch + merge model | Append-only -- no rewrites, no deletes |
| Who writes | Operator, developer, CI pipeline | Tool developer, CI pipeline | Kernel runtime exclusively |
| Who reads | Any kernel at awakening, routing layer | Runtime executor, CKI spawner | CKs declared in ck:isAccessibleBy |
| Versioning goal | Track CK identity evolution over time | Track capability evolution | Accumulate knowledge and proof |
| GC policy | None -- all commits retained forever | None -- all tool versions retained | Archival after policy period (never deleted) |

::: tip Mount Point Rules
The three mount paths (`/`, `/tool/`, `/storage/`) are identical for every Concept Kernel. They are defined once at platform level and applied automatically on kernel mint. Any process that sees a CK root sees the same structure regardless of kernel class or version.
:::

## Version Materialisation

Each volume is a git repository on the distributed filesystem. Git provides deduplication, history, branching, and atomic rollback.

Versions are explicit paths on the filesystem:

```
/{conceptkernel}/storage/web/v1/    <- version 1
/{conceptkernel}/storage/web/v2/    <- version 2 (current)
```

`serving.json` declares which versions are active:

```json
{
  "versions": [
    { "name": "v1", "active": true },
    { "name": "v2", "active": true, "current": true },
    { "name": "v3", "active": false, "deprecated_at": "2026-04-01" }
  ]
}
```

Deprecation is announced with `deprecated_at` field. Old version removed when `active: false`.

### Consumer Resolution

Per the instance versioning model: `depends_on: ckp://Instance#i-task-{guid}` (HEAD) or `depends_on: ckp://Instance#i-task-{guid}@b2c1f4` (pinned commit). Both valid simultaneously. No coordination required.

## Gateway Split Routing

Web content lives in the DATA loop at `storage/web/`. The gateway routes public HTTP traffic directly to the distributed filesystem -- not through the runtime process.

```
Browser -> Gateway -> /action/*  -> runtime process (TOOL loop)
Browser -> Gateway -> /cklib/*   -> filesystem (shared library edge storage/web/)
Browser -> Gateway -> /v{N}/*    -> filesystem (versioned DATA loop storage/web/v{N}/)
Browser -> Gateway -> /*         -> filesystem (current DATA loop storage/web/)
```

No FUSE overhead for web serving. The runtime process only runs the TOOL loop.

### Route Rule Pattern

```yaml
rules:
  # API actions -> runtime process
  - matches:
      - path: { type: PathPrefix, value: /action/ }
    backendRefs:
      - name: "{service_name}"
        port: 80

  # Edge dependencies -> filesystem
  - matches:
      - path: { type: PathPrefix, value: /cklib/ }
    filters:
      - type: URLRewrite
        urlRewrite:
          path:
            type: ReplacePrefixMatch
            replacePrefixMatch: /{project}/concepts/SharedLib/storage/web/

  # Explicit version paths -> filesystem
  - matches:
      - path: { type: PathPrefix, value: /v1/ }
    filters:
      - type: URLRewrite
        urlRewrite:
          path:
            replacePrefixMatch: /{project}/concepts/{conceptkernel}/storage/web/v1/

  # Current version (catch-all) -> filesystem
  - matches:
      - path: { type: PathPrefix, value: / }
    filters:
      - type: URLRewrite
        urlRewrite:
          path:
            replacePrefixMatch: /{project}/concepts/{conceptkernel}/storage/web/v2/
```

Standard Gateway API. No extensions, no custom filters.
