---
layout: home
hero:
  name: Concept Kernel
  text: Protocol v3.6
  tagline: "Talk to concept kernels from Claude Code, evolve them through ontological consensus, deploy the results to a live cluster."
  actions:
    - theme: brand
      text: Introduction
      link: /v3.6/introduction
    - theme: alt
      text: What's New
      link: /v3.6/changelog
    - theme: alt
      text: Join Discord
      link: https://discord.gg/sTbfxV9xyU

features:
  - icon: "\U0001F510"
    title: Auth + Web Shell
    details: "OIDC via Keycloak, three-panel console UI, kernel lifecycle from the browser. Login, dispatch actions, watch results."
  - icon: "\U0001F916"
    title: CK as Claude Code Subagent
    details: "Every kernel is a Claude Code subagent. /ck Operator loads the CK loop as agent context. Three-loop discipline enforced."
  - icon: "\U0001F4E1"
    title: Claude Streaming via NATS
    details: "stream.{kernel} topic carries per-token output. Browser renders progressive chat bubbles. Same SDK locally and in cluster."
  - icon: "\U0001F9E9"
    title: EXTENDS Predicate
    details: "Mount Claude capability onto any kernel via an edge. Personas, constraints, and ontology-shaped output. The action is yours, the capability is Claude's."
  - icon: "\U0001F91D"
    title: Consensus Loop
    details: "Ontological governance for kernel evolution. Propose, evaluate, approve through conversation. Tasks executed by headless Claude Code."
  - icon: "\U0001F9EC"
    title: Three Loops Foundation
    details: "CK (TBox), TOOL (RBox), DATA (ABox) -- three DL boxes with independent versioning, write authority, and physical volume isolation."
---

<style>
.discord-banner {
  text-align: center;
  padding: 3rem 1.5rem;
  margin: 2rem auto;
  max-width: 720px;
}
.discord-banner h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.discord-banner p {
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
}
.discord-btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: #5865F2;
  color: white !important;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none !important;
  transition: opacity 0.2s;
}
.discord-btn:hover {
  opacity: 0.9;
}
</style>

<div class="discord-banner">
  <h2>Join the Community</h2>
  <p>Connect with contributors, ask questions, and help shape the future of concept governance.</p>
  <a href="https://discord.gg/sTbfxV9xyU" class="discord-btn">Join our Discord</a>
</div>
