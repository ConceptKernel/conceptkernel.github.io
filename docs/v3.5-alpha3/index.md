---
layout: home
hero:
  name: Concept Kernel
  text: Protocol
  tagline: Three loops. One kernel. Identity, capability, and verifiable production for autonomous agents.
  actions:
    - theme: brand
      text: Get Started
      link: /v3.5-alpha3/getting-started/quickstart
    - theme: alt
      text: Architecture
      link: /v3.5-alpha3/architecture
    - theme: alt
      text: Join Discord
      link: https://discord.gg/sTbfxV9xyU

features:
  - icon: "\U0001F9EC"
    title: Three Loops Architecture
    details: Every kernel is organised around CK (identity), TOOL (capability), and DATA (production) loops with strict dependency order and independent versioning.
  - icon: "\U0001F50F"
    title: Ontology-First
    details: Built on LinkML schemas and SHACL constraints, grounded in BFO. The ontology IS the type definition. No external registry needed.
  - icon: "\U0001F9E0"
    title: Self-Describing Kernels
    details: A kernel carries its genome, ontology, constraints, and awakening sequence. Drop it on disk and any agent can become it.
  - icon: "\U0001F517"
    title: Edge Graph Integration
    details: Kernels communicate through declared edges with typed predicates. EXTENDS inherits actions. COMPOSES delegates. The graph IS the integration.
  - icon: "\U0001F6E1\uFE0F"
    title: Materialised Proofs
    details: Every sealed instance carries SHA-256 hashes and PROV-O provenance. Compliance checks produce verifiable proof records.
  - icon: "\U0001F680"
    title: CK.Lib Runtime
    details: A Python package that turns any kernel directory into a running NATS participant with action routing, instance sealing, and Keycloak auth.
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
