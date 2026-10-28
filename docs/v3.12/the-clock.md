---
title: "The Orbit & the Tick"
description: "Each kernel keeps its own clock as sealed law — period, lead, seat and anchor — so its next crossing is computable by anyone. The substrate's tick only detects and queues; a crossing never executes, and never decides."
---

# The Orbit & the Tick

Every concept kernel is a sun with **NOW fixed at north**. Its work turns around it on a ring whose period, prepare window and seat the kernel declares as law. When the ring brings a moment back to north, that is a **crossing** — and a crossing is a time anyone can compute from the sealed law alone, without asking the kernel.

Two things are kept apart on purpose:

| | what it is | who governs it |
|---|---|---|
| **the gears** | the orbit law: how long one rotation lasts, how long the prepare window is, where the kernel sits | the kernel, through `propose → vote → apply` |
| **the escapement** | the substrate's tick: the pulse that notices a crossing is due | the operator of the substrate |

The kernel owns its rhythm; the substrate owns only the heartbeat that reads it.

## The orbit law

Four properties on the sealed `ckp:Kernel` describe the orbit, and a fifth names the dwell constant the score arithmetic uses. All are gated by `KernelShape`:

| Law (`https://conceptkernel.org/ontology/v3.11/core#…`) | Datatype | Bound the ground enforces | Meaning |
|---|---|---|---|
| `orbitPeriodSeconds` | `xsd:integer` | `> 0` | the duration of one full rotation. A zero or negative period is not a slow clock; it is no clock |
| `orbitLeadSeconds` | `xsd:integer` | `≥ 0` and `< orbitPeriodSeconds` | the prepare window before the crossing — submissions validate, then this many seconds remain before the crossing seals. A lead as long as the period is a window that never closes |
| `orbitSeat` | `xsd:integer` | `≥ 0` | the kernel's approved position on its ring. Rendering derives geometry from it, never the reverse |
| `orbitAnchor` | `xsd:dateTime` | — | the instant crossings are counted from |
| `tauImplicitMillis` | `xsd:integer` | `> 0` | the dwell time constant of an implicit Signal — see [Signals & Scores](/v3.12/signals-and-scores) |

Each clause carries `sh:maxCount 1` and **no** `sh:minCount`. A kernel that declares no orbit has no orbit — a real answer. A wrong *value* is what the ground refuses, including the one cross-property invariant (`orbitLeadSeconds sh:lessThan orbitPeriodSeconds`) that no per-property bound could catch.

The orbit law's governed route is the one all kernel law takes — `set_kernel_policy` through `propose → vote → apply` (see [Governance](/v3.12/governance)). The tick only reads it; the tick cannot wind the clock.

## The next crossing — computable by a stranger

```
rotation   n    = max( ceil( (now − anchor) / period ), 1 )
next crossing   = anchor + n · period
prepare opens   = next crossing − lead
```

Nothing in this arithmetic belongs to the kernel's private state. Given the sealed Kernel and a shared clock, any third party derives the same instant. The verb exposes it so nobody has to:

```json
{ "verb": "orbit.next", "payload": { "kernel": "<transport-segment>" } }
```

```json
{ "ok": true, "kernel": "…", "periodSeconds": 3600, "leadSeconds": 300,
  "anchor": "2026-09-01T00:00:00Z", "rotation": 42,
  "nextCrossing": "2026-09-02T18:00:00Z", "prepareOpensAt": "2026-09-02T17:55:00Z",
  "method": "anchor + ceil((now-anchor)/period)*period — re-derivable from the sealed law alone" }
```

The reply carries its **method** alongside its value, so the answer can be checked rather than trusted.

A kernel with no declared orbit is refused by name — never answered with a zero that looks like a time:

```json
{ "ok": false, "refused": true, "sqlstate": "42704", "error": "no_orbit_declared",
  "hint": "this kernel declares no orbitPeriodSeconds/orbitAnchor — no orbit is a real answer, not a zero. …" }
```

A name with no sealed Kernel behind it answers `unknown_instance`. See [Stamps & Refusals](/v3.12/reading-a-reply) for the refusal envelope.

## The tick — detect, queue, drain

The substrate's background worker calls one function per pulse. That function does two separate things with two separate budgets:

