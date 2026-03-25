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
}
