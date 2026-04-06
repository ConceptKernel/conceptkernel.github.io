---
title: Edge Predicates and Action Composition
description: Five edge predicates — COMPOSES, TRIGGERS, PRODUCES, EXTENDS, LOOPS_WITH — and how actions compose across kernel boundaries.
---

# Edge Predicates and Action Composition

## Why Edges Exist

Kernels are sovereign entities with isolated volumes. They cannot call each other's functions, import each other's modules, or write to each other's filesystems. The only way kernels cooperate is through **edges** -- declared relationships that the platform materialises into NATS subscriptions. This indirection is deliberate: it makes cooperation auditable, revocable, and ontologically grounded.

## The Five Edge Predicates

CKP defines exactly five edge predicates. Each predicate has distinct semantics for action composition, context assembly, NATS materialisation, and instance ownership.

| Edge Predicate | Direction | Composition Style | Context Assembly | Instance Ownership |
|----------------|-----------|-------------------|------------------|--------------------|
| `COMPOSES` | Source -> Target | Parent calls child actions directly (module pattern) | Load target `SKILL.md` into parent context | Each kernel writes its own instances |
| `TRIGGERS` | Source -> Target | Source fires target after own action completes | Sequential -- target context loaded after source completes | Each kernel writes its own instances |
| `PRODUCES` | Source -> Target | Event-driven, no request/reply | No direct context sharing -- NATS event only | Each kernel writes its own instances |
| `EXTENDS` | Source -> Target | Target adds new capabilities to source | Child `SKILL.md` defines new actions on parent | Source kernel writes instances (in its own DATA loop) |
| `LOOPS_WITH` | Bidirectional | Both can call each other | Both `SKILL.md` files loaded; circular guard required | Each kernel writes its own instances |

::: warning Closed Registry
The five edge predicates are a closed set. Conformant implementations MUST support all five and MUST NOT define additional predicates without a specification amendment.
:::

## Edge Declaration in conceptkernel.yaml

Edges are declared in the `edges` block of `conceptkernel.yaml`. Both outbound (this kernel initiates) and inbound (another kernel initiates toward this kernel) edges are declared.

```yaml
edges:
  outbound:
    - target_kernel: Acme.UI.Layout
      predicate: COMPOSES
    - target_kernel: CK.ComplianceCheck
      predicate: TRIGGERS
      trigger_action: check.identity
    - target_kernel: CK.Claude
      predicate: EXTENDS
      config:
        persona: analytical-reviewer
        actions:
          - name: analyze
            description: "Deep analysis using Claude"
            access: auth
          - name: summarize
            description: "Summarize instances"
            access: auth
        constraints:
          max_tokens: 4096
          model: sonnet
  inbound:
    - source_kernel: Acme.AdvancedEditor
      predicate: EXTENDS
```

## COMPOSES -- Hub-Spoke Module Composition

COMPOSES is the most common edge predicate. The source (parent/hub) kernel gains access to the target (child/spoke) kernel's declared actions. The parent can invoke any of the child's actions as if they were its own.

**Behavioral semantics:**

- Parent subscribes to `result.{spoke}` at startup
- Parent can publish to `input.{spoke}` on demand
- Parent's `effective_actions` includes all spoke actions
- Each kernel writes instances to its own DATA loop

**Use case:** A hub kernel that orchestrates multiple specialised spokes. The hub receives a request, determines which spoke can handle it, dispatches, and collects the result.

```
Delvinator.Core (hub)
  COMPOSES Delvinator.ThreadScout
  COMPOSES Delvinator.ExchangeParser
  COMPOSES Delvinator.IntentMapper
  COMPOSES Delvinator.TaxonomySynthesis
```

## TRIGGERS -- Sequential Activation

TRIGGERS fires the target kernel's specified action after the source kernel completes its own action. The trigger is automatic: when the source publishes an event, the target is activated.

**Behavioral semantics:**

- Source publishes to `event.{source}` with `trigger_action` field
- Target subscribes to `event.{source}` and invokes the named action
- Sequential -- target context loaded after source completes
- Each kernel writes its own instances

**Use case:** Compliance checking after deployment. After `CK.Operator` completes `deploy.ready`, it triggers `CK.ComplianceCheck` to validate the fleet.

