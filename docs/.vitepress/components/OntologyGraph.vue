<template>
  <div class="onto-wrap" ref="wrap">
    <canvas ref="canvas" :width="W * dpr" :height="H * dpr"
      :style="`width:${W}px;height:${H}px`"
      @mousemove="onMouse" @mouseleave="hovered = null"></canvas>
    <div v-if="loading" class="onto-loading">
      loading ontology... {{ loadedCount }}/7
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const W = 920
const H = 420
const dpr = ref(1)
const canvas = ref(null)
const wrap = ref(null)
const loading = ref(true)
const loadedCount = ref(0)
const hovered = ref(null)

// Graph state
let graphNodes = []
let graphEdges = []
let animFrame = null
let frame = 0

const boxes = [
  { label: 'TBox · Identity', cx: W * 0.18, color: '#0B6E2D', colorLight: 'rgba(11,110,45,0.08)' },
  { label: 'RBox · Capability', cx: W * 0.5, color: '#B8860B', colorLight: 'rgba(184,134,11,0.08)' },
  { label: 'ABox · Knowledge', cx: W * 0.82, color: '#6B21A8', colorLight: 'rgba(107,33,168,0.08)' },
]

const boxWidth = W * 0.28

function onMouse(e) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const mx = (e.clientX - rect.left)
  const my = (e.clientY - rect.top)
  let closest = null
  let closestDist = 20
  for (let i = 0; i < graphNodes.length; i++) {
    const n = graphNodes[i]
    const d = Math.hypot(n.x - mx, n.y - my)
    if (d < closestDist) { closest = i; closestDist = d }
  }
  hovered.value = closest
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  dpr.value = window.devicePixelRatio || 1

  // Load N3.js
  let N3
  try {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/n3@1.16.3/browser/n3.min.js'
    document.head.appendChild(script)
    await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject })
    N3 = window.N3
  } catch (e) { loading.value = false; buildFallback(); startDraw(); return }

  const store = new N3.Store()
  const ttlFiles = [
    '/ontology/v3.5-alpha6/core.ttl',
    '/ontology/v3.5-alpha6/kernel-metadata.ttl',
    '/ontology/v3.5-alpha6/processes.ttl',
    '/ontology/v3.5-alpha6/relations.ttl',
    '/ontology/v3.5-alpha6/base-instances.ttl',
    '/ontology/v3.5-alpha6/proof.ttl',
    '/ontology/v3.5-alpha6/rbac.ttl',
  ]

  for (const url of ttlFiles) {
    try {
      const resp = await fetch(url)
      if (!resp.ok) continue
      const parser = new N3.Parser({ baseIRI: 'https://conceptkernel.org/ontology/v3.5/' })
      store.addQuads(parser.parse(await resp.text()))
      loadedCount.value++
    } catch (e) {}
  }
  loading.value = false

  // Extract classes only (not all 507 entities)
  const classes = new Map()
  const subOf = []
  for (const q of store.getQuads(null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', null)) {
    if (q.object.value.endsWith('#Class') || q.object.value.endsWith('Class')) {
      const uri = q.subject.value
      const name = uri.includes('#') ? uri.split('#').pop() : uri.split('/').pop()
      if (name && name.length > 1 && !name.startsWith('_'))
        classes.set(uri, { uri, label: name })
    }
  }
  for (const q of store.getQuads(null, 'http://www.w3.org/2000/01/rdf-schema#subClassOf', null)) {
    if (classes.has(q.subject.value) && classes.has(q.object.value))
      subOf.push({ child: q.subject.value, parent: q.object.value })
  }

  // Assign to DL boxes based on known patterns
  const assignBox = (label) => {
    if (/Instance|Proof|Ledger|Project|Sealed|Manifest/.test(label)) return 2
    if (/Contract|Serving|Edge|Action|Process|Invoc|Broad|Consen|Commun|Reconc|Workflow/.test(label)) return 1
    return 0
  }

  // Build graph nodes with force layout positions
  const nodeArr = []
  classes.forEach((info) => {
    const box = assignBox(info.label)
    nodeArr.push({
      ...info, box,
      x: boxes[box].cx + (Math.random() - 0.5) * boxWidth * 0.6,
      y: 60 + Math.random() * (H - 100),
      vx: 0, vy: 0,
      color: boxes[box].color,
    })
  })

  // Build edge list
  const edgeArr = []
  const uriToIdx = {}
  nodeArr.forEach((n, i) => { uriToIdx[n.uri] = i })
  subOf.forEach(({ child, parent }) => {
    if (uriToIdx[child] !== undefined && uriToIdx[parent] !== undefined)
      edgeArr.push({ from: uriToIdx[child], to: uriToIdx[parent] })
  })

  graphNodes = nodeArr
  graphEdges = edgeArr

  // Run force simulation for 200 iterations
  for (let iter = 0; iter < 200; iter++) {
    forceStep(0.3)
  }

  startDraw()
})

