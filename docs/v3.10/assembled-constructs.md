---
title: "Notation In, Construct Out"
description: "The CKN.assemble surface, the client-side compiler pipeline, the two planes, and the anti-goals that keep the notation sugar over consent."
---

::: warning IN DESIGN — v3.10
CKN is the design direction beyond the shipped v3.9.1 runtime. This page describes intent, not shipped behaviour. It is meant to be argued with. The current runtime is documented at [/v3.9/introduction](/v3.9/introduction).
:::

# Notation In, Construct Out

The contract is one line: `CKN.assemble(text) → construct`. The person writing notation takes a CKN sentence and receives a finished construct. They never name a message subject, a connection, a trace identifier, or a sequence number. Those exist under the surface as the mechanism by which the construct comes to life; if any of them leaked into the user surface, the design would have failed.

```javascript
const construct = await CKN.assemble(`
  CK( Panel.Session ) ≜ ⟪
    χ : Position(A), Position(B), Synthesis(S), Decision(D)
    ρ : A.holds = "ship Friday"   B.holds = "ship after review"
    edges : A —contradicts→ B,  S —resolves→ (A∥B),  D —sealed_as→ S
    τ : Session → 'decided'
  ⟫`);

// → { ok: true, urns: { A, B, S, D }, proof: "9202c6…" }
//   every step shape-validated, sealed, proof-chained.
```

One call lexes the sentence, plans an ordered dispatch sequence, drives it over the existing door, and returns the construct with its resolved URNs and its proof digest.

## The compiler pipeline

CKN's compiler is a pure client-side notation compiler. It composes the existing kernel handle and adds no transport, no authority, and no second execution engine. It turns a sentence into an ordered list of governed dispatches — nothing more.

```
  CKN sentence (text)
      │
      ▼
  ┌──────────┐   lex the nine-symbol alphabet + URN references
  │  lexer   │   (no RDF, no quads, no query language)
  └────┬─────┘
       ▼
  ┌──────────┐   parse to an AST that IS a dispatch plan:
  │  parser  │   an ordered list of { verb, typed-body } — not a graph
  └────┬─────┘
       ▼
  ┌──────────┐   plan: topological order χ → ρ → σ → edges → τ,
  │ planner  │   one trace identifier per sentence, step index per verb
  └────┬─────┘
       ▼
  ┌──────────┐   emit δ: each plan step → ONE existing governed dispatch
  │ emitter  │   create · link · transition · validate · verify · propose/vote/apply
  └────┬─────┘
       ▼
  the one door → seal → sealed event → every attached participant
```

The AST is the important part. It is a **dispatch plan** — an ordered list of `{ verb, typed-body }` entries — not a quad store and not a graph. The planner reads the notation's own left-to-right order: what exists, then what it looks like, then what can happen, then the transition through it. Each step is tagged with a single trace identifier for the whole sentence and a step index, so the multi-step assembly is one causal thread that any participant can follow, replay, and verify end to end. The emitter turns each step into exactly one governed dispatch `δ` through the one door — the same door every other action uses.

## The two planes

A CKN sentence lands on one of two planes, and the compiler is honest about which.

**Instance assembly is buildable on the shipped runtime today.** Laying down instances, filling properties, linking edges, and driving shape-gated transitions over an *already-declared* kernel compiles into dispatches the runtime already exposes. This is the demonstrable slice: a sentence in, a sealed construct out, with no new substrate capability required.

**Genome declaration is governance, and it is gated.** Declaring a *new* class, shape, affordance, or grant *from* notation is not a direct write — it is a consented, multi-party change. Such a sentence compiles to `propose → vote → apply`, and where that governance plane is not yet live on the runtime, the compiler degrades honestly: it emits the governed verb, reports the substrate's `*_unavailable` answer, and stops. It never fabricates a result and never falls back to a direct write. The genome plane is a future capability of the *same* compiler, unlocked exactly as fast as the governance and substrate stages land — never a workaround around them.

## The anti-goals the compiler holds

Three lines the compiler must not cross. Each keeps the notation as sugar over the existing architecture rather than a second, ungoverned one.

| Anti-goal | Why it would break the architecture |
|---|---|
| Build a client-side quad / SPARQL surface to "evaluate" notation | The AST is a dispatch plan, not a graph. A local RDF store would become a second, unsealed source of truth. |
| Seal a type fact directly instead of `propose → vote → apply` | Declaring a capability is a consented, multi-party act. A direct write bypasses consent and attribution. |
| Open a new door — a subject, a connection, a held token | There is one authorization boundary. The compiler carries no authority of its own; it only re-expresses existing governed verbs. |

The compiler invents no new authority. Every dispatch it emits is an existing affordance through the existing door, gated by the same grants, sealed into the same proof chain.

## Worked example: a Panel.Session

Two participants take positions; a mediator resolves them; a decision is sealed. The sentence a user writes:

```
CK( Panel.Session ) ⟦instance⟧ ≜
  χ : Position(A), Position(B), Synthesis(S), Decision(D)
  ρ : A.holds = "ship Friday"        B.holds = "ship after review"
  edges :
      A —contradicts→ B                  ; the sealed conflict edge
      S —resolves→ (A∥B)                 ; the synthesis over both
      D —sealed_as→ S                    ; the decision seals the synthesis
  τ : Session → 'decided'                ; σ DecisionShape gates this
  π : verify(D)                          ; re-verifiable decision
```

The ordered verb sequence it compiles to — one trace identifier for the whole sentence, one step index per verb:

| Step | Emitted dispatch (existing verb) | Sealed event every participant sees |
|---|---|---|
| 1 | `create(Position, { holds: "ship Friday", by: A })` | A's position appears |
| 2 | `create(Position, { holds: "ship after review", by: B })` | B's position appears |
| 3 | `link(A, contradicts, B)` | the conflict edge seals |
| 4 | `create(Synthesis, { … })` | the synthesis appears |
| 5 | `link(S, resolves, A)` ; `link(S, resolves, B)` | the synthesis edges seal |
| 6 | `transition(session, 'decided')` | the shape gate admits the move, or returns the legal set |
| 7 | `verify(D)` | the decision is re-verifiable by anyone, any time |

Step 6 is shape-gated: the `DecisionShape` constraint (a synthesis must resolve at least one position) is enforced at the seal, so an illegal transition cannot land — it returns the allowed moves instead. Step 7 makes the whole thread provable through the proof chain.

Because each step is a sealed event on a shared scope, the assembly is observable by construction, and a second participant — the mediator — can supply steps 4 and 5 from their own sentence. The cascade advances when each seal arrives, not on a timer, so it does not matter whose dispatch produced the seal. The notation is the score; the seal-events are the collaboration.

The notation is sugar over consent. Every construct it produces is a sequence of governed dispatches that were legal to make, sealed as they were made, and provable afterward. What those sealed gestures are *worth* — how a session's signals become a score — is the subject of [The Scoring Loop](/v3.10/scoring-loop).
