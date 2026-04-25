---
title: Ontological Graph -- Jena Fuseki and SPARQL
description: How the CKP fleet is materialised as SPARQL-queryable BFO:0000040 nodes in Jena Fuseki, from Turtle module loading to fleet graph queries.
---

# Ontological Graph

## From Files to Triples

CKP v3.5 defines the ontology in Turtle files. v3.7 loads those files into Jena Fuseki, making them queryable. This is the step from "the ontology is a file on disk" to "the ontology is a knowledge graph you can ask questions about."

The difference matters because:
- **Files** support grep. **Graphs** support inference. You can grep for `ckp:Kernel` in a Turtle file. You can SPARQL for "all kernels that transitively COMPOSE a kernel with STRICT governance" in a graph.
- **Files** are local. **Graphs** are networked. A SPARQL endpoint can be queried by any kernel, any tool, any browser.
- **Files** are snapshots. **Graphs** can be updated. When a new kernel deploys, its metadata becomes triples. The graph reflects the live fleet, not just the spec.

## Jena Fuseki /ckp Dataset

CK.Operator publishes to a Jena Fuseki dataset at `/ckp`. Each project's fleet is stored in a named graph: `urn:ckp:fleet:{hostname}`.

| Fact | Value |
|------|-------|
| Endpoint | `jena.conceptkernel.dev/ckp/sparql` |
| Internal endpoint | `jena-fuseki.jena.svc:3030/ckp/sparql` |
| Triples loaded | 2,797 |
| Source modules | 10 of 17 spec-declared Turtle modules |

### Modules Loaded

| Module | Content | Triples |
|--------|---------|---------|
| `core.ttl` | Core classes: Kernel, Action, Instance, Edge | ~400 |
| `proof.ttl` | ProofRecord, ProofCheck, ProofOutcome | ~150 |
| `base-instances.ttl` | Default kernel instances, system kernel declarations | ~300 |
| `kernel-metadata.ttl` | Kernel type qualities, governance modes | ~200 |
| `processes.ttl` | Occurrent classes, action lifecycle | ~250 |
| `rbac.ttl` | Grants, access levels, role mappings | ~200 |
| `relations.ttl` | Edge predicates: COMPOSES, TRIGGERS, PRODUCES, CONSUMES, EXTENDS | ~150 |
| `self-improvement.ttl` | Consensus, governance, evolution classes | ~200 |
| `shapes.ttl` | SHACL shapes for instance validation | ~350 |
| `workflow.ttl` | Task lifecycle, execution, provenance | ~200 |

### Modules Not Yet Published

Seven modules declared in the spec are not yet published as Turtle:

| Module | Content | Status |
|--------|---------|--------|
| `instance.ttl` | Instance lifecycle, sealing, amendment | Docs stub only |
| `action.ttl` | Action types, parameters, access levels | Docs stub only |
| `identity.ttl` | URN scheme, SPIFFE mapping, GUID assignment | Docs stub only |
| `governance.ttl` | Governance modes, escalation, direction | Docs stub only |
| `lifecycle.ttl` | Kernel lifecycle: mint, deploy, evolve, retire | Docs stub only |
| `economic.ttl` | ValueFlows/REA economic events | Docs stub only |
| `topology.ttl` | Fleet topology, namespace mapping, volume layout | Docs stub only |

::: info Template Exclusion
`kernel-entity-template.ttl.template` is intentionally excluded from the Turtle publication set. It is a scaffolding template that contains placeholder tokens (`{KERNEL_NAME}`, `{ROLES}`, etc.) and is therefore not valid Turtle. The `.ttl.template` suffix keeps it out of the `*.ttl` glob used by the materialisation loader (RDF loaders like Jena Fuseki match by glob, not by extension semantics — the rename ensures the file simply is not fed to the parser). Per-kernel entity triples are produced at kernel creation time and published per-kernel rather than consumed from this template.
:::

## Published Triples

The graph materialises three levels of information from `conceptkernel.yaml` files:

### Per Project

```turtle
<ckp://Project#delvinator.tech.games> a ckp:Project ;
    rdfs:label "delvinator.tech.games" ;
    ckp:hasNamespace "ck-delvinator" .
```

### Per Kernel

