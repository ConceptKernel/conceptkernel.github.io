---
title: EXTENDS Predicate
description: Mount Claude capability onto any kernel via the EXTENDS edge predicate and CK.Claude.
---

# EXTENDS Predicate + CK.Claude

## Motivation

Claude is not a built-in capability of every kernel. It is a **concept kernel** (`LOCAL.ClaudeCode` or a deployed `CK.Claude`) that other kernels can reference via an edge. When a kernel declares an `EXTENDS` edge to a Claude kernel, the Claude kernel's behaviors (personas, reasoning modes, streaming) become available as **new actions on the requesting kernel** -- not on the Claude kernel itself.

This means:
- `Delvinator.Core` EXTENDS `CK.Claude` -- Core gains `message`, `analyze`, `summarize` actions
- `Hello.Greeter` EXTENDS `CK.Claude` with persona `friendly-assistant` -- Greeter gains `chat` action with that personality
- A kernel that does NOT extend Claude has no LLM capability -- it is purely algorithmic

Claude behavior is **mounted**, not inherited. Different kernels mount different personalities, tool permissions, and reasoning constraints.

## The EXTENDS Predicate

```yaml
# In conceptkernel.yaml of the requesting kernel
spec:
  edges:
    outbound:
      - target_kernel: CK.Claude
        predicate: EXTENDS
        config:
          persona: analytical-reviewer
          actions:
            - name: analyze
              description: "Deep analysis using Claude"
              access: auth
            - name: summarize
              description: "Summarize instances using Claude"
              access: auth
          constraints:
            max_tokens: 4096
            tools: ["Read", "Grep"]
            model: sonnet
```

## Action Formation

The `EXTENDS` edge creates **new actions on the source kernel**, not on the Claude kernel. This is the key distinction from COMPOSES:

| Predicate | Actions appear on | Example |
|-----------|-------------------|---------|
| COMPOSES | Source kernel inherits target's existing actions | Core COMPOSES ComplianceCheck -- Core gets `check.all` |
| TRIGGERS | Source kernel can invoke target's actions | ExchangeParser TRIGGERS IntentMapper -- ExchangeParser calls `classify` |
| **EXTENDS** | **Source kernel gains NEW actions backed by target's capability** | Core EXTENDS CK.Claude -- Core gains `analyze` (new, doesn't exist on CK.Claude) |

The action `analyze` lives on `Delvinator.Core`, is listed in Core's action sidebar, and is dispatched to `input.Delvinator.Core`. Core's processor routes it to the Claude kernel for execution, but the user sees it as a Core action.

## Persona Mounting

The `config.persona` field references a persona template on the Claude kernel:

```
/ck/CK.Claude/storage/personas/{persona}.yaml
```

A persona defines:
- **System prompt** -- behavioral instructions, tone, constraints
- **Tool permissions** -- which Claude Code tools the persona can use
- **Knowledge scope** -- which kernel contexts to load
- **Output format** -- structured JSON, markdown, chat

```yaml
# /ck/CK.Claude/storage/personas/analytical-reviewer.yaml
name: analytical-reviewer
system_prompt: |
  You are a precise analytical reviewer. You examine data structures,
  identify patterns, and produce structured assessments. You never
  speculate -- only report what the evidence shows.
tools: [Read, Grep, Glob]
output_format: structured
temperature: 0.1
```

Different kernels mount different personas:
- `Delvinator.Core` -- `analytical-reviewer` (structured analysis)
- `Hello.Greeter` -- `friendly-assistant` (conversational)
- `CK.ComplianceCheck` -- `strict-auditor` (pass/fail only)

## Runtime Dispatch

When `input.Delvinator.Core` receives `{action: "analyze", data: {...}}`:

1. Core's processor sees `analyze` is an EXTENDS action
2. Loads the Claude kernel's persona template (`analytical-reviewer`)
3. Builds prompt: persona system prompt + Core's ontology context + user data
4. Invokes Claude via `claude_agent_sdk` (streaming) or `claude -p` (batch)
5. Streams results to `stream.Delvinator.Core` (not `stream.CK.Claude`)
6. Seals result as instance in Core's DATA loop (not Claude's)

The action is Core's. The capability is Claude's. The persona is mounted.

## Why Not Just Call Claude Directly?

Because:
- **Ontological grounding** -- the action is typed in Core's ontology, produces Core-shaped instances
- **Access control** -- Core's grants govern who can invoke `analyze`, not Claude's
- **Provenance** -- the instance traces to Core's action, not a generic Claude call
- **Personality** -- the persona is chosen per-kernel, not global
- **Composability** -- `analyze` can be further composed by kernels that COMPOSE Core
- **No Claude in cluster** -- LOCAL.ClaudeCode runs locally, EXTENDS works via NATS relay

## Edge Predicate Registry

Updated table with EXTENDS:

| Predicate | Semantics | Action Behavior |
|-----------|-----------|-----------------|
| COMPOSES | A includes B's actions | B's actions appear on A |
| TRIGGERS | A invokes B | A calls B's actions remotely |
| PRODUCES | A generates input for B | A's output feeds B's input |
| CONSUMES | A reads output from B | A subscribes to B's results |
| **EXTENDS** | **A gains new actions backed by B's capability** | **New actions on A, executed by B, shaped by A's ontology** |

## Conformance

- EXTENDS MUST create new actions on the source kernel, not expose the target's actions
- The `config.persona` field MUST reference a valid persona template on the target kernel
- Actions created by EXTENDS MUST be listed in the source kernel's action sidebar
- Instances produced by EXTENDS actions MUST be sealed in the source kernel's DATA loop
- Provenance MUST trace to the source kernel's action, with `prov:used` linking to the Claude kernel
- The EXTENDS target MUST be a kernel with LLM capability (type `agent` or with `claude_agent_sdk`)
