---
title: Compliance Checking
description: CK.ComplianceCheck — the fleet validator with 20 check types covering identity, structure, edges, ontology, provenance, and more.
---

# Compliance Checking

## Purpose

A distributed system with ontological governance needs a kernel that can answer: "Does this fleet conform to its own declared rules?" `CK.ComplianceCheck` is that kernel. It validates every kernel in the fleet -- including itself -- against the CKP specification, producing compliance reports as sealed instances with PROV-O provenance.

The validator exists as a separate kernel (rather than a library function) because validation is an occurrent process that produces evidence, takes time, and must itself be auditable. Making it a kernel means its own compliance can be checked, its results are sealed instances, and other kernels can TRIGGER it via standard [edges](./edges).

| Property | Value |
|----------|-------|
| URN | `ckp://Kernel#CK.ComplianceCheck:v1.0` |
| Type | `node:hot` |
| Governance | `STRICT` |
| Entrypoint | `tool/processor.py` |
| Archetype | Validator |

## The 20 Check Types

CK.ComplianceCheck defines 20 check types, each grounded in BFO. Every check type produces an `IdentityCheck` occurrent (BFO:0000015) with pass/fail verdict and evidence.

### Core Checks (1-8)

Core checks validate the fundamental structural and identity requirements of every kernel.

| # | Check Type | BFO Basis | What It Validates |
|---|------------|-----------|-------------------|
| 1 | `check.identity` | BFO:0000040 | `apiVersion: conceptkernel/v3`, identity fields, namespace, domain, project |
| 2 | `check.awakening` | CKP | All 8 awakening files present and non-empty |
| 3 | `check.structure` | BFO:0000040 | Directory layout: `llm/`, `tool/`, `web/`, `data/` |
| 4 | `check.types` | BFO:0000019 | `qualities.type`, `governance_mode`, `deployment_state` declared and valid |
| 5 | `check.edges` | BFO:0000015 | Target kernel exists, predicate is valid, no duplicate edges |
| 6 | `check.tool` | BFO:0000015 | `processor.py` exists, valid Python syntax, entrypoint declared |
| 7 | `check.web` | BFO:0000040 | `index.html` present if `serve=true`, no broken references |
| 8 | `check.grants` | BFO:0000023 | Grants block present with identity levels and actions declared |

### Full Checks (9-20)

Full checks extend core validation with ontological, runtime, and provenance-level verification.

| # | Check Type | BFO Basis | What It Validates |
|---|------------|-----------|-------------------|
| 9 | `check.integrity` | BFO:0000144 | Files non-empty, YAML parses, no stale or deprecated fields |
| 10 | `check.llm` | BFO:0000017 | `CLAUDE.md` at project root (not in `llm/`), `SKILL.md` sections valid |
| 11 | `check.versions` | BFO:0000008 | `metadata.version` is valid semver, kernel version is pinned in the project's `.ckproject` manifest |
| 12 | `check.nats` | BFO:0000015 | `spec.nats` with input/result/event topics declared |
| 13 | `check.mutation_frequency` | BFO:0000144 | Git commit count per file matches expected governance band |
| 14 | `check.ontology_types` | BFO:0000017 | `ontology.yaml` has non-empty `classes:` with `is_a:` and `attributes:` |
| 15 | `check.instance_typing` | BFO:0000040 | Instances in `data/` conform to `ontology.yaml` class definitions |
| 16 | `check.three_loop_isolation` | CKP | Static analysis: `tool/` code does not write to CK loop files |
| 17 | `check.edge_materialisation` | BFO:0000015 | Edge targets exist in fleet, NATS topics resolve correctly |
| 18 | `check.shacl_validity` | BFO:0000017 | `rules.shacl` is syntactically valid SHACL |
| 19 | `check.consensus_provenance` | PROV-O | AUTONOMOUS kernels have PROV-O on ontology changes |
| 20 | `check.provenance` | PROV-O | Every instance has `prov:wasGeneratedBy`, `prov:wasAttributedTo`, `prov:generatedAtTime` |

