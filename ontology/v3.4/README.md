# ConceptKernel BFO Ontology

**Version:** v1.3.11-DRAFT-01
**Date:** 2025-11-23
**Location:** `/concepts/.ontology/`

## Overview

This directory contains the formal ontology files that map ConceptKernel architecture to Basic Formal Ontology (BFO). These files enable:

- **Formal reasoning** about kernel relationships and processes
- **Automatic inference** using OWL reasoners and SPARQL queries
- **Type safety validation** via SHACL rules
- **Provenance tracking** through temporal process chains
- **Compliance checking** against BFO alignment standards

## Files

### 1. `conceptkernel-bfo-base.ttl`
**Core BFO Mappings for Continuants**

Defines the persistent entities (continuants) in ConceptKernel:
- **Kernel** → `bfo:IndependentContinuant` (Material Entity)
- **Edge** → `bfo:IndependentContinuant` (Relational Entity)
- **Instance** → `bfo:GenericallyDependentContinuant` (Information Entity)
- **Ontology** → `bfo:SpecificallyDependentContinuant` (Universal)

**Coverage:** 85% (WELL_IMPLEMENTED)

**Key Classes:**
- `ckp:Kernel`, `ckp:HotKernel`, `ckp:ColdKernel`
- `ckp:Edge`, `ckp:RelationshipType` (PRODUCES, NOTIFIES, etc.)
- `ckp:Instance`, `ckp:KernelOntology`
- `ckp:EdgeKernel`, `ckp:ConsensusKernel`, `ckp:WssHubKernel` (Three Mediators)

### 2. `conceptkernel-processes.ttl`
**Occurrent (Process) Definitions**

Defines the temporal processes (occurrents) that unfold over time:
- **InvocationProcess** → Kernel job execution
- **EdgeCommunicationProcess** → Inter-kernel communication via edges
- **EdgeSubscriptionProcess** → Edge creation (consensus-driven)
- **ConsensusProcess** → Governance and voting
- **BroadcastProcess** → Real-time WebSocket broadcasting

**Coverage:** 45% (PARTIAL - temporal parts not tracked)

**Key Classes:**
- `ckpp:InvocationProcess`, `ckpp:EdgeCommunicationProcess`
- `ckpp:ConsensusProcess`, `ckpp:BroadcastProcess`
- `ckpp:TemporalPart`, `ckpp:ProcessBoundary`

### 3. `conceptkernel-relations.ttl`
**Relationships and Inference Rules**

Defines properties, property chains, and SWRL rules for automatic reasoning:
- **Graph traversal:** `ckpr:connected_by`, `ckpr:can_reach`, `ckpr:upstream_of`
- **Provenance:** `ckpr:created_by_process`, `ckpr:participates_in`
- **Authorization:** `ckpr:authorizes_edge`, `ckpr:requires_consensus`
- **Mediation:** `ckpr:mediates_communication`, `ckpr:mediates_governance`

**Coverage:** 75% (SWRL rules defined but not enforced at runtime)

**SWRL Rules:**
1. **InstanceProvenanceRule** - Infer instance creator from process participant
2. **EdgeCommunicationInferenceRule** - Infer communication process from instance+edge
3. **SiblingKernelRule** - Detect kernels with shared upstream source
4. **WorkflowChainRule** - Detect temporal ordering via data dependencies
5. **AuthorizationRequirementRule** - Validate edge authorization
6. **ConsensusRequirementRule** - Enforce consensus for edges (NOT ENFORCED)

### 4. `index.json`
**Programmatic Ontology Index**

Machine-readable metadata about ontology files, coverage scores, critical gaps, and phase recommendations. Use this for:
- Compliance checking integration
- Coverage reporting
- Gap analysis automation
- Roadmap tracking

## Quick Start

### Loading in Protégé

1. **Install Protégé**: https://protege.stanford.edu/
2. **Open ontology**: File → Open → `conceptkernel-bfo-base.ttl`
3. **Import dependencies**: Protégé will auto-import `conceptkernel-processes.ttl` and `conceptkernel-relations.ttl`
4. **Enable reasoner**: Reasoner → Pellet (or HermiT)
5. **Run inference**: Reasoner → Start reasoner

### SPARQL Queries

#### Example 1: Find all edges from a kernel
```sparql
PREFIX ckp: <https://conceptkernel.org/ontology/v3.4/>

SELECT ?edge ?target WHERE {
  ?edge ckp:hasSource ?sourceKernel .
  ?edge ckp:hasTarget ?target .
  FILTER (?sourceKernel = <ckp://Recipes.BakeCake:v0.1>)
}
```

#### Example 2: Find provenance chain for an instance
```sparql
PREFIX ckp: <https://conceptkernel.org/ontology/v3.4/>
PREFIX ckpr: <https://conceptkernel.org/ontology/v3.4/relation/>

SELECT ?kernel ?process WHERE {
  ?instance ckp:createdByKernel ?kernel .
  ?instance ckpr:created_by_process ?process .
}
```

