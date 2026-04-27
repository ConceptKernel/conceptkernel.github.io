# Editorial discipline for conceptkernel.org/docs

This is a **publicly exposed normative specification site**. Readers landing here are seeing CKP for the first time — they have no internal context, no history of prior methods, no awareness of architectural drift between versions. Every page must read like a freshly-authored canonical spec, not like a cleanup commit.

## Methodology — ontology-first

When answering or editing anything CKP-related (paths, fields, gateway names, deployment modes, kernel types, etc.), consult the ontology TTL files at `https://conceptkernel.org/ontology/v3.7/` (or the local mirror at `docs/public/ontology/v3.7/`) **before** prose docs. The TTL is the contract; prose is description that drifts.

Never invent strings for ontology-controlled values. If you don't know whether a value is ontology-defined or freeform, fetch the relevant TTL and check before writing it.

## Tone rules — what to keep out of public docs

The following patterns are **internal cleanup language** and MUST NOT appear in normative spec pages. They serve us internally during transitions but harm new readers.

### 1. Don't lead with the wrong/old way

❌ Bad — leads with what's NOT the case:
> "Provenance lives in `data/proof/`, not `CHANGELOG.md`. CHANGELOG is cosmetic..."

✅ Good — leads with the canonical position:
> "Provenance lives in `data/proof/` — PROV-O-grounded, hash-chained, append-only."

### 2. Don't tell new readers not to be confused

❌ Bad — assumes the reader already had a wrong mental model:
> "Don't conflate the two layers. The companion artefacts here are NOT to be confused with the ontological approach..."

✅ Good — describes the boundary positively:
> "Identity, types, and constraints are governed by `conceptkernel.yaml` + `ontology.yaml` + `cktype/` + `rules.shacl`. Documentation, skills, and agent prompts are described by README/SKILL/CLAUDE/CHANGELOG."

### 3. Don't reference retired methods, prior versions, or "the problem"

❌ Bad — page opens with a problem statement:
> "## The Problem
> CKP's three-loop model gives each kernel three independently-versioned concerns..."

✅ Good — page opens with the model:
> "Each kernel has three independently-versioned concerns: CK (identity), TOOL (capability), and DATA (knowledge)."

❌ Bad — buries the canonical answer behind a comparison:
> "Previously, X used to be Y. v3.7 dissolves this by introducing Z. Z avoids three problems..."

✅ Good — describes Z as the canonical approach:
> "Z handles this: ..."

### 4. Don't write "X is not bare", "no monorepo", "no .ck-guid", "no CLAUDE.md"

The reader doesn't know any of these were ever options. Stating absences is internal-comparison framing. Describe what IS, not what isn't.

❌ Bad: "Per-kernel master clones (Not Monorepo, Not Bare)"
✅ Good: "Per-kernel master clones" (the section body explains the structure positively)

### 5. Don't reference change-history in normative prose

Change history belongs in `changelog.md`, not on every spec page. A reader of `versioning.md` should not see "v3.7 introduced this; v3.6 used that." If a current value differs from a historical one, just document the current value.

The one exception: a single inline note where the change is genuinely operationally relevant for an existing operator (e.g., "v3.7 retired `serving.json` — version state now lives in `.ckproject`"). Use sparingly and never as the section opener.

## Tone rules — what to keep IN

- **Affirmative, declarative voice.** "X is Y." not "X is not Z, but rather Y."
- **Concrete examples** with the canonical paths, kernel names, and SHA1 placeholders.
- **Section openers that describe the model**, not problems with the previous one.
- **Callouts (`::: tip`, `::: warning`, `::: danger`) that add operational guidance**, not that warn against confusing layers the reader hasn't encountered yet.
- **Tables and trees** that show the structure directly.

## Workflow

1. **Author or edit a page** → read it as if you've never used CKP before.
2. **Scan for "not", "don't", "no longer", "previously", "retired", "dissolves", "is NOT", "rather than"** — most of these are scrub candidates.
3. **Each callout** — does it serve a NEW reader, or does it warn against a confusion only an existing user could have? If the latter, drop it or rewrite affirmatively.
4. **Each section opener** — does it lead with the canonical position, or with a problem/contrast? If the latter, restructure.

## What goes where

| Surface | Audience | Tone |
|---|---|---|
| `docs/v3.7/*.md` (this repo) | New readers, public | Affirmative, canonical, no change-history |
| `docs/v3.7/changelog.md` | Implementers tracking version changes | Historical, comparative, dated |
| Internal SPEC.* drafts in adjacent repos (e.g. `xr-websockets-v4/SPEC.CK.NEW.v3.7.4.md`) | Spec authors, internal | Working notes, deltas, drift commentary OK |
| Auto-memory + this `CLAUDE.md` | Agents working on the docs | Discipline rules |

Any agent editing this repo's `docs/v3.7/*.md` (and the ontology TTLs) should re-read this `CLAUDE.md` before each session. The discipline above is what keeps the public spec readable.

## Last revision

2026-04-27 — established after a working session where internal-cleanup framing leaked into normative pages. The fix was a sweep replacing "not" / "don't" / "previously" patterns with affirmative descriptions.
