import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Concept Kernel Protocol',
  description: 'An open protocol for autonomous concept governance across distributed agents',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Concept Kernel Protocol' }],
    ['meta', { property: 'og:description', content: 'An open protocol for autonomous concept governance across distributed agents' }],
    ['meta', { property: 'og:url', content: 'https://conceptkernel.org' }],
  ],

  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Concept Kernel',

    nav: [
      { text: 'Docs', link: '/introduction' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Concepts', link: '/concepts/kernels' },
      { text: 'Get Started', link: '/getting-started/quickstart' },
      {
        text: 'Community',
        items: [
          { text: 'Discord', link: 'https://discord.gg/sTbfxV9xyU' },
          { text: 'GitHub', link: 'https://github.com/ConceptKernel' },
        ]
      }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is CKP?', link: '/introduction' },
          { text: 'Architecture', link: '/architecture' },
        ]
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'Kernels', link: '/concepts/kernels' },
          { text: 'Ontology', link: '/concepts/ontology' },
          { text: 'Protocol', link: '/concepts/protocol' },
          { text: 'Consensus', link: '/concepts/consensus' },
          { text: 'Governance', link: '/concepts/governance' },
        ]
      },
      {
        text: 'Getting Started',
        items: [
          { text: 'Quickstart', link: '/getting-started/quickstart' },
          { text: 'Installation', link: '/getting-started/installation' },
        ]
      },
      {
        text: 'Community',
        items: [
          { text: 'Join Discord', link: 'https://discord.gg/sTbfxV9xyU' },
          { text: 'GitHub', link: 'https://github.com/ConceptKernel' },
          { text: 'Contributing', link: '/contributing' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ConceptKernel' },
      { icon: 'discord', link: 'https://discord.gg/sTbfxV9xyU' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2024-present ConceptKernel Contributors'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/ConceptKernel/conceptkernel.github.io/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  }
})
