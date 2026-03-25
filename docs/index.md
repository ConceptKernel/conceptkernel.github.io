---
layout: home
hero:
  name: Concept Kernel
  text: Protocol
  tagline: Autonomous governance for distributed agents through boundary isolation and ontological enforcement.
  actions:
    - theme: brand
      text: Read the Docs
      link: /v3.4/introduction
    - theme: alt
      text: v3.5 Alpha
      link: /v3.5-alpha3/
    - theme: alt
      text: Discord
      link: https://discord.gg/sTbfxV9xyU
---

<script setup>
import { onMounted } from 'vue'

onMounted(async () => {
  if (typeof window === 'undefined') return
  const c = document.getElementById('kernel-canvas')
  if (!c) return
  const ctx = c.getContext('2d')
  const dpr = window.devicePixelRatio || 1

  function resize() {
    c.width = c.offsetWidth * dpr
    c.height = c.offsetHeight * dpr
    ctx.scale(dpr, dpr)
  }
  resize()
  window.addEventListener('resize', resize)

  const nodes = []
  const edges = []
  const w = () => c.offsetWidth
  const h = () => c.offsetHeight

  const names = ['CK.Lib', 'CK.Task', 'CK.Goal', 'CK.Ontology', 'CK.Discovery',
                 'CK.Compliance', 'LOCAL.Claude', 'CS.Voting', 'CK.Email']

  for (let i = 0; i < names.length; i++) {
    nodes.push({
      x: Math.random() * 0.8 + 0.1,
      y: Math.random() * 0.8 + 0.1,
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      r: 3 + Math.random() * 2,
      name: names[i],
      phase: Math.random() * Math.PI * 2,
    })
  }

  for (let i = 0; i < nodes.length; i++) {
    const targets = Math.floor(Math.random() * 2) + 1
    for (let t = 0; t < targets; t++) {
      const j = Math.floor(Math.random() * nodes.length)
      if (j !== i) edges.push([i, j])
    }
  }

  let frame = 0
  function draw() {
    frame++
    ctx.clearRect(0, 0, w(), h())

    for (const n of nodes) {
      n.x += n.vx
      n.y += n.vy
      if (n.x < 0.05 || n.x > 0.95) n.vx *= -1
      if (n.y < 0.05 || n.y > 0.95) n.vy *= -1
    }

    for (const [i, j] of edges) {
      const a = nodes[i], b = nodes[j]
      ctx.beginPath()
      ctx.moveTo(a.x * w(), a.y * h())
      ctx.lineTo(b.x * w(), b.y * h())
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.12)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    for (const n of nodes) {
      const pulse = Math.sin(frame * 0.02 + n.phase) * 0.3 + 0.7
      ctx.beginPath()
      ctx.arc(n.x * w(), n.y * h(), n.r * pulse * 1.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(96, 165, 250, ${0.15 + pulse * 0.15})`
      ctx.fill()

      ctx.beginPath()
      ctx.arc(n.x * w(), n.y * h(), n.r * 0.7, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(139, 92, 246, ${0.5 + pulse * 0.3})`
      ctx.fill()

      ctx.font = '9px system-ui'
      ctx.fillStyle = `rgba(200, 200, 220, ${0.3 + pulse * 0.2})`
      ctx.fillText(n.name, n.x * w() + n.r + 4, n.y * h() + 3)
    }

    requestAnimationFrame(draw)
  }
  draw()
})
</script>

<div class="kernel-graph">
  <canvas id="kernel-canvas" style="width:100%;height:200px;display:block"></canvas>
</div>

<div class="home-links">
  <div class="link-section">
    <h3>Ontology</h3>
    <p>BFO-aligned type definitions for every kernel.</p>
    <a href="/ontology/v3.4/">v3.4 Stable</a> · <a href="/ontology/v3.5/">v3.5 Alpha</a>
  </div>
  <div class="link-section">
    <h3>Specification</h3>
    <p>The Three Loops System — identity, capability, knowledge.</p>
    <a href="/v3.4/architecture">v3.4 Architecture</a> · <a href="/v3.5-alpha3/architecture">v3.5 Alpha</a>
  </div>
  <div class="link-section">
    <h3>Community</h3>
    <p>Shape the future of autonomous concept governance.</p>
    <a href="https://discord.gg/sTbfxV9xyU">Discord</a> · <a href="https://github.com/ConceptKernel">GitHub</a>
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
