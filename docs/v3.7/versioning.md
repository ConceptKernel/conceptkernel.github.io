---
title: Versioning -- Per-Kernel Master Clones, Per-Project Worktrees, Three Sibling Dirs
description: CKP uses per-kernel master clones plus per-project worktrees on the SeaweedFS filer, three sibling directories per kernel (ck/, tool/, data/), the runc constraint that drives this design, and ontological grounding via Git2PROV and DOAP.
---

# Versioning

CKP's three-loop model gives each kernel three independently-versioned concerns: CK (identity), TOOL (capability), and DATA (knowledge). v3.7's design:

- **Per-kernel master clones** on the SeaweedFS filer -- one regular (non-bare) clone per kernel-organ that tracks the registry's master.
- **Per-project worktrees** off each master clone, on `<project>/<version>` branches, materialised at version-keyed paths.
- **Three sibling directories** (`ck/`, `tool/`, `data/`) inside the pod, mounted as independent PVs.
- **`.ckproject` manifest-driven materialisation** -- held in [CK.Project](./project)'s DATA organ, reflected onto the cluster as a `CKProject` CR.

## Per-Kernel Master Clones

Each concept kernel has its own isolated git repository per organ on the SeaweedFS filer -- a regular clone of the registry's `<Kernel>/{ck,tool}.git` upstream, with `master` checked out:

```
/ck/{ConceptKernel}/master/ck/      clone of ck.git, master branch checked out (.git inside)
/ck/{ConceptKernel}/master/tool/    clone of tool.git, master branch checked out (.git inside)
```

Materialised version paths sit alongside the master clone, populated from it via `git worktree add` (writable, branched, per-project) or `git archive` (read-only, version-pinned). Pods mount only the materialised version paths.

### Properties

| Property | How it is satisfied |
|----------|---------------------|
| Independent versioning per kernel | Each kernel has its own clone; SHAs in one kernel never affect another |
| Storage isolation per kernel | Each kernel's git objects live under its own filer path |
| Per-organ versioning | CK and TOOL each have their own clone, each with independent SHAs |
| Materialisation flexibility | `git worktree add` for branched/writable checkouts; `git archive` for read-only version-pinned extraction |

## Filer Layout -- Two Roots, Three Sibling Dirs

The filer uses two roots: `/ck/` holds master clones plus version-keyed CK and TOOL materialisations as siblings; `/ck-data/` holds project-keyed DATA.

```
/ck/                                       CK + TOOL filer root
├── Hello.Greeter/
│   ├── master/                            master clones (one per organ)
│   │   ├── ck/                            regular clone of ck.git, master branch checked out
│   │   │   ├── .git/                      git internals (HEAD, objects/, refs/) live INSIDE .git
│   │   │   ├── conceptkernel.yaml
│   │   │   └── ontology.yaml
│   │   └── tool/                          regular clone of tool.git, master branch checked out
│   │       ├── .git/
│   │       └── greet.py
│   ├── <ck-sha-abc123>/                   CK organ at this SHA (project-agnostic; shared by any project pinning this SHA)
│   │   └── ck/
│   │       ├── conceptkernel.yaml
│   │       └── .git-ref                   contains "abc123"
│   ├── <tool-sha-aaa111>/                 TOOL organ at this SHA (project-agnostic)
│   │   └── tool/
│   │       ├── greet.py
│   │       └── .git-ref                   contains "aaa111"
│   ├── <ck-sha-def456>/                   another CK SHA
│   │   └── ck/
│   │       ├── conceptkernel.yaml         ← changed
│   │       └── .git-ref
│   └── <tool-sha-bbb222>/                 another TOOL SHA
│       └── tool/
│           ├── greet.py                   ← changed
│           ├── greet_v2.py                ← new file
│           └── .git-ref
│
├── Delvinator.Core/
│   ├── master/
│   │   ├── ck/   (.git inside)
│   │   └── tool/ (.git inside)
│   ├── <ck-sha-…>/ck/
│   └── <tool-sha-…>/tool/
│
├── CK.Lib.Py/
│   ├── master/{ck,tool}/
│   └── …
│
└── CK.Lib.Js/
    ├── master/{ck,tool}/
    └── …

/ck-data/                                  DATA loop filer root
├── hello.tech.games/                      project: hello
│   └── Hello.Greeter/
│       ├── v1.3.2/                        data for v1.3.2 deployment
│       │   └── data/                      DATA organ root — all metadata lives here
│       │       ├── instances/             typed + task instance records
│       │       ├── proof/                 verification evidence
│       │       ├── ledger/                append-only audit trail
│       │       ├── index/                 derived search indices
│       │       ├── llm/                   LLM interaction logs
│       │       ├── web/                   runtime web data
│       │       └── logs/                  process / runtime logs
│       └── v1.3.19/                       data for v1.3.19 deployment
│           └── data/                      isolated from v1.3.2
│               ├── instances/
│               ├── proof/
│               ├── ledger/
│               ├── index/
│               ├── llm/
│               ├── web/
│               └── logs/
│
└── delvinator.tech.games/                 project: delvinator
    ├── Delvinator.Core/
    │   └── v1.3.2/
    │       └── data/
    │           ├── instances/
    │           ├── proof/
    │           └── ...
    └── Delvinator.ThreadScout/
        └── v1.3.2/
            └── data/
                └── ...
```

