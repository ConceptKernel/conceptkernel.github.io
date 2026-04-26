---
title: Conformance and Terminology
description: RFC 2119 keywords, conformance levels, and CKP glossary of 23 defined terms.
---

# Conformance and Terminology

This page covers Chapters 2 and 3 of the CKP v3.7 specification: how conformance is defined and tested, and the precise meaning of every term used throughout the protocol.

## RFC 2119 Keywords

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this specification are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

::: tip
When reading the specification pages, pay attention to these keywords. A MUST requirement is a hard conformance gate -- violating it means the implementation is non-conformant. A SHOULD requirement is a strong recommendation that may be deviated from with documented justification. A MAY requirement is genuinely optional.
:::

## Conformance Requirements

A conformant CKP implementation:

| # | Requirement | Keyword |
|---|-------------|---------|
| 1 | Implement the [three-loop separation axiom](./three-loops) | MUST |
| 2 | Use BFO 2020 as the upper ontology | MUST |
| 3 | Provide the [nine awakening files](./ck-loop#awakening-sequence) per kernel | MUST |
| 4 | Implement the NATS topic topology | MUST |
| 5 | Support the CKP URN scheme | MUST |
| 6 | Enforce [instance mutability policy](./data-loop#instance-versioning-and-mutation-policy) | MUST |
| 7 | Include [PROV-O provenance](./data-loop#prov-o-provenance) in all instances | MUST |
| 8 | Verify JWT before handler dispatch on the NATS path | MUST |
| 9 | Mount CK and [TOOL volumes ReadOnly](./tool-loop#volume-driver-enforcement) | MUST |
| 10 | Produce a PROV-O instance record for every deployment | MUST |
| 11 | Implement all 13 compliance check types; 7 additional checks are proposed | SHOULD |
| 12 | Support all five edge predicates | MUST |
| 13 | Implement the star topology activation model | MAY |

::: tip CRDs
The two custom resources published by v3.7 are the **ConceptKernel CRD** (`conceptkernel.org/v1`, shortname `ck`) for per-kernel identity and proof status, and the **CKProject CRD** (`ck.tech.games/v1`, shortname `ckp`) for project-level orchestration. Both schemas are in [Custom Resource Definitions](./crd).
:::

## Conformance Levels

CKP defines two conformance levels. Implementations MUST declare which level they target. Partial conformance (meeting some but not all Core requirements) is **non-conformant**.

| Level | Requirements | Typical Implementer |
|-------|-------------|---------------------|
| **Core** | Items 1--10 above | Any CKP runtime or operator |
| **Full** | Items 1--13 above | Production fleet deployments |

::: warning
There is no "partial Core" conformance. An implementation either satisfies all 10 Core requirements or it is non-conformant. This is by design -- the Core requirements represent the minimum set of invariants needed for interoperability.
:::

## Compliance Check Categories

Conformance is verified by the CK.ComplianceCheck system kernel. It implements 13 check types that validate structural, ontological, and operational conformance. Each check produces a proof record with pass/fail outcome, expected value, and actual value.

| Category | Checks | What Is Validated |
|----------|--------|-------------------|
| Identity | `check.identity`, `check.awakening` | GUID presence, `conceptkernel.yaml` validity, awakening file completeness |
| Ontology | `check.ontology`, `check.bfo-alignment` | `ontology.yaml` imports valid modules, all classes trace to BFO |
| Loop Isolation | `check.loop-isolation` | CK and TOOL volumes are ReadOnly, DATA volume is writable |
| Provenance | `check.provenance` | All instances contain PROV-O fields |
| Instance Integrity | `check.instance-sealed`, `check.instance-proof` | `data.json` not modified post-seal, proof hash matches |
| Security | `check.spiffe`, `check.grants` | SVID present and valid, grants block well-formed |
| NATS | `check.nats-topics` | Required NATS topics are published |

Implementations targeting **Core** conformance MUST pass all checks in the Identity, Ontology, Loop Isolation, and Provenance categories. Implementations targeting **Full** conformance MUST pass all 13 checks.

## Part I Conformance Criteria Summary

| ID | Requirement | Level | Chapter |
|----|------------|-------|---------|
| F-1 | Implementation MUST declare target conformance level (Core or Full) | Core | 2 |
| F-2 | Implementation MUST use RFC 2119 keyword semantics as defined | Core | 2 |
| F-3 | Implementation MUST use the namespace prefixes defined in the [Namespaces](./namespaces) table when emitting RDF | Core | 4 |
| F-4 | Implementation MUST satisfy all eight [design principles](./introduction#the-eight-design-principles) in their normative aspects | Core | 5 |
| F-5 | Implementation MUST treat this specification as the sole normative source | Core | 5 |

---

## Defined Terms

The following 23 terms are normatively defined. When these terms appear in the specification (capitalised or in code), they carry the precise meaning given here.

### Concept Kernel (CK)

A Material Entity (`bfo:BFO_0000040`) with a GUID-based identity, three independently-versioned loops (CK/TOOL/DATA), and a NATS messaging interface. The atomic unit of computation in CKP.

### CK Loop (TBox)

The identity organ. Holds `conceptkernel.yaml`, `ontology.yaml`, `rules.shacl`, and other design-time artifacts that define what the kernel IS. ReadOnly at runtime.

### TOOL Loop (RBox)

The capability organ. Holds `tool/processor.py` and executable code. ReadOnly at runtime. Shaped by the CK loop's ontology.

### DATA Loop (ABox)

The memory organ. The DATA root is `data/`. Inside it: `data/instances/`, `data/proof/`, `data/ledger/`, `data/index/`, `data/llm/`, `data/web/`, `data/logs/`. ReadWrite at runtime. The only loop that grows during execution.

### Awakening Sequence

The ordered reading of nine identity files when a kernel starts (see [CK Loop](./ck-loop#awakening-sequence)). The sequence is normative and MUST NOT be reordered.

### Occurrent

A bounded process in time (`bfo:BFO_0000015`). In CKP, every action execution is an occurrent with a PROV-O trace.

### Instance

A sealed data item (`iao:DataItem`) produced by a kernel action. Write-once in the [DATA loop](./data-loop).

### Edge

A typed relationship between two kernels. Five predicates: `COMPOSES`, `EXTENDS`, `TRIGGERS`, `PRODUCES`, `LOOPS_WITH`.

### Grant

An access control declaration in `conceptkernel.yaml` mapping identities (`anon`/`auth`/`owner`) to permitted actions.

### Materialisation

The process of creating infrastructure resources (PVCs, Deployments, HTTPRoutes) from ontological declarations. Performed by [CK.Operator](./operator).

### Three-Loop Separation Axiom

The foundational invariant of CKP: CK and TOOL volumes are ReadOnly at runtime; only the DATA volume is writable; no loop may write to another. Enforced at the infrastructure level, not by convention. See [Three Loops](./three-loops#the-three-loop-separation-axiom).

### SPIFFE SVID

A SPIFFE Verifiable Identity Document issued to each kernel at mint time, providing cryptographic workload identity for inter-kernel authentication.

### Kernel Type

One of five deployment profiles: `node:hot` (always-on), `node:cold` (on-demand), `inline` (browser-side), `static` (filer-served, no process), `agent` (long-running, conversational, persistent NATS subscriber that supports streaming and behavioural-template registries — see [EXTENDS](./extends)). All five are Material Entities; they differ in runtime characteristics, not ontological status.

### Action

A named capability declared in `SKILL.md` and the `spec.actions` block of `conceptkernel.yaml`. An action *definition* is an `iao:PlanSpecification`; an action *execution* is a `bfo:Process`.

### Proof Record

A validation artifact generated after each instance write. Contains check results, data hashes, and the identity of the checking kernel.

### Ledger Entry

An append-only record of state transitions. Records before/after values, timestamps, and actor identity for every mutation.

### Governance Mode

One of three fleet governance policies: `STRICT` (all actions require approval), `RELAXED` (actions within grants are auto-approved), `AUTONOMOUS` (kernel self-governs within ontological constraints).

### Project

An organisational unit (`cco:Organization`) that groups related kernels. Projects provide namespace scoping and shared governance policies.

### Fleet

The complete set of kernels under a single CKP deployment. Fleet-level operations (discovery, compliance checking, topology mapping) are performed by system kernels.

---

## Abbreviations

| Abbreviation | Expansion |
|-------------|-----------|
| BFO | Basic Formal Ontology (ISO 21838-2) |
| CCO | Common Core Ontologies |
| CK | Concept Kernel |
| CKP | Concept Kernel Protocol |
| DL | Description Logic |
| IAO | Information Artifact Ontology |
| NATS | Neural Autonomic Transport System (messaging) |
| OWL | Web Ontology Language |
| PROV-O | W3C Provenance Ontology |
| SHACL | Shapes Constraint Language |
| SPIFFE | Secure Production Identity Framework for Everyone |
| SPIRE | SPIFFE Runtime Environment |
| SVID | SPIFFE Verifiable Identity Document |
| URN | Uniform Resource Name |

## Normative References

| Reference | Title | URI |
|-----------|-------|-----|
| [RFC 2119] | Key words for use in RFCs to Indicate Requirement Levels | https://www.rfc-editor.org/rfc/rfc2119 |
| [BFO 2020] | Basic Formal Ontology 2020 (ISO 21838-2) | http://purl.obolibrary.org/obo/bfo.owl |
| [IAO] | Information Artifact Ontology | http://purl.obolibrary.org/obo/iao.owl |
| [CCO] | Common Core Ontologies | http://www.ontologyrepository.com/CommonCoreOntologies/ |
| [PROV-O] | W3C Provenance Ontology | http://www.w3.org/ns/prov |
| [OWL 2] | OWL 2 Web Ontology Language | https://www.w3.org/TR/owl2-overview/ |
| [SHACL] | Shapes Constraint Language | https://www.w3.org/TR/shacl/ |
| [SPIFFE] | Secure Production Identity Framework for Everyone | https://spiffe.io/docs/latest/spiffe-about/overview/ |
| [NATS] | NATS Messaging System | https://docs.nats.io/ |
| [LinkML] | Linked Data Modeling Language | https://linkml.io/ |
| [ValueFlows] | ValueFlows REA Vocabulary | https://www.valueflo.ws/ |
