<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vitepress'

const route = useRoute()
const router = useRouter()

const versions = [
  { label: 'v3.4', prefix: '/v3.4/', badge: 'stable' },
  { label: 'v3.5-alpha3', prefix: '/v3.5-alpha3/', badge: 'alpha' },
]

const current = computed(() => {
  const path = route.path
  return versions.find(v => path.startsWith(v.prefix)) || versions[0]
})

const isOpen = ref(false)

function switchTo(version) {
  isOpen.value = false
  const currentPath = route.path
  const currentVersion = versions.find(v => currentPath.startsWith(v.prefix))
  if (currentVersion && currentVersion.prefix !== version.prefix) {
    const relativePath = currentPath.replace(currentVersion.prefix, '')
    router.go(version.prefix + relativePath)
  } else if (!currentVersion) {
    router.go(version.prefix)
  }
}
</script>

<template>
  <div class="version-switcher" @mouseleave="isOpen = false">
    <button class="version-btn" @click="isOpen = !isOpen" v-if="typeof current === 'object'">
      {{ current.label }}
      <span class="version-badge" :class="current.badge">{{ current.badge }}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
    <div v-show="isOpen" class="version-dropdown">
      <a
        v-for="v in versions"
        :key="v.label"
        :class="{ active: v.prefix === current.prefix }"
        @click.prevent="switchTo(v)"
      >
        {{ v.label }}
        <span class="version-badge" :class="v.badge">{{ v.badge }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.version-switcher {
  position: relative;
  margin-right: 8px;
}
.version-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}
.version-btn:hover {
  border-color: var(--vp-c-brand-1);
}
.version-badge {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 600;
}
.version-badge.stable {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}
.version-badge.alpha {
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
}
.version-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 160px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 4px;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.version-dropdown a {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 13px;
  color: var(--vp-c-text-1);
  cursor: pointer;
  text-decoration: none;
}
.version-dropdown a:hover {
  background: var(--vp-c-bg-soft);
}
.version-dropdown a.active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
</style>