::: tip All metadata lives under `data/`
The DATA organ root is `/ck-data/<project>/<Kernel>/<version>/data/`. Every metadata folder — instances, proof, ledger, index, llm, web, logs, and any future kind — is a child of that single `data/` directory. Nothing metadata-related lives at `<version>/` directly; that level is reserved for organ folders (`data/` here, with `ck/`/`tool/` materialised under `/ck/<Kernel>/<version>/` on the other filer root).
:::

### Key Rules

- `/ck/{ConceptKernel}/{version}/ck/` is the CK loop materialisation path. `/ck/{ConceptKernel}/{version}/tool/` is the TOOL loop materialisation path. `/ck-data/<project>/{ConceptKernel}/{version}/data/` is the DATA loop path — everything below `data/` is metadata folders (`instances/`, `proof/`, `ledger/`, `index/`, `llm/`, `web/`, `logs/`, …).
- Each concept kernel has its own master clone under `/ck/{kernel}/` -- no monorepo. CK and TOOL each have their own master clone under `/ck/{kernel}/master/{ck,tool}/`. Materialised version paths are added off those clones via `git worktree add` (writable, branched) or extracted via `git archive` (read-only).
- Master clones live at `/ck/{kernel}/master/{ck,tool}/` with their git internals inside `.git/`. Version-keyed materialisations sit alongside as siblings. PVs mount `ck/` and `tool/` from the version directories only -- pods never see `.git/` or the master clones.
- `.git-ref` in each loop directory (`ck/` and `tool/`) contains the commit hash for verification.
- No files exist at the version root (`/ck/{kernel}/{version}/`). The version root is a namespace containing only `ck/` and `tool/` subdirectories.
- The flat `/ck/{KernelName}/` layout (without version subdirs) is NOT the materialisation target.

### `.ckproject` and `.git-ref` -- Two Halves of the Provenance Contract

Version provenance is carried by two files working in tandem:

| File | Lives where | Who writes it | What it says |
|------|-------------|---------------|--------------|
| `.ckproject` manifest | [CK.Project](./project)'s DATA organ (`/ck-data/<project>/CK.Project/<version>/data/instances/.ckproject`), symlinked from `<project-root>/.ckproject` and `/ck-data/<project>/.ckproject` | The operator / developer / governance process | **Intent**: "this project should deploy kernel X at version vN.M.P, with organ `ck/` pinned to SHA1 abc123, `tool/` to bbb222, `data/` to ccc333" |
| `.git-ref` (per organ) | Inside each materialised organ dir (`/ck/<kernel>/<version>/ck/.git-ref`, `.../tool/.git-ref`, and the DATA organ equivalent) | Written by CK.Operator at materialisation | **Outcome**: "this directory was extracted from SHA1 abc123" |

CK.Operator materialises a kernel by (1) reading the `.ckproject` pins, (2) running `git archive <pin>` from the master clone to populate the version directory, and (3) writing the SHA1 into that directory's `.git-ref`. A conformant cluster can verify frozen deployment at any time: for every kernel-organ mounted, the `.git-ref` contents MUST equal the matching pin in the project's `.ckproject`. If they disagree, the deployment has drifted and the kernel MUST NOT serve traffic.

