---
title: Authentication -- AuthConfig Ontology and Keycloak Integration
description: How CKP v3.6 provisions OIDC identity as infrastructure through the AuthConfig ontology class, deploy.auth reconciliation step, and Keycloak realm management.
---

# Authentication

## Why Authentication Needed an Ontology Class

v3.5 kernels had no concept of user identity. Every NATS message was anonymous. The web shell (when it arrived) had no way to distinguish users or restrict actions. This created a fundamental gap: the `access: auth` field on actions had no enforcement mechanism.

The v3.6 answer is not to bolt on auth as middleware. It is to make authentication a **first-class ontological concept** -- declared in the same `ontology.yaml` that declares kernel types, actions, and edges. If auth is not in the ontology, it does not exist in the cluster.

## AuthConfig Schema

Every CK.Project instance MAY declare an `auth` block in its project declaration. If omitted, the project operates in anonymous-only mode -- all actions with `access: auth` are unreachable.

```yaml
auth:
  provider: keycloak       # keycloak | none
  instance: keycloak-name  # Keycloak CR on cluster
  realm: realm-name        # Keycloak realm
  client_id: ck-web        # OIDC public client
  issuer_url: https://id.example.com/realms/realm-name
  create_realm: false      # true = operator creates realm
  redirect_uris: []        # required if create_realm
  web_origins: []          # required if create_realm
```

The schema is deliberately minimal. CKP is not an auth framework -- it delegates to Keycloak for the actual OIDC machinery. What CKP controls is the **declaration** (what auth exists) and the **provisioning** (how auth reaches the cluster).

### Two Modes

The `create_realm` flag governs whether the operator is a consumer or creator of Keycloak infrastructure:

**Mode 1: Reuse existing realm** (default, `create_realm: false`)

The project attaches to a Keycloak realm that already exists. The operator verifies the OIDC endpoint, injects the issuer URL into deployments, and moves on. Zero Keycloak write permissions required.

This works when the existing realm has a wildcard redirect URI (e.g., `https://*.tech.games/*`) that covers the new project's hostname. The reference deployment uses this: `delvinator.tech.games` reuses the `techgames` realm.

**Mode 2: Create own realm** (`create_realm: true`)

The operator generates a `KeycloakRealmImport` CR and applies it to the cluster. The Keycloak operator provisions the realm, client, and cryptographic key provider. The new realm is specific to this project.

The reference deployment demonstrates this: `hello.tech.games` creates its own `hello` realm because it runs in a different namespace and needs its own redirect URIs.

### Why Two Modes?

The reuse/create split reflects a real operational trade-off:

| Concern | Reuse | Create |
|---------|-------|--------|
| Keycloak write permissions | None needed | `keycloakrealmimports: get, list, create` |
| Shared user base | Yes -- same realm means same users | No -- separate realm, separate users |
| Operator simplicity | Just verify endpoint | Generate CR, wait for provisioning |
| Teardown | Nothing to clean up | Realm retained (identity outlives compute) |

The operator MUST NOT modify or delete existing realms. It can birth realms but never destroy them. This is a deliberate asymmetry: identity is more permanent than compute.

## deploy.auth -- The Reconciliation Step

`deploy.auth` is a step in the CK.Operator reconciliation lifecycle. It executes between `deploy.routing` and `deploy.endpoint`:

```
deploy.namespace    -- create/verify project namespace
deploy.storage.ck   -- create CK loop PV (ReadOnlyMany)
deploy.storage.data -- create DATA loop PV (ReadWriteMany)
deploy.processors   -- create Deployments, Services
deploy.web          -- create web server Deployment
deploy.routing      -- create HTTPRoute
deploy.auth         -- provision auth (THIS STEP)
deploy.endpoint     -- verify external endpoint HTTP 200
```

### Step Logic

1. Read `auth` block from project declaration
2. If `provider: none` or auth block missing -- skip, no verification
3. If `create_realm: true`:
   a. Generate `KeycloakRealmImport` CR with EdDSA key provider, audience mapper, public client
   b. Apply to Keycloak operator namespace (skip if already exists)
   c. Wait for realm readiness
4. Inject environment variables into processor Deployment:
   - `KEYCLOAK_ISSUER={issuer_url}`
   - `KEYCLOAK_CLIENT_ID={client_id}`
5. Inject auth config into web ConfigMap so `ck-client.js` knows the OIDC endpoint
6. Run verification checks

### KeycloakRealmImport Generation

When `create_realm: true`, the operator generates a full Keycloak realm import:

```yaml
apiVersion: k8s.keycloak.org/v2alpha1
kind: KeycloakRealmImport
metadata:
  name: {subdomain}-realm
  namespace: keycloak-operator
  labels:
    conceptkernel.org/project: {hostname}
spec:
  keycloakCRName: {instance}
  realm:
    realm: {realm}
    displayName: "{subdomain} (CKP)"
    enabled: true
    clients:
      - clientId: {client_id}
        publicClient: true
        standardFlowEnabled: true
        directAccessGrantsEnabled: true
        redirectUris: {redirect_uris}
        webOrigins: {web_origins}
        defaultClientScopes: [openid, profile, email]
        protocolMappers:
          - name: audience
            protocol: openid-connect
            protocolMapper: oidc-audience-mapper
            config:
              access.token.claim: "true"
              id.token.claim: "true"
              included.client.audience: {client_id}
    components:
      org.keycloak.keys.KeyProvider:
        - name: eddsa-key-provider
          providerId: eddsa-generated
          config:
            active: ["true"]
            algorithm: ["EdDSA"]
            enabled: ["true"]
            priority: ["200"]
```

