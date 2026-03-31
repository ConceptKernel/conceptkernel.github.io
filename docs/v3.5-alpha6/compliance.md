---
title: CK.ComplianceCheck
description: The fleet validator -- 13 check types as BFO-typed IdentityCheck occurrents, with SHACL reactive rules.
---

# CK.ComplianceCheck -- Fleet Validator

CK.ComplianceCheck is the platform kernel that validates the entire fleet against the CKP specification. It runs 13 check types as BFO-typed IdentityCheck occurrents.

## Check Types

| Check Type | BFO Basis | What It Validates |
|-----------|-----------|-------------------|
| **identity** | BFO:0000040 | `apiVersion: conceptkernel/v3`, is_a, kind, metadata, namespace_prefix, domain, project fields |
| **awakening** | CKP | All 8 awakening files present: yaml, README.md, CLAUDE.md, SKILL.md, CHANGELOG.md, ontology.yaml, rules.shacl, serving.json |
| **structure** | BFO:0000040 | Directory layout -- llm/, tool/, web/, storage/ present |
| **types** | BFO:0000019 | qualities.type, governance_mode, deployment_state declared |
| **edges** | BFO:0000015 | Target exists, predicate valid (COMPOSES/EXTENDS/TRIGGERS/LOOPS_WITH/PRODUCES), no duplicates |
| **tool** | BFO:0000015 | processor.py exists, valid syntax, entrypoint declared |
| **web** | BFO:0000040 | index.html present if serve=true, no broken refs |
| **grants** | BFO:0000023 | grants block present with identity + actions declared |
| **integrity** | BFO:0000144 | Files non-empty, YAML parses, no stale/deprecated fields |
| **llm** | BFO:0000017 | CLAUDE.md at OPS root (not in llm/), SKILL.md sections valid, kernel name refs correct |
| **versions** | BFO:0000008 | metadata.version is valid semver, serving.json present and parses |
| **nats** | BFO:0000015 | spec.nats with input/result/event topics declared |
| **mutation_frequency** | BFO:0000144 | Git commit count per file matches expected band for its type (v3.3) |

## Compliance Check Output

```
$ ckp compliance
  Running CK.ComplianceCheck against fleet...
  check.identity            N/N  PASS
  check.awakening           N/N  PASS  (8 required files)
  check.structure           N/N  PASS
  check.types               N/N  PASS
  check.edges               N/N  PASS
  check.tool                N/N  PASS
  check.web                 N/N  PASS
  check.grants              N/N  PASS
  check.integrity           N/N  PASS
  check.llm                 N/N  PASS  (CLAUDE.md at root, not llm/)
  check.versions            N/N  PASS
  check.nats                N/N  PASS
  check.mutation_frequency  N/N  PASS  (v3.3 -- commit bands match policy)
  ---------------------------------------------------------------
  ALL PASS  |  0 warns  |  0 fails  |  full v3.3 compliance
```

## SHACL in the Protocol

SHACL plays three roles in CKP:

### 1. Tool-to-Storage Contract

The tool's only obligation toward the DATA loop is to write a conforming instance into `storage/`. The instance must conform to the CK's `rules.shacl` before the write is accepted:

```json
{
  "instance_id":   "<short-tx>",
  "kernel_class":  "Finance.Employee",
  "kernel_id":     "7f3e-a1b2-c3d4-e5f6",
  "tool_ref":      "refs/heads/stable",
  "ck_ref":        "refs/heads/stable",
  "created_at":    "2026-03-14T10:00:00Z",
  "data": {}
}
```

### 2. Awakening Sequence

`rules.shacl` is the 7th file in the awakening sequence -- read after `ontology.yaml` and before `serving.json`. It defines the validation rules that instances must conform to.

### 3. SHACL Reactive Rules (v3.4)

::: tip Future Enhancement
v3.4 extends the compliance engine to execute SHACL Advanced Rules as part of governance: when conditions match in the knowledge graph, the compliance engine can materialise new triples and trigger governance actions (e.g., escalate overdue tasks, promote trust trajectories). Currently `rules.shacl` files are permissive stubs -- as kernels mature they accumulate domain-specific reactive rules.
:::

## Mutation Frequency Check (v3.3)

Git commit frequency maps predictably to loop membership. The `check.mutation_frequency` check cross-references commit counts against expected bands:

```bash
# Commit count for a single file:
git log --follow --oneline -- storage/i-task-{id}/data.json | wc -l

# All files ranked by update frequency:
git log --name-only --format='' | sort | uniq -c | sort -rn
```

| Frequency Band | Files | Expected | If Violated |
|----------------|-------|----------|-------------|
| High | `storage/ledger.json`, `storage/llm/context.jsonl` | Append-only logs | Expected |
| Medium | `CLAUDE.md`, `SKILL.md`, `CHANGELOG.md` | Identity evolves gradually | Expected |
| Low | `conceptkernel.yaml`, `ontology.yaml`, `rules.shacl` | Stable foundation | Flag if >20 commits |
| Near-zero | `storage/i-*/data.json` (sealed) | Sealed outputs | Flag if >1-3 commits |
