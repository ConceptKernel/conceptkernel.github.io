---
layout: home
hero:
  name: Concept Kernel
  text: Protocol v3.5
  tagline: "Three loops. Three DL boxes. One Material Entity. Identity, capability, and verifiable production for autonomous agents."
  actions:
    - theme: brand
      text: Introduction
      link: /v3.5-alpha6/introduction
    - theme: alt
      text: v3.6 (Latest)
      link: /v3.6/introduction
    - theme: alt
      text: Join Discord
      link: https://discord.gg/sTbfxV9xyU

features:
  - icon: "\U0001F9EC"
    title: Three Loops = Three DL Boxes
    details: "CK (TBox), TOOL (RBox), DATA (ABox) -- each loop is a Description Logic box with independent versioning, write authority, and physical volume isolation."
  - icon: "\U0001F50F"
    title: BFO 2020 + Mid-Level Ontologies
    details: "Four-layer import chain: BFO 2020 (Layer 0), IAO + CCO + PROV-O + ValueFlows (Layer 0.5), CKP (Layer 1), per-kernel ontology (Layer 2)."
  - icon: "\U0001F9E0"
    title: Self-Describing Material Entity
    details: "A kernel is BFO:0000040 -- a Material Entity. It wakes by reading 8 identity files in strict order. No external configuration service needed."
  - icon: "\U0001F517"
    title: Action Composition via Edges
    details: "Five edge predicates (EXTENDS, COMPOSES, TRIGGERS, LOOPS_WITH, PRODUCES) define inter-kernel relationships. The graph IS the integration."
  - icon: "\U0001F6E1\uFE0F"
    title: SPIFFE Workload Identity
    details: "Every kernel receives a SPIFFE SVID at mint. Grants are action-scoped, time-bounded, and audited. ODRL maps directly to the grants block."
  - icon: "\U0001F680"
    title: CK.Operator
    details: "A cluster operator that reconciles conceptkernel.yaml into gateway resources. If it is not in the ontology, it does not exist in the cluster."
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
