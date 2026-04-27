---
title: Ontological Graph -- Jena Fuseki and SPARQL
description: The CKP fleet as a SPARQL-queryable knowledge graph -- BFO:0000040 kernel nodes, edge predicates as RDF properties, project-scoped named graphs.
---

# Ontological Graph

A deployed CKP fleet is materialised as a knowledge graph in Jena Fuseki. Each kernel is a `ckp:Kernel` individual typed as a BFO:0000040 Material Entity; each declared edge becomes an RDF object property triple; each project is a named graph keyed by its hostname. The SPARQL endpoint is publicly readable, supports SPARQL 1.1 including property paths, and answers fleet-scoped queries (transitive closure, cross-kernel joins, provenance trace) directly against typed triples.

## Endpoint

| Property | Value |
|----------|-------|
| Dataset | `/ckp` on the fleet's Jena Fuseki instance |
| Public endpoint | `https://jena.<domain>/ckp/sparql` |
| In-cluster endpoint | `jena-fuseki.jena.svc:3030/ckp/sparql` |
| Read access | Public, anonymous |
| Write access | Authenticated, restricted to CK.Operator |

CK.Operator's `deploy.graph` step publishes kernel metadata and edges as RDF triples to the `/ckp` dataset after each successful deployment.

## Loaded Modules

The dataset is loaded from the published CKP Turtle modules at `https://conceptkernel.org/ontology/v3.7/`:

| Module | Content |
|--------|---------|
| `core.ttl` | Core classes: Kernel, Project, Action, Instance, Edge, RelationshipType |
| `kernel-metadata.ttl` | Kernel type qualities, governance modes, deployment methods |
| `processes.ttl` | Occurrent classes, action lifecycle |
| `proof.ttl` | ProofRecord, ProofCheck, ProofOutcome |
| `rbac.ttl` | Grants, access levels, role mappings |
| `relations.ttl` | Edge predicates: COMPOSES, TRIGGERS, PRODUCES, EXTENDS, LOOPS_WITH |
| `self-improvement.ttl` | Consensus, governance, evolution classes |
| `shapes.ttl` | SHACL shapes for instance validation |
| `workflow.ttl` | Task lifecycle, execution, provenance |
| `base-instances.ttl` | System kernel instance declarations |

Per-kernel entity triples are produced at kernel creation time from `kernel-entity-template.ttl.template` and published into the named graph for that kernel's project. The `.ttl.template` suffix keeps the template file out of the bulk-load glob.

## Published Triples

The graph materialises three levels of information from `conceptkernel.yaml` files.

### Project

```turtle
<ckp://Project#delvinator.tech.games> a ckp:Project ;
    rdfs:label "delvinator.tech.games" ;
    ckp:hasNamespace "ck-delvinator" .
```

### Kernel

Each deployed kernel becomes a `ckp:Kernel` individual, typed as a BFO:0000040 Material Entity:

```turtle
<ckp://Kernel#Delvinator.Core:v1.0> a ckp:Kernel, bfo:0000040 ;
    rdfs:label "Delvinator.Core" ;
    ckp:hasType "node:cold" ;
    ckp:hasGovernance "STRICT" ;
    ckp:belongsToProject <ckp://Project#delvinator.tech.games> .
```

### Edges

Each declared outbound edge in `conceptkernel.yaml` becomes an RDF object-property triple keyed by the predicate's IRI:

```turtle
<ckp://Kernel#Delvinator.Core:v1.0>
    ckp:composes <ckp://Kernel#CK.ComplianceCheck:v1.0> ;
    ckp:produces <ckp://Kernel#Delvinator.TaxonomySynthesis:v1.0> ;
    ckp:extends  <ckp://Kernel#Provider.LLM:v1.0> .
```

## Named Graphs (Project Scope)

Each project's fleet is stored in its own named graph:

