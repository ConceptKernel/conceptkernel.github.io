/**
 * CKP Ontology Browser — Configuration
 * Concept Kernel Protocol v3.6
 */

const VERSION = 'v3.6';

// Use relative URLs when served from same origin (conceptkernel.org or localhost)
// Falls back to absolute URLs with CORS proxy for cross-origin
const BASE = '/ontology/v3.6/';
const CKP_ONTOLOGY_URLS = [
    `${BASE}core.ttl`,
    `${BASE}kernel-metadata.ttl`,
    `${BASE}processes.ttl`,
    `${BASE}relations.ttl`,
    `${BASE}base-instances.ttl`,
    `${BASE}proof.ttl`,
    `${BASE}rbac.ttl`,
];

const CKP_PREFIXES = {
    'ckp': 'https://conceptkernel.org/ontology/v3.5/',
    'ckpp': 'https://conceptkernel.org/ontology/v3.5/process/',
    'ckpr': 'https://conceptkernel.org/ontology/v3.5/relation/',
    'ckpw': 'https://conceptkernel.org/ontology/v3.5/workflow/',
    'ckpi': 'https://conceptkernel.org/ontology/v3.5/improvement/',
    'bfo': 'http://purl.obolibrary.org/obo/BFO_',
    'iao': 'http://purl.obolibrary.org/obo/IAO_',
    'cco': 'http://www.ontologydesignpatterns.org/ont/cco/',
    'vf': 'https://w3id.org/valueflows#',
};

const COLOR_SCHEME = {
    headerNavy: '#0D2137',
    sidebarBg: '#f8f9fb',
    linkBlue: '#3b82f6',
    linkBlueHover: '#2563eb',
    classBadgeBg: '#dbeafe',
    classBadgeText: '#1e40af',
    propertyBadgeBg: '#d4edda',
    propertyBadgeText: '#166534',
    individualBadgeBg: '#fef3c7',
    individualBadgeText: '#92400e',
    ontologyBadgeBg: '#f3e5f5',
    ontologyBadgeText: '#6B21A8',
};

/**
 * Module colors for the toggle pills in the sidebar.
 * Keys correspond to the TTL filenames (sans extension).
 */
const MODULE_COLORS = {
    'core':             '#3b82f6',  // blue
    'kernel-metadata':  '#0d9488',  // teal
    'processes':        '#d97706',  // amber
    'relations':        '#7c3aed',  // purple
    'base-instances':   '#16a34a',  // green
    'proof':            '#dc2626',  // red
    'rbac':             '#475569',  // slate
};

/**
 * Friendly display labels for each module.
 */
const MODULE_LABELS = {
    'core':             'Core',
    'kernel-metadata':  'Metadata',
    'processes':        'Processes',
    'relations':        'Relations',
    'base-instances':   'Instances',
    'proof':            'Proof',
    'rbac':             'RBAC',
};

/**
 * Explicit module ordering for structured navigation.
 * Core concepts first, then supporting modules.
 */
const MODULE_ORDER = [
    'core',
    'kernel-metadata',
    'processes',
    'relations',
    'base-instances',
    'proof',
    'rbac',
];

/**
 * Rich module descriptions for the welcome panel and sidebar headers.
 */
const MODULE_DESCRIPTIONS = {
    'core': 'Core BFO continuants: Kernel, Edge, Instance, Action, Project. The fundamental building blocks of CKP architecture, dual-grounded in BFO 2020 and mid-level ontologies (IAO, CCO, PROV-O).',
    'kernel-metadata': 'Storage, deployment, and serving qualities. Alpha-6 adds StorageMedium, DeploymentMethod, and ServingDisposition for the four kernel types.',
    'processes': 'BFO occurrents: Invocation, EdgeCommunication, Consensus, and Broadcast processes. Temporal parts and process boundaries for lifecycle tracking.',
    'relations': 'Object properties and SWRL inference rules: connected_by, depends_on, can_reach, upstream_of, downstream_of, sibling_of. Property chains for transitive closure.',
    'base-instances': 'Instance shapes with PROV-O integration: InstanceManifest, SealedInstance, LedgerEntry. Write-once immutability and append-only audit logs.',
    'proof': 'Proof verification: ProofRecord, ProofCheck, ProofOutcome. SHA-256 hashing, SHACL/SCHEMA/PROVENANCE checks, SPIFFE/SVID trust binding.',
    'rbac': 'Role-Based Access Control: Agent, UserAgent, ProcessAgent, Role, Permission, Quorum. Governance modes (STRICT, RELAXED, AUTONOMOUS).',
};

/**
 * Featured entities for the welcome panel — key concepts to highlight.
 */
const FEATURED_ENTITIES = [
    { label: 'Kernel', type: 'Class', module: 'core', description: 'Persistent computational entity. Dual-grounded: BFO MaterialEntity + CCO Agent.' },
    { label: 'HotKernel', type: 'Class', module: 'core', description: 'Always-on service kernel with NATS listener and /action/* API.' },
    { label: 'ColdKernel', type: 'Class', module: 'core', description: 'On-demand kernel triggered by filesystem events.' },
    { label: 'InlineKernel', type: 'Class', module: 'core', description: 'Podless browser-side JS kernel — NATS WSS, JWT auth.' },
    { label: 'StaticKernel', type: 'Class', module: 'core', description: 'No process — gateway serves storage/web/ directly.' },
    { label: 'Edge', type: 'Class', module: 'core', description: 'Inter-kernel connection with predicate, NATS subject, and consensus flag.' },
    { label: 'Instance', type: 'Class', module: 'core', description: 'BFO GenDepCont grounded in IAO DataItem. Versioned data artifacts.' },
    { label: 'Action', type: 'Class', module: 'core', description: 'BFO Process grounded in IAO PlanSpecification. Named kernel operations.' },
    { label: 'Project', type: 'Class', module: 'core', description: 'Federated namespace root grounded in CCO Organization.' },
    { label: 'InvocationProcess', type: 'Class', module: 'processes', description: 'Complete lifecycle of a kernel action invocation.' },
    { label: 'ProofRecord', type: 'Class', module: 'proof', description: 'SHA-256 manifest verification with SPIFFE identity binding.' },
    { label: 'Agent', type: 'Class', module: 'rbac', description: 'Autonomous entity with roles, permissions, and governance authority.' },
];

/**
 * Ontology-level metadata for the welcome panel overview.
 */
const ONTOLOGY_META = {
    name: 'ConceptKernel BFO Ontology',
    version: VERSION,
    tagline: 'Three loops. Three Description Logic boxes. One Material Entity.',
    description: 'An open protocol for autonomous concept governance. Every entity typed against BFO 2020 (ISO 21838-2) with formal IAO/CCO/PROV-O mid-level grounding.',
    bfoVersion: '2020 (ISO 21838-2)',
    midLevelOntologies: ['IAO', 'CCO', 'PROV-O', 'ValueFlows'],
    threeLoops: [
        { name: 'CK Loop', box: 'TBox', description: 'Identity & type definitions', color: '#16a34a' },
        { name: 'TOOL Loop', box: 'RBox', description: 'Capability & executable code', color: '#d97706' },
        { name: 'DATA Loop', box: 'ABox', description: 'Asserted facts & instances', color: '#7c3aed' },
    ],
};

export {
    VERSION, CKP_ONTOLOGY_URLS, CKP_PREFIXES, COLOR_SCHEME,
    MODULE_COLORS, MODULE_LABELS, MODULE_ORDER, MODULE_DESCRIPTIONS,
    FEATURED_ENTITIES, ONTOLOGY_META
};