::: tip Core vs Full
Core checks (1-8) validate structural correctness -- these can run without access to the running cluster. Full checks (9-20) require access to filesystem content, git history, running NATS topics, and instance data. Running `check.all` executes all 20.
:::

## Check Execution Model

Each check type is invoked as a fleet-wide scan. For every kernel in the fleet, the check produces a per-kernel verdict. The aggregate is a compliance report.

```
CK.ComplianceCheck receives check.all
  for each kernel in fleet:
    for each check_type in [check.identity ... check.provenance]:
      verdict = run_check(kernel, check_type)
      record verdict as IdentityCheck occurrent
  seal compliance report as instance
```

Each check produces:
- **Verdict:** PASS or FAIL per kernel per check type
- **Evidence:** The actual value observed (not just the boolean)
- **PROV-O provenance:** Who ran the check, when, against which kernel version

## Bootstrap Self-Validation

CK.ComplianceCheck MUST validate itself as part of every fleet scan. This creates a self-referential loop that is intentional: if the validator fails its own checks, the fleet report reflects that failure. The validator does not skip itself.

::: warning Self-Reference
This means a broken CK.ComplianceCheck will report its own failures. If the validator's `ontology.yaml` is missing, `check.ontology_types` will fail for CK.ComplianceCheck itself, and the fleet report will include that failure.
:::

## Compliance Output

```
$ ckp compliance
  Running CK.ComplianceCheck against fleet...
  check.identity            12/12  PASS
  check.awakening           12/12  PASS
  check.structure           12/12  PASS
  check.types               12/12  PASS
  check.edges               12/12  PASS
  check.tool                12/12  PASS
  check.web                 12/12  PASS
  check.grants              12/12  PASS
  check.integrity           12/12  PASS
  check.llm                 12/12  PASS
  check.versions            12/12  PASS
  check.nats                12/12  PASS
  check.mutation_frequency  12/12  PASS
  check.ontology_types      12/12  PASS
  check.instance_typing     12/12  PASS
  check.three_loop_isolation 12/12 PASS
  check.edge_materialisation 12/12 PASS
  check.shacl_validity      12/12  PASS
  check.consensus_provenance 12/12 PASS
  check.provenance          12/12  PASS
  --------
  ALL PASS  |  0 warns  |  0 fails
```

The output shows `{passing_kernels}/{total_kernels}` for each check type. A fleet with 12 kernels runs 240 individual checks (20 types x 12 kernels).

## Check Category Summary

| Category | Check Types | What It Covers |
|----------|-------------|----------------|
| **Identity** | 1, 2, 4, 11 | apiVersion, awakening files, type/governance, version/serving |
| **Structure** | 3, 6, 7, 9 | Directory layout, processor, web, file integrity |
| **Edges & NATS** | 5, 12, 17 | Edge validity, NATS topics, edge materialisation |
| **Ontology** | 14, 15, 18 | Ontology types, instance typing, SHACL validity |
| **Governance** | 8, 13, 16, 19 | Grants, mutation frequency, three-loop isolation, consensus provenance |
| **Provenance** | 20 | PROV-O fields on every instance |
| **LLM** | 10 | CLAUDE.md and SKILL.md validity |

## Edge Integration

CK.ComplianceCheck is triggered by other system kernels via [edge predicates](./edges):

- **CK.Operator** `TRIGGERS` CK.ComplianceCheck after every `project.deploy`
- **CK.Consensus** `TRIGGERS` CK.ComplianceCheck after every approval decision

This means compliance validation runs automatically as part of the platform lifecycle, not as a manual step.

## Conformance Requirements

| Criterion | Level |
|-----------|-------|
| Implementations MUST implement all 20 check types | REQUIRED |
| `check.provenance` MUST enforce PROV-O field presence | REQUIRED |
| CK.ComplianceCheck MUST validate itself during fleet scans | REQUIRED |
| `ontology.yaml` MUST be treated as REQUIRED (not OPTIONAL) | REQUIRED |
| Compliance reports MUST be sealed instances with PROV-O | REQUIRED |
