/**
 * CKP Ontology Browser — Configuration
 * Concept Kernel Protocol v3.5-alpha6
 */

const VERSION = 'v3.5-alpha6';

// Use relative URLs when served from same origin (conceptkernel.org or localhost)
// Falls back to absolute URLs with CORS proxy for cross-origin
const BASE = '/ontology/v3.5-alpha6/';
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

export { VERSION, CKP_ONTOLOGY_URLS, CKP_PREFIXES, COLOR_SCHEME, MODULE_COLORS, MODULE_LABELS };
