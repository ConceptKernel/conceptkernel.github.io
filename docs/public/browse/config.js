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
    `${BASE}edges.ttl`,
    `${BASE}consensus.ttl`,
];

const CKP_PREFIXES = {
    'ckp': 'https://conceptkernel.org/ontology/v3.6/',
    'ckpp': 'https://conceptkernel.org/ontology/v3.6/process/',
    'ckpr': 'https://conceptkernel.org/ontology/v3.6/relation/',
    'ckpw': 'https://conceptkernel.org/ontology/v3.6/workflow/',
    'ckpi': 'https://conceptkernel.org/ontology/v3.6/improvement/',
    'bfo': 'http://purl.obolibrary.org/obo/BFO_',
    'iao': 'http://purl.obolibrary.org/obo/IAO_',
    'cco': 'http://www.ontologyrepository.com/CommonCoreOntologies/',
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
    'edges':            '#ec4899',  // pink
    'consensus':        '#f59e0b',  // gold
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
    'edges':            'Edges',
    'consensus':        'Consensus',
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
    'edges',
    'consensus',
];

/**
 * Rich module descriptions for the welcome panel and sidebar headers.
 */
const MODULE_DESCRIPTIONS = {
    'core': 'Core BFO continuants: Kernel (4 types + AgentKernel), Edge, Instance, Action, Project. Dual-grounded in BFO 2020 and mid-level ontologies (IAO, CCO, PROV-O).',
    'kernel-metadata': 'Storage, deployment, and serving qualities. StorageMedium, DeploymentMethod, ServingDisposition, PersonaTemplate, and ModelConfiguration.',
    'processes': 'BFO occurrents: Invocation, EdgeCommunication, Consensus, Broadcast, TaskExecution, Spawning, and Session processes.',
    'relations': 'Object properties and SWRL inference rules: connected_by, depends_on, can_reach, extends_with, loops_with, spawned_by. Property chains for transitive closure.',
    'base-instances': 'Instance shapes with PROV-O integration: InstanceManifest, SealedInstance, LedgerEntry, TaskInstance, ConversationInstance.',
    'proof': 'Proof verification with 20 CheckType individuals. ProofRecord, ProofCheck, ProofOutcome. SHA-256 hashing, SPIFFE/SVID trust binding.',
    'rbac': 'Role-Based Access Control: Agent, UserAgent, ProcessAgent, Role, Permission, Quorum, TeamCoordinator. GovernanceLevel (STRICT, RELAXED, AUTONOMOUS).',
    'edges': 'Edge predicate ontology: COMPOSES, TRIGGERS, PRODUCES, EXTENDS, LOOPS_WITH. Composition semantics, instance ownership, and activation models.',
    'consensus': 'CK.Consensus formal ontology: ConsensusProposal lifecycle, ConsensusVote, ValidationLayer (ontological, constraint, topology, compliance).',
};

/**
 * Featured entities for the welcome panel — key concepts to highlight.
 */
const FEATURED_ENTITIES = [
    { label: 'Kernel', type: 'Class', module: 'core', description: 'Persistent computational entity. Dual-grounded: BFO MaterialEntity + CCO Agent.' },
    { label: 'AgentKernel', type: 'Class', module: 'core', description: 'LLM-capable kernel with streaming, personas, and multi-turn sessions.' },
    { label: 'HotKernel', type: 'Class', module: 'core', description: 'Always-on service kernel with NATS listener and /action/* API.' },
    { label: 'Edge', type: 'Class', module: 'core', description: 'Inter-kernel connection with predicate, NATS subject, and consensus flag.' },
    { label: 'Instance', type: 'Class', module: 'core', description: 'BFO GenDepCont grounded in IAO DataItem. Versioned data artifacts.' },
    { label: 'Action', type: 'Class', module: 'core', description: 'BFO Process grounded in IAO PlanSpecification. Named kernel operations.' },
    { label: 'PersonaTemplate', type: 'Class', module: 'core', description: 'Reusable system prompt template for EXTENDS persona mounting.' },
    { label: 'EdgePredicate', type: 'Class', module: 'edges', description: 'Five predicates: COMPOSES, TRIGGERS, PRODUCES, EXTENDS, LOOPS_WITH.' },
    { label: 'ConsensusProposal', type: 'Class', module: 'consensus', description: 'Formal proposal for CK loop evolution with 4 validation layers.' },
    { label: 'InvocationProcess', type: 'Class', module: 'processes', description: 'Complete lifecycle of a kernel action invocation.' },
    { label: 'ProofRecord', type: 'Class', module: 'proof', description: 'SHA-256 manifest verification with 20 check types.' },
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