#### Example 3: Find all unauthorized edges (validation)
```sparql
PREFIX ckp: <https://conceptkernel.org/ontology/v3.4/>

SELECT ?edge ?target WHERE {
  ?edge a ckp:Edge .
  ?edge ckp:hasTarget ?target .
  ?edge ckp:isAuthorized false .
}
```

#### Example 4: Find all kernels reachable from source
```sparql
PREFIX ckpr: <https://conceptkernel.org/ontology/v3.4/relation/>

SELECT ?reachableKernel WHERE {
  <ckp://Recipes.MixIngredients:v0.1> ckpr:can_reach ?reachableKernel .
}
```

See `/SPARQL_QUERIES.v1.3.11.DRAFT-01.md` for more examples.

### Setting Up SPARQL Endpoint (Apache Jena Fuseki)

```bash
# 1. Download Fuseki
wget https://dlcdn.apache.org/jena/binaries/apache-jena-fuseki-x.x.x.tar.gz
tar xzf apache-jena-fuseki-x.x.x.tar.gz
cd apache-jena-fuseki-x.x.x

# 2. Start server
./fuseki-server --update --mem /ckp

# 3. Load ontology files via web UI
# Open: http://localhost:3030/
# Upload: conceptkernel-bfo-base.ttl, conceptkernel-processes.ttl, conceptkernel-relations.ttl

# 4. Query via SPARQL endpoint
curl -X POST http://localhost:3030/ckp/sparql \
  -H "Content-Type: application/sparql-query" \
  --data "PREFIX ckp: <https://conceptkernel.org/ontology/v3.4/> SELECT * WHERE { ?s ?p ?o } LIMIT 10"
```

## Integration with ConceptKernel

### Compliance Checking

The ontology files are intended to be used by `/core/src/Compliance.js` for BFO alignment validation:

```javascript
// FUTURE: Compliance.js integration
const ontologyIndex = require('../concepts/.ontology/index.json');

function validateBFOAlignment(kernel) {
    const ontology = loadKernelOntology(kernel);

    // Check if kernel declares BFO class
    if (!ontology.metadata.bfo || !ontology.metadata.bfo.class) {
        throw new Error(`Kernel ${kernel} missing BFO class declaration`);
    }

    // Validate contracts against BFO dispositions
    validateDispositions(ontology.spec.queue_contract, 'bfo:Disposition');
    validateDispositions(ontology.spec.storage_contract, 'bfo:Disposition');

    // Check edge authorization
    validateEdgeAuthorization(kernel, ontology.spec.edges);

    return { compliant: true, score: ontologyIndex.coverage.overall.score };
}
```

### Adding BFO Annotations to Kernel Ontologies

**Current** (`ontology.yaml`):
```yaml
apiVersion: conceptkernel/v1
kind: Ontology
metadata:
  name: Recipes.BakeCake
  domain: Org.ConceptKernel
  type: node:cold
  version: v0.1
```

**Recommended** (with BFO annotations):
```yaml
apiVersion: conceptkernel/v1
kind: Ontology
metadata:
  name: Recipes.BakeCake
  domain: Org.ConceptKernel
  type: node:cold
  version: v0.1

  # NEW: BFO annotations
  bfo:
    class: bfo:IndependentContinuant
    subclass: bfo:MaterialEntity
    qualities:
      - type: { bfo:Quality }
      - domain: { bfo:Quality }
    dispositions:
      - queue_contract: { bfo:Disposition }
      - storage_contract: { bfo:Disposition }

spec:
  queue_contract:
    bfo:
      role: bfo:Disposition  # What this kernel can accept
    manifest:
      - name: "dough"
        payload_type_link: "ckp://Recipes.MixIngredients:v0.1"
        rule: "required_one"

  storage_contract:
    bfo:
      role: bfo:Disposition  # What this kernel will produce
    cake:
      type: object
      properties:
        type: string
```

## Coverage Summary

**Overall BFO Alignment:** 65%

| Category | Score | Status | Gaps |
|----------|-------|--------|------|
| **Continuants** | 85% | ✅ WELL_IMPLEMENTED | Process URN tracking, Temporal lifecycle |
| • Kernel | 85% | ✅ WELL_IMPLEMENTED | Process URN missing |
| • Edge | 85% | ✅ WELL_IMPLEMENTED | Consensus integration missing |
| • Instance | 80% | ✅ WELL_IMPLEMENTED | ckp:// URI incomplete |
| • Ontology | 70% | ⚠️ PARTIAL | No BFO mappings |
| **Occurrents** | 45% | ⚠️ PARTIAL | Process URN, Temporal parts |
| • Invocation | 60% | ⚠️ PARTIAL | No Process URN, No temporal parts |
| • EdgeCommunication | 65% | ⚠️ PARTIAL | No Process URN, Implicit phases |
| • EdgeSubscription | 0% | ❌ NOT_IMPLEMENTED | Manual only, no consensus |
| • Consensus | 50% | ⚠️ PARTIAL | No auto-enforcement, No WssHub |
| • Broadcast | 70% | ⚠️ PARTIAL | No Process URN, No filtering |
| **Three Mediators** | 68% | ⚠️ PARTIAL | EdgeKernel ↔ Consensus not integrated |
| • EdgeKernel | 85% | ✅ WELL_IMPLEMENTED | SHACL stub |
| • ConsensusKernel | 50% | ⚠️ PARTIAL | Not integrated |
| • WssHubKernel | 70% | ✅ WELL_IMPLEMENTED | No consensus events |