```
            ┌───────────────────────── one tick ─────────────────────────┐
            │                                                            │
 sealed     │  DETECT      for every Kernel with orbit law, compute the  │
 Kernels ──►│              most recent past crossing; enqueue it ONCE    │
 with orbit │              (unique per kernel + crossing instant)        │
 law        │                         │                                  │
            │                         ▼                                  │
            │  DRAIN       at most four jobs, at most ONE per kernel     │
            │              each job = the draft-only score tick          │
            │              success → done · failure → attempt counted    │
            │              fifth failure → parked, last error kept       │
            └────────────────────────────────────────────────────────────┘
```

### A crossing enqueues — it never executes

Detection writes a queue entry and nothing else. Re-detecting the same crossing is free: the queue is unique on *(kernel, crossing instant)*, so a crossing is queued exactly once no matter how many pulses observe it.

### The drain is bounded, fair and visible

- **Bounded.** A drain takes at most four jobs.
- **Fair.** At most one job per kernel per drain, oldest crossing first. The wait a kernel experiences scales with how many kernels are busy — never with how much the busiest one queued.
- **Attempt-counted.** Every failure increments the job's attempt count and records the error.
- **Parked at five.** A job that fails five times stops being selected and is kept as `failed` with its last error. A job re-selected forever would look exactly like the loop working; a parked job is visible where a spinning one is not.

### The work itself is draft-only

The only work a drained crossing performs is the [score tick](/v3.12/signals-and-scores): Scores are derived from sealed Signals under the kernel's own law, and a threshold crossing **drafts** a proposal. Even executed, a crossing seals no vote, applies nothing and advances no epoch.

::: tip The constitutional limit
Time can make a kernel *notice*. Only its participants can make it *change*. The limit lives in the substrate's own code, where its gates measure it.
:::

## Background work is attributable

A tick runs with no participant at the keyboard, so it acts under a **named service identity** rather than none. Every seal it produces is attributed:

- the boundary artifacts of computation — the `ckp:Run` that realized the score tick — seal under the service identity;
- content that changes meaning — votes, applies, adoptions — stays with accountable parties, and the tick produces none of it.

A fact belonging to nobody never lands, even when the clock is the one acting.

## Reading the clock

| question | how to answer it |
|---|---|
| when does this kernel next turn? | `orbit.next` — or compute it yourself from the sealed Kernel |
| what law is the orbit under? | the sealed `ckp:Kernel` (`instance.get` on `urn:ckp:<kernel>/kernel`) |
| what did the last computation produce? | the sealed `ckp:Run` and the Scores whose `wasGeneratedBy` names it |
| did the tick change anything it may not? | the tick's reply reports `epochUnchanged`; the ledger shows no vote or apply from it |

## Status in this release

| mechanism | law (declared in core) | gate (refuses) | runtime (pgCK 0.4.112) | proven by |
|---|---|---|---|---|
| Orbit quartet + `tauImplicitMillis` | ✅ `KernelShape` | ✅ every bound, incl. lead < period | ✅ sealed on the Kernel, read by `orbit.next` and the tick | [s88](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s88_scope_and_orbit.sql) |
| Next crossing, third-party computable | ✅ | — | ✅ `orbit.next`, method carried in the reply | [s88](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s88_scope_and_orbit.sql) |
| No orbit refused by name | — | ✅ `no_orbit_declared` (registered) | ✅ | [s88](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s88_scope_and_orbit.sql) |
| Crossing enqueues, never executes | — | — | ✅ unique per kernel + crossing | [s89](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s89_signal_score_orbit.sql) |
| Bounded, fair, attempt-counted drain; park at five | — | — | ✅ background worker, one call per tick | [s89](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s89_signal_score_orbit.sql) |
| Drained work is draft-only | ✅ `"draft"` proposal state | ✅ | ✅ no vote, no apply, no epoch | [s89](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s89_signal_score_orbit.sql) |
| Tick acts under a named service identity | — | ✅ unattributed writes refuse | ✅ | [s89](https://github.com/styk-tv/pgCK/blob/v0.4.112/sql/test/s89_signal_score_orbit.sql) |
| Prepare window (`orbitLeadSeconds`) acted on | ✅ | ✅ | ⏳ reported by `orbit.next`; no submission window is enforced by the tick yet | — |
| `orbitSeat` | ✅ | ✅ | ⏳ declared law for renderers; the substrate does not read it | — |