```turtle
GRAPH <urn:ckp:fleet:delvinator-tech-games> {
    <ckp://Project#delvinator.tech.games> a ckp:Project ;
        rdfs:label "delvinator.tech.games" ;
        ckp:hasNamespace "ck-delvinator" .

    <ckp://Kernel#Delvinator.Core:v1.0> a ckp:Kernel, bfo:0000040 ;
        ckp:belongsToProject <ckp://Project#delvinator.tech.games> ;
        ckp:hasType "node:cold" .
}
```

Named-graph convention: `urn:ckp:fleet:{hostname-slug}`, where `{hostname-slug}` is the project's hostname with `.` replaced by `-`. Project-scoped queries target the matching named graph; cross-fleet queries omit the `GRAPH` clause and select across the default graph.

## SPARQL Examples

### All kernels in a project

```sparql
SELECT ?kernel ?type WHERE {
  GRAPH <urn:ckp:fleet:delvinator-tech-games> {
    ?kernel a ckp:Kernel ;
            ckp:hasType ?type .
  }
}
```

### All edges across the fleet

```sparql
SELECT ?source ?predicate ?target WHERE {
  ?source ?predicate ?target .
  ?source a ckp:Kernel .
  ?target a ckp:Kernel .
}
```

### Instances produced by a kernel

```sparql
SELECT ?instance ?time WHERE {
  ?instance prov:wasAttributedTo ?kernel ;
            prov:generatedAtTime ?time .
  ?kernel ckp:hasUrn "ckp://Kernel#Delvinator.Core:v1.0" .
}
```

This query uses [PROV-O provenance](./provenance) triples emitted alongside each instance.

### Trace the provenance chain for an instance

```sparql
SELECT ?action ?agent ?time WHERE {
  ?instance prov:wasGeneratedBy ?action .
  ?action prov:wasAssociatedWith ?agent ;
          prov:startedAtTime ?time .
}
```

### Kernels that EXTEND a given capability provider

```sparql
SELECT ?kernel WHERE {
  ?kernel ckp:extends <ckp://Kernel#Provider.LLM:v1.0> .
}
```

### Transitive COMPOSES closure

```sparql
SELECT ?kernel ?composed WHERE {
  ?kernel ckp:composes+ ?composed .
}
```

The `+` operator walks one-or-more `composes` edges, returning the full transitive closure. If A COMPOSES B and B COMPOSES C, the result includes (A,B), (A,C), and (B,C).

### Kernels with failing proof checks

```sparql
SELECT ?kernel ?checks ?passed WHERE {
  ?kernel a ckp:Kernel ;
          ckp:proofTotalChecks ?checks ;
          ckp:proofTotalPassed ?passed .
  FILTER(?passed < ?checks)
}
```

## Authority and Liveness

The graph is a **projection** of the fleet's authoritative state. The authoritative declarations live in each project's `.ckproject` manifest (and the `conceptkernel.yaml` of each kernel); the graph is rebuilt from those by `deploy.graph` after each successful reconciliation.

`deploy.graph` is best-effort: a deployment succeeds even when Fuseki is unreachable, and the graph catches up on the next successful publish. Consumers that need point-in-time correctness should query the SPARQL endpoint as an index into the fleet, then resolve detailed kernel state through the relevant `ConceptKernel` CR or filer paths.

## Conformance Requirements

| Criterion | Level |
|-----------|-------|
| CK.Operator MUST publish kernel metadata to Jena after a successful deploy when reachable | REQUIRED |
| Each published kernel MUST be typed as `ckp:Kernel` and `bfo:0000040` | REQUIRED |
| Edges MUST be expressed using CKP predicates from `relations.ttl` (`ckp:composes`, `ckp:triggers`, `ckp:produces`, `ckp:extends`, `ckp:loopsWith`) | REQUIRED |
| Each project's triples MUST be stored in a named graph following `urn:ckp:fleet:{hostname-slug}` | REQUIRED |
| The SPARQL endpoint MUST be publicly readable | REQUIRED |
| Updates MUST require authentication | REQUIRED |
| Graph materialisation MAY be best-effort: deploy SHALL succeed even if Fuseki is unreachable | RECOMMENDED |
