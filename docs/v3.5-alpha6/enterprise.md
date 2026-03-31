---
title: Enterprise Amendments
description: All enterprise amendments from v3.4 -- enterprise loops, formal tasks, deployment events, capability advertisement, audience profiles, PROV-O, direction governance, archetypes, ValueFlows, and SHACL rules.
---

# Enterprise Amendments (v3.4)

v3.4 integrates the Ontological Enterprise v1.1 white paper into CKP. This page consolidates all enterprise amendments.

## Enterprise Business Engine

The CK three-loop model is the implementation substrate for the enterprise's autonomous business organism. Every enterprise operational pattern maps to a specific CKP mechanism:

| Enterprise Pattern | CKP Implementation | Status |
|--------------------|-------------------|--------|
| Unlimited autonomous directions | CK.Goal instances -- each goal is a direction; tasks distributed across kernels | Implemented |
| Formal task descriptions | task.yaml in CK.Task storage/ with typed inputs, outputs, quality_criteria | Partial |
| Capability advertisement | spec.actions + capability: block in conceptkernel.yaml; CK.Discovery fleet.catalog | Implemented |
| Audience profile accumulation | i-audience-{session}/ instances in web-serving kernel storage/ | Future |
| Provenance for all actions | PROV-O fields in every manifest.json; GPG+OIDC+SVID three-factor audit chain | Partial |
| Deployment as ontological event | i-deploy-{ts}/ instance with manifests, probe result, operator identity | Implemented |
| SHACL reactive business rules | rules.shacl reactive logic layer; SHACL Advanced Rules | Future -- stubs only |
| Economic events (ValueFlows/REA) | Sealed instances with vf:EconomicEvent typing | Future |

## Formal Task Descriptions

A task instance is a typed entity with machine-executable formal properties -- not a text description:

```yaml
# CK.Task/storage/i-task-{ts}/task.yaml
type:           ckp:FormalTaskDescription
target_kernel:  ckp://Kernel#Finance.Employee:v1.0
goal:           ckp://Goal#G001:v1.0
order:          1

inputs:
  - conceptkernel.yaml
  - CLAUDE.md
  - SKILL.md

expected_outputs:
  - type: code_change
    target: conceptkernel.yaml

quality_criteria:
  - compliance_check: pass
  - syntax_valid: true

acceptance_conditions:
  - all_tests_pass: true
  - compliance_all: true

agent_requirements:
  - capability: code_edit
  - capability: file_read
  - capability: git_commit
```

::: info
A ticket requires human interpretation; a formal task description is directly executable by an autonomous agent.
:::

## Deployment as Ontological Process

Deployment is a formally-typed process with declared inputs, triggering conditions, post-conditions, and a rollback plan:

```json
{
  "type":                    "ckp:DeploymentProcess",
  "bfo_type":               "BFO:0000015",
  "ckp:input":              "ckp://Kernel#Finance.Employee:v1.0",
  "ckp:triggerCondition":   "all acceptance_conditions pass",
  "ckp:postCondition":      "health probe pass, route rule accepted",
  "ckp:rollbackPlan":       "ckp://Deployment#rollback-Finance.Employee-{ts}",
  "prov:wasAssociatedWith": "ckp://Actor#operator",
  "prov:wasAttributedTo":   "ckp://Kernel#CK.Agent:v1.0",
  "prov:generatedAtTime":   "2026-03-14T20:00:02Z"
}
```

## Capability Advertisement

The `capability:` block in `conceptkernel.yaml` powers the enterprise discovery loop:

```yaml
capability:
  service_type:    "employee data governance"
  pricing_model:   free_tier      # free_tier | per_request | subscription | negotiated
  availability:    deployed       # deployed | staging | local
  sla:             best_effort    # best_effort | 99.9 | 99.99
```

The `spec.actions` block is the machine-readable service description queryable by CK.Discovery and external agents.

## Audience Profiles

Kernels serving web content write audience interaction events to their DATA loop. Each interaction creates or amends an audience profile instance:

```
storage/i-audience-{session_id}/
  interaction.json     # what happened: page views, actions, dwell time
  profile.json         # inferred: topic affinity, trust level, cognitive style
  manifest.json        # PROV-O: which kernel wrote this, when, from what input
```

Trust trajectory is implemented as `instance_mutability: amendments_allowed` -- the profile updates with each interaction, each update git-versioned. An audience member is an OWL individual with asserted and inferred properties, not a CRM row.

## PROV-O Provenance

Every instance record SHOULD include PROV-O provenance fields:

```json
{
  "instance_id":              "i-task-1773518402",
  "prov:wasGeneratedBy":      "ckp://Action#CK.Task.task.create-1773518402000",
  "prov:wasAssociatedWith":   "ckp://Actor#operator",
  "prov:wasAttributedTo":     "ckp://Kernel#CK.Agent:v1.0",
  "prov:generatedAtTime":     "2026-03-14T20:00:02Z",
  "prov:used": [
    "ckp://Kernel#Finance.Employee:v1.0/conceptkernel.yaml",
    "ckp://Kernel#Finance.Employee:v1.0/CLAUDE.md"
  ]
}
```

::: warning Provenance Mandate
PROV-O is not optional. Every `ckp:Action` that produces or mutates a `ckp:Instance` MUST record `prov:wasGeneratedBy`, `prov:wasAttributedTo`, `prov:generatedAtTime`, `prov:wasAssociatedWith`, and `prov:used`. This is enforced by `check.provenance` in CK.ComplianceCheck.
:::

## Direction Governance

v3.4 maps the Goal -> Task -> Conversation hierarchy to the enterprise's unlimited autonomous directions model:

::: tip Direction = Goal
A direction is a formally-typed autonomous pursuit -- a goal state declared in OWL, kernel agents assigned, resources allocated, termination condition evaluable by the reasoner. The CKP implementation: a CK.Goal instance with priority, spanning multiple CKs, grouping CK.Task instances each with typed acceptance_conditions that CK.ComplianceCheck validates.
:::

| Level | Kernel | BFO Type | Key Properties |
|-------|--------|----------|----------------|
| Goal | CK.Goal | BFO:0000040 | Owner-assigned priority; spans multiple CKs; groups tasks |
| Task | CK.Task | BFO:0000040 + lifecycle | Targets one CK; build-order within goal; pending->in_progress->completed |
| Conversation | CK.Task | BFO:0000015 | Append-only; bound to task; resumable -- new file per session |

## Four Kernel Archetypes

| Archetype | CKP Kernels | Enterprise Role |
|-----------|-------------|-----------------|
| **Executor** | CK.Task, CK.Workflow | Receives formal task description, executes playbook, writes sealed instance |
| **Registrar** | CK.Discovery, CK.Ontology | Publishes fleet capability catalog; answers fleet.catalog queries |
| **Monitor** | CK.ComplianceCheck, CK.Probe | Validates fleet against spec; detects anomalies |
| **Personaliser** | (domain kernels) | Adapts content per audience profile; writes i-audience instances |
| **Universal Operator** | CK.Agent | Inhabits any archetype by loading the target kernel's context |

## ValueFlows and REA

ValueFlows (built on REA) provides the operational framework for agent-to-agent commerce:

| ValueFlows Entity | CKP Instance Type | instance_mutability | BFO Type |
|-------------------|-------------------|---------------------|----------|
| vf:EconomicEvent | Sealed instance: service delivered, invoice paid | sealed | BFO:0000030 |
| vf:Commitment | Amendable instance: bilateral obligation | amendments_allowed | BFO:0000030 |
| vf:Agreement | Amendable instance: formal binding of Commitments | amendments_allowed | BFO:0000030 |
| vf:Process | Workflow execution instance | sealed | BFO:0000015 |
| vf:Agent | Any CK with qualities.type: agent | -- | BFO:0000040 |
| vf:EconomicResource | Capability entry in spec.actions | -- | BFO:0000030 |

::: info Current Status: Future Work
No CKP kernels currently handle economic transactions. The instance model supports ValueFlows natively -- economic events are sealed instances with appropriate BFO typing. This section defines the mapping so implementation is unambiguous when it begins.
:::

```json
{
  "type":                     "vf:EconomicEvent",
  "bfo_type":                "BFO:0000030",
  "instance_mutability":     "sealed",
  "vf:action":               "vf:deliverService",
  "vf:provider":             "ckp://Kernel#ExampleKernel:v1.0",
  "vf:receiver":             "ckp://Actor#client-acme-corp",
  "vf:hasPointInTime":       "2026-03-14T20:00:02Z",
  "prov:wasGeneratedBy":     "ckp://Action#ExampleKernel.render-1773518402000"
}
```

## SHACL Reactive Rules

SHACL plays three roles in CKP:

1. **Tool-to-Storage Contract** -- `rules.shacl` validates instances before storage writes
2. **Awakening Sequence** -- `rules.shacl` is the 7th file read during awakening
3. **Reactive Governance** -- SHACL Advanced Rules for trigger conditions (future)

::: tip
v3.4 extends the compliance engine to execute SHACL Advanced Rules as part of governance. When conditions match in the knowledge graph, the compliance engine can materialise new triples and trigger governance actions. Currently `rules.shacl` files are permissive stubs -- as kernels mature they accumulate domain-specific reactive rules.
:::