```turtle
<ckp://Kernel#Delvinator.Core:v1.0> a ckp:Kernel, bfo:0000040 ;
    rdfs:label "Delvinator.Core" ;
    ckp:hasType "node:cold" ;
    ckp:belongsToProject <ckp://Project#delvinator.tech.games> .
```

### Per Edge

```turtle
<ckp://Kernel#Delvinator.Core:v1.0> ckp:composes <ckp://Kernel#CK.ComplianceCheck:v1.0> .
<ckp://Kernel#Delvinator.Core:v1.0> ckp:produces <ckp://Kernel#Delvinator.TaxonomySynthesis:v1.0> .
```

## Fleet Graph Materialisation

The `deploy.graph` step in the CK.Operator reconciliation lifecycle publishes kernel metadata and edges as RDF triples to the `/ckp` dataset after successful deployment.

### Kernel as BFO:0000040 Node

Each deployed kernel becomes a `ckp:Kernel` individual, typed as a BFO:0000040 Material Entity:

```turtle
<ckp://Kernel#Delvinator.Core:v1.0> a ckp:Kernel, bfo:0000040 ;
    rdfs:label "Delvinator.Core" ;
    ckp:hasType "node:cold" ;
    ckp:hasGovernance "STRICT" ;
    ckp:belongsToProject <ckp://Project#delvinator.tech.games> .
```

### Edges as RDF Object Properties

Edge predicates from `conceptkernel.yaml` become RDF triples:

```turtle
<ckp://Kernel#Delvinator.Core:v1.0>
    ckp:composes <ckp://Kernel#CK.ComplianceCheck:v1.0> ;
    ckp:produces <ckp://Kernel#Delvinator.TaxonomySynthesis:v1.0> ;
    ckp:extends  <ckp://Kernel#{provider-kernel}:v1.0> .
```

### Project as Named Graph

Each project's fleet is stored in a named graph:

```turtle
GRAPH <urn:ckp:fleet:delvinator-tech-games> {
    <ckp://Project#delvinator.tech.games> a ckp:Project ;
        rdfs:label "delvinator.tech.games" ;
        ckp:hasNamespace "ck-delvinator" .

    <ckp://Kernel#Delvinator.Core:v1.0> a ckp:Kernel, bfo:0000040 ;
        ckp:belongsToProject <ckp://Project#delvinator.tech.games> ;
        ...
}
```

Named graphs enable per-project SPARQL queries. You can ask "show me all kernels in the delvinator fleet" without scanning the entire graph.

## SPARQL Query Examples

### All Kernels in a Project

```sparql
SELECT ?kernel ?type WHERE {
  GRAPH <urn:ckp:fleet:delvinator-tech-games> {
    ?kernel a ckp:Kernel ; ckp:hasType ?type .
  }
}
```

### All Edges Across the Entire Fleet

```sparql
SELECT ?source ?predicate ?target WHERE {
  ?source ?predicate ?target .
  ?source a ckp:Kernel .
  ?target a ckp:Kernel .
}
```

### Find All Instances Produced by a Kernel

```sparql
SELECT ?instance ?time WHERE {
  ?instance prov:wasAttributedTo ?kernel ;
            prov:generatedAtTime ?time .
  ?kernel ckp:hasUrn "ckp://Kernel#Delvinator.Core:v1.0" .
}
```

This query leverages [PROV-O provenance](./provenance) triples to find all instances attributed to a specific kernel.

### Trace Provenance Chain for an Instance

```sparql
SELECT ?action ?agent ?time WHERE {
  ?instance prov:wasGeneratedBy ?action .
  ?action prov:wasAssociatedWith ?agent ;
          prov:startedAtTime ?time .
}
```

### Kernels That EXTEND a Specific Capability Provider

```sparql
SELECT ?kernel ?template WHERE {
  ?kernel ckp:extends ?provider .
  FILTER(?provider = <ckp://Kernel#{provider-kernel}:v1.0>)
  OPTIONAL { ?kernel ckp:hasTemplate ?template }
}
```

### Transitive COMPOSES Chain

```sparql
SELECT ?kernel ?composed WHERE {
  ?kernel ckp:composes+ ?composed .
}
```

