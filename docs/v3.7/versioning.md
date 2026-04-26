---
title: Versioning -- Per-Kernel Repos, Three Sibling Dirs, and Provenance
description: How CKP uses per-kernel bare git repositories on the SeaweedFS filer, three sibling directories per kernel (ck/, tool/, data/), the runc constraint that drives this design, and ontological grounding via Git2PROV and DOAP.
---

# Versioning

## The Problem

CKP's three-loop model gives each kernel three independently-versioned concerns: CK (identity), TOOL (capability), and DATA (knowledge). The question is: how do you version CK and TOOL without creating a compatibility nightmare, and how do you mount three independent loops into a container without hitting container runtime constraints?

v3.7 answers both questions with a single design: **per-kernel bare repositories** on the SeaweedFS filer, **three sibling directories** inside the pod, and **`.ckproject` manifest-driven materialisation** (held in [CK.Project](./project)'s DATA organ, reflected onto the cluster as a `CKProject` CR) replacing the retired `serving.json`.

## Per-Kernel Bare Repositories (Not Monorepo)

Each concept kernel has its own isolated bare git repository on the SeaweedFS filer. There is no monorepo. The bare repo lives alongside the materialised versions under the kernel directory:

```
/ck/{ConceptKernel}/             bare repo (HEAD, objects/, refs/)
```

Materialised version directories sit as siblings to the git internals under the same kernel directory. Each version directory contains `ck/` and `tool/` subdirectories. PVs mount the version's `ck/` and `tool/` paths independently -- pods never see git internals.

### Why Per-Kernel Repos

| Concern | Per-Kernel Repos | Monorepo |
|---------|-----------------|----------|
| Independent versioning | Each kernel versioned independently by design | Requires subtree gymnastics |
| Storage isolation | Each kernel's git objects isolated | Shared object store |
| Quick setup | Can init git per-kernel incrementally | All-or-nothing |
| Filer path consistency | Bare repo + versions under same path | Separate repo path vs materialised path |
| `git archive` | `git -C /ck/{kernel} archive {ref}` -- direct extraction | `git archive {ref}:{kernel}/` -- subtree extraction |

## Filer Layout -- Two Roots, Three Sibling Dirs

The filer uses two roots (`/ck/` and `/ck-data/`) with per-kernel bare repos and version subdirectories. Each version directory contains `ck/` and `tool/` as sibling subdirectories. There is **no separate `/ck-tool/` filer root**.

```
/ck/                                       CK + TOOL filer root
├── Hello.Greeter/                         bare repo + versions
│   ├── HEAD                               ┐
│   ├── objects/                            │ git internals
│   │   └── pack/                           │ never mounted
│   │       ├── pack-<hash>.pack            │ into pods
│   │       └── pack-<hash>.idx             │
│   ├── refs/                               ┘
│   ├── v1.3.2/                            materialised version
│   │   ├── ck/                            CK loop files
│   │   │   ├── conceptkernel.yaml
│   │   │   ├── .ck-guid
│   │   │   └── .git-ref                   contains "abc123f"
│   │   └── tool/                          TOOL loop files
│   │       ├── greet.py
│   │       └── .git-ref                   contains "aaa111"
│   └── v1.3.19/                           materialised version
│       ├── ck/                            CK loop files
│       │   ├── conceptkernel.yaml         ← changed from v1.3.2
│       │   ├── .ck-guid
│       │   └── .git-ref
│       └── tool/                          TOOL loop files
│           ├── greet.py                   ← changed
│           ├── greet_v2.py                ← new file
│           └── .git-ref
│
├── Delvinator.Core/                       bare repo + versions
│   ├── HEAD
│   ├── objects/
│   ├── refs/
│   ├── v1.3.2/
│   │   ├── ck/
│   │   │   ├── conceptkernel.yaml
│   │   │   ├── .ck-guid
│   │   │   └── .git-ref
│   │   └── tool/
│   │       ├── app.py
│   │       ├── utils.py
│   │       └── .git-ref
│   └── v1.3.19/                           ← same refs as v1.3.2
│       ├── ck/
│       │   └── .git-ref                   operator skips extraction
│       └── tool/
│           └── .git-ref
│
├── CK.Lib.Py/
│   ├── ...
│
└── CK.Lib.Js/
    ├── ...

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
The DATA organ root is `/ck-data/<host>/<Kernel>/<version>/data/`. Every metadata folder — instances, proof, ledger, index, llm, web, logs, and any future kind — is a child of that single `data/` directory. Nothing metadata-related lives at `<version>/` directly; that level is reserved for organ folders (`data/` here, with `ck/`/`tool/` materialised under `/ck/<Kernel>/<version>/` on the other filer root).
:::

### Key Rules

- `/ck/{ConceptKernel}/{version}/ck/` is the CK loop materialisation path. `/ck/{ConceptKernel}/{version}/tool/` is the TOOL loop materialisation path. `/ck-data/{hostname}/{ConceptKernel}/{version}/data/` is the DATA loop path — everything below `data/` is metadata folders (`instances/`, `proof/`, `ledger/`, `index/`, `llm/`, `web/`, `logs/`, …).
- Each concept kernel has its own bare repo under `/ck/{kernel}/` -- no monorepo. CK and TOOL loops share the same bare repo root but extract to separate sibling directories.
- Bare repo git internals (`HEAD`, `objects/`, `refs/`) and materialised version directories coexist under the same kernel directory. PVs mount `ck/` and `tool/` within version subdirectories -- pods never see git internals.
- `.git-ref` in each loop directory (`ck/` and `tool/`) contains the commit hash for verification.
- No files exist at the version root (`/ck/{kernel}/{version}/`). The version root is a namespace containing only `ck/` and `tool/` subdirectories.
- The flat `/ck/{KernelName}/` layout (without version subdirs) is NOT the materialisation target.

### `.ckproject` and `.git-ref` -- Two Halves of the Provenance Contract

Version provenance is carried by two files working in tandem:

| File | Lives where | Who writes it | What it says |
|------|-------------|---------------|--------------|
| `.ckproject` manifest | [CK.Project](./project)'s DATA organ (`/ck-data/<project>/CK.Project/<version>/data/instances/.ckproject`), symlinked from `<project-root>/.ckproject` and `/ck-data/<project>/.ckproject` | The operator / developer / governance process | **Intent**: "this project should deploy kernel X at version vN.M.P, with organ `ck/` pinned to SHA1 abc123, `tool/` to bbb222, `data/` to ccc333" |
| `.git-ref` (per organ) | Inside each materialised organ dir (`/ck/<kernel>/<version>/ck/.git-ref`, `.../tool/.git-ref`, and the DATA organ equivalent) | Written by CK.Operator at materialisation | **Outcome**: "this directory was extracted from SHA1 abc123" |

CK.Operator materialises a kernel by (1) reading the `.ckproject` pins, (2) running `git archive <pin>` from the bare repo to populate the version directory, and (3) writing the SHA1 into that directory's `.git-ref`. A conformant cluster can verify frozen deployment at any time: for every kernel-organ mounted, the `.git-ref` contents MUST equal the matching pin in the project's `.ckproject`. If they disagree, the deployment has drifted and the kernel MUST NOT serve traffic.

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
ck-{project}-{kernel}-{version}-data     DATA loop   → /ck-data/{hostname}/{kernel}/{version}/data/
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

During initial development or quick setup, a bare repository is NOT required. The operator can serve files dropped directly into a materialised version directory on the filer:

```
/ck/Hello.Greeter/v1.0.0/ck/conceptkernel.yaml
/ck/Hello.Greeter/v1.0.0/tool/greet.py
/ck-data/hello.tech.games/Hello.Greeter/v1.0.0/data/   (scaffolded by operator)
```

If no bare repo exists under the kernel directory, the operator treats the version folder as manually managed. It mounts whatever is there. The `.git-ref` file is absent, indicating no git provenance. Integrity verification and commit traceability are unavailable in this mode.

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

2. Git init:     Create bare repo at /ck/Hello.Greeter/
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
| Repository | `doap:GitRepository` | Per-kernel bare repos at `/ck/{kernel}/` |
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

## DATA Loop: Not in Git

The DATA loop is deliberately excluded from git. DATA accumulates continuously at runtime -- instances, proofs, ledger entries -- and has fundamentally different versioning semantics:

- CK and TOOL are **point-in-time snapshots** (a commit represents a complete state)
- DATA is **append-only accumulation** (versioned by its own proof chain, not by commits)

Putting DATA in git would mean either committing on every instance creation (impractical for a real-time system) or periodically snapshotting (losing the append-only invariant). The ReadWriteMany volume with ledger-based versioning is the correct abstraction for DATA.

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

- Each concept kernel SHOULD have its own bare git repository at `/ck/{ConceptKernel}/` (containing `HEAD`, `objects/`, `refs/`)
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