## In-Container Mount Layout -- Three Sibling Dirs (Option A)

Inside the pod, three PVs mount as **sibling directories** under the kernel name. The kernel name directory `/ck/{ConceptKernel}/` is **not a volume** -- it is a plain directory that the kubelet creates on the node filesystem as part of normal mountPath processing. No volume is nested inside another volume.

```
/ck/{ConceptKernel}/ck/               ← CK PV       ReadOnly
/ck/{ConceptKernel}/tool/             ← TOOL PV     ReadOnly (or ReadWrite for hot-reload)
/ck/{ConceptKernel}/data/             ← DATA PV     ReadWrite
```

### Why Three Siblings (The runc Constraint)

Kubernetes runc **cannot** create mountpoint directories inside a ReadOnly parent volume. The `mkdirat` syscall fails with `EROFS: read-only file system` when the container runtime attempts to create subdirectory mountpoints within an already-mounted ReadOnly overlay.

This affects all nested mount scenarios:
- ReadWrite volume mounted inside a ReadOnly parent: **fails**
- ReadOnly volume mounted inside a ReadOnly parent: **fails**
- The failure occurs at the container runtime level, before any volume content is visible

Pre-creating empty "stub" directories inside the CK volume does **not** work either. runc calls `mkdirat` **before** the parent volume's content is visible in the mount namespace. The stubs exist on the filer but are invisible at the moment runc needs them. The parent overlay is ReadOnly at that point and `mkdirat` is rejected.

The sibling model avoids this entirely: no volume is mounted inside another volume. Each loop has its own independent mountpoint. The kernel name directory is a namespace, not a volume.

### PV-to-Filer Path Mapping

```
IN-CONTAINER MOUNT                FILER PATH                                          MODE
───────────────────────────────── ─────────────────────────────────────────────────── ─────
/ck/Hello.Greeter/ck/             /ck/Hello.Greeter/v1.3.2/ck/                        RO
/ck/Hello.Greeter/tool/           /ck/Hello.Greeter/v1.3.2/tool/                      RO
/ck/Hello.Greeter/data/           /ck-data/hello.tech.games/Hello.Greeter/v1.3.2/data/   RW
```

The version tag is invisible to the kernel. The operator wires it through PV volumeAttributes. CK and TOOL both source from the same filer root (`/ck/`) under sibling subdirectories of the version path.

### Example: Two Versions of Hello.Greeter

```
hello-v1.3.2 pod:                            hello-v1.3.19 pod:

/ck/Hello.Greeter/                           /ck/Hello.Greeter/
├── ck/                                      ├── ck/
│   ├── conceptkernel.yaml                   │   ├── conceptkernel.yaml    ← different
│   └── .ck-guid                             │   └── .ck-guid
├── tool/                                    ├── tool/
│   └── greet.py                             │   ├── greet.py              ← different
│                                            │   └── greet_v2.py           ← new
└── data/                                    └── data/
    ├── instances/     ← v1.3.2 data             ├── instances/     ← v1.3.19 data
    ├── proof/                                    ├── proof/
    ├── ledger/                                   ├── ledger/
    ├── index/                                    ├── index/
    ├── llm/                                      ├── llm/
    └── web/                                      └── web/
```

### What The Kernel Code Sees

From the perspective of kernel code running inside the pod:

```python
# Read kernel identity (CK loop -- read only)
yaml.load(open("/ck/Hello.Greeter/ck/conceptkernel.yaml"))
guid = open("/ck/Hello.Greeter/ck/.ck-guid").read()

# Import tool code (TOOL loop -- read only, or read-write for hot-reload)
from tool.greet import handler

# Write runtime data (DATA loop -- read write)
json.dump(data, open("/ck/Hello.Greeter/data/instances/abc.json", "w"))
proof.write("/ck/Hello.Greeter/data/proof/chain.json")
```

The kernel does not know:
- Which version tag it is running under
- That `/ck/`, `/tool/`, and `/data/` are three separate PVs
- That `/data/` is a project-scoped volume on a different filer root
- That the files in `/ck/` and `/tool/` are extracted from git commits
- That another version of itself is running in a different pod

