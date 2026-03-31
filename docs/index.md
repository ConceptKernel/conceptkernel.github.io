---
layout: home
hero:
  name: Concept Kernel
  text: Protocol
  tagline: "Three loops. Three Description Logic boxes. One Material Entity."
  actions:
    - theme: brand
      text: Read the Spec
      link: /v3.5/introduction
    - theme: alt
      text: Browse Ontology
      link: /browse/
    - theme: alt
      text: GitHub
      link: https://github.com/ConceptKernel
---

<script setup>
import OntologyGraph from './.vitepress/components/OntologyGraph.vue'
</script>

<ClientOnly>
  <OntologyGraph />
</ClientOnly>

<div class="home-links">
  <div class="link-section">
    <h3>Ontology</h3>
    <p>BFO 2020 → IAO + CCO → CKP — four-layer type system for every kernel.</p>
    <a href="/v3.5/ontology-layering">Layering Strategy</a> · <a href="/v3.5/bfo-mapping">BFO Mapping</a> · <a href="/ontology/v3.5-alpha6/">TTL Files</a>
  </div>
  <div class="link-section">
    <h3>Three Loops</h3>
    <p>TBox (identity) · RBox (capability) · ABox (knowledge) — Description Logic boxes as volumes.</p>
    <a href="/v3.5/three-loops">DL Box Mapping</a> · <a href="/v3.5/topology">Physical Topology</a>
  </div>
  <div class="link-section">
    <h3>Patterns</h3>
    <p>Proven implementation patterns from production CKP deployments.</p>
    <a href="/v3.5/patterns">8 Patterns</a> · <a href="/v3.5/operator">CK.Operator</a> · <a href="https://github.com/ConceptKernel">GitHub</a>
  </div>
</div>

<style>
.kernel-graph {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}
.home-links {
  display: flex;
  gap: 2rem;
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}
.link-section {
  flex: 1;
}
.link-section h3 {
  font-size: 1rem;
  margin-bottom: 0.3rem;
}
.link-section p {
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}
.link-section a {
  font-size: 0.85rem;
}
@media (max-width: 640px) {
  .home-links { flex-direction: column; gap: 1.5rem; }
}
</style>
