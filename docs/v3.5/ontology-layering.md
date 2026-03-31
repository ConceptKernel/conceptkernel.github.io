---
title: Ontology Layering Strategy
description: The four-layer import chain from BFO 2020 through mid-level ontologies to per-kernel domain schemas
---

# Ontology Layering Strategy

CKP adopts a four-layer import chain grounded in established ontologies. Each layer builds on the one below, and no layer may bypass an intermediate.

```mermaid
graph BT
    L0["<b>Layer 0</b><br/>BFO 2020 (ISO 21838-2)<br/><i>Upper ontology</i><br/>entity, continuant, occurrent"]
    L05["<b>Layer 0.5</b><br/>IAO + CCO + PROV-O + ValueFlows<br/><i>Mid-level</i><br/>information, agents, provenance, economics"]
    L1["<b>Layer 1</b><br/>CKP (conceptkernel.org/v3.5/)<br/><i>Protocol</i><br/>kernel, edge, instance, action"]
    L2["<b>Layer 2</b><br/>Per-kernel (ontology.yaml)<br/><i>Domain-specific</i><br/>SpawnInstance, TraceRecord, etc."]

    L0 --> L05
    L05 --> L1
    L1 --> L2

    style L0 fill:#2c3e50,color:#fff
    style L05 fill:#34495e,color:#fff
    style L1 fill:#4a6fa5,color:#fff
    style L2 fill:#6a8e4e,color:#fff
```

## The Four Layers

```
Layer 0:   BFO 2020 (ISO 21838-2)           -- upper ontology (entity, continuant, occurrent)
Layer 0.5: IAO + CCO + PROV-O + ValueFlows  -- mid-level (information, agents, provenance, economics)
Layer 1:   CKP (conceptkernel.org/v3.5/)     -- protocol (kernel, edge, instance, action)
Layer 2:   Per-kernel (ontology.yaml)         -- domain-specific (SpawnInstance, TraceRecord, etc.)
```

## Imported Ontologies (Layer 0.5)

| Ontology | IRI | Scope | Grounds these CKP concepts |
|----------|-----|-------|---------------------------|
| **IAO** | `http://purl.obolibrary.org/obo/iao.owl` | Information entities | KernelOntology -> iao:Document, Instance -> iao:DataItem, Action -> iao:PlanSpecification, Contracts -> iao:DirectiveInformationEntity, ProcessorCode -> iao:Algorithm |
| **CCO Agent** | `cco:AgentOntology` | Agents, roles, organizations | Kernel -> cco:Agent, Project -> cco:Organization, RBAC -> cco:Role |
| **CCO Artifact** | `cco:ArtifactOntology` | Artifacts, specifications | Edge -> cco:Artifact, ServingDisposition -> cco:Specification |
| **CCO Info Entity** | `cco:InformationEntityOntology` | Information, documents | Aligns with IAO for richer information typing |
| **CCO Event** | `cco:EventOntology` | Events, actions | Action subtypes -> cco:Event |
| **PROV-O** | `http://www.w3.org/ns/prov#` | Provenance chains | Instance -> prov:Entity, Action -> prov:Activity, Kernel -> prov:Agent |
| **ValueFlows** | `https://w3id.org/valueflows#` | Economic events (REA) | Payment -> vf:EconomicEvent, Route/Agreement -> vf:Agreement, 402 Response -> vf:Commitment |

## Key Reclassifications from v3.4

v3.5 reclassifies several CKP classes to route through mid-level ontologies rather than mapping directly to BFO:

| CKP Class | v3.4 (BFO direct) | v3.5 (via mid-level) | Rationale |
|-----------|--------------------|---------------------|-----------|
| `ckp:KernelOntology` | bfo:0000020 (Quality) | iao:0000310 (Document) | An ontology is a document, not a quality of the kernel |
| `ckp:Instance` | bfo:0000031 (GenDepCont) | iao:0000027 (DataItem) | An instance is a truthful data item about something |
| `ckp:Edge` | bfo:0000031 (GenDepCont) | cco:Artifact | An edge is a constructed artifact connecting kernels |
| `ckp:Kernel` | bfo:0000040 (MaterialEntity) | cco:Agent + bfo:0000040 | A kernel is both material entity AND agent -- it acts |
| `ckp:Action` | bfo:0000015 (Process) | iao:0000104 (PlanSpecification) | An action is a plan specification that gets realized as a process |
| `ckp:Project` | (not in v3.4) | cco:Organization | A project organizes kernels into a coherent unit |
| `ckp:QueueContract` | bfo:0000016 (Disposition) | iao:0000017 (DirectiveInfoEntity) | A contract directs how to interact, not just a capability |

::: tip Why Mid-Level Ontologies?
Direct BFO mapping was sufficient for v3.4's structural concerns. But autonomous operations integration requires richer semantics -- agents that act, documents that describe, events that have economic value. The mid-level layer provides these without abandoning BFO's foundational rigour.
:::

## Deliberately Skipped Ontologies

These ontologies were evaluated and deliberately deferred. Each includes a trigger condition for future inclusion.

::: details Full List of Deferred Ontologies

| Ontology | Reason for deferral | Revisit when |
|----------|-------------------|--------------|
| **CCO Geospatial** | CKP kernels don't have physical location yet | Geo-distributed kernels across data centres; spatial service clustering |
| **CCO Facility** | No physical infrastructure modelling needed | Modelling cluster topology, rack placement, or edge nodes ontologically |
| **CCO Units of Measure** | `xsd:decimal` sufficient for current metrics | Quality-of-service SLAs need formal measurement with uncertainty |
| **CCO Quality** | BFO:0000019 sufficient for kernel qualities | Quality scoring needs richer dimensional analysis |
| **CCO Time** | `xsd:dateTime` sufficient for timestamps | Temporal reasoning (Allen intervals, duration calculus, scheduling) |
| **CCO Currency Unit** | ValueFlows covers economic events | Multi-currency support requiring ISO 4217 modelling |
| **ODRL** | Grants block in conceptkernel.yaml is simpler | Fine-grained policy composition across fleet; machine-readable licensing |
| **Hydra Core** | REST API descriptions handled by OpenAPI | Hypermedia-driven API discovery; self-describing endpoints |
| **SWRL** | SHACL rules sufficient for validation | Complex temporal/conditional business rules; reactive governance |

:::