Key design decisions:
- **Public client** (`publicClient: true`) -- no client secret needed. The web shell is a browser SPA; it cannot keep secrets.
- **Direct access grants** -- enables the password grant flow that `ck-client.js` uses from the browser.
- **EdDSA key provider** -- Ed25519 signatures. Faster and shorter than RSA. Priority 200 overrides the default RSA provider.
- **Audience mapper** -- ensures the JWT `aud` claim contains the client ID, which processors validate.

## Verification

Auth verification adds two checks to the proof chain:

| Check | Method | Expected |
|-------|--------|----------|
| `oidc_discovery` | `curl {issuer_url}/.well-known/openid-configuration` | HTTP 200 |
| `jwks_reachable` | `curl {issuer_url}/protocol/openid-connect/certs` | HTTP 200 + keys present |

These two checks bring the total from 13 (v3.5.2) to 15 (v3.5.5+). Both checks must pass before the deploy is marked ready.

::: warning Verification Order Matters
`oidc_discovery` runs before `jwks_reachable`. If OIDC discovery fails, the JWKS check is skipped -- there is no point validating keys if the issuer endpoint is unreachable. This is the same halt-on-failure principle used throughout the proof chain.
:::

## Teardown Semantics

Auth resources follow a clear lifecycle rule: **identity outlives compute**.

| Resource | On Teardown | Why |
|----------|-------------|-----|
| KeycloakRealmImport | **Retained** | User accounts survive project deletion |
| Keycloak instance | **Untouched** | Shared across projects |
| PVs | **Retained** | Data preservation |
| Namespace | **Retained** | Anchors PVCs and realm |
| Deployments, Services, HTTPRoute | **Deleted** | Compute is ephemeral |
| ConceptKernel CRs | **Deleted** | Logical representation of running kernels |

All operator-created resources carry a `conceptkernel.org/project` label, enabling cross-namespace inventory:

```bash
kubectl get pv,keycloakrealmimport -A -l conceptkernel.org/project=hello.tech.games
```

## RBAC

CK.Operator requires additional RBAC for create_realm mode:

```yaml
- apiGroups: [k8s.keycloak.org]
  resources: [keycloakrealmimports]
  verbs: [get, list, create]
```

Note the deliberate absence of `patch`, `update`, and `delete`. The operator can birth realms but MUST NOT modify or destroy existing ones. This is enforced at the Kubernetes RBAC level -- not by convention.

## Multi-Project Auth: The Hello.Greeter Test

v3.5.7 deployed `Hello.Greeter` to `hello.tech.games` as a proof that auth works across multiple projects with different realm strategies:

| Project | Hostname | Realm | Mode | Namespace |
|---------|----------|-------|------|-----------|
| Delvinator | delvinator.tech.games | techgames | Reuse | ck-delvinator |
| Hello | hello.tech.games | hello | Create | ck-hello |

Both projects:
- Pass 15/15 verification checks (including auth)
- Show working login in the web shell
- Have independent namespace isolation

The `hello` realm was created by the operator via `KeycloakRealmImport`. The `techgames` realm was pre-existing. Both produce valid JWTs that processors can verify.

## Architectural Consistency Check

::: details Logical Analysis: Auth and the Three-Loop Model

**Question:** Does auth belong in the CK loop, the TOOL loop, or the DATA loop?

**Answer:** Auth config is declared in the CK.Project ontology -- this is **CK loop** territory (TBox). The auth provider, realm, and client ID are identity declarations, not runtime state. They change at design time, not at runtime.

However, JWTs themselves are **DATA loop** artifacts. A JWT is an instance: it has a creation time, an expiry, claims, and a signature. It is produced by Keycloak (an external process) and consumed by kernel processors. The JWT is not stored in the DATA loop (it lives in browser memory), but it follows the same pattern: a runtime artifact governed by a design-time schema.

**Question:** Why not embed auth directly in NatsKernelLoop?

**Answer:** Because not all kernels need auth. A `LOCAL.*` kernel running on a developer machine has no Keycloak. An `AUTONOMOUS` kernel with SPIFFE mTLS uses a different identity model entirely. Auth is a concern of the **project**, not the kernel. The kernel sees env vars (`KEYCLOAK_ISSUER`, `KEYCLOAK_CLIENT_ID`) injected by the operator -- it does not know how those values got there.

**Gap identified:** The current auth model covers browser-to-kernel authentication (JWT via NATS headers). It does NOT cover kernel-to-kernel authentication, which requires SPIFFE SVIDs. This is acknowledged in the v3.5 spec (Chapter 16) and deferred to a future SPIFFE integration milestone.
:::

## Conformance Requirements

- CK.Operator MUST inject auth env vars into processor and web deployments when auth is declared
- CK.Operator MUST verify OIDC discovery endpoint before marking deploy as ready
- CK.Operator MUST NOT modify existing Keycloak realms -- only create new ones
- CK.Operator MUST label all created resources with `conceptkernel.org/project`
- If `create_realm: true`, `redirect_uris` MUST contain at least one entry
- Auth config (issuer, realm, client_id) MUST be injected by the operator, not hardcoded in kernel code
