---
title: Versioning -- Git Model, Tag Prefixes, and Provenance
description: How CKP uses one git repository per project, tag prefix conventions for independent CK and TOOL versioning, and ontological grounding via Git2PROV and DOAP.
---

# Versioning

## The Problem

CKP's three-loop model gives each kernel three independently-versioned concerns: CK (identity), TOOL (capability), and DATA (knowledge). The question is: how do you version CK and TOOL without creating a compatibility nightmare?

The naive answer is "separate repos." One for CK files, one for TOOL code. This sounds clean until you need to guarantee that a CK schema change and the TOOL code that implements it are compatible. With separate repos you need a compatibility matrix, two-phase commits across repos, and an operator that clones, tracks, and resolves multiple repositories per project. Every problem in distributed systems gets harder with more independent state.

The CKP answer is: **one repo, two version streams.**

## One Repo Per Project

Each project uses a single git repository containing all kernel CK and TOOL loops. DATA loop content is never in git -- it lives on the ReadWriteMany volume, versioned by its own ledger and proof chain.

```
kernels.git/
├── Delvinator.Core/
│   ├── conceptkernel.yaml       CK loop
│   ├── CLAUDE.md                CK loop
│   ├── SKILL.md                 CK loop
│   ├── ontology.yaml            CK loop
│   ├── rules.shacl              CK loop
│   └── tool/                    TOOL loop
│       └── processor.py
├── CK.Lib.Py/
│   └── cklib/                   TOOL loop (shared)
└── CK.Lib.Js/
    └── ck-client.js             TOOL loop (shared)
```

The CK loop and TOOL loop live side by side in the same tree. This is not a compromise -- it is a deliberate design choice rooted in three architectural realities.

### Why One Repo

| Concern | One Repo | Separate Repos |
|---------|----------|----------------|
| Compatibility | Any commit is known-compatible | Compatibility matrix hell |
| Atomic changes | CK schema + TOOL code in one commit | Two-phase commit across repos |
| Operator simplicity | One clone, two subPath mounts | Multiple clones, merge resolution |
| git archive | Works on subtrees natively | Each repo needs separate clone |

The strongest argument is compatibility. When a CK ontology change requires a corresponding TOOL code change, both happen in a single commit. The operator can `git archive` any commit and know that CK and TOOL are compatible at that point. With separate repos, you need an external mechanism to assert "CK v1.2 is compatible with TOOL v3.4" -- and that mechanism is itself a versioning problem.

## Independent Versioning via Tag Prefixes

"Independently versioned" does not require separate repositories. Git tags with path prefixes provide independent version streams:

| Tag Pattern | What It Versions | Example |
|-------------|-----------------|---------|
| `ck/{kernel}/v{X.Y.Z}` | CK loop of a specific kernel | `ck/Delvinator.Core/v1.0.0` |
| `tool/{kernel}/v{X.Y.Z}` | TOOL loop of a specific kernel | `tool/Delvinator.Core/v2.3.1` |
| `v{X.Y.Z}` | Entire project snapshot | `v1.0.0` (compatibility-guaranteed) |

A commit touching only `tool/Delvinator.Core/` does not change the CK version. The operator resolves each loop independently via `git archive`:

```bash
# Extract CK loop for a specific version
git archive ck/Delvinator.Core/v1.0.0 -- Delvinator.Core/conceptkernel.yaml \
    Delvinator.Core/CLAUDE.md Delvinator.Core/ontology.yaml ...

# Extract TOOL loop for a specific version
git archive tool/Delvinator.Core/v2.3.1 -- Delvinator.Core/tool/
```

This gives you the best of both worlds: independent version numbers per loop, with guaranteed compatibility at any project-level tag.

### Per-Loop Overrides in CK.Project

The [CK.Project CRD](./project) supports both unified and per-loop version references:

```yaml
spec:
  versions:
    - name: live
      ref: abc123f          # project-level: both loops use this commit
      route: /
    - name: staging
      ref: def4567
      ck_ref: ck/Delvinator.Core/v1.0.0    # CK loop from this tag
      tool_ref: tool/Delvinator.Core/v2.3.1 # TOOL loop from this tag
      route: /staging
```

When `ck_ref` and `tool_ref` are omitted, both loops materialise from `ref`. When specified, each loop materialises from its own tag. This enables scenarios like "deploy latest TOOL code against the stable CK schema."

## Ontological Grounding: Git2PROV and DOAP

CKP does not invent its own vocabulary for git concepts. It grounds them in two established ontologies.

### DOAP for Repository Metadata

[DOAP (Description of a Project)](https://github.com/ewilderj/doap) provides the vocabulary for project-level git metadata:

| Git Concept | DOAP Term | CKP Usage |
|-------------|-----------|-----------|
| Repository | `doap:GitRepository` | `spec.repo` in CK.Project |
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

Every materialised kernel directory contains a `.git-ref` file with the exact commit hash used for materialisation:

```
/ck/v/live/Delvinator.Core/.git-ref
→ contains: "abc123f"
```

This is not decorative metadata. It implements the Git2PROV `prov:wasGeneratedBy` relationship: the materialised files at `/ck/v/live/Delvinator.Core/` were generated by a `git archive` activity operating on commit `abc123f`.

The `.git-ref` stamp serves three purposes:

1. **Verification** -- the operator reads `.git-ref` on reconciliation to determine whether the materialised files match the declared version. If the ref matches, the version is already current and no re-materialisation is needed.

2. **Traceability** -- given any deployed file, you can trace it back to the exact commit that produced it. `cat .git-ref` gives you the commit hash; `git log -1 {hash}` gives you the author, date, and message.

3. **Audit** -- the `.git-ref` file is part of the ReadOnlyMany volume. It cannot be modified by the runtime. If the materialised files have been tampered with, the `.git-ref` will not match a `git archive` of the same commit.

## Bare Repo Location

The bare git repository cannot live directly on the SeaweedFS FUSE mount. Git requires filesystem-level `mmap` and locking semantics that FUSE does not provide -- `git archive` fails with "not a git repository" when run against a FUSE-mounted bare repo.

The resolution: the bare repo lives in the operator pod's scratch space (emptyDir or PVC), cloned from an upstream source. The operator:

1. On startup: `git clone --bare {upstream} /scratch/kernels.git`
2. On reconcile: `git -C /scratch/kernels.git fetch origin`
3. Runs `git archive` against the local bare repo
4. Uploads results to filer via HTTP API

This means `spec.repo` in CK.Project points to the upstream source (a GitHub URL or internal git server), not the filer path. The filer is the materialisation **target**, not the repo **source**.

## DATA Loop: Not in Git

The DATA loop is deliberately excluded from git. DATA accumulates continuously at runtime -- instances, proofs, ledger entries -- and has fundamentally different versioning semantics:

- CK and TOOL are **point-in-time snapshots** (a commit represents a complete state)
- DATA is **append-only accumulation** (versioned by its own proof chain, not by commits)

Putting DATA in git would mean either committing on every instance creation (impractical for a real-time system) or periodically snapshotting (losing the append-only invariant). The ReadWriteMany volume with ledger-based versioning is the correct abstraction for DATA.

## Conformance

- Each project SHOULD use a single git repository for all kernel CK and TOOL loops
- DATA loop content MUST NOT be stored in git
- Independent loop versioning MUST use tag prefixes (`ck/`, `tool/`), not separate repositories
- The `.git-ref` stamp MUST record the exact commit hash used for materialisation
- `spec.repo` MUST be a clonable git URL (the upstream source, not a filer path)
- If `ck_ref` and `tool_ref` are omitted in a version declaration, both loops MUST materialise from `ref`