```yaml
- target_kernel: CK.ComplianceCheck
  predicate: TRIGGERS
  trigger_action: check.identity
```

## PRODUCES -- Event Broadcasting

PRODUCES declares that the source kernel emits events that other kernels may consume. There is no request/reply -- the source publishes and does not wait for a response. Any kernel subscribed to the source's event topic receives the event.

**Behavioral semantics:**

- Source publishes to `event.{source}`
- Target subscribes to `event.{source}`
- Target auto-invokes its default action on event receipt
- No direct context sharing -- only the event payload is received

**Use case:** Pipeline activation. A scanning kernel PRODUCES events that trigger downstream parsing, classification, and indexing kernels.

```
ThreadScout --PRODUCES--> ExchangeParser --TRIGGERS--> IntentMapper
```

## EXTENDS -- Capability Mounting

EXTENDS is the most distinctive CKP edge predicate. Unlike COMPOSES (which inherits existing actions from the target), EXTENDS creates **NEW actions** on the source kernel that are backed by the target's runtime capability. The extended actions are defined in the edge configuration, not in the target kernel's `SKILL.md`.

**Behavioral semantics:**

- Source gains new actions defined in `config.actions`
- Source subscribes to `result.{target}` at startup
- On invocation of an EXTENDS action, the source loads a persona from the target, invokes the target's runtime, and streams the result
- Instances are sealed in the **source** kernel's DATA loop (not the target's)
- The source kernel's ontology governs instance shape

| Predicate | Actions Appear On | Action Source | Instance Ownership |
|-----------|-------------------|---------------|--------------------|
| COMPOSES | Source inherits target's existing actions | Target `SKILL.md` | Each writes its own |
| TRIGGERS | Source invokes target's existing actions post-completion | Target `SKILL.md` | Each writes its own |
| EXTENDS | Source gains NEW actions backed by target's runtime | Edge `config.actions` | Source writes all |

For a deep dive into CK.Claude, persona templates, and the EXTENDS integration pattern, see [EXTENDS Predicate and CK.Claude](./extends).

## LOOPS_WITH -- Bidirectional Cooperation

LOOPS_WITH declares that two kernels can invoke each other. Both subscribe to each other's `event.*` topics. This creates a potential for infinite recursion that MUST be guarded against.

**Circular guard:** When assembling context for an action that follows a LOOPS_WITH edge, implementations MUST mark the source kernel as visited before walking the edge. The same `SKILL.md` MUST NOT be loaded twice. A visited set prevents infinite context recursion.

```python
def get_effective_actions(kernel, visited=None):
    if visited is None:
        visited = set()
    if kernel.name in visited:
        return {}  # circular guard
    visited.add(kernel.name)
    actions = kernel.own_actions.copy()
    for edge in kernel.edges.outbound:
        target_actions = get_effective_actions(edge.target, visited)
        actions.update(target_actions)
    return actions
```

## Effective Actions Formula

A kernel's effective action set includes not only its own declared actions but also the actions of kernels it references through outbound edges.

```
effective_actions(CK) = own_actions(CK)
                      + UNION own_actions(edge.target)
                        for edge in CK.edges.outbound
                        where edge.predicate in {COMPOSES, EXTENDS}

                      # TRIGGERS and PRODUCES do not add to the
                      # source's effective action set -- they
                      # activate the target independently.
```

For COMPOSES edges, the target's own actions are included. For EXTENDS edges, the actions defined in the edge `config.actions` are included. TRIGGERS and PRODUCES do not contribute to the source's effective action set because they activate the target as an independent kernel, not as a composed module.

## Context Assembly per Predicate

When an effective action is invoked, the platform assembles context differently depending on the edge predicate.

| Predicate | Context Loaded | Why |
|-----------|---------------|-----|
| Own action | Own `SKILL.md` + `CLAUDE.md` + `ontology.yaml` | Standard action dispatch |
| COMPOSES | Own context + target `SKILL.md` | Hub needs to understand spoke capabilities |
| EXTENDS | Own context + target persona template | Source defines new actions using target's capability |
| TRIGGERS | Target's full context (loaded by target) | Target is an independent kernel; it loads its own context |
| PRODUCES | None (event payload only) | No context sharing; event is self-describing |
| LOOPS_WITH | Both `SKILL.md` files (with circular guard) | Bidirectional requires mutual understanding |