## Critical Gaps

1. **Process URN Generation** (HIGH PRIORITY)
   - **Gap:** No explicit Process URNs for Occurrents
   - **Impact:** Cannot reference/query past processes, no audit trail
   - **Affected:** Invocation, EdgeCommunication, Consensus, Broadcast

2. **Temporal Parts Tracking** (HIGH PRIORITY)
   - **Gap:** Process phases not explicitly tracked
   - **Impact:** No phase recording, poor debugging, no metrics
   - **Affected:** All processes

3. **EdgeKernel ↔ Consensus Integration** (CRITICAL)
   - **Gap:** Edge creation doesn't trigger consensus
   - **Impact:** Architectural constraint not enforced
   - **Affected:** EdgeSubscriptionProcess

4. **ckp:// Instance URIs** (MEDIUM)
   - **Gap:** Instances not fully addressable via ckp://
   - **Impact:** No uniform identifiers
   - **Affected:** Instance

5. **SHACL Validation** (MEDIUM)
   - **Gap:** Stub implementation only
   - **Impact:** Type safety not enforced
   - **Affected:** Edge

## Roadmap

See `/BFO_ALIGNMENT_ANALYSIS.v1.3.11.DRAFT-01.md` for detailed implementation phases:

- **Phase 1** (1-2 weeks): Core BFO Tracking (Process URNs, Temporal parts)
- **Phase 2** (3-4 weeks): Three Mediators Integration
- **Phase 3** (5-6 weeks): Type Safety & Validation (SHACL, ckp:// URIs)
- **Phase 4** (7-8 weeks): BFO Formal Mappings (Ontology annotations, Reasoning)

## Tooling Recommendations

### OWL Reasoners
- **Pellet**: Most complete OWL-DL reasoner
- **HermiT**: Fast, good for consistency checking
- **FaCT++**: Very fast, limited expressiveness
- **ELK**: Extremely fast, OWL-EL only

### Ontology Editors
- **Protégé**: Industry standard, free, feature-rich
- **TopBraid Composer**: Commercial, SHACL support

### SPARQL Endpoints
- **Apache Jena Fuseki**: Free, easy setup
- **GraphDB**: Commercial, excellent performance
- **Stardog**: Commercial, advanced reasoning

### Validators
- **shacl-js**: JavaScript SHACL validator
- **rdf-validate-shacl**: Node.js SHACL engine
- **TopBraid SHACL API**: Java library

## References

- **BFO Specification**: https://basic-formal-ontology.org/
- **BFO OWL File**: http://purl.obolibrary.org/obo/bfo.owl
- **OWL 2 Primer**: https://www.w3.org/TR/owl2-primer/
- **SPARQL 1.1**: https://www.w3.org/TR/sparql11-query/
- **SWRL**: https://www.w3.org/Submission/SWRL/
- **SHACL**: https://www.w3.org/TR/shacl/

## Documentation

- `/CKP_BFO_ONTOLOGY.v1.3.11.DRAFT-01.md` - Original BFO ontology specification (updated with implementation status)
- `/BFO_ALIGNMENT_ANALYSIS.v1.3.11.DRAFT-01.md` - Comprehensive implementation analysis
- `/SPARQL_QUERIES.v1.3.11.DRAFT-01.md` - SPARQL query examples
- `/BFO_IMPLEMENTATION_MATRIX.v1.3.11.DRAFT-01.csv` - Gap matrix spreadsheet

## Contributing

When extending the ontology:

1. **Follow BFO naming conventions**:
   - Continuants: Nouns (Kernel, Edge, Instance)
   - Occurrents: Gerunds (InvocationProcess, EdgeCommunication)

2. **Maintain property axioms**:
   - Declare domain and range for all properties
   - Mark functional properties (single-valued)
   - Define inverse properties where appropriate

3. **Add SWRL rules for inference**:
   - Write rules in both Turtle and English
   - Test rules with Pellet reasoner
   - Document expected inferences

4. **Update `index.json`**:
   - Add new entities to coverage section
   - Update coverage scores
   - Document new gaps

5. **Validate with reasoner**:
   - Load in Protégé
   - Run Pellet reasoner
   - Check for inconsistencies

## License

ConceptKernel is licensed under the MIT License. The BFO ontology imports are governed by the BFO license (CC BY 4.0).

---

**Maintained by:** ConceptKernel Contributors
**Last Updated:** 2025-11-23
**Version:** v1.3.11-DRAFT-01