This finds all kernels in the transitive closure of COMPOSES -- if A COMPOSES B and B COMPOSES C, this returns (A, B), (A, C), and (B, C). Useful for understanding the full capability inheritance chain.

### Kernels with Failing Proof

```sparql
SELECT ?kernel ?checks ?passed WHERE {
  ?kernel a ckp:Kernel ;
          ckp:proofTotalChecks ?checks ;
          ckp:proofTotalPassed ?passed .
  FILTER(?passed < ?checks)
}
```

## Existing Fuseki State

The cluster already runs Jena Fuseki in the `jena` namespace:

| Dataset | Triples | Content |
|---------|---------|---------|
| `/ontosys` | ~335,000 | Legacy ontosys.io ontology (pre-CKP) |
| `/dataset` | ~3,000 | General purpose |
| `/ckp` | ~2,800 | CKP v3.5-alpha6 ontology (10 modules) |

Admin credentials are stored in the `jena-fuseki-admin` secret in the `jena` namespace. The SPARQL endpoint is publicly readable; updates require authentication.

## Why Jena Fuseki

The choice of Jena Fuseki over other triple stores:

| Concern | Jena Fuseki | Alternatives |
|---------|-------------|-------------|
| **SPARQL 1.1** | Full support including UPDATE, named graphs, property paths | Most stores support this |
| **Turtle loading** | Native format, bulk upload via HTTP POST | Some stores require conversion |
| **Named graphs** | First-class support -- each project gets its own graph | Some stores simulate with contexts |
| **Lightweight** | Single JAR, ~100MB memory for small datasets | Comparable to Blazegraph; lighter than Virtuoso |
| **Already deployed** | Running in the cluster since pre-CKP | No new infrastructure needed |

The critical feature is named graphs. Without them, fleet-scoped queries would require filtering by project on every query -- adding complexity and reducing performance.

## Architectural Consistency Check

::: details Logical Analysis: Graph Design

**Question:** Is the graph a mirror of conceptkernel.yaml, or does it add information?

**Answer:** Currently, it is a projection. Every triple in the fleet graph can be derived from the `conceptkernel.yaml` files on disk. The graph adds no new information -- it adds new access patterns. You cannot do transitive queries on YAML files. You cannot do cross-fleet joins on YAML files. The graph materialises what the files declare.

In the future (v3.5.13), the graph will add information: instance provenance chains, consensus decision links, and runtime status. At that point, the graph becomes a union of declaration (from YAML) and observation (from runtime), which cannot be derived from files alone.

**Question:** What happens if the graph gets out of sync with the cluster?

**Answer:** The `deploy.graph` step runs after every successful deployment. If a deployment does not trigger graph materialisation (e.g., Fuseki is unreachable), the graph becomes stale. This is explicitly acceptable: `deploy.graph` is best-effort. The deployment succeeds even if Fuseki is down. The graph is an index, not a source of truth -- `conceptkernel.yaml` files are always authoritative.

**Question:** Why not use FerretDB or MongoDB for the graph?

**Answer:** Because graph queries (transitive closure, path finding, inference) are fundamentally different from document queries (filter, aggregate, project). FerretDB is used for instance storage (the ABox -- what DOES exist). Fuseki is used for ontology storage (the TBox/RBox -- what CAN exist and HOW things relate). This maps directly to the Description Logic box model: document store for ABox, graph store for TBox+RBox.

**Gap identified:** The 7 unpublished Turtle modules (instance, action, identity, governance, lifecycle, economic, topology) represent a significant portion of the CKP ontology. Without them, the /ckp dataset covers the core and system concepts but misses the domain-level and lifecycle classes. Publishing these modules is a prerequisite for the graph materialisation feature (v3.5.13) to be fully useful.
:::

## Conformance Requirements

- CK.Operator SHOULD publish kernel metadata to Jena after successful deploy
- Each kernel MUST be typed as `ckp:Kernel` and `bfo:0000040`
- Edges MUST use CKP predicates (`ckp:composes`, `ckp:triggers`, `ckp:produces`, `ckp:extends`)
- Graph materialisation is best-effort -- deploy succeeds even if Jena is unreachable
- Named graphs MUST use the convention `urn:ckp:fleet:{hostname-slug}`
- The SPARQL endpoint MUST be publicly readable; updates MUST require authentication
