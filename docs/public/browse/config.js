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

export { VERSION, CKP_ONTOLOGY_URLS, CKP_PREFIXES, COLOR_SCHEME };