function forceStep(dt) {
  const N = graphNodes.length
  // Repulsion between nodes in same box
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (graphNodes[i].box !== graphNodes[j].box) continue
      let dx = graphNodes[j].x - graphNodes[i].x
      let dy = graphNodes[j].y - graphNodes[i].y
      let d = Math.hypot(dx, dy) || 1
      let force = 800 / (d * d)
      graphNodes[i].vx -= (dx / d) * force * dt
      graphNodes[i].vy -= (dy / d) * force * dt
      graphNodes[j].vx += (dx / d) * force * dt
      graphNodes[j].vy += (dy / d) * force * dt
    }
  }
  // Attraction along edges
  for (const e of graphEdges) {
    const a = graphNodes[e.from], b = graphNodes[e.to]
    let dx = b.x - a.x, dy = b.y - a.y
    let d = Math.hypot(dx, dy) || 1
    let force = (d - 50) * 0.02
    a.vx += (dx / d) * force * dt
    a.vy += (dy / d) * force * dt
    b.vx -= (dx / d) * force * dt
    b.vy -= (dy / d) * force * dt
  }
  // Gravity toward box center + boundary constraints
  for (const n of graphNodes) {
    const box = boxes[n.box]
    n.vx += (box.cx - n.x) * 0.005 * dt
    n.vy += ((H / 2) - n.y) * 0.002 * dt
    n.vx *= 0.85
    n.vy *= 0.85
    n.x += n.vx
    n.y += n.vy
    // Keep in bounds
    const left = box.cx - boxWidth / 2 + 10
    const right = box.cx + boxWidth / 2 - 10
    n.x = Math.max(left, Math.min(right, n.x))
    n.y = Math.max(45, Math.min(H - 15, n.y))
  }
}

function buildFallback() {
  const fallback = [
    { label: 'Kernel', box: 0 }, { label: 'HotKernel', box: 0 }, { label: 'ColdKernel', box: 0 },
    { label: 'KernelOntology', box: 0 }, { label: 'GovernanceMode', box: 0 },
    { label: 'Action', box: 1 }, { label: 'Edge', box: 1 }, { label: 'ServingDisposition', box: 1 },
    { label: 'Instance', box: 2 }, { label: 'ProofRecord', box: 2 }, { label: 'LedgerEntry', box: 2 },
  ]
  fallback.forEach((item, i) => {
    graphNodes.push({
      ...item, uri: '', color: boxes[item.box].color,
      x: boxes[item.box].cx + (Math.random() - 0.5) * 80,
      y: 60 + (i % 4) * 80 + Math.random() * 20,
      vx: 0, vy: 0,
    })
  })
  graphEdges = [{ from: 1, to: 0 }, { from: 2, to: 0 }, { from: 3, to: 0 }]
  for (let i = 0; i < 100; i++) forceStep(0.3)
}

function startDraw() {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  const d = dpr.value

  function draw() {
    frame++
    ctx.clearRect(0, 0, W * d, H * d)
    ctx.save()
    ctx.scale(d, d)

    // Subtle drift
    if (frame % 3 === 0) forceStep(0.05)

    // Box backgrounds
    for (const box of boxes) {
      ctx.fillStyle = box.colorLight
      ctx.beginPath()
      ctx.roundRect(box.cx - boxWidth / 2, 5, boxWidth, H - 10, 8)
      ctx.fill()
      // Header
      ctx.fillStyle = box.color
      ctx.globalAlpha = 0.9
      ctx.font = '600 11px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(box.label, box.cx, 25)
      ctx.globalAlpha = 1
    }

    // Edges
    for (const e of graphEdges) {
      const a = graphNodes[e.from], b = graphNodes[e.to]
      const pulse = 0.08 + Math.sin(frame * 0.02 + e.from) * 0.04
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = a.color
      ctx.globalAlpha = pulse
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // Nodes
    for (let i = 0; i < graphNodes.length; i++) {
      const n = graphNodes[i]
      const isHov = hovered.value === i
      const breathe = Math.sin(frame * 0.015 + i * 0.5) * 0.3 + 0.7
      const r = isHov ? 6 : 3.5 * (0.85 + breathe * 0.15)

      // Glow
      if (isHov) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, 14, 0, Math.PI * 2)
        ctx.fillStyle = n.color
        ctx.globalAlpha = 0.1
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // Dot
      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = n.color
      ctx.globalAlpha = isHov ? 1 : 0.5 + breathe * 0.3
      ctx.fill()
      ctx.globalAlpha = 1

      // Label
      ctx.font = isHov ? '600 12px system-ui' : '400 9px system-ui'
      ctx.fillStyle = isHov ? n.color : 'rgba(180,180,200,0.6)'
      ctx.textAlign = 'left'
      ctx.fillText(n.label, n.x + r + 4, n.y + (isHov ? -1 : 3))

      // Sub-label on hover
      if (isHov) {
        ctx.font = '400 8px system-ui'
        ctx.fillStyle = 'rgba(150,150,170,0.7)'
        ctx.fillText(n.box === 0 ? 'TBox' : n.box === 1 ? 'RBox' : 'ABox', n.x + r + 4, n.y + 12)
      }
    }

    ctx.restore()
    animFrame = requestAnimationFrame(draw)
  }

  draw()
}

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
})
</script>

<style scoped>
.onto-wrap {
  max-width: 920px;
  margin: 0 auto 0.5rem;
  position: relative;
}
.onto-wrap canvas {
  width: 100%;
  height: auto;
  display: block;
}
.onto-loading {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--vp-c-text-3);
  font-family: system-ui;
}

@media (max-width: 640px) {
  .onto-wrap canvas { height: 250px; }
}
</style>
