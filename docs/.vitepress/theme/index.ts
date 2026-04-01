import DefaultTheme from 'vitepress/theme'
import VersionSwitcher from './VersionSwitcher.vue'
import { h } from 'vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-before': () => h(VersionSwitcher),
    })
  },
  enhanceApp() {
    // Force full page reload when clicking logo (/) so public/index.html serves
    if (typeof window !== 'undefined') {
      document.addEventListener('click', (e) => {
        const link = (e.target as HTMLElement).closest('a[href="/"]')
        if (link) {
          e.preventDefault()
          e.stopPropagation()
          window.location.href = '/'
        }
      }, true)
    }
  },
}
