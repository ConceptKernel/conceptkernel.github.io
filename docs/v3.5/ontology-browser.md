---
title: Ontology Browser
description: Interactive browser for CKP v3.5 ontology classes, properties, and relationships
---

<script setup>
import { ref, computed, onMounted } from 'vue'

const classes = ref([])
const selected = ref(null)
const filter = ref('')
const loaded = ref(false)

const grouped = computed(() => {
  const groups = {}
  for (const c of classes.value) {
    const mod = c.module || 'core'
    if (!groups[mod]) groups[mod] = []
    if (filter.value && !c.name.toLowerCase().includes(filter.value.toLowerCase()) &&
        !c.bfo?.toLowerCase().includes(filter.value.toLowerCase())) continue
    groups[mod].push(c)
  }
  return groups
})

onMounted(async () => {
  try {
    const res = await fetch('/ontology/v3.5-alpha6/index.json')
    const data = await res.json()
    // Parse the index.json into a flat class list
    const entities = data.entities || data.classes || []
    if (Array.isArray(entities)) {
      classes.value = entities
    } else if (typeof entities === 'object') {
      classes.value = Object.entries(entities).map(([name, info]) => ({
        name,
        ...info
      }))
    }
    // If index.json doesn't have entities array, build from known classes
    if (classes.value.length === 0) {
      classes.value = buildKnownClasses()
    }
    loaded.value = true
  } catch (e) {
    classes.value = buildKnownClasses()
    loaded.value = true
  }
})

function buildKnownClasses() {
  return [
    { name: 'Kernel', bfo: 'BFO:0000040 (MaterialEntity)', grounding: 'cco:Agent', module: 'core', desc: 'A persistent computational entity that maintains identity across time. The fundamental atomic unit of the CKP architecture.', alpha6: false },
    { name: 'HotKernel', bfo: 'subClassOf Kernel', grounding: 'cco:Agent', module: 'core', desc: 'Always-on service kernel. Listens for events, serves API endpoints.', alpha6: false },
    { name: 'ColdKernel', bfo: 'subClassOf Kernel', grounding: 'cco:Agent', module: 'core', desc: 'On-demand kernel. Triggered by events, exits after execution.', alpha6: false },
    { name: 'InlineKernel', bfo: 'subClassOf Kernel', grounding: 'cco:Agent', module: 'core', desc: 'Podless browser-side kernel. Runs via CK.Lib.Js with NATS WSS and JWT authentication.', alpha6: true },
    { name: 'StaticKernel', bfo: 'subClassOf Kernel', grounding: 'cco:Agent', module: 'core', desc: 'No process. Gateway serves storage/web/ directly from the distributed filesystem.', alpha6: true },
    { name: 'Edge', bfo: 'BFO:0000031 (GenDepCont)', grounding: 'cco:Artifact', module: 'core', desc: 'A typed relationship between two kernels. The only mechanism for inter-kernel communication.', alpha6: false },
    { name: 'AuthorizedEdge', bfo: 'subClassOf Edge', grounding: 'cco:Artifact', module: 'core', desc: 'An edge where the target kernel explicitly authorizes the relationship.', alpha6: false },
    { name: 'Instance', bfo: 'BFO:0000031 (GenDepCont)', grounding: 'iao:0000027 (DataItem)', module: 'core', desc: 'A persistent information entity — the result of a Process. Immutable after seal.', alpha6: false },
    { name: 'KernelOntology', bfo: 'BFO:0000020 (SpecDepCont)', grounding: 'iao:0000310 (Document)', module: 'core', desc: 'The type definition of a kernel. Stored as ontology.yaml in the CK loop.', alpha6: false },
    { name: 'Action', bfo: 'BFO:0000015 (Process)', grounding: 'iao:0000104 (PlanSpec)', module: 'core', desc: 'A typed action that a kernel can perform. Exposed via conceptkernel.yaml spec.actions.', alpha6: false },
    { name: 'Reconciliation', bfo: 'subClassOf Action', grounding: 'iao:0000104 (PlanSpec)', module: 'core', desc: 'An operator reconciliation cycle. Watches cluster state and applies desired configuration.', alpha6: true },
    { name: 'GovernanceMode', bfo: 'BFO:0000016 (Disposition)', grounding: '-', module: 'core', desc: 'The governance quality of a kernel: STRICT, RELAXED, or AUTONOMOUS.', alpha6: false },
    { name: 'Project', bfo: 'BFO:0000031 (GenDepCont)', grounding: 'cco:Organization', module: 'core', desc: 'A .ckproject declaration that organizes kernels into a coherent unit.', alpha6: true },
    { name: 'QueueContract', bfo: 'BFO:0000016 (Disposition)', grounding: 'iao:0000017 (Directive)', module: 'core', desc: 'Disposition defining what inputs a kernel can accept.', alpha6: false },
    { name: 'StorageContract', bfo: 'BFO:0000016 (Disposition)', grounding: '-', module: 'core', desc: 'Disposition defining what outputs a kernel will produce.', alpha6: false },
    { name: 'InstanceManifest', bfo: 'BFO:0000031 (GenDepCont)', grounding: 'iao:0000027 (DataItem)', module: 'base-instances', desc: 'Metadata container for an instance. Carries PROV-O provenance fields.', alpha6: false },
    { name: 'SealedInstance', bfo: 'subClassOf InstanceManifest', grounding: 'iao:0000027 (DataItem)', module: 'base-instances', desc: 'Write-once immutable instance. data.json is never modified after seal.', alpha6: false },
    { name: 'LedgerEntry', bfo: 'BFO:0000031 (GenDepCont)', grounding: '-', module: 'base-instances', desc: 'Append-only state log entry. Records before/after for every mutation.', alpha6: false },
    { name: 'ProofRecord', bfo: 'BFO:0000031 (GenDepCont)', grounding: '-', module: 'proof', desc: 'SHA-256 hash verification per instance. SPIFFE/SVID identity binding.', alpha6: false },
    { name: 'ProofCheck', bfo: 'BFO:0000031 (GenDepCont)', grounding: '-', module: 'proof', desc: 'A single validation check within a compliance run.', alpha6: false },
    { name: 'StorageMedium', bfo: 'BFO:0000019 (Quality)', grounding: '-', module: 'kernel-metadata', desc: 'Quality defining the storage backend: FILESYSTEM, DOCUMENT_STORE, or CONFIGMAP.', alpha6: true },
    { name: 'DeploymentMethod', bfo: 'BFO:0000019 (Quality)', grounding: '-', module: 'kernel-metadata', desc: 'Quality defining how volumes are mounted: VOLUME, FILER, CONFIGMAP_DEPLOY, or INLINE_DEPLOY.', alpha6: true },
    { name: 'ServingDisposition', bfo: 'BFO:0000016 (Disposition)', grounding: 'cco:Specification', module: 'kernel-metadata', desc: 'Disposition for how a kernel serves content: API, Web, NATS, or Browser WSS.', alpha6: true },
    { name: 'Invocation', bfo: 'BFO:0000015 (Process)', grounding: '-', module: 'processes', desc: 'A tool or API call within a kernel execution.', alpha6: false },
    { name: 'EdgeCommunication', bfo: 'BFO:0000015 (Process)', grounding: '-', module: 'processes', desc: 'An inter-kernel message traversing an edge.', alpha6: false },
    { name: 'Consensus', bfo: 'BFO:0000015 (Process)', grounding: '-', module: 'processes', desc: 'A governance decision process involving roles, votes, and proofs.', alpha6: false },
    { name: 'Agent', bfo: 'BFO:0000040 (MaterialEntity)', grounding: 'cco:Agent', module: 'rbac', desc: 'An entity that can perform actions. Parent of UserAgent and ProcessAgent.', alpha6: false },
    { name: 'Role', bfo: 'BFO:0000023 (Role)', grounding: 'cco:Role', module: 'rbac', desc: 'A role that an agent bears in the context of inter-kernel authorization.', alpha6: false },
    { name: 'Permission', bfo: 'BFO:0000016 (Disposition)', grounding: '-', module: 'rbac', desc: 'A permission granted to a role for specific actions on specific resources.', alpha6: false },
  ]
}
</script>

