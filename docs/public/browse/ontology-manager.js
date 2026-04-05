/**
 * CKP Ontology Browser — OntologyManager
 * Concept Kernel Protocol v3.5-alpha6
 *
 * Handles ontology loading, parsing (N3/Turtle + RDF/XML),
 * entity extraction, filtering, search, and detail rendering.
 */

import {
    CKP_ONTOLOGY_URLS, CKP_PREFIXES, MODULE_COLORS, MODULE_LABELS,
    MODULE_ORDER, MODULE_DESCRIPTIONS, FEATURED_ENTITIES, ONTOLOGY_META
} from './config.js';

class OntologyManager {
    constructor() {
        // Map of loaded ontology base URIs to their info
        this.ontologies = new Map();
        // Single, global store for all triples from all ontologies
        this.globalStore = new N3.Store();

        this.failedUrls = new Set();
        this.n3Available = false;
        this.rdflibAvailable = false;
        this.currentFilter = 'all';

        // Module toggle state: maps module key -> boolean (enabled/disabled)
        this.moduleEnabled = {};
        // Module key -> ontology URL mapping
        this.moduleUrlMap = {};

        // Common prefixes for shortening URIs
        this.prefixes = {
            'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
            'owl': 'http://www.w3.org/2002/07/owl#',
            'xsd': 'http://www.w3.org/2001/XMLSchema#',
            'dct': 'http://purl.org/dc/terms/',
            'skos': 'http://www.w3.org/2004/02/skos/core#',
            'prov': 'http://www.w3.org/ns/prov#',
            'time': 'http://www.w3.org/2006/time#',
            // CKP-specific prefixes
            ...CKP_PREFIXES,
        };

        // Build module key -> URL mapping from CKP_ONTOLOGY_URLS
        CKP_ONTOLOGY_URLS.forEach(url => {
            const key = this.extractModuleKey(url);
            this.moduleUrlMap[key] = url;
            this.moduleEnabled[key] = true; // all enabled by default
        });

        // Check dependencies right away
        this.checkDependencies().then(() => {
            // Initialize event listeners after check
            this.initEventListeners();
            // Pre-populate textarea with CKP ontology URLs
            this.populateOntologyUrls();
            // Render initial module pills (loading state)
            this.renderModulePills();
            // Auto-load CKP ontologies (URN resolution happens in updateOntologyTree)
            setTimeout(() => this.handleLoadOntologies(), 500);
        });
    }

    /**
     * Extract module key from a URL, e.g. "/ontology/v3.5-alpha6/core.ttl" -> "core"
     */
    extractModuleKey(url) {
        const filename = url.substring(url.lastIndexOf('/') + 1);
        return filename.replace(/\.ttl$/, '').replace(/\.owl$/, '').replace(/\.rdf$/, '');
    }

    /**
     * Pre-populate the textarea with CKP ontology URLs
     */
    populateOntologyUrls() {
        const textarea = document.getElementById('ontologyUrls');
        if (textarea && !textarea.value.trim()) {
            textarea.value = CKP_ONTOLOGY_URLS.join('\n');
        }
    }

    /**
     * Resolve URL parameters to navigate to a specific entity.
     * Supports:
     *   ?urn=ckp://Kernel#CK.Task:v1.0   -> resolves CKP URN to entity URI
     *   ?class=Kernel                      -> finds class by local name
     *   ?uri=https://...#Kernel            -> direct URI lookup
     *   #BroadcastProcess                  -> hash fragment as local name
     */
    resolveUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash.substring(1); // remove #

        let targetUri = null;

        // ?urn=ckp://Kernel#CK.Task:v1.0
        const urn = params.get('urn');
        if (urn && urn.startsWith('ckp://')) {
            // Parse CKP URN: ckp://{Type}#{Name}:{Version}
            const match = urn.match(/^ckp:\/\/(\w+)#(.+?)(?::v[\d.]+)?$/);
            if (match) {
                const [, type, name] = match;
                // Search loaded entities for matching name
                for (const [, ont] of this.ontologies) {
                    const entity = ont.entities.find(e =>
                        e.label === name || e.uri.endsWith('#' + name) || e.uri.endsWith('/' + name)
                    );
                    if (entity) { targetUri = entity.uri; break; }
                }
            }
        }

        // ?class=Kernel or ?property=hasEdge or ?entity=GovernanceMode
        const className = params.get('class') || params.get('property') || params.get('entity');
        if (!targetUri && className) {
            const lcName = className.toLowerCase();
            for (const [, ont] of this.ontologies) {
                const entity = ont.entities.find(e => {
                    const localName = this.extractLocalName(e.uri).toLowerCase();
                    return e.label.toLowerCase() === lcName ||
                           localName === lcName ||
                           e.uri.endsWith('#' + className) ||
                           e.uri.endsWith('/' + className);
                });
                if (entity) { targetUri = entity.uri; break; }
            }
        }

        // ?uri=https://conceptkernel.org/ontology/v3.5/#Kernel
        const directUri = params.get('uri');
        if (!targetUri && directUri) {
            targetUri = directUri;
        }

        // #BroadcastProcess (hash fragment)
        if (!targetUri && hash) {
            for (const [, ont] of this.ontologies) {
                const entity = ont.entities.find(e =>
                    e.label === hash || e.uri.endsWith('#' + hash) || e.uri.endsWith('/' + hash)
                );
                if (entity) { targetUri = entity.uri; break; }
            }
        }

        // Navigate to the found entity
        if (targetUri) {
            this.showEntityDetailsByUri(targetUri);
            this.log(`Resolved URL param to: ${targetUri}`, 'success');
        }
    }

