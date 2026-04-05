---
title: Authentication
description: AuthConfig and deploy.auth -- OIDC identity for CKP projects via Keycloak.
---

# Authentication

## Overview

v3.6 adds OIDC authentication to CKP projects via Keycloak. Every `CK.Project` instance MAY declare an `auth` block specifying how the project authenticates users. If omitted, the project operates in anonymous-only mode.

## AuthConfig Schema

```yaml
AuthConfig:
  description: "OIDC identity provider configuration for a CKP project"
  attributes:
    provider:
      range: AuthProviderEnum   # keycloak | none
      required: true
    instance:
      range: string             # Keycloak CR name (e.g. keycloak-techgames)
    realm:
      range: string
      required: true
    client_id:
      range: string
      required: true
    issuer_url:
      range: uri
      required: true
    create_realm:
      range: boolean            # Default: false
    redirect_uris:
      range: string
      multivalued: true
    web_origins:
      range: string
      multivalued: true
```

## Two Modes

### Mode 1: Reuse Existing Realm

The project attaches to an existing Keycloak realm. The operator injects the issuer URL and verifies the OIDC endpoint is reachable. Zero Keycloak write permissions required.

```yaml
auth:
  provider: keycloak
  instance: keycloak-techgames
  realm: techgames
  client_id: ck-web
  issuer_url: https://id.tech.games/realms/techgames
```

This works when the existing realm has a wildcard redirect URI (e.g., `https://*.tech.games/*`) that covers the new project's hostname.

### Mode 2: Create Own Realm

When `create_realm: true`, the operator generates a `KeycloakRealmImport` CR. The Keycloak operator provisions the realm, client, and key provider.

```yaml
auth:
  provider: keycloak
  instance: keycloak-techgames
  realm: hello
  client_id: ck-web
  create_realm: true
  issuer_url: https://id.tech.games/realms/hello
  redirect_uris:
    - https://hello.tech.games/*
  web_origins:
    - https://hello.tech.games
```

## deploy.auth Reconciliation Step

`deploy.auth` executes between `deploy.routing` and `deploy.endpoint` in the CK.Operator reconciliation lifecycle.

### Step Logic

1. Read `auth` block from project declaration
2. If `provider: none` or auth block missing -- skip, no verification
3. If `create_realm: true`:
   - Generate `KeycloakRealmImport` CR
   - Apply to Keycloak operator namespace (skip if already exists)
   - Wait for realm to become ready
4. Inject auth environment variables into processor Deployment:
   - `KEYCLOAK_ISSUER={issuer_url}`
   - `KEYCLOAK_CLIENT_ID={client_id}`
5. Inject auth config into web ConfigMap so the JavaScript client knows the OIDC endpoint
6. Run verification checks

### KeycloakRealmImport Generation

When `create_realm: true`, the operator generates:

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

### Verification

| Check | Method | Expected |
|-------|--------|----------|
| `oidc_discovery` | GET `{issuer_url}/.well-known/openid-configuration` | HTTP 200 |
| `jwks_reachable` | GET `{issuer_url}/protocol/openid-connect/certs` | HTTP 200 + keys present |

### RBAC

CK.Operator ClusterRole MUST include (for `create_realm` mode):

```yaml
- apiGroups: [k8s.keycloak.org]
  resources: [keycloakrealmimports]
  verbs: [get, list, create]
```

The operator can birth a realm but MUST NOT modify or delete existing ones.

## Teardown Semantics

| Resource | On Teardown | Why |
|----------|-------------|-----|
| KeycloakRealmImport | **Retained** | Identity outlives compute |
| Keycloak instance | **Untouched** | Shared across projects |
| PVs | **Retained** | Data preservation |
| Namespace | **Retained** | Anchors PVCs |
| Deployments, Services, ConfigMaps, HTTPRoute | **Deleted** | Compute is ephemeral |
| ConceptKernel CRs | **Deleted** | Logical representation of running kernels |

All operator-created resources carry `conceptkernel.org/project: {hostname}` label, enabling cross-namespace inventory:

```bash
kubectl get pv,keycloakrealmimport -A -l conceptkernel.org/project=hello.tech.games
```

## Conformance

- CK.Project instances MAY declare an `auth` block
- If `auth.provider` is `keycloak`, `realm`, `client_id`, and `issuer_url` MUST be present
- If `create_realm: true`, `redirect_uris` MUST contain at least one entry
- CK.Operator MUST inject auth env vars into processor and web deployments when auth is declared
- CK.Operator MUST verify OIDC discovery endpoint is reachable before marking deploy as ready
- CK.Operator MUST NOT modify existing Keycloak realms
- CK.Operator MUST label all created resources with `conceptkernel.org/project`
