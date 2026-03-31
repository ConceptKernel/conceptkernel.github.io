---
title: What's New in v3.5
description: Key changes from CKP v3.4 to v3.5 — DL box mapping, ontology layering, new kernel types, implementation patterns
---

# What's New in v3.5

## Conceptual Changes

### Three Loops as Description Logic Boxes

The defining change. Each loop maps to a formal DL box:

```
CK Loop   → TBox (terminological)   — what CAN exist
TOOL Loop → RBox (relational)       — how things RELATE
DATA Loop → ABox (assertional)      — what DOES exist
```

This is not a metaphor. Each box is an independently-versioned volume with different write authority and git semantics. [Read more →](/v3.5/three-loops)

### Four-Layer Ontology Import Chain

CKP now grounds through established mid-level ontologies:

| Layer | Ontology | Scope |
|-------|----------|-------|
| 0 | BFO 2020 | Upper ontology |
| 0.5 | IAO + CCO + PROV-O + ValueFlows | Information, agents, provenance, economics |
| 1 | CKP | Protocol: kernel, edge, instance, action |
| 2 | Per-kernel ontology.yaml | Domain-specific types |

Key reclassifications: KernelOntology → iao:Document, Instance → iao:DataItem, Kernel → cco:Agent, Action → iao:PlanSpecification. [Read more →](/v3.5/ontology-layering)

### Kernel-as-Datatype Rule

A kernel IS a datatype. `ontology.yaml` defines the type. `storage/instances/` holds individuals. Empty `ontology.yaml` is a compliance failure, not an incomplete feature.

## New Kernel Types

| Type | Process | NATS | Description |
|------|---------|------|-------------|
| HOT | long-running | server listen + send | API service, always-on |
| COLD | execute + exit | send only | On-demand execution |
| INLINE | none (browser) | WSS + JWT | Browser-side JS with CK.Lib.Js |
| STATIC | none | none | Gateway serves files directly |

[Read more →](/v3.5/patterns#kernel-type-matrix)

## New Ontology Classes (alpha-6)

- `ckp:InlineKernel` — podless browser-side kernel
- `ckp:StaticKernel` — no process, gateway serves storage/web/
- `ckp:Project` — .ckproject declaration (cco:Organization)
- `ckp:Reconciliation` — operator reconciliation cycle
- `ckp:StorageMedium` — FILESYSTEM / DOCUMENT_STORE / CONFIGMAP
- `ckp:DeploymentMethod` — VOLUME / FILER / CONFIGMAP_DEPLOY / INLINE_DEPLOY
- `ckp:ServingDisposition` — API / Web / NATS / Browser WSS

[Browse all classes →](/browse/?class=Kernel)

## Physical Topology

- Three volumes per kernel via volume driver (TBox ReadOnly, RBox ReadOnly, ABox ReadWrite)
- Gateway split routing: `/action/*` → container, `/*` → filesystem
- Explicit version directories (`storage/web/v1/`, `v2/`) — no weighted canary
- Separation axiom enforced physically by volume `readOnly`

[Read more →](/v3.5/topology)

## CK.Operator

Replaces manual deployment tooling. A Kubernetes operator that reconciles `.ckproject` and `conceptkernel.yaml` into gateway resources. Watches cluster state, publishes events via NATS.

[Read more →](/v3.5/operator)

## Implementation Patterns

Eight patterns extracted from production CKP deployments:

1. [Dual-Store](/v3.5/patterns#dual-store) — TBox in graph DB, ABox in document DB
2. [Classification](/v3.5/patterns#classification) — typed pipeline stage
3. [Quality Assessment](/v3.5/patterns#quality-assessment) — sosa:Observation
4. [Composition](/v3.5/patterns#composition) — OWL property validation
5. [Economic Event](/v3.5/patterns#economic-event) — ValueFlows for payments
6. [Pipeline Stage](/v3.5/patterns#pipeline-stage) — PROV-O mandatory
7. [Provenance Mandate](/v3.5/patterns#provenance) — every action traces
8. [Kernel Type Matrix](/v3.5/patterns#kernel-type-matrix) — four deployment modes

## PROV-O Mandate

No longer optional. Every action that produces an instance MUST record `prov:wasGeneratedBy`, `prov:wasAttributedTo`, `prov:generatedAtTime`. Enforced by `check.provenance`.

## Deliberately Deferred

- CCO Geospatial, Facility, Time, Currency, Quality ontologies
- ODRL, Hydra Core, SWRL
- [See full list →](/v3.5/ontology-layering#deliberately-skipped-ontologies)
