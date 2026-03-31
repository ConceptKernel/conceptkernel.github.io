<template>
  <div class="onto-wrap" ref="wrap">
    <svg ref="svg" :viewBox="`0 0 ${W} ${H}`" xmlns="http://www.w3.org/2000/svg">
      <!-- DL Box headers -->
      <g v-for="(box, bi) in boxes" :key="bi">
        <rect :x="box.x - box.w/2" y="8" :width="box.w" height="26" rx="6"
          :fill="box.color" fill-opacity="0.1" :stroke="box.color" stroke-width="1" class="box-header"/>
        <text :x="box.x" y="26" text-anchor="middle" :fill="box.color"
          font-size="11" font-weight="700" font-family="system-ui" class="box-label">{{ box.label }}</text>
      </g>

      <!-- Edges (drawn first, behind nodes) -->
      <line v-for="(edge, ei) in edges" :key="'e'+ei"
        :x1="edge.x1" :y1="edge.y1" :x2="edge.x2" :y2="edge.y2"
        :stroke="edge.color" stroke-opacity="0.15" stroke-width="1" class="edge"/>

      <!-- Nodes -->
      <g v-for="(node, ni) in nodes" :key="'n'+ni" class="node-g"
         @mouseenter="hovered = ni" @mouseleave="hovered = null">
        <circle :cx="node.x" :cy="node.y" :r="hovered === ni ? 7 : 4.5"
          :fill="node.color" :fill-opacity="hovered === ni ? 1 : 0.7" class="dot"/>
        <text :x="node.x + 9" :y="node.y + (hovered === ni ? -2 : 4)"
          :fill="hovered === ni ? 'var(--vp-c-text-1)' : 'var(--vp-c-text-2)'"
          :font-size="hovered === ni ? 12 : 10" font-family="system-ui"
          :font-weight="hovered === ni ? 700 : 400" class="label">{{ node.label }}</text>
        <text v-if="hovered === ni" :x="node.x + 9" :y="node.y + 12"
          fill="var(--vp-c-text-3)" font-size="8" font-family="system-ui" class="sublabel">{{ node.type }}</text>
      </g>

      <!-- Loading indicator -->
      <text v-if="loading" :x="W/2" :y="H - 10" text-anchor="middle"
        fill="var(--vp-c-text-3)" font-size="9" font-family="system-ui">
        loading ontology... {{ loadedCount }}/7
      </text>
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const W = 920
const H = 400
const svg = ref(null)
const wrap = ref(null)
const hovered = ref(null)
const loading = ref(true)
const loadedCount = ref(0)
const nodes = ref([])
const edges = ref([])

const boxes = [
  { label: 'TBox · Identity', x: 160, w: 180, color: '#0B6E2D' },
  { label: 'RBox · Capability', x: 460, w: 180, color: '#B8860B' },
  { label: 'ABox · Knowledge', x: 760, w: 180, color: '#6B21A8' },
]

// Map BFO types to DL boxes
const boxMap = {
  'Class': 0, 'Ontology': 0,
  'Property': 1,
  'Individual': 2,
}

// Color by BFO category
const colorMap = {
  0: '#0B6E2D', // TBox green
  1: '#B8860B', // RBox amber
  2: '#6B21A8', // ABox purple
}

let animeInstances = []