    // --- Top Loading Bar ---
    showTopLoadingBar() {
        const bar = document.getElementById('topLoadingBar');
        if (!bar) return;
        bar.style.width = '0%';
        bar.classList.remove('done');
        bar.classList.add('active');
    }

    updateTopLoadingBar(percent) {
        const bar = document.getElementById('topLoadingBar');
        if (!bar) return;
        bar.style.width = `${Math.min(percent, 95)}%`;
    }

    hideTopLoadingBar() {
        const bar = document.getElementById('topLoadingBar');
        if (!bar) return;
        bar.classList.remove('active');
        bar.classList.add('done');
        bar.style.width = '100%';
        setTimeout(() => {
            bar.classList.remove('done');
            bar.style.width = '0%';
        }, 800);
    }

    // --- Module Pills ---
    renderModulePills() {
        const container = document.getElementById('modulePills');
        if (!container) return;
        container.innerHTML = '';

        const moduleKeys = Object.keys(this.moduleUrlMap);
        moduleKeys.forEach(key => {
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'module-pill';
            pill.dataset.moduleKey = key;

            const color = MODULE_COLORS[key] || '#6b7280';
            const label = MODULE_LABELS[key] || key;

            const url = this.moduleUrlMap[key];
            const ontology = this.ontologies.get(url);
            const isFailed = this.failedUrls.has(url);
            const isEnabled = this.moduleEnabled[key];

            if (isFailed) {
                pill.classList.add('failed');
                pill.title = `Failed to load: ${key}`;
            } else if (isEnabled) {
                pill.classList.add('active');
                pill.style.background = color;
                pill.style.borderColor = color;
                pill.title = `${label}: click to hide`;
            } else {
                pill.classList.add('inactive');
                pill.title = `${label}: click to show`;
            }

            let innerHTML = label;
            if (ontology) {
                innerHTML += `<span class="pill-count">${ontology.stats.total}</span>`;
            }
            pill.innerHTML = innerHTML;

            // Toggle on click (unless failed)
            if (!isFailed) {
                pill.addEventListener('click', () => {
                    this.moduleEnabled[key] = !this.moduleEnabled[key];
                    this.renderModulePills();
                    this.filterEntities();
                    this.updateEntityCountBadge();
                });
            }

            container.appendChild(pill);
        });
    }

    // --- Entity Count Badge ---
    updateEntityCountBadge() {
        const badge = document.getElementById('entityCountBadge');
        if (!badge) return;

        let count = 0;
        document.querySelectorAll('.ontology-item').forEach(ontologyItem => {
            ontologyItem.querySelectorAll('.entity-item').forEach(entityItem => {
                if (entityItem.style.display !== 'none') {
                    count++;
                }
            });
        });
        badge.textContent = count;
    }

    // --- 1. Dependency Check and Initialization ---
    async checkDependencies() {
        const dependencyCheck = document.getElementById('dependencyCheck');
        const loadButton = document.getElementById('loadOntologies');
        const status = document.getElementById('loadStatus');

        let checksPassed = true;
        let depHtml = '';

        if (typeof N3 !== 'undefined') {
            this.n3Available = true;
            depHtml += '&#10003; N3.js parser loaded (for Turtle/N3)<br>';
            this.log('N3.js parser is available.', 'success');
        } else {
            checksPassed = false;
            depHtml += '&#10007; N3.js parser not found (Turtle/N3 disabled)<br>';
            this.log('N3.js parser not found.', 'error');
        }

        // Check for rdflib
        if (typeof $rdf !== 'undefined') {
            this.rdflibAvailable = true;
            depHtml += '&#10003; rdflib.js parser loaded (for RDF/XML)';
            this.log('rdflib.js parser is available.', 'success');
        } else {
            depHtml += '&#9888; rdflib.js not found (RDF/XML parsing disabled)';
            this.log('rdflib.js not found. Will not be able to parse RDF/XML files.', 'warning');
        }

        dependencyCheck.innerHTML = depHtml;

        if (checksPassed) {
            dependencyCheck.style.color = '#16a34a';
            status.textContent = 'Ready to load ontologies.';
            loadButton.disabled = false;
        } else {
            dependencyCheck.style.color = '#dc2626';
            status.textContent = 'Error: Core parser N3.js is required.';
            this.log('Cannot load ontologies without the core N3.js parser.', 'error');
        }
    }