## PV Naming Convention

Three PVs per kernel per version:

```
ck-{project}-{kernel}-{version}-ck       CK loop     → /ck/{kernel}/{version}/ck/
ck-{project}-{kernel}-{version}-tool     TOOL loop   → /ck/{kernel}/{version}/tool/
ck-{project}-{kernel}-{version}-data     DATA loop   → /ck-data/<project>/{kernel}/{version}/data/
```

### PV Definitions

```yaml
# CK loop -- kernel identity
apiVersion: v1
kind: PersistentVolume
metadata:
  name: ck-hello-greeter-v1.3.2-ck
spec:
  accessModes: [ReadOnlyMany]
  capacity:
    storage: 50Gi
  csi:
    driver: seaweedfs-csi-driver
    volumeHandle: ck-hello-greeter-v1.3.2-ck
    volumeAttributes:
      path: "/ck/Hello.Greeter/v1.3.2/ck"
  storageClassName: seaweedfs

---
# TOOL loop -- tool source code
apiVersion: v1
kind: PersistentVolume
metadata:
  name: ck-hello-greeter-v1.3.2-tool
spec:
  accessModes: [ReadOnlyMany]
  capacity:
    storage: 50Gi
  csi:
    driver: seaweedfs-csi-driver
    volumeHandle: ck-hello-greeter-v1.3.2-tool
    volumeAttributes:
      path: "/ck/Hello.Greeter/v1.3.2/tool"
  storageClassName: seaweedfs

---
# DATA loop -- runtime state
apiVersion: v1
kind: PersistentVolume
metadata:
  name: ck-hello-greeter-v1.3.2-data
spec:
  accessModes: [ReadWriteMany]
  capacity:
    storage: 50Gi
  csi:
    driver: seaweedfs-csi-driver
    volumeHandle: ck-hello-greeter-v1.3.2-data
    volumeAttributes:
      path: "/ck-data/hello.tech.games/Hello.Greeter/v1.3.2/data"
  storageClassName: seaweedfs
```

### Volume Mounts in Pod Spec

```yaml
volumeMounts:
  - name: ck
    mountPath: /ck/Hello.Greeter/ck/
    readOnly: true
  - name: tool
    mountPath: /ck/Hello.Greeter/tool/
    readOnly: true        # or readOnly: false for hot-reload
  - name: data
    mountPath: /ck/Hello.Greeter/data/
```

## Quick Setup Mode -- No Git Required

During initial development or quick setup, no master clone is required either. The operator can serve files dropped directly into a materialised version directory on the filer:

```
/ck/Hello.Greeter/v1.0.0/ck/conceptkernel.yaml
/ck/Hello.Greeter/v1.0.0/tool/greet.py
/ck-data/hello.tech.games/Hello.Greeter/v1.0.0/data/   (scaffolded by operator)
```

If no master clone exists under the kernel directory, the operator treats the version folder as manually managed. It mounts whatever is there. The `.git-ref` file is absent, indicating no git provenance. Integrity verification and commit traceability are unavailable in this mode.

### CK.Project Declaration for Quick Setup

```yaml
apiVersion: ck.tech.games/v1
kind: CKProject
metadata:
  name: hello
spec:
  hostname: hello.tech.games
  versions:
    - name: v1.0.0
      route: /
      kernels:
        - name: Hello.Greeter
          # no ck_ref, no tool_ref
          # operator mounts whatever is at:
          #   /ck/Hello.Greeter/v1.0.0/ck/
          #   /ck/Hello.Greeter/v1.0.0/tool/
```

### Transition Path to Git-Managed

```
1. Quick setup:  Upload files to /ck/Hello.Greeter/v1.0.0/ck/ and
                 /ck/Hello.Greeter/v1.0.0/tool/ manually via filer HTTP API.

2. Git clone:    Clone master at /ck/Hello.Greeter/master/{ck,tool}/ from the registry
                 (HEAD, objects/, refs/).

3. First commit: Push files into the repo.

4. Materialise:  Operator extracts commits into /ck/Hello.Greeter/v1.0.0/ck/
                 and /ck/Hello.Greeter/v1.0.0/tool/, writes .git-ref in each.
                 From here on, git-managed.
```

