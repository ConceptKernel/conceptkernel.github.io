<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

const versions = [
  { label: 'v3.7', prefix: '/v3.7/', badge: 'latest', color: '#3b82f6' },
  { label: 'v3.6', prefix: '/v3.6/', badge: 'frozen', color: '#8b5cf6' },
  { label: 'v3.5-alpha6', prefix: '/v3.5-alpha6/', badge: 'stable', color: '#22c55e' },
  { label: 'v3.5-alpha3', prefix: '/v3.5-alpha3/', badge: 'alpha', color: '#eab308' },
  { label: 'v3.4', prefix: '/v3.4/', badge: 'legacy', color: '#6b7280' },
]

const current = computed(() => {
  const path = route.path
  return versions.find(v => path.startsWith(v.prefix)) || versions[0]
})

const isOpen = ref(false)
const switcher = ref(null)

function switchTo(version) {
  isOpen.value = false
  if (typeof window === 'undefined') return
  // Always navigate to the version's introduction page to avoid 404s.
  // Different versions have different page structures, so trying to map
  // the current page path into a different version causes SPA 404 errors.
  window.location.href = version.prefix + 'introduction'
}

function handleClickOutside(e) {
  if (switcher.value && !switcher.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <ClientOnly>
    <div ref="switcher" class="version-switcher">
      <button class="version-btn" @click.stop="isOpen = !isOpen">
        {{ current.label }}
        <span class="version-badge" :style="{ color: current.color, background: current.color + '22' }">{{ current.badge }}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div v-if="isOpen" class="version-dropdown">
        <a
          v-for="v in versions"
          :key="v.label"
          :class="{ active: v.prefix === current.prefix }"
          href="#"
          @click.prevent.stop="switchTo(v)"
        >
          {{ v.label }}
          <span class="version-badge" :style="{ color: v.color, background: v.color + '22' }">{{ v.badge }}</span>
        </a>
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.version-switcher { position: relative; margin-right: 12px; }
.version-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 3px 10px; border: 1px solid var(--vp-c-divider); border-radius: 6px;
  background: transparent; color: var(--vp-c-text-1);
  font-size: 12px; cursor: pointer; font-family: inherit; white-space: nowrap;
}
.version-btn:hover { border-color: var(--vp-c-brand-1); }
.version-badge { font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: 600; }
.version-dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; min-width: 150px;
  background: var(--vp-c-bg-elv); border: 1px solid var(--vp-c-divider);
  border-radius: 8px; padding: 4px; z-index: 200;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.version-dropdown a {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px; border-radius: 4px;
  font-size: 13px; color: var(--vp-c-text-1); cursor: pointer; text-decoration: none;
}
.version-dropdown a:hover { background: var(--vp-c-bg-soft); }
.version-dropdown a.active { color: var(--vp-c-brand-1); font-weight: 600; }
</style>