### Dispatch Mechanism

When `NatsKernelLoop` receives an action that is not in the kernel's own action catalog, it checks the effective actions:

1. Look up action in `own_actions`. If found: dispatch directly.
2. Look up action in `effective_actions` from COMPOSES edges. If found: forward to the composed kernel via `input.{target}` and await response on `result.{target}`.
3. Look up action in `effective_actions` from EXTENDS edges. If found: execute the EXTENDS dispatch sequence (persona loading, runtime invocation, stream to source topic).
4. If not found in any: return error `{"error": "unknown_action"}`.

## Two Activation Models

Two activation models emerge from edge predicates. Both coexist. The activation model is emergent from the edge graph, not a separate configuration.

### Workflow Model (Pipeline)

Kernel A PRODUCES event -> Kernel B subscribed via edge -> Kernel B auto-invokes. Each kernel activates exactly one downstream kernel. Linear. Predictable. Suitable for ingestion pipelines.

```
ThreadScout --PRODUCES--> ExchangeParser --TRIGGERS--> IntentMapper --TRIGGERS--> Core
```

### Star Model (Hub-Spoke)

A hub kernel COMPOSES multiple spokes. The hub's effective action set includes all spoke actions. The hub dispatches to spokes on demand -- not sequentially, but as needed by the current task.

```
                    +-- ExchangeParser
                    +-- IntentMapper
    Core (hub) -----+-- ConceptRegistry
                    +-- TaxonomySynthesis
                    +-- ThreadScout
```

| Aspect | Workflow (Pipeline) | Star (Hub-Spoke) |
|--------|-------------------|------------------|
| Activation | Event-driven, automatic | On-demand, hub decides |
| State | No shared state | Hub accumulates results from spokes |
| Use case | Ingestion: scan -> parse -> classify -> index | Exploration: hub queries multiple spokes |
| Concurrency | Sequential by default | Parallel -- hub can fire multiple spokes |
| Instance ownership | Each kernel writes its own | Each spoke writes its own; hub writes summary |
| Edge predicates | PRODUCES, TRIGGERS | COMPOSES |

## Edge Subscription Materialisation

Edge predicates materialise as NATS subscriptions at kernel startup. No edge subscription code is written in the processor -- the `NatsKernelLoop` derives subscriptions from the `conceptkernel.yaml` edges block.

| Edge Predicate | NATS Subscription Created | Activation Trigger |
|----------------|---------------------------|--------------------|
| `PRODUCES` | Source publishes to `event.{source}`. Target subscribes to `event.{source}`. | Target auto-invokes default action |
| `TRIGGERS` | Source publishes to `event.{source}` with `trigger_action`. Target subscribes and invokes named action. | Target invokes the specified action |
| `COMPOSES` | Hub subscribes to `result.{spoke}`. Hub can publish to `input.{spoke}` on demand. | Hub dispatches, receives results |
| `EXTENDS` | Source subscribes to `result.{target}`. Source dispatches via persona. | Source forwards EXTENDS actions to target |
| `LOOPS_WITH` | Both subscribe to each other's `event.*` topics. Circular guard via visited set. | Bidirectional invocation |

## Conformance Requirements

| Criterion | Level |
|-----------|-------|
| Implementations MUST support all five edge predicates | REQUIRED |
| LOOPS_WITH MUST implement circular guard via visited set | REQUIRED |
| Edge targets MUST exist and be reachable via NATS | REQUIRED |
| EXTENDS actions MUST be defined in the edge config, not the target SKILL.md | REQUIRED |
| EXTENDS instances MUST be sealed in the source kernel's DATA loop | REQUIRED |
| Effective actions MUST include composed actions from COMPOSES and EXTENDS edges | REQUIRED |
| TRIGGERS and PRODUCES MUST NOT add to the source's effective action set | REQUIRED |
| The activation model MUST be derived from edge predicates, not configured separately | REQUIRED |
| Unknown actions MUST return an error | REQUIRED |
| Edge subscriptions MUST be materialised at kernel startup from `conceptkernel.yaml` | REQUIRED |
| Processor code MUST NOT contain hardcoded edge subscriptions | REQUIRED |
| Edge predicates and action types are closed sets; extensions REQUIRE specification amendment | REQUIRED |