    log(message, type = 'info') {
        const logsContainer = document.getElementById('loadLogs');
        if (!logsContainer) return;
        const logEntry = document.createElement('div');
        logEntry.className = `log ${type}`;
        const timestamp = new Date().toLocaleTimeString();
        const icon = type === 'success' ? '&#10003;' : type === 'error' ? '&#10007;' : type === 'warning' ? '&#9888;' : '&#8505;';
        logEntry.innerHTML = `${icon} [${timestamp}] ${message}`;
        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    // --- 2. Ontology Loading Logic ---
    async handleLoadOntologies() {
        if (!this.n3Available) {
            this.log('Loading is disabled because N3.js is not available.', 'error');
            return;
        }

        const urlsText = document.getElementById('ontologyUrls').value;
        const urls = urlsText.split('\n').map(url => url.trim()).filter(Boolean);

        if (urls.length === 0) {
            this.log('No URLs provided.', 'warning');
            return;
        }

        const status = document.getElementById('loadStatus');
        const loadButton = document.getElementById('loadOntologies');
        document.getElementById('loadLogs').innerHTML = '';
        loadButton.disabled = true;
        loadButton.textContent = 'Loading...';

        // Show top loading bar
        this.showTopLoadingBar();

        let loadedCount = 0;
        const promises = urls.map(async (url, index) => {
            const progress = ((index + 1) / urls.length) * 100;
            status.textContent = `Loading ${index + 1} of ${urls.length}: ${this.extractLocalName(url, true)}`;
            this.updateProgress(progress);
            this.updateTopLoadingBar(progress);

            if (this.ontologies.has(url)) {
                this.log(`Already loaded: ${url}`, 'warning');
                return;
            }
            if (this.failedUrls.has(url)) {
                this.log(`Skipping previously failed: ${url}`, 'warning');
                return;
            }

            try {
                // Use direct fetch for same-origin/relative URLs, CORS proxy for external
                const isLocal = url.startsWith('/') || url.startsWith('./') || url.startsWith(window.location.origin);
                const proxyUrl = isLocal ? url : `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const ontologyData = await this.loadOntologyWithTimeout(proxyUrl, url, 15000);

                // Add triples to the global store
                this.globalStore.addQuads(ontologyData.store.getQuads());

                // Save the extracted info
                this.ontologies.set(url, ontologyData);

                this.log(`Loaded: ${url} (${ontologyData.stats.total} entities)`, 'success');
                loadedCount++;
            } catch (error) {
                this.failedUrls.add(url);
                this.log(`Failed: ${url} - ${error.message}`, 'error');
            }
        });

        await Promise.all(promises);

        // Hide top loading bar
        this.hideTopLoadingBar();

        status.textContent = `Finished. Loaded ${loadedCount} new ontology/ontologies.`;
        loadButton.disabled = false;
        loadButton.textContent = 'Load Ontologies';

        // Refresh module pills with loaded/failed state
        this.renderModulePills();
        // Refresh the display with all entities from the global store
        this.updateOntologyTree();
        // Update count badge
        this.updateEntityCountBadge();
    }

    async loadOntologyWithTimeout(fetchUrl, baseUri, timeoutMs) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(fetchUrl, { signal: controller.signal });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const content = await response.text();
            // Pass the original URL as the baseUri for parsing
            return await this.parseOntology(content, baseUri);
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
            }

            console.error(`[OntologyManager] Failed to fetch or parse ${baseUri}:`, error);

            // Re-throw with the (now more detailed) message from parseOntology
            throw new Error(`Fetch/parse failed: ${error.message}`);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async parseOntology(content, baseUri) {
        const store = new N3.Store();
        const isXml = content.trim().startsWith('<?xml');

        if (isXml) {
            // --- RDF/XML PARSING PATH ---
            if (!this.rdflibAvailable) {
                throw new Error('File is RDF/XML, but rdflib.js parser is not loaded.');
            }
            return new Promise((resolve, reject) => {
                try {
                    const rdfGraph = $rdf.graph();
                    $rdf.parse(content, rdfGraph, baseUri, 'application/rdf+xml');

                    const rdflibQuads = rdfGraph.match(undefined, undefined, undefined);

                    // Manually convert rdflib.js Quads to N3.js Quads
                    const n3Quads = rdflibQuads.map(q => {
                        const subject = this.normalizeRdfLibTerm(q.subject);
                        const predicate = this.normalizeRdfLibTerm(q.predicate);
                        const object = this.normalizeRdfLibTerm(q.object);
                        const graph = this.normalizeRdfLibTerm(q.graph);

                        if (!subject || !predicate || !object || !graph) {
                            console.warn("[OntologyManager] Failed to normalize quad, skipping:", q);
                            return null;
                        }

                        return N3.DataFactory.quad(subject, predicate, object, graph);
                    }).filter(q => q !== null);

                    store.addQuads(n3Quads);

                    const info = this.extractOntologyInfo(store, baseUri);
                    resolve({ ...info, store: store });
                } catch (error) {
                    console.error(`[OntologyManager] rdflib.js Parse Error for ${baseUri}:`);
                    console.error("Full rdflib.js error object:", error);
                    let detailedMessage = `RDF/XML Parse error: ${error.message}`;
                    reject(new Error(detailedMessage));
                }
            });

        } else {
            // --- N3/TURTLE PARSING PATH ---
            return new Promise((resolve, reject) => {
                const parser = new N3.Parser({ baseIRI: baseUri });
                parser.parse(content, (error, quad) => {
                    if (error) {
                        console.error(`[OntologyManager] N3.js Parse Error for ${baseUri}:`);
                        console.error("Full N3.js error object:", error);

                        let detailedMessage = `Parse error: ${error.message}`;
                        const context = error.context || (error.detail && error.detail.context);
                        if (context && context.line) {
                            detailedMessage += ` (at line ${context.line}, col ${context.col})`;
                        }
                        return reject(new Error(detailedMessage));
                    }
                    if (quad) {
                        store.addQuad(quad);
                    } else {
                        const info = this.extractOntologyInfo(store, baseUri);
                        resolve({ ...info, store: store });
                    }
                });
            });
        }
    }

    /**
     * Converts an rdflib.js term object to a standard N3.js (RDF-JS) term object.
     * This is needed to handle rdflib.js's non-standard 'Collection' termType.
     */
    normalizeRdfLibTerm(term) {
        if (!term) return N3.DataFactory.defaultGraph();

        switch (term.termType) {
            case 'NamedNode':
                return N3.DataFactory.namedNode(term.value);
            case 'BlankNode':
                return N3.DataFactory.blankNode(term.value);
            case 'Literal':
                if (term.language) {
                    return N3.DataFactory.literal(term.value, term.language);
                }
                if (term.datatype && term.datatype.value) {
                    return N3.DataFactory.literal(term.value, N3.DataFactory.namedNode(term.datatype.value));
                }
                return N3.DataFactory.literal(term.value);
            case 'Collection':
                return N3.DataFactory.blankNode(term.value);
            case 'DefaultGraph':
                return N3.DataFactory.defaultGraph();
            default:
                console.warn(`[OntologyManager] Unknown rdflib.js termType: ${term.termType}`, term);
                if (term.value) {
                    return N3.DataFactory.blankNode(term.value);
                }
                return null;
        }
    }

    extractOntologyInfo(store, url) {
        const entities = [];
        const classes = new Set();
        const properties = new Set();
        const individuals = new Set();
        let ontologyUri = null;
        let ontologyTitle = this.extractLocalName(url, true);

        const CLASS_TYPES = ['http://www.w3.org/2000/01/rdf-schema#Class', 'http://www.w3.org/2002/07/owl#Class'];
        const PROP_TYPES = ['http://www.w3.org/1999/02/22-rdf-syntax-ns#Property', 'http://www.w3.org/2002/07/owl#ObjectProperty', 'http://www.w3.org/2002/07/owl#DatatypeProperty', 'http://www.w3.org/2002/07/owl#AnnotationProperty'];
        const IND_TYPES = ['http://www.w3.org/2002/07/owl#NamedIndividual'];
        const ONT_TYPE = 'http://www.w3.org/2002/07/owl#Ontology';

        for (const quad of store.getQuads(null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', null, null)) {
            const subjectUri = quad.subject.value;
            const typeUri = quad.object.value;

            if (CLASS_TYPES.includes(typeUri)) classes.add(subjectUri);
            else if (PROP_TYPES.includes(typeUri)) properties.add(subjectUri);
            else if (IND_TYPES.includes(typeUri)) individuals.add(subjectUri);
            else if (typeUri === ONT_TYPE) {
                ontologyUri = subjectUri;
                const titleQuad = store.getQuads(quad.subject, 'http://purl.org/dc/terms/title', null, null)[0]
                    || store.getQuads(quad.subject, 'http://www.w3.org/2000/01/rdf-schema#label', null, null)[0];
                if (titleQuad && titleQuad.object.termType === 'Literal') {
                    ontologyTitle = titleQuad.object.value;
                }
            }
        }

        // Also add any subject or object that isn't a literal, as they might be defined implicitly
        store.forEach(quad => {
            if (quad.subject.termType === 'NamedNode') individuals.add(quad.subject.value);
            if (quad.object.termType === 'NamedNode') individuals.add(quad.object.value);
        }, null, null, null, null);


        [...classes].forEach(uri => entities.push(this.createEntity(store, uri, 'Class')));
        [...properties].forEach(uri => entities.push(this.createEntity(store, uri, 'Property')));

        // Add individuals, but filter out any that are already classes or properties
        [...individuals].forEach(uri => {
            if (uri !== ontologyUri && !classes.has(uri) && !properties.has(uri)) {
                entities.push(this.createEntity(store, uri, 'Individual'));
            }
        });

        // Manually add the ontology entity so it can be browsed
        if (ontologyUri) {
            entities.push(this.createEntity(store, ontologyUri, 'Ontology'));
        }

        return {
            uri: url,
            ontologyUri: ontologyUri,
            title: ontologyTitle,
            entities: entities,
            stats: { classes: classes.size, properties: properties.size, individuals: individuals.size - classes.size - properties.size - (ontologyUri ? 1 : 0), total: entities.length }
        };
    }

    createEntity(store, uri, type) {
        let label = this.extractLocalName(uri);
        const labelQuad = store.getQuads(N3.DataFactory.namedNode(uri), N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'), null, null)[0];
        if (labelQuad && labelQuad.object.termType === 'Literal') {
            label = labelQuad.object.value;
        }

        return { uri, label, type };
    }

    extractLocalName(uri, isFile = false) {
        try {
            if (uri.includes('#')) {
                return uri.substring(uri.lastIndexOf('#') + 1);
            }
            if (uri.includes('/')) {
                const lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
                if (isFile && lastSegment.includes('.')) {
                    return lastSegment.substring(0, lastSegment.lastIndexOf('.'));
                }
                return lastSegment || uri;
            }
        } catch {
            return uri;
        }
        return uri;
    }

    updateProgress(percent) {
        document.getElementById('progressBar').style.width = `${percent}%`;
    }

    // --- 3. UI Rendering & Display Logic ---
    updateOntologyTree() {
        const tree = document.getElementById('ontologyTree');
        if (this.ontologies.size === 0) {
            tree.innerHTML = '<div class="canvas-placeholder">No ontologies loaded.</div>';
            return;
        }

        tree.innerHTML = '';

        // Use explicit MODULE_ORDER for deterministic, meaningful ordering
        const orderedUrls = [];
        MODULE_ORDER.forEach(key => {
            const url = this.moduleUrlMap[key];
            if (url && this.ontologies.has(url)) {
                orderedUrls.push(url);
            }
        });
        // Append any loaded ontologies not in MODULE_ORDER (external loads)
        this.ontologies.forEach((_, url) => {
            if (!orderedUrls.includes(url)) {
                orderedUrls.push(url);
            }
        });

        orderedUrls.forEach(url => {
            const ontology = this.ontologies.get(url);
            const ontologyItem = this.createOntologyItem(ontology, url);
            tree.appendChild(ontologyItem);
        });

        this.filterEntities();
        this.updateEntityCountBadge();
        // Populate welcome panel with live data
        this.populateWelcomePanel();
        // Resolve URL params after entities are indexed (once)
        if (!this._urlResolved) {
            this._urlResolved = true;
            this.resolveUrlParams();
        }
    }

    createOntologyItem(ontology, url) {
        const item = document.createElement('div');
        item.className = 'ontology-item';
        // Tag with module key for filtering
        const moduleKey = this.extractModuleKey(url);
        item.dataset.moduleKey = moduleKey;

        const moduleColor = MODULE_COLORS[moduleKey] || '#6b7280';
        const moduleLabel = MODULE_LABELS[moduleKey] || moduleKey;
        const moduleDesc = MODULE_DESCRIPTIONS[moduleKey] || '';

        const header = document.createElement('div');
        header.className = 'ontology-header';
        header.style.borderLeft = `4px solid ${moduleColor}`;
        header.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <strong>${moduleLabel}</strong>
                ${moduleDesc ? `<div class="ontology-header-desc">${moduleDesc}</div>` : ''}
            </div>
            <div class="ontology-stats">
                <span>C: ${ontology.stats.classes}</span>
                <span>P: ${ontology.stats.properties}</span>
                <span>I: ${ontology.stats.individuals}</span>
            </div>
        `;

        const entityList = document.createElement('div');
        entityList.className = 'entity-list';

        if (ontology.entities.length > 0) {
            // Group entities by type for structured display
            const typeOrder = ['Class', 'Property', 'Individual', 'Ontology'];
            const typeColors = {
                'Class': '#1e40af',
                'Property': '#166534',
                'Individual': '#92400e',
                'Ontology': '#6B21A8',
            };
            const grouped = {};
            ontology.entities.forEach(e => {
                const t = e.type || 'Other';
                if (!grouped[t]) grouped[t] = [];
                grouped[t].push(e);
            });

            typeOrder.forEach(type => {
                const entities = grouped[type];
                if (!entities || entities.length === 0) return;

                // Type group header
                const groupHeader = document.createElement('div');
                groupHeader.className = 'entity-type-group-header';
                groupHeader.innerHTML = `
                    ${type === 'Class' ? 'Classes' : type === 'Property' ? 'Properties' : type === 'Individual' ? 'Individuals' : type === 'Ontology' ? 'Ontologies' : type}
                    <span class="entity-type-group-count" style="background: ${typeColors[type] || '#6b7280'}">${entities.length}</span>
                `;
                entityList.appendChild(groupHeader);

                // Sort entities alphabetically within each type group
                entities.sort((a, b) => a.label.localeCompare(b.label))
                    .forEach(entity => {
                        const entityItem = document.createElement('button');
                        entityItem.className = 'entity-item';
                        entityItem.title = entity.uri;
                        entityItem.dataset.ontologyUri = ontology.uri;
                        entityItem.dataset.ontologyTitle = ontology.title;
                        entityItem.dataset.ontologyEntityUri = ontology.ontologyUri;
                        entityItem.dataset.entityUri = entity.uri;
                        entityItem.dataset.entityType = entity.type;

                        entityItem.innerHTML = `
                            <span class="entity-label">${entity.label}</span>
                            <span class="entity-type ${entity.type}">${entity.type}</span>
                        `;

                        entityItem.addEventListener('click', () => {
                            this.showEntityDetails(
                                entity.uri,
                                entity.label,
                                entity.type,
                                ontology.ontologyUri || ontology.uri,
                                ontology.title
                            );
                        });

                        entityList.appendChild(entityItem);
                    });
            });
        } else {
            entityList.innerHTML = `<div class="canvas-placeholder" style="font-size: 12px; padding: 10px;">No entities found.</div>`;
        }

        // Expand ALL sections by default for full navigation visibility
        entityList.classList.add('expanded');

        header.addEventListener('click', () => {
            entityList.classList.toggle('expanded');
        });

        item.appendChild(header);
        item.appendChild(entityList);
        return item;
    }

    filterEntities() {
        const query = document.getElementById('searchInput').value.toLowerCase();

        document.querySelectorAll('.ontology-item').forEach(ontologyItem => {
            // Check module toggle visibility
            const moduleKey = ontologyItem.dataset.moduleKey;
            const moduleVisible = moduleKey ? (this.moduleEnabled[moduleKey] !== false) : true;

            if (!moduleVisible) {
                ontologyItem.style.display = 'none';
                return;
            }

            let visibleEntities = 0;
            ontologyItem.querySelectorAll('.entity-item').forEach(entityItem => {
                const label = entityItem.querySelector('.entity-label').textContent.toLowerCase();
                const uri = entityItem.title.toLowerCase();
                const type = entityItem.querySelector('.entity-type').textContent;

                const matchesSearch = !query || label.includes(query) || uri.includes(query);
                const matchesFilter = this.currentFilter === 'all' || type.toLowerCase() === this.currentFilter;

                const isVisible = matchesSearch && matchesFilter;
                entityItem.style.display = isVisible ? 'flex' : 'none';
                if (isVisible) visibleEntities++;
            });

            const headerStrong = ontologyItem.querySelector('.ontology-header strong');
            const headerUri = ontologyItem.querySelector('.ontology-header-uri');

            const matchesHeader = !query ||
                (headerStrong && headerStrong.textContent.toLowerCase().includes(query)) ||
                (headerUri && headerUri.title.toLowerCase().includes(query));

            ontologyItem.style.display = (visibleEntities > 0 || matchesHeader) ? 'block' : 'none';
        });

        this.updateEntityCountBadge();
    }

    // --- 4. Main Content Panel Logic ---

    showEntityDetails(entityUri, entityLabel, entityType, ontologyUri, ontologyTitle) {
        const welcomePanel = document.getElementById('welcomePanel');
        const infoPanel = document.getElementById('infoPanel');

        // Hide welcome panel, show info
        if (welcomePanel) welcomePanel.style.display = 'none';
        infoPanel.style.display = 'block';

        // --- 1. Render Breadcrumbs ---
        const breadcrumbs = document.getElementById('breadcrumbs');
        breadcrumbs.innerHTML = `
            <a href="#" class="breadcrumb-item" data-uri="${ontologyUri}" data-label="${ontologyTitle}" data-type="Ontology">${ontologyTitle}</a>
            <span class="breadcrumb-separator">/</span>
            <span>${entityType}</span>
        `;

        breadcrumbs.querySelector('.breadcrumb-item').addEventListener('click', (e) => {
            e.preventDefault();
            const ontType = this.findEntityType(ontologyUri) || 'Ontology';
            this.showEntityDetails(ontologyUri, ontologyTitle, ontType, ontologyUri, ontologyTitle);
        });

        // --- 2. Render Header ---
        document.getElementById('infoLabel').textContent = entityLabel;
        document.getElementById('infoUri').textContent = entityUri;

        // --- 3. Render Detail Sections ---
        const namedNode = N3.DataFactory.namedNode(entityUri);

        const outgoingQuads = this.globalStore.getQuads(namedNode, null, null, null);
        const incomingQuads = this.globalStore.getQuads(null, null, namedNode, null);

        this.renderDetailSection(outgoingQuads);
        this.renderRelationshipSection(document.getElementById('outgoingContent'), outgoingQuads);
        this.renderRelationshipSection(document.getElementById('incomingContent'), incomingQuads, true);
    }

    /**
     * Renders the "Details" section (for literals)
     */
    renderDetailSection(quads) {
        const content = document.getElementById('detailsContent');
        const literalQuads = quads.filter(q => q.object.termType === 'Literal');

        if (literalQuads.length === 0) {
            content.innerHTML = '<div style="color: #6b7280; font-size: 0.875rem; padding: 0.5rem;">No literal properties found.</div>';
            return;
        }

        // Group quads by predicate
        const quadsByPredicate = {};
        literalQuads.forEach(q => {
            const predUri = q.predicate.value;
            if (!quadsByPredicate[predUri]) {
                quadsByPredicate[predUri] = [];
            }
            quadsByPredicate[predUri].push(q);
        });

        let html = '';

        // Define predicates that should always be full-width prose
        const prosePredicates = [
            'http://www.w3.org/2000/01/rdf-schema#comment',
            'http://www.w3.org/2004/02/skos/core#definition',
            'http://www.w3.org/2004/02/skos/core#editorialNote',
            'http://www.w3.org/2004/02/skos/core#historyNote',
            'http://www.w3.org/2004/02/skos/core#changeNote',
            'http://purl.org/dc/terms/description',
            'http://www.w3.org/ns/prov#editorialNote',
        ];

        const sortedPredicates = Object.keys(quadsByPredicate).sort();

        sortedPredicates.forEach(predUri => {
            const predShort = this.shortenUri(predUri);
            const associatedQuads = quadsByPredicate[predUri];

            const isProse = prosePredicates.includes(predUri) ||
                associatedQuads.some(q => q.object.value.length > 80);

            if (isProse) {
                html += `
                    <div class="prose-row">
                        <span class="predicate">${this.renderClickablePredicate(predShort, predUri)}</span>
                        <div class="object-literal-group">
                `;
                associatedQuads.forEach(q => {
                    html += `
                        <span class="object-literal-item">
                            ${this.escapeHTML(q.object.value)}
                            ${this.renderLiteralLanguage(q.object)}
                        </span>`;
                });
                html += `</div></div>`;

            } else {
                html += `
                    <div class="detail-row">
                        <span class="predicate">${this.renderClickablePredicate(predShort, predUri)}</span>
                        <div class="object-literal-group">
                `;
                associatedQuads.forEach(q => {
                    html += `
                        <span class="object-literal-item">
                            ${this.escapeHTML(q.object.value)}
                            ${this.renderLiteralLanguage(q.object)}
                        </span>`;
                });
                html += `</div></div>`;
            }
        });

        content.innerHTML = html;
    }

    renderLiteralLanguage(literal) {
        if (literal.language) {
            return `<span class="object-literal-lang">@${literal.language}</span>`;
        }
        if (literal.datatype) {
            const shortType = this.shortenUri(literal.datatype.value);
            if (shortType !== 'xsd:string' && shortType !== 'rdf:langString') {
                return `<span class="object-literal-lang" title="${literal.datatype.value}">^^${shortType}</span>`;
            }
        }
        return '';
    }

    /**
     * Renders "Outgoing" and "Incoming" sections (for links)
     */
    renderRelationshipSection(container, quads, isIncoming = false) {
        const linkedQuads = quads.filter(q => {
            const node = isIncoming ? q.subject : q.object;
            return node.termType === 'NamedNode';
        });

        if (linkedQuads.length === 0) {
            container.innerHTML = `<div style="color: #6b7280; font-size: 0.875rem; padding: 0.5rem;">No ${isIncoming ? 'incoming' : 'outgoing'} relationships found.</div>`;
            return;
        }

        let html = '';
        linkedQuads
            .sort((a, b) => {
                const predA = a.predicate.value;
                const predB = b.predicate.value;
                if (predA !== predB) return predA.localeCompare(predB);

                const objA = isIncoming ? a.subject.value : a.object.value;
                const objB = isIncoming ? b.subject.value : b.object.value;
                return objA.localeCompare(objB);
            })
            .forEach(q => {
                const predUri = q.predicate.value;
                const predShort = this.shortenUri(predUri);

                const otherNode = isIncoming ? q.subject : q.object;
                const otherUri = otherNode.value;
                const otherLabel = this.findLabel(otherUri) || this.shortenUri(otherUri);
                const otherType = this.findEntityType(otherUri);

                html += `
                    <div class="triple-row">
                        <span class="predicate">
                            ${this.renderClickablePredicate(predShort, predUri)}
                        </span>
                        <div>
                            ${this.renderClickableEntity(otherLabel, otherUri, otherType)}
                            <span class="object-link-uri">
                                ${this.escapeHTML(otherUri)}
                                ${this.renderLoadButton(otherUri)}
                            </span>
                        </div>
                    </div>
                `;
            });
        container.innerHTML = html;
    }

    /**
     * Helper to render a predicate as a clickable link
     */
    renderClickablePredicate(label, uri) {
        const type = this.findEntityType(uri) || 'Property';
        return `<a href="#"
                   class="object-link predicate"
                   title="${uri}"
                   onclick="event.preventDefault(); window.ontologyManager.showEntityDetailsByUri('${uri}', '${type}')">
                   ${this.escapeHTML(label)}
                </a>`;
    }

    /**
     * Helper to render an entity as a clickable link
     */
    renderClickableEntity(label, uri, type) {
        type = type || this.findEntityType(uri) || 'Resource';
        return `<a href="#"
                   class="object-link"
                   title="${uri}"
                   onclick="event.preventDefault(); window.ontologyManager.showEntityDetailsByUri('${uri}', '${type}')">
                   ${this.escapeHTML(label)}
                </a>`;
    }

    /**
     * Helper to show details just from a URI. Finds label/type automatically.
     */
    showEntityDetailsByUri(uri, defaultType = 'Resource') {
        const label = this.findLabel(uri) || this.extractLocalName(uri);
        const type = this.findEntityType(uri) || defaultType;

        // Find the ontology this URI belongs to for breadcrumbs
        let ontUri = '';
        let ontTitle = '';
        for (const [key, ont] of this.ontologies.entries()) {
            if (ont.entities.some(e => e.uri === uri)) {
                ontUri = ont.ontologyUri || ont.uri;
                ontTitle = ont.title;
                break;
            }
        }

        // If not found, fall back to a generic "External"
        if (!ontUri) {
            ontUri = '#';
            ontTitle = 'External Resource';
        }

        this.showEntityDetails(uri, label, type, ontUri, ontTitle);
    }

    /**
     * Renders a "Load" button for external ontology URIs
     */
    renderLoadButton(uri) {
        const fileExtensions = ['.ttl', '.owl', '.rdf', '.n3', '.nt'];
        const isOntologyLink = fileExtensions.some(ext => uri.endsWith(ext)) ||
            uri.includes('owl#') ||
            uri.includes('rdf-schema#') ||
            uri.includes('/ns/prov#');

        const specialPreds = [
            'http://www.w3.org/2002/07/owl#imports',
            'http://www.w3.org/2000/01/rdf-schema#seeAlso',
            'http://www.w3.org/2002/07/owl#priorVersion'
        ];

        const currentEntityUri = document.getElementById('infoUri').textContent;
        const isSpecialLink = this.globalStore.has(
            N3.DataFactory.namedNode(currentEntityUri),
            specialPreds.map(p => N3.DataFactory.namedNode(p)),
            N3.DataFactory.namedNode(uri),
            null
        );

        if (isOntologyLink || isSpecialLink) {
            const alreadyLoaded = this.ontologies.has(uri);
            const failed = this.failedUrls.has(uri);

            let text = 'Load';
            let disabled = '';
            if (alreadyLoaded) {
                text = 'Loaded';
                disabled = 'disabled';
            } else if (failed) {
                text = 'Failed';
                disabled = 'disabled';
            }

            return `<button class="load-external-btn" ${disabled} onclick="window.ontologyManager.loadExternalOntology('${uri}', this)">
                        ${text}
                    </button>`;
        }
        return '';
    }

    loadExternalOntology(uri, button) {
        const textarea = document.getElementById('ontologyUrls');
        if (!textarea.value.includes(uri)) {
            textarea.value += `\n${uri}`;
        }
        if (button) {
            button.textContent = 'Queued';
            button.disabled = true;
        }
        // Trigger the load
        document.getElementById('loadOntologies').click();
    }

    // --- 5. Data Helper Functions ---

    /**
     * Finds the best rdfs:label for a given URI from the global store
     */
    findLabel(uri) {
        const quads = this.globalStore.getQuads(N3.DataFactory.namedNode(uri), N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'), null, null);
        if (quads.length > 0 && quads[0].object.termType === 'Literal') {
            return quads[0].object.value;
        }
        return null;
    }

    /**
     * Finds the entity type (Class, Property, etc.) for a given URI
     */
    findEntityType(uri) {
        const node = N3.DataFactory.namedNode(uri);
        if (this.globalStore.has(node, N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), N3.DataFactory.namedNode('http://www.w3.org/2002/07/owl#Ontology'), null)) return 'Ontology';
        if (this.globalStore.has(node, N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), N3.DataFactory.namedNode('http://www.w3.org/2002/07/owl#Class'), null)) return 'Class';
        if (this.globalStore.has(node, N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), N3.DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#Class'), null)) return 'Class';

        if (this.globalStore.has(node, N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property'), null)) return 'Property';
        if (this.globalStore.has(node, N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), N3.DataFactory.namedNode('http://www.w3.org/2002/07/owl#ObjectProperty'), null)) return 'Property';
        if (this.globalStore.has(node, N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), N3.DataFactory.namedNode('http://www.w3.org/2002/07/owl#DatatypeProperty'), null)) return 'Property';
        if (this.globalStore.has(node, N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), N3.DataFactory.namedNode('http://www.w3.org/2002/07/owl#AnnotationProperty'), null)) return 'Property';

        if (this.globalStore.has(node, N3.DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), N3.DataFactory.namedNode('http://www.w3.org/2002/07/owl#NamedIndividual'), null)) return 'Individual';

        // Fallback: If it's used as a predicate, it's a Property
        if (this.globalStore.has(null, node, null, null)) return 'Property';

        return null;
    }

    /**
     * Shortens a URI using the prefix map
     */
    shortenUri(uri) {
        for (const [prefix, namespace] of Object.entries(this.prefixes)) {
            if (uri.startsWith(namespace)) {
                return `${prefix}:${uri.substring(namespace.length)}`;
            }
        }
        return this.extractLocalName(uri);
    }

    /**
     * Escapes HTML to prevent XSS
     */
    escapeHTML(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }


    // --- 6. Welcome Panel ---

    populateWelcomePanel() {
        // Aggregate stats across all loaded ontologies
        let totalClasses = 0, totalProperties = 0, totalIndividuals = 0, totalEntities = 0;
        this.ontologies.forEach(ont => {
            totalClasses += ont.stats.classes;
            totalProperties += ont.stats.properties;
            totalIndividuals += ont.stats.individuals;
            totalEntities += ont.stats.total;
        });

        const setTextIfExists = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };
        setTextIfExists('statClasses', totalClasses);
        setTextIfExists('statProperties', totalProperties);
        setTextIfExists('statIndividuals', totalIndividuals);
        setTextIfExists('statTotal', totalEntities);

        // Module overview cards
        const modulesContainer = document.getElementById('welcomeModules');
        if (modulesContainer) {
            modulesContainer.innerHTML = '';
            MODULE_ORDER.forEach(key => {
                const url = this.moduleUrlMap[key];
                const ont = url ? this.ontologies.get(url) : null;
                const color = MODULE_COLORS[key] || '#6b7280';
                const label = MODULE_LABELS[key] || key;
                const desc = MODULE_DESCRIPTIONS[key] || '';
                const count = ont ? ont.stats.total : 0;

                const card = document.createElement('div');
                card.className = 'welcome-module-card';
                card.style.borderLeftColor = color;
                card.innerHTML = `
                    <div class="welcome-module-header">
                        <span class="welcome-module-name">${label}</span>
                        <span class="welcome-module-count" style="background: ${color}">${count}</span>
                    </div>
                    <p class="welcome-module-desc">${desc}</p>
                `;
                // Click to scroll to module in sidebar
                card.addEventListener('click', () => {
                    const sidebarItem = document.querySelector(`.ontology-item[data-module-key="${key}"]`);
                    if (sidebarItem) {
                        sidebarItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        // Flash highlight
                        sidebarItem.style.transition = 'background 0.3s';
                        sidebarItem.style.background = '#eff6ff';
                        setTimeout(() => { sidebarItem.style.background = ''; }, 1500);
                    }
                });
                modulesContainer.appendChild(card);
            });
        }

        // Featured entities
        const featuredContainer = document.getElementById('welcomeFeatured');
        if (featuredContainer) {
            featuredContainer.innerHTML = '';
            FEATURED_ENTITIES.forEach(fe => {
                // Try to find the actual entity in loaded ontologies
                let foundUri = null;
                for (const [, ont] of this.ontologies) {
                    const entity = ont.entities.find(e =>
                        e.label === fe.label || e.uri.endsWith('#' + fe.label) || e.uri.endsWith('/' + fe.label)
                    );
                    if (entity) { foundUri = entity.uri; break; }
                }

                const card = document.createElement('div');
                card.className = 'welcome-entity-card';
                card.innerHTML = `
                    <span class="welcome-entity-type-badge ${fe.type}">${fe.type}</span>
                    <div class="welcome-entity-name">${fe.label}</div>
                    <p class="welcome-entity-desc">${fe.description}</p>
                `;
                if (foundUri) {
                    card.addEventListener('click', () => {
                        this.showEntityDetailsByUri(foundUri, fe.type);
                    });
                }
                featuredContainer.appendChild(card);
            });
        }
    }

    showWelcomePanel() {
        const welcomePanel = document.getElementById('welcomePanel');
        const infoPanel = document.getElementById('infoPanel');
        if (welcomePanel) welcomePanel.style.display = 'block';
        if (infoPanel) infoPanel.style.display = 'none';
    }

    // --- 7. Event Listeners ---
    initEventListeners() {
        document.getElementById('loadOntologies').addEventListener('click', () => this.handleLoadOntologies());
        document.getElementById('searchInput').addEventListener('input', () => this.filterEntities());

        document.querySelectorAll('.entity-filter button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.currentFilter = e.target.id.replace('filter', '').toLowerCase();

                document.querySelectorAll('.entity-filter button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                this.filterEntities();
            });
        });

        // Back to welcome panel button
        const backBtn = document.getElementById('backToWelcome');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showWelcomePanel());
        }

        // Advanced loader toggle
        const advancedToggle = document.getElementById('advancedToggle');
        const advancedContent = document.getElementById('advancedContent');
        const advancedToggleIcon = document.getElementById('advancedToggleIcon');
        if (advancedToggle && advancedContent) {
            advancedToggle.addEventListener('click', () => {
                const isExpanded = advancedContent.classList.contains('expanded');
                advancedContent.classList.toggle('expanded');
                advancedToggleIcon.classList.toggle('expanded');
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ontologyManager = new OntologyManager();
});

export { OntologyManager };