# Ontology Browser <Badge type="tip" text="v3.5-alpha6" />

Browse the CKP v3.5 ontology — every class grounded in [BFO 2020](http://purl.obolibrary.org/obo/bfo.owl), with [IAO](http://purl.obolibrary.org/obo/iao.owl) and [CCO](https://github.com/CommonCoreOntology/CommonCoreOntologies) mid-level grounding where applicable.

<div class="onto-browser">
  <input v-model="filter" placeholder="Filter classes... (try 'Kernel', 'Instance', 'Action')" class="onto-filter" />

  <div v-for="(items, mod) in grouped" :key="mod" class="onto-module">
    <h3 class="onto-module-title">{{ mod }}.ttl</h3>
    <div v-for="c in items" :key="c.name"
         class="onto-class"
         :class="{ selected: selected?.name === c.name, alpha6: c.alpha6 }"
         @click="selected = selected?.name === c.name ? null : c">
      <div class="onto-class-header">
        <code class="onto-class-name">ckp:{{ c.name }}</code>
        <Badge v-if="c.alpha6" type="info" text="α6" />
        <span class="onto-class-bfo">{{ c.bfo }}</span>
      </div>
      <div v-if="selected?.name === c.name" class="onto-class-detail">
        <p>{{ c.desc }}</p>
        <table>
          <tr><td class="onto-label">BFO Parent</td><td>{{ c.bfo }}</td></tr>
          <tr><td class="onto-label">IAO/CCO</td><td>{{ c.grounding }}</td></tr>
          <tr><td class="onto-label">Module</td><td><a :href="'/ontology/v3.5-alpha6/' + c.module + '.ttl'">{{ c.module }}.ttl</a></td></tr>
        </table>
      </div>
    </div>
  </div>
</div>

<style>
.onto-browser { margin-top: 1rem; }
.onto-filter {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  margin-bottom: 1.5rem;
  outline: none;
}
.onto-filter:focus { border-color: var(--vp-c-brand-1); }
.onto-module { margin-bottom: 1.5rem; }
.onto-module-title {
  font-size: 13px;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid var(--vp-c-divider);
}
.onto-class {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
}
.onto-class:hover { background: var(--vp-c-bg-soft); }
.onto-class.selected { background: var(--vp-c-bg-alt); border-left: 3px solid var(--vp-c-brand-1); }
.onto-class.alpha6 .onto-class-name { color: var(--vp-c-brand-1); }
.onto-class-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.onto-class-name { font-size: 13px; font-weight: 600; }
.onto-class-bfo { font-size: 11px; color: var(--vp-c-text-3); margin-left: auto; }
.onto-class-detail {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 13px;
}
.onto-class-detail p { color: var(--vp-c-text-2); margin-bottom: 8px; }
.onto-class-detail table { width: 100%; font-size: 12px; }
.onto-class-detail td { padding: 3px 8px; }
.onto-label { color: var(--vp-c-text-3); width: 90px; font-weight: 500; }
</style>
