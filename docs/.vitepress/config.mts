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
        text: 'Docs',
        items: [
          { text: 'v3.7 (Current)', link: '/v3.7/introduction' },
          { text: 'v3.6 (Frozen)', link: '/v3.6/introduction' },
          { text: 'v3.5-alpha6', link: '/v3.5-alpha6/introduction' },
          { text: 'v3.5-alpha3', link: '/v3.5-alpha3/introduction' },
          { text: 'v3.4', link: '/v3.4/introduction' },
        ]
      },
      {
        text: 'Ontology',
        link: '/ontology/v3.7/',
        items: [
          { text: 'Browse Ontology', link: '/browse/index.html' },
          { text: 'v3.7 (TTL) — Current', link: '/ontology/v3.7/' },
          { text: 'v3.6 (TTL)', link: '/ontology/v3.6/' },
          { text: 'v3.5-alpha6 (TTL)', link: '/ontology/v3.5-alpha6/' },
          { text: 'v3.5-alpha3 (TTL)', link: '/ontology/v3.5-alpha3/' },
          { text: 'v3.4 (TTL)', link: '/ontology/v3.4/' },
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
      '/v3.7/': [
        {
          text: 'Part I: Foundations',
          items: [
            { text: 'Introduction', link: '/v3.7/introduction' },
            { text: 'Conformance & Terminology', link: '/v3.7/conformance' },
            { text: 'Namespaces', link: '/v3.7/namespaces' },
          ]
        },
        {
          text: 'Part II: The Three Loops',
          items: [
            { text: 'CK Loop: Identity', link: '/v3.7/ck-loop' },
            { text: 'TOOL Loop: Capability', link: '/v3.7/tool-loop' },
            { text: 'DATA Loop: Knowledge', link: '/v3.7/data-loop' },
            { text: 'Three Loops as One System', link: '/v3.7/three-loops' },
          ]
        },
        {
          text: 'Part III: Ontology',
          items: [
            { text: 'BFO 2020 Grounding', link: '/v3.7/bfo-grounding' },
            { text: 'Four-Layer Ontology Model', link: '/v3.7/ontology-model' },
          ]
        },
        {
          text: 'Part IV: Messaging',
          items: [
            { text: 'NATS Transport & Topics', link: '/v3.7/nats' },
            { text: 'Message Envelope & Processing', link: '/v3.7/message-envelope' },
          ]
        },
        {
          text: 'Part V: Security',
          items: [
            { text: 'Loop Isolation', link: '/v3.7/isolation' },
            { text: 'Authentication', link: '/v3.7/auth' },
            { text: 'Namespace Security', link: '/v3.7/namespace-security' },
          ]
        },
        {
          text: 'Part VI: Edges & Composition',
          items: [
            { text: 'Edge Predicates', link: '/v3.7/edges' },
            { text: 'EXTENDS', link: '/v3.7/extends' },
          ]
        },
        {
          text: 'Part VII: System Kernels',
          items: [
            { text: 'Taxonomy & Archetypes', link: '/v3.7/taxonomy' },
            { text: 'CK.ComplianceCheck', link: '/v3.7/compliance' },
            { text: 'CK.Operator', link: '/v3.7/operator' },
            { text: 'CK.Project & Libraries', link: '/v3.7/project' },
          ]
        },
        {
          text: 'Part VIII: Infrastructure',
          items: [
            { text: 'ConceptKernel CRD', link: '/v3.7/crd' },
            { text: 'Evidence-Based Proof', link: '/v3.7/proof' },
            { text: 'Reconciliation & Logging', link: '/v3.7/reconciliation' },
            { text: 'Versioning', link: '/v3.7/versioning' },
          ]
        },
        {
          text: 'Part IX: Governance & Accumulation',
          items: [
            { text: 'CK.Consensus', link: '/v3.7/consensus' },
            { text: 'Task Engine', link: '/v3.7/task-engine' },
            { text: 'Ontological Graph', link: '/v3.7/graph' },
            { text: 'Sessions', link: '/v3.7/sessions' },
            { text: 'PROV-O Provenance', link: '/v3.7/provenance' },
          ]
        },
        {
          text: 'Reference',
          collapsed: true,
          items: [
            { text: 'Full Changelog', link: '/v3.7/changelog' },
          ]
        },
        {
          text: 'Ontology Files',
          items: [
            { text: 'Browse Ontology', link: '/browse/index.html' },
            { text: 'v3.7 (Turtle)', link: '/ontology/v3.7/' },
            { text: 'v3.6 (Turtle)', link: '/ontology/v3.6/' },
            { text: 'v3.5-alpha6 (Turtle)', link: '/ontology/v3.5-alpha6/' },
          ]
        },
        {
          text: 'Previous Versions',
          collapsed: true,
          items: [
            { text: 'v3.6 (Frozen)', link: '/v3.6/introduction' },
            { text: 'v3.5-alpha6', link: '/v3.5-alpha6/introduction' },
            { text: 'v3.5-alpha3', link: '/v3.5-alpha3/introduction' },
            { text: 'v3.4', link: '/v3.4/introduction' },
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
      '/v3.6/': [
        {
          text: 'Part I: Foundations',
          items: [
            { text: 'Introduction', link: '/v3.6/introduction' },
            { text: 'Conformance & Terminology', link: '/v3.6/conformance' },
            { text: 'Namespaces', link: '/v3.6/namespaces' },
          ]
        },
        {
          text: 'Part II: The Three Loops',
          items: [
            { text: 'CK Loop: Identity', link: '/v3.6/ck-loop' },
            { text: 'TOOL Loop: Capability', link: '/v3.6/tool-loop' },
            { text: 'DATA Loop: Knowledge', link: '/v3.6/data-loop' },
            { text: 'Three Loops as One System', link: '/v3.6/three-loops' },
          ]
        },
        {
          text: 'Part III: Ontology',
          items: [
            { text: 'BFO 2020 Grounding', link: '/v3.6/bfo-grounding' },
            { text: 'Four-Layer Ontology Model', link: '/v3.6/ontology-model' },
          ]
        },
        {
          text: 'Part IV: Messaging',
          items: [
            { text: 'NATS Transport & Topics', link: '/v3.6/nats' },
            { text: 'Message Envelope & Processing', link: '/v3.6/message-envelope' },
          ]
        },
        {
          text: 'Part V: Security',
          items: [
            { text: 'Loop Isolation', link: '/v3.6/isolation' },
            { text: 'Authentication', link: '/v3.6/auth' },
            { text: 'Namespace Security', link: '/v3.6/namespace-security' },
          ]
        },
        {
          text: 'Part VI: Edges & Composition',
          items: [
            { text: 'Edge Predicates', link: '/v3.6/edges' },
            { text: 'EXTENDS + CK.Claude', link: '/v3.6/extends' },
          ]
        },
        {
          text: 'Part VII: System Kernels',
          items: [
            { text: 'Taxonomy & Archetypes', link: '/v3.6/taxonomy' },
            { text: 'CK.ComplianceCheck', link: '/v3.6/compliance' },
            { text: 'CK.Operator', link: '/v3.6/operator' },
            { text: 'CK.Project & Libraries', link: '/v3.6/project' },
          ]
        },
        {
          text: 'Part VIII: Infrastructure',
          items: [
            { text: 'ConceptKernel CRD', link: '/v3.6/crd' },
            { text: 'Evidence-Based Proof', link: '/v3.6/proof' },
            { text: 'Reconciliation & Logging', link: '/v3.6/reconciliation' },
            { text: 'Versioning', link: '/v3.6/versioning' },
          ]
        },
        {
          text: 'Part IX: Claude Integration',
          items: [
            { text: 'CK as Subagent', link: '/v3.6/subagent' },
            { text: 'Streaming', link: '/v3.6/streaming' },
            { text: 'Web Shell', link: '/v3.6/web-shell' },
            { text: 'CK Loop Evolution', link: '/v3.6/evolution' },
          ]
        },
        {
          text: 'Part X: Governance',
          items: [
            { text: 'CK.Consensus', link: '/v3.6/consensus' },
            { text: 'Task Engine', link: '/v3.6/task-engine' },
            { text: 'Ontological Graph', link: '/v3.6/graph' },
            { text: 'Sessions & Agent Teams', link: '/v3.6/sessions' },
            { text: 'Agent Teams', link: '/v3.6/agent-teams' },
            { text: 'Dynamic Spawning', link: '/v3.6/spawning' },
            { text: 'PROV-O Provenance', link: '/v3.6/provenance' },
          ]
        },
        {
          text: 'Reference',
          collapsed: true,
          items: [
            { text: 'Full Changelog', link: '/v3.6/changelog' },
          ]
        },
        {
          text: 'Ontology Files',
          items: [
            { text: 'Browse Ontology', link: '/browse/index.html' },
            { text: 'v3.6 (Turtle)', link: '/ontology/v3.6/' },
            { text: 'v3.5-alpha6 (Turtle)', link: '/ontology/v3.5-alpha6/' },
          ]
        },
        {
          text: 'Previous Versions',
          collapsed: true,
          items: [
            { text: 'v3.5-alpha6', link: '/v3.5-alpha6/introduction' },
            { text: 'v3.5-alpha3', link: '/v3.5-alpha3/introduction' },
            { text: 'v3.4', link: '/v3.4/introduction' },
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
            { text: 'v3.5 (Turtle)', link: '/ontology/v3.5-alpha6/' },
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
            { text: 'v3.5 (Turtle)', link: '/ontology/v3.5-alpha6/' },
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
      '/v3.5-alpha6/': [
        {
          text: 'Foundation',
          items: [
            { text: 'Introduction', link: '/v3.5-alpha6/introduction' },
            { text: 'Three Loops (DL Boxes)', link: '/v3.5-alpha6/three-loops' },
            { text: 'Ontology Layering', link: '/v3.5-alpha6/ontology-layering' },
          ]
        },
        {
          text: 'The Three Loops',
          items: [
            { text: 'CK Loop: Identity', link: '/v3.5-alpha6/ck-loop' },
            { text: 'TOOL Loop: Capability', link: '/v3.5-alpha6/tool-loop' },
            { text: 'DATA Loop: Knowledge', link: '/v3.5-alpha6/data-loop' },
            { text: 'System Integration', link: '/v3.5-alpha6/system' },
          ]
        },
        {
          text: 'Physical Topology',
          items: [
            { text: 'Volumes & Paths', link: '/v3.5-alpha6/topology' },
          ]
        },
        {
          text: 'Identity & Security',
          items: [
            { text: 'SPIFFE Identity', link: '/v3.5-alpha6/spiffe' },
          ]
        },
        {
          text: 'Protocol',
          items: [
            { text: 'Kernel Lifecycle', link: '/v3.5-alpha6/lifecycle' },
            { text: 'NATS Topology', link: '/v3.5-alpha6/nats' },
            { text: 'URN Scheme', link: '/v3.5-alpha6/urn' },
            { text: 'CK.Operator', link: '/v3.5-alpha6/operator' },
          ]
        },
        {
          text: 'Ontology Reference',
          items: [
            { text: 'BFO Type Mapping', link: '/v3.5-alpha6/bfo-mapping' },
            { text: 'Ontology Browser', link: '/v3.5-alpha6/ontology-browser' },
            { text: 'Compliance', link: '/v3.5-alpha6/compliance' },
            { text: 'System Kernels', link: '/v3.5-alpha6/taxonomy' },
          ]
        },
        {
          text: 'Autonomous Operations',
          items: [
            { text: 'Autonomous Operations', link: '/v3.5-alpha6/autonomous-ops' },
          ]
        },
        {
          text: 'Patterns',
          items: [
            { text: 'Implementation Patterns', link: '/v3.5-alpha6/patterns' },
          ]
        },
        {
          text: 'Changelog',
          collapsed: true,
          items: [
            { text: "What's New in v3.5", link: '/v3.5-alpha6/whats-new' },
          ]
        },
        {
          text: 'Ontology Files',
          items: [
            { text: 'v3.5-alpha6 (Turtle)', link: '/ontology/v3.5-alpha6/' },
            { text: 'v3.5 (Turtle)', link: '/ontology/v3.5-alpha6/' },
            { text: 'v3.4 (Turtle)', link: '/ontology/v3.4/' },
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