onMounted(async () => {
  if (typeof window === 'undefined') return

  // Load N3.js dynamically
  let N3
  try {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/n3@1.16.3/browser/n3.min.js'
    document.head.appendChild(script)
    await new Promise((resolve, reject) => {
      script.onload = resolve
      script.onerror = reject
    })
    N3 = window.N3
  } catch (e) {
    loading.value = false
    buildFallbackGraph()
    return
  }

  // Fetch and parse TTL files
  const ttlFiles = [
    '/ontology/v3.5-alpha6/core.ttl',
    '/ontology/v3.5-alpha6/kernel-metadata.ttl',
    '/ontology/v3.5-alpha6/processes.ttl',
    '/ontology/v3.5-alpha6/relations.ttl',
    '/ontology/v3.5-alpha6/base-instances.ttl',
    '/ontology/v3.5-alpha6/proof.ttl',
    '/ontology/v3.5-alpha6/rbac.ttl',
  ]

  const store = new N3.Store()
  const CLASS_TYPES = [
    'http://www.w3.org/2002/07/owl#Class',
    'http://www.w3.org/2000/01/rdf-schema#Class',
  ]
  const PROP_TYPES = [
    'http://www.w3.org/2002/07/owl#ObjectProperty',
    'http://www.w3.org/2002/07/owl#DatatypeProperty',
  ]

  for (const url of ttlFiles) {
    try {
      const resp = await fetch(url)
      if (!resp.ok) continue
      const text = await resp.text()
      const parser = new N3.Parser({ baseIRI: 'https://conceptkernel.org/ontology/v3.5/' })
      const quads = parser.parse(text)
      store.addQuads(quads)
      loadedCount.value++
    } catch (e) { /* skip failed files */ }
  }

  loading.value = false

  // Extract classes and properties
  const classes = new Set()
  const properties = new Set()
  const subClassEdges = []

  for (const q of store.getQuads(null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', null)) {
    if (CLASS_TYPES.includes(q.object.value)) classes.add(q.subject.value)
    if (PROP_TYPES.includes(q.object.value)) properties.add(q.subject.value)
  }

  for (const q of store.getQuads(null, 'http://www.w3.org/2000/01/rdf-schema#subClassOf', null)) {
    if (classes.has(q.subject.value) && classes.has(q.object.value)) {
      subClassEdges.push({ from: q.subject.value, to: q.object.value })
    }
  }

  // Build node list — pick the most interesting classes (not all 507)
  const allEntities = []
  classes.forEach(uri => {
    const localName = uri.includes('#') ? uri.split('#').pop() : uri.split('/').pop()
    if (localName && localName.length > 1 && !localName.startsWith('_'))
      allEntities.push({ uri, label: localName, type: 'Class', box: 0 })
  })
  properties.forEach(uri => {
    const localName = uri.includes('#') ? uri.split('#').pop() : uri.split('/').pop()
    if (localName && localName.length > 1 && !localName.startsWith('_'))
      allEntities.push({ uri, label: localName, type: 'Property', box: 1 })
  })

  // Assign boxes and layout
  const grouped = { 0: [], 1: [], 2: [] }
  allEntities.forEach(e => {
    // Override box based on known patterns
    if (e.label.includes('Instance') || e.label.includes('Proof') || e.label.includes('Ledger') || e.label.includes('Project'))
      e.box = 2
    else if (e.label.includes('Contract') || e.label.includes('Serving') || e.label.includes('Edge') || e.label.includes('Action') || e.label.includes('Process') || e.type === 'Property')
      e.box = 1

    if (grouped[e.box].length < 14) // Cap per column
      grouped[e.box].push(e)
  })

  // Position nodes
  const positioned = []
  Object.entries(grouped).forEach(([boxIdx, items]) => {
    const bx = boxes[parseInt(boxIdx)].x
    const startY = 50
    const spacing = (H - 70) / Math.max(items.length, 1)
    items.forEach((item, i) => {
      const jitter = (Math.random() - 0.5) * 40
      positioned.push({
        ...item,
        x: bx + jitter,
        y: startY + i * spacing + Math.random() * 10,
        color: colorMap[parseInt(boxIdx)],
      })
    })
  })

  nodes.value = positioned

  // Build edges from subclass relationships
  const nodeMap = {}
  positioned.forEach((n, i) => { nodeMap[n.uri] = i })

  const edgeList = []
  subClassEdges.forEach(({ from, to }) => {
    if (nodeMap[from] !== undefined && nodeMap[to] !== undefined) {
      const f = positioned[nodeMap[from]]
      const t = positioned[nodeMap[to]]
      edgeList.push({ x1: f.x, y1: f.y, x2: t.x, y2: t.y, color: f.color })
    }
  })
  edges.value = edgeList

  // Animate
  startAnimations()
})

function buildFallbackGraph() {
  // Static fallback if N3.js fails to load
  const fallback = [
    { label: 'Kernel', type: 'MaterialEntity', box: 0 },
    { label: 'KernelOntology', type: 'Document', box: 0 },
    { label: 'GovernanceMode', type: 'Quality', box: 0 },
    { label: 'Action', type: 'PlanSpec', box: 1 },
    { label: 'Edge', type: 'Artifact', box: 1 },
    { label: 'ServingDisposition', type: 'Disposition', box: 1 },
    { label: 'Instance', type: 'DataItem', box: 2 },
    { label: 'ProofRecord', type: 'Proof', box: 2 },
    { label: 'LedgerEntry', type: 'Ledger', box: 2 },
  ]
  fallback.forEach((item, i) => {
    const bx = boxes[item.box].x
    nodes.value.push({
      ...item,
      x: bx + (Math.random() - 0.5) * 30,
      y: 70 + (i % 3) * 80 + Math.random() * 20,
      color: colorMap[item.box],
    })
  })
  startAnimations()
}

async function startAnimations() {
  if (typeof window === 'undefined' || !svg.value) return
  try {
    const anime = (await import('animejs/lib/anime.es.js')).default

    // Fade in dots
    animeInstances.push(anime({
      targets: svg.value.querySelectorAll('.dot'),
      opacity: [0, 0.7],
      r: [0, 4.5],
      delay: anime.stagger(40, { start: 200 }),
      duration: 600,
      easing: 'easeOutElastic(1, .6)'
    }))

    // Fade in labels
    animeInstances.push(anime({
      targets: svg.value.querySelectorAll('.label'),
      opacity: [0, 1],
      translateX: [-6, 0],
      delay: anime.stagger(40, { start: 400 }),
      duration: 400,
      easing: 'easeOutQuad'
    }))

    // Draw edges
    animeInstances.push(anime({
      targets: svg.value.querySelectorAll('.edge'),
      strokeDashoffset: [anime.setDashoffset, 0],
      opacity: [0, 0.15],
      delay: anime.stagger(30, { start: 300 }),
      duration: 800,
      easing: 'easeInOutQuad'
    }))

    // Continuous breathing
    animeInstances.push(anime({
      targets: svg.value.querySelectorAll('.dot'),
      r: [4.5, 6, 4.5],
      fillOpacity: [0.7, 0.9, 0.7],
      duration: 4000,
      loop: true,
      easing: 'easeInOutSine',
      delay: anime.stagger(150)
    }))

    // Box header pulse
    animeInstances.push(anime({
      targets: svg.value.querySelectorAll('.box-header'),
      fillOpacity: [0.08, 0.15, 0.08],
      duration: 5000,
      loop: true,
      easing: 'easeInOutSine',
      delay: anime.stagger(500)
    }))

  } catch (e) { /* anime.js unavailable */ }
}

onUnmounted(() => {
  animeInstances.forEach(a => a && a.pause && a.pause())
})
</script>

<style scoped>
.onto-wrap {
  max-width: 920px;
  margin: 0.5rem auto 1rem;
  padding: 0 0.5rem;
}
.onto-wrap svg {
  width: 100%;
  height: auto;
  min-height: 300px;
}
.node-g { cursor: default; transition: opacity 0.2s; }
.node-g:hover .dot { filter: brightness(1.3); }

@media (max-width: 640px) {
  .onto-wrap svg { min-height: 200px; }
  .label { font-size: 8px !important; }
}
</style>
