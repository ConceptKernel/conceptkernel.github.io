---
layout: home
hero:
  name: Concept Kernel
  text: Protocol v3.6
  tagline: "Auth. Web shell. Claude integration. Consensus. Graph. The runtime that makes concept kernels operational."
  actions:
    - theme: brand
      text: Introduction
      link: /v3.6/introduction
    - theme: alt
      text: Operator
      link: /v3.6/operator
    - theme: alt
      text: Join Discord
      link: https://discord.gg/sTbfxV9xyU

features:
  - icon: "\U0001F510"
    title: AuthConfig Ontology
    details: "OIDC identity provider declaration in the CK.Project ontology. Reuse existing Keycloak realms or birth new ones -- the operator provisions identity as infrastructure."
  - icon: "\U0001F4BB"
    title: Web Shell
    details: "Three-panel kernel-driven UI. Action sidebar, parameter form, results panel. The operator generates it; the kernels populate it."
  - icon: "\U0001F916"
    title: Claude as Subagent
    details: "/ck Operator spawns a Claude Code subagent loaded with the kernel's CK loop -- identity, actions, ontology, memory. Three-loop discipline enforced."
  - icon: "\U0001F4E1"
    title: NATS Streaming
    details: "stream.{kernel} topic carries per-token Claude output. Same SDK events, same rendering, local or cluster."
  - icon: "\U0001F9E9"
    title: EXTENDS Predicate
    details: "Mount Claude capability onto any kernel. Persona templates shape behavior. The action is yours; the intelligence is mounted."
  - icon: "\U0001F3DB\uFE0F"
    title: Consensus + Graph
    details: "CK.Consensus governs kernel evolution. Jena Fuseki stores the fleet as SPARQL-queryable BFO:0000040 nodes."
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