No changes to PVs, mounts, or pod specs during this transition. The version directory path is stable regardless of whether git backs it.

## Per-Loop Version Overrides in CK.Project

The [CK.Project CRD](./project) supports per-kernel `ck_ref` and `tool_ref` pinning exact git commits:

```yaml
spec:
  versions:
    - name: v1.3.2
      route: /
      data: isolated
      kernels:
        - name: Hello.Greeter
          ck_ref: abc123f
          tool_ref: aaa111
        - name: CK.Lib.Py
          ck_ref: eee555
          tool_ref: fff666
    - name: v1.3.19
      route: /next
      data: isolated
      kernels:
        - name: Hello.Greeter
          ck_ref: def4567
          tool_ref: bbb222
        - name: CK.Lib.Py
          ck_ref: eee555          # same as v1.3.2
          tool_ref: fff666        # same as v1.3.2
```

Each kernel in each version has independent CK and TOOL refs. When `ck_ref` and `tool_ref` are omitted, the operator mounts whatever is at the version path (quick setup mode). When specified, the operator extracts exact commits via `git archive`.

## Ontological Grounding: Git2PROV and DOAP

CKP does not invent its own vocabulary for git concepts. It grounds them in two established ontologies.

### DOAP for Repository Metadata

[DOAP (Description of a Project)](https://github.com/ewilderj/doap) provides the vocabulary for project-level git metadata:

| Git Concept | DOAP Term | CKP Usage |
|-------------|-----------|-----------|
| Repository | `doap:GitRepository` | Per-kernel master clones at `/ck/{kernel}/` |
| Release | `doap:release` | Version tags |

### Git2PROV for Commit Provenance

[Git2PROV](https://github.com/mmlab/Git2PROV) maps git operations to W3C PROV-O:

| Git Concept | PROV-O Term | CKP Usage |
|-------------|-------------|-----------|
| Commit | `prov:Activity` | The activity that produced a version's files |
| Tree | -- | The `git archive` extraction target |
| Author | `prov:wasAssociatedWith` | Commit author |

This grounding matters because CKP already uses PROV-O for instance provenance in the DATA loop. Extending the same vocabulary to git operations means the entire provenance chain -- from commit to materialisation to runtime instance -- is expressible in a single ontology.

## The .git-ref Stamp

Every materialised loop directory contains a `.git-ref` file with the exact commit hash used for materialisation:

```
/ck/Hello.Greeter/v1.3.2/ck/.git-ref
→ contains: "abc123f"

/ck/Hello.Greeter/v1.3.2/tool/.git-ref
→ contains: "aaa111"
```

This is not decorative metadata. It implements the Git2PROV `prov:wasGeneratedBy` relationship: the materialised files at `/ck/Hello.Greeter/v1.3.2/ck/` were generated by a `git archive` activity operating on commit `abc123f`.

The `.git-ref` stamp serves three purposes:

1. **Verification** -- the operator reads `.git-ref` on reconciliation to determine whether the materialised files match the declared version. If the ref matches, the version is already current and no re-materialisation is needed.

2. **Traceability** -- given any deployed file, you can trace it back to the exact commit that produced it. `cat .git-ref` gives you the commit hash; `git log -1 {hash}` gives you the author, date, and message.

3. **Audit** -- the `.git-ref` file is part of the ReadOnlyMany volume. It cannot be modified by the runtime. If the materialised files have been tampered with, the `.git-ref` will not match a `git archive` of the same commit.

## DATA Loop: SeaweedFS Volume Is the Persistence; Git Is the Snapshot Layer

DATA spans **two coexisting layers**. They are not subordinate to each other -- they hold different things at different cadences. Both are valid, both are durable, neither replaces the other.

| Layer | What it IS | Path | Cadence |
|-------|------------|------|---------|
| **SeaweedFS volume** | The **persistence layer** -- the live state of the kernel. Where every instance write, proof entry, ledger append, and log line is durably stored. The volume itself provides the durability via SeaweedFS replication; nothing else is required. | `/ck-data/<project>/<Kernel>/<data-seed-sha>/data/` (mounted into pods at `/ck/<Kernel>/data/`) | Continuous. Persists across pod restarts. |
| **Git** -- referenced by `pins.data` SHA1 | The **snapshot layer** -- discrete commit-boundary records. Captures the SEED state a kernel-version is born with, plus any deliberate checkpoint promoted into a new pin. | `<registry>/<Kernel>/data.git` (or equivalent), referenced by SHA1 in `.ckproject` | Commit-driven. Bumped at boundaries (initial seed, schema migration, archived checkpoint). |

Concretely:

- **The SeaweedFS volume IS the database disk.** Like a Postgres data directory or an EBS-backed PV. The kernel writes to it; SeaweedFS persists it; restarts don't lose it.
- **The git snapshot is the migration record.** Like a Postgres `pg_dump` or a schema-migration commit -- a discrete artefact captured at a chosen moment, not the live state.
- **`data/ledger/audit.jsonl` and `data/proof/` are content ON the volume**, not the durability mechanism. They are audit and provenance records the kernel writes alongside its instances. Their durability comes from the volume, exactly like every other file in `data/`. They are append-only by convention, hash-chained for integrity, replayable for audit -- but the volume is what keeps them around.

CK and TOOL behave differently because they ARE git -- a CK or TOOL commit IS the complete state. DATA cannot work that way:

- Committing on every instance creation is impractical for a real-time system.
- Periodically snapshotting would lose the append-only invariant.

So the live tail lives on the volume; the snapshot points live in git. They coexist.

::: tip The pin is the snapshot point; the tail is whatever the volume holds
`pins.data` answers "what did this kernel-version START with?" The SeaweedFS volume answers "what is it RIGHT NOW?" Two questions, two layers, both authoritative for their own cadence.
:::

## Kernel Version as Three-SHA Combination Lock

A kernel's deployed version is a **combination lock of three SHA1s** -- one per organ. The three axes are independent:

```
kernel-version = (ck-sha, tool-sha, data-seed-sha)
```

Bumping any single SHA produces a new combination. `.ckproject` records all three per kernel (see [Project](./project) §Manifest Contents).

| Pin | What changing this SHA means | Bumped when |
|-----|-----------------------------|-------------|
| `pins.ck` | New schema -- new types, new SHACL constraints, new ontology | On a CK organ commit |
| `pins.tool` | New behaviour -- new processor code, new entrypoints | On a TOOL organ commit |
| `pins.data` | New SEED -- new initial fixtures, new migration baseline, archived volume checkpoint promoted to seed | On a deliberate seed checkpoint -- never per-instance-write |

A typical project will see `pins.ck` and `pins.tool` move on developer commits, while `pins.data` stays stable for long stretches and is bumped only at migration boundaries. Runtime DATA accumulates continuously on the SeaweedFS volume during the gap; that accumulation is the kernel's normal operation, not a version event.

### What Changes a Pin

| Event | `pins.ck` | `pins.tool` | `pins.data` |
|-------|-----------|-------------|-------------|
| Edit `ontology.yaml` and commit | ✅ new SHA | -- | -- |
| Run `ck regenerate <kernel>` (rebuilds `cktype/` + `rules.shacl` from ontology.yaml) | ✅ new SHA (bundle changes) | -- | -- |
| Commit a `tool/processor.py` change | -- | ✅ new SHA | -- |
| Kernel writes 10 000 instances at runtime | -- | -- | -- (volume grows; pin unchanged) |
| Operator promotes a checkpoint of the volume to a new seed | -- | -- | ✅ new SHA |

The first three rows are **commit-driven** -- normal developer flow. The fourth row is **runtime accumulation on the volume** -- normal operational flow, no version impact. The fifth row is **deliberate checkpointing from the volume into a new git seed** -- rare, governance-bounded.

The database analogy lines up cleanly:

| RDBMS concept | CKP analogue |
|---------------|--------------|
| Schema version / migration commit | `pins.data` -- bumped at commit boundaries only |
| Database data directory on disk | SeaweedFS volume at `/ck-data/<project>/<Kernel>/<data-seed-sha>/data/` -- the actual persistence |
| Rows on disk (inserts/updates) | `data/instances/`, `data/proof/`, `data/ledger/`, `data/logs/` -- files on the volume |
| WAL / audit log file (also on disk) | `data/ledger/audit.jsonl` -- append-only file on the same volume |
| Cluster replication (durability mechanism) | SeaweedFS replication of the volume |
| `pg_dump` / scheduled snapshot (separate artefact) | Promoting a volume checkpoint into a new `pins.data` SHA1 |

You don't bump the schema version per `INSERT`; you bump it per `ALTER TABLE`. You don't back up the database after every row write; you let the storage layer persist it and snapshot deliberately. Same here.

## Shared Kernel Optimisation

When two versions reference the same commit for a kernel's loop, the operator does not extract twice. It checks `.git-ref` in the existing version directory. If the hash matches, it points the new version's PV at the existing path:

```
# v1.3.19 Delvinator.Core has same ck_ref as v1.3.2
# Operator sets PV path to the existing materialisation:
PV ck-delvinator-core-v1.3.19-ck:
  path: /ck/Delvinator.Core/v1.3.2/ck/       ← reuses v1.3.2 CK extraction

PV ck-delvinator-core-v1.3.19-tool:
  path: /ck/Delvinator.Core/v1.3.2/tool/     ← reuses v1.3.2 TOOL extraction
```

This eliminates duplication for unchanged kernels across versions.

## Read-Only Enforcement

### Three Layers

```
Layer 1: PV accessMode: ReadOnlyMany
         K8s prevents the PVC from binding in ReadWrite mode.

Layer 2: volumeMount: readOnly: true
         Kernel rejects write syscalls at the VFS level.

Layer 3: Pod security context
         No CAP_SYS_ADMIN -- pod cannot remount.
```

All three layers apply to CK and TOOL PVs. DATA PVs use ReadWriteMany with readOnly: false.

### Filer-Level Protection

SeaweedFS filer has no per-path ACLs. Protection at the filer level uses:

- **NetworkPolicy:** Only CK.Operator and CSI driver pods can reach the filer service. All other pods are blocked.
- **Filer JWT:** SeaweedFS supports JWT auth on write operations. Reads are open (CSI driver mounts without tokens). Writes require a signed JWT only the operator has.

Both together provide defense in depth. The materialised version directories are effectively immutable to everything except the operator's reconcile loop.

## Proven on Live Cluster

v3.7 has been proven on a live AKS cluster with SeaweedFS 3.93 and the SeaweedFS CSI driver:

- `hello-v1-0-0-proc` pod Running with three sibling PVs (ck, tool, data)
- Three independent mountpoints under `/ck/Hello.Greeter/` -- no nesting, no runc failures
- CK and TOOL volumes ReadOnly, DATA volume ReadWrite
- PV naming: `ck-hello-greeter-v1.0.0-ck`, `ck-hello-greeter-v1.0.0-tool`, `ck-hello-greeter-v1.0.0-data`

## Conformance

- Each concept kernel SHOULD have its own master clone at `/ck/{ConceptKernel}/` (containing `HEAD`, `objects/`, `refs/`)
- CK loop files are materialised to `/ck/{kernel}/{version}/ck/`
- TOOL loop files are materialised to `/ck/{kernel}/{version}/tool/`
- There MUST NOT be a separate `/ck-tool/` filer root -- CK and TOOL are sibling subdirectories under the version directory
- DATA loop content MUST NOT be stored in git
- The `.git-ref` stamp MUST record the exact commit hash used for materialisation, one per loop directory (`ck/` and `tool/`)
- In-container mount layout MUST use three sibling directories under `/ck/{kernel}/`: `ck/`, `tool/`, `data/`
- No volume MUST be mounted as a child of another volume
- The kernel name directory (`/ck/{kernel}/`) MUST NOT be a mounted volume -- it is a namespace only
- CK PV MUST always be ReadOnly
- TOOL PV SHOULD be ReadOnly; MAY be ReadWrite for hot-reload scenarios
- DATA PV MUST be ReadWrite
- Mountpoint stub directories (`tool/`, `data/` inside CK volume content) MUST NOT be created -- they do not work with runc
- Quick setup mode (no git, no refs) MUST be supported -- operator mounts whatever is at the version's `ck/` and `tool/` paths
