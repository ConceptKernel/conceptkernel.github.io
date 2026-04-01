<template>
  <div class="onto-wrap">
    <svg ref="svg" viewBox="0 0 920 480" xmlns="http://www.w3.org/2000/svg">
      <!-- Three DL Box columns -->
      <g v-for="(col, ci) in columns" :key="ci">
        <!-- Column header -->
        <rect :x="col.x - 90" y="10" width="180" height="30" rx="6"
          :fill="col.color" fill-opacity="0.12" :stroke="col.color" stroke-width="1"/>
        <text :x="col.x" y="30" text-anchor="middle" :fill="col.color"
          font-size="12" font-weight="700" font-family="system-ui">{{ col.label }}</text>

        <!-- Nodes -->
        <g v-for="(node, ni) in col.nodes" :key="ni" class="node-g">
          <a :href="`/browse/?class=${node.name}`" class="node-link">
            <!-- Edge line from parent -->
            <line v-if="node.parent !== undefined"
              :x1="col.x" :y1="56 + node.parent * 52 + 14"
              :x2="node.ox" :y2="node.oy - 14"
              :stroke="col.color" stroke-opacity="0.18" stroke-width="1" class="edge"/>
            <!-- Dot -->
            <circle :cx="node.ox" :cy="node.oy" r="5"
              :fill="col.color" fill-opacity="0.7" class="dot"/>
            <!-- Label -->
            <text :x="node.ox + 10" :y="node.oy + 4"
              fill="var(--vp-c-text-1)" font-size="12" font-family="system-ui"
              font-weight="500" class="label">{{ node.name }}</text>
            <!-- Sublabel -->
            <text :x="node.ox + 10" :y="node.oy + 17"
              fill="var(--vp-c-text-3)" font-size="8.5" font-family="system-ui"
              class="sublabel">{{ node.sub }}</text>
          </a>
        </g>
      </g>

      <!-- Cross-column arcs -->
      <path d="M 310,120 Q 460,85 610,120" fill="none" stroke="var(--vp-c-text-3)" stroke-width="0.5"
        stroke-dasharray="4,4" opacity="0.2" class="arc"/>
      <path d="M 310,225 Q 460,190 610,225" fill="none" stroke="var(--vp-c-text-3)" stroke-width="0.5"
        stroke-dasharray="4,4" opacity="0.2" class="arc"/>
    </svg>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const svg = ref(null)

const columns = [
  {
    label: 'TBox · Identity',
    x: 155,
    color: '#0B6E2D',
    nodes: [
      { name: 'Kernel', sub: 'BFO:0000040 · cco:Agent', ox: 90, oy: 70 },
      { name: 'HotKernel', sub: 'always-on process', ox: 70, oy: 122, parent: 0 },
      { name: 'ColdKernel', sub: 'on-demand', ox: 170, oy: 122, parent: 0 },
      { name: 'InlineKernel', sub: 'browser-side · WSS', ox: 60, oy: 174, parent: 0 },
      { name: 'StaticKernel', sub: 'gateway serves files', ox: 180, oy: 174, parent: 0 },
      { name: 'KernelOntology', sub: 'iao:Document', ox: 120, oy: 232 },
      { name: 'GovernanceMode', sub: 'STRICT · RELAXED · AUTONOMOUS', ox: 80, oy: 290 },
      { name: 'KernelType', sub: 'HOT · COLD · INLINE · STATIC', ox: 160, oy: 348 },
    ]
  },
  {
    label: 'RBox · Capability',
    x: 460,
    color: '#B8860B',
    nodes: [
      { name: 'Action', sub: 'iao:PlanSpecification', ox: 400, oy: 70 },
      { name: 'Invocation', sub: 'tool / API call', ox: 380, oy: 122, parent: 0 },
      { name: 'Reconciliation', sub: 'operator cycle', ox: 510, oy: 122, parent: 0 },
      { name: 'Edge', sub: 'cco:Artifact · typed relationship', ox: 430, oy: 180 },
      { name: 'AuthorizedEdge', sub: 'target approves', ox: 450, oy: 232, parent: 3 },
      { name: 'ServingDisposition', sub: 'API · Web · NATS · WSS', ox: 400, oy: 290 },
      { name: 'StorageContract', sub: 'iao:Directive', ox: 490, oy: 348 },
      { name: 'QueueContract', sub: 'input contract', ox: 380, oy: 406 },
    ]
  },
  {
    label: 'ABox · Knowledge',
    x: 760,
    color: '#6B21A8',
    nodes: [
      { name: 'Instance', sub: 'iao:DataItem · sealed', ox: 700, oy: 70 },
      { name: 'SealedInstance', sub: 'write-once', ox: 680, oy: 122, parent: 0 },
      { name: 'InstanceManifest', sub: 'PROV-O metadata', ox: 810, oy: 122, parent: 0 },
      { name: 'LedgerEntry', sub: 'append-only · PROV-O', ox: 720, oy: 180 },
      { name: 'ProofRecord', sub: 'SHA-256 · SVID', ox: 800, oy: 232 },
      { name: 'ProofCheck', sub: 'validation', ox: 720, oy: 290, parent: 4 },
      { name: 'Project', sub: 'cco:Organization', ox: 780, oy: 348 },
      { name: 'StorageMedium', sub: 'FILESYSTEM · DOCUMENT_STORE', ox: 700, oy: 406 },
    ]
  }
]

onMounted(async () => {
  if (typeof window === 'undefined' || !svg.value) return
  try {
    const anime = (await import('animejs/lib/anime.es.js')).default

    anime({
      targets: svg.value.querySelectorAll('.dot'),
      opacity: [0, 0.7],
      r: [0, 5],
      delay: anime.stagger(50, { start: 300 }),
      duration: 600,
      easing: 'easeOutElastic(1, .6)'
    })

    anime({
      targets: svg.value.querySelectorAll('.label, .sublabel'),
      opacity: [0, 1],
      translateX: [-6, 0],
      delay: anime.stagger(50, { start: 500 }),
      duration: 400,
      easing: 'easeOutQuad'
    })

    anime({
      targets: svg.value.querySelectorAll('.edge'),
      strokeDashoffset: [anime.setDashoffset, 0],
      delay: anime.stagger(40, { start: 200 }),
      duration: 800,
      easing: 'easeInOutQuad'
    })

    anime({
      targets: svg.value.querySelectorAll('.dot'),
      r: [5, 6.5, 5],
      fillOpacity: [0.7, 0.9, 0.7],
      duration: 4000,
      loop: true,
      easing: 'easeInOutSine',
      delay: anime.stagger(150)
    })

    anime({
      targets: svg.value.querySelectorAll('.arc'),
      opacity: [0.1, 0.3, 0.1],
      duration: 5000,
      loop: true,
      easing: 'easeInOutSine'
    })
  } catch (e) {}
})
</script>

<style scoped>
.onto-wrap {
  max-width: 920px;
  margin: 0 auto 0.5rem;
  padding: 0 0.5rem;
}
.onto-wrap svg {
  width: 100%;
  height: auto;
}
.node-link { text-decoration: none; }
.node-g { cursor: pointer; }
.node-g:hover .dot { r: 8; fill-opacity: 1; }
.node-g:hover .label { font-weight: 700; fill: var(--vp-c-brand-1); }
.node-g:hover .sublabel { fill: var(--vp-c-text-2); }

@media (max-width: 640px) {
  .onto-wrap svg { height: 300px; }
  .label { font-size: 9px !important; }
  .sublabel { font-size: 7px !important; }
}
</style>
