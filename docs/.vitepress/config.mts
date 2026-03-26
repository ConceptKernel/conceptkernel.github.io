import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
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
      {
        text: 'Ontology',
        items: [
          { text: 'v3.4 (stable)', link: '/ontology/v3.4/' },
          { text: 'v3.5 (alpha-3)', link: '/ontology/v3.5/' },
        ]
      },
      {
        text: 'Community',
        items: [
          { text: 'Discord', link: 'https://discord.gg/sTbfxV9xyU' },
          { text: 'GitHub', link: 'https://github.com/ConceptKernel' },
        ]
      }
    ],

    sidebar: {
      '/v3.4/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is CKP?', link: '/v3.4/introduction' },
            { text: 'Architecture', link: '/v3.4/architecture' },
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Kernels', link: '/v3.4/concepts/kernels' },
            { text: 'Ontology', link: '/v3.4/concepts/ontology' },
            { text: 'Protocol', link: '/v3.4/concepts/protocol' },
            { text: 'Consensus', link: '/v3.4/concepts/consensus' },
            { text: 'Governance', link: '/v3.4/concepts/governance' },
          ]
        },
        {
          text: 'Getting Started',
          items: [
            { text: 'Quickstart', link: '/v3.4/getting-started/quickstart' },
            { text: 'Installation', link: '/v3.4/getting-started/installation' },
          ]
        },
        {
          text: 'Ontology Files',
          items: [
            { text: 'v3.4 (Turtle)', link: '/ontology/v3.4/' },
            { text: 'v3.5 (Turtle)', link: '/ontology/v3.5/' },
          ]
        },
        {
          text: 'Community',
          items: [
            { text: 'Join Discord', link: 'https://discord.gg/sTbfxV9xyU' },
            { text: 'GitHub', link: 'https://github.com/ConceptKernel' },
            { text: 'Contributing', link: '/v3.4/contributing' },
          ]
        }
      ],
      '/v3.5-alpha3/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is CKP?', link: '/v3.5-alpha3/introduction' },
            { text: 'Architecture', link: '/v3.5-alpha3/architecture' },
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Kernels', link: '/v3.5-alpha3/concepts/kernels' },
            { text: 'Ontology', link: '/v3.5-alpha3/concepts/ontology' },
            { text: 'Protocol', link: '/v3.5-alpha3/concepts/protocol' },
            { text: 'Consensus', link: '/v3.5-alpha3/concepts/consensus' },
            { text: 'Governance', link: '/v3.5-alpha3/concepts/governance' },
          ]
        },
        {
          text: 'Ontology',
          items: [
            { text: 'Versions', link: '/v3.5-alpha3/ontology/versions' },
          ]
        },
        {
          text: 'Spec',
          items: [
            { text: 'Three Loops', link: '/v3.5-alpha3/spec/three-loops' },
            { text: 'Proof Model', link: '/v3.5-alpha3/spec/proof-model' },
          ]
        },
        {
          text: 'Getting Started',
          items: [
            { text: 'Quickstart', link: '/v3.5-alpha3/getting-started/quickstart' },
            { text: 'Installation', link: '/v3.5-alpha3/getting-started/installation' },
          ]
        },
        {
          text: 'Ontology Files',
          items: [
            { text: 'v3.4 (Turtle)', link: '/ontology/v3.4/' },
            { text: 'v3.5 (Turtle)', link: '/ontology/v3.5/' },
          ]
        },
        {
          text: 'Community',
          items: [
            { text: 'Join Discord', link: 'https://discord.gg/sTbfxV9xyU' },
            { text: 'GitHub', link: 'https://github.com/ConceptKernel' },
            { text: 'Contributing', link: '/v3.5-alpha3/contributing' },
          ]
        }
      ],
    },

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
  },

  mermaid: {},
}))
