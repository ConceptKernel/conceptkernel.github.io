---
title: SPIFFE, Grants, and Security
description: SPIFFE workload identity, the grants block as ODRL implementation, SVID verification flow, and loop isolation via volume drivers.
---

# SPIFFE, Grants, and Security

::: info Amendment CKP-3.1-SPIFFE-Identity
This section extends CKP v3.0 with fine-grained, cryptographically-attested cross-kernel cooperation. Every Concept Kernel is a SPIFFE workload. Every cross-kernel action requires a valid SVID. Permissions are action-scoped, time-bounded, and audited. SPIRE handles the entire certificate lifecycle automatically.
:::

## SPIFFE Identity Assignment at Mint

Every CK receives a stable SPIFFE identity at mint time. The SPIFFE ID is derived deterministically from the kernel class and GUID. It never changes for the lifetime of the Material Entity.

```
# SPIFFE ID format -- assigned at mint, permanent
spiffe://{domain}/ck/{kernel_class}/{guid}

# Examples:
spiffe://{domain}/ck/Finance.Employee/7f3e-a1b2-c3d4-e5f6
spiffe://{domain}/ck/CK.Query/9a1b-c2d3-e4f5-g6h7
spiffe://{domain}/ck/predicates.isDependentOn/bb3c-d4e5-f6a7-b8c9
```

## Grants Block -- The ODRL Policy

The `grants` block in `conceptkernel.yaml` replaces all binary `ck:isAccessibleBy` declarations. It is the sole source of cross-CK permission truth -- and is recognised as the CKP implementation of ODRL.

| Enterprise ODRL Concept | CKP Grants Block Equivalent | Example |
|------------------------|----------------------------|---------|
| odrl:Policy | The entire `grants:` block | The kernel's complete permission declaration |
| odrl:Permission | `actions:` list for a given identity | `actions: [read-identity, invoke-tool]` |
| odrl:Prohibition | Absence from actions list = implicitly prohibited | CK not in any identity's actions -> access denied |
| odrl:Constraint | `expires:` field on a grant entry | `expires: 2026-06-01T00:00:00Z` |
| odrl:Duty | `audit: true` -- obligation to log the access | Every access written to ledger/ |
| odrl:Asset | The kernel itself -- all three volumes | Target = `ckp://Kernel#Finance.Employee:v1.0` |
| odrl:Party | SPIFFE identity string or access tier | `spiffe://{domain}/ck/CK.Query/...` |

```yaml
# conceptkernel.yaml -- grants block
grants:
  - identity:  spiffe://{domain}/ck/CK.Query/9a1b-...
    actions:   [read-storage, read-index, read-llm]
    expires:   2027-01-01T00:00:00Z
    audit:     true

  - identity:  spiffe://{domain}/ck/Finance.Payroll/cc4d-...
    actions:   [read-storage, read-index]
    expires:   2026-12-31T00:00:00Z
    audit:     true

  - identity:  spiffe://{domain}/ck/CK.AuditFinal/dd5e-...
    actions:   [read-identity, read-storage, read-ledger]
    expires:   never
    audit:     true

  - identity:  spiffe://{domain}/agent/agent-kernel
    actions:   [invoke-tool, read-identity, read-skill]
    expires:   2026-06-01T00:00:00Z
    audit:     true
```

## Seven Action Types (v3.2)

v3.2 classifies all actions into seven types that determine context assembly, output format, and instance record:

| Type | Verbs / Pattern | Context Loaded | Instance Record | BFO |
|------|----------------|----------------|-----------------|-----|
| **inspect** | status, show, list, version | Target identity only | None -- stateless | -- |
| **check** | check.*, validate, probe.* | Target + rules + schema | proof.json | BFO:0000015 |
| **mutate** | create, update, complete, assign | Target + grants + pre-state | ledger.json (before/after) | BFO:0000015 |
| **operate** | execute, render, run, spawn, chat | Full workspace | sealed instance + conversation/ | BFO:0000015 |
| **query** | fleet.*, catalog, search | Fleet-wide scan | None -- stateless | -- |
| **deploy** | deploy.*, apply, route.* | Target + manifests + cluster state | deployment record | BFO:0000015 |
| **transfer** | export.*, import.*, sync | Source + destination + mapping | transfer receipt | BFO:0000015 |

::: warning Actions Not Grantable to External Identities
No external identity may ever be granted `write-storage`, `write-tool`, or any action that mutates the CK loop. These are reserved for the kernel's own runtime and the operator CI pipeline. The sovereign boundary of the Material Entity is absolute.
:::

## SVID Verification Flow

Every cross-kernel request is authenticated by SPIRE before it reaches the target CK's volumes:

```
1. Caller CK obtains its SVID from local SPIRE agent
   GET /run/spire/sockets/agent.sock -> X.509-SVID (valid 1h)

2. Caller presents SVID in mTLS handshake to target CK's access proxy

3. Target CK access proxy verifies:
   a. SVID signature valid against SPIRE trust bundle
   b. SVID not expired
   c. Caller SPIFFE ID present in conceptkernel.yaml grants block
   d. Requested action in granted actions list for that identity
   e. Grant not expired (expires field)

4. On success: request forwarded to the kernel's storage volume
   On failure: 403 + audit entry written to storage/ledger/audit.jsonl

5. All accesses (success + failure) appended to ledger/:
   { timestamp, caller_svid, action, path, result: allow|deny }

6. SPIRE rotates caller SVID automatically before TTL expiry
```

## Grant Lifecycle

| Lifecycle Event | How It Happens | What Changes |
|----------------|---------------|--------------|
| Grant created | Operator edits grants block, commits to CK loop repo | SPIRE entry updated; new grant active on next promotion |
| Grant expires | expires field passes -- SPIRE stops issuing SVIDs for that entry | No manual action; access silently blocked |
| Grant revoked early | Operator removes grant, commits + promotes | SPIRE entry deleted; existing SVIDs expire within TTL (max 1h) |
| SVID rotation | SPIRE rotates certificate automatically before 1h TTL | Caller gets new cert transparently |
| CK decommissioned | Platform removes SPIRE entries for all three CK SVIDs | All grants to/from this CK revoked within 1h |

## Loop Isolation via Volume Drivers

| DL Box | Loop | Volume `readOnly` | Consequence |
|--------|------|-------------------|-------------|
| TBox | CK | `true` | Runtime process cannot modify identity or ontology |
| RBox | TOOL | `true` | Runtime process cannot modify its own code |
| ABox | DATA | `false` | Runtime process writes instances, proofs, ledger |

::: warning
Volume driver `readOnly` makes the Separation Axiom physically impossible to violate, not merely a convention.

> A storage write NEVER causes a CK commit. A tool execution NEVER modifies identity files. An identity change NEVER directly mutates stored instances.
:::

## SPIFFE and the Awakening Sequence

The awakening sequence gains a new step between reading `CHANGELOG.md` and reading `ontology.yaml`:

| Order | File / Action | Question Answered |
|-------|--------------|-------------------|
| 1 | conceptkernel.yaml | I am -- class, GUID, BFO:0000040 |
| 2 | README.md | I exist because -- purpose and goals |
| 3 | CLAUDE.md | I behave like this -- rules, agreements, folder map |
| 4 | SKILL.md | I can do these things -- reusable capabilities |
| 5 | CHANGELOG.md | I have already become -- completed evolution |
| 5a | **SPIRE agent** | I am cryptographically who I claim -- SVID obtained and verified |
| 6 | ontology.yaml | My world has this shape -- TBox schema |
| 7 | rules.shacl | I am constrained by -- validation rules |

## NATS Topic Authentication

NATS connections from CKs require a SPIFFE JWT-SVID as the connection credential:

```python
# NATS connection authenticated by SPIFFE JWT-SVID
spiffe_jwt = spire_agent.fetch_jwt_svid(audience='nats.{domain}')

nats.connect('nats://nats.{domain}:4222',
             user=f'spiffe://{domain}/ck/{class}/{guid}',
             password=spiffe_jwt)

# Subject-level ACLs derived from grants block:
#   publish:   ck.{own-guid}.*           (always allowed)
#   subscribe: ck.{other-guid}.*          (only if grant exists)
```

## SPIFFE Infrastructure Requirements

| Component | Role | Deployment |
|-----------|------|------------|
| SPIRE Server | Issues SVIDs; maintains registration entries; rotates certs | Single workload with HA via leader election |
| SPIRE Agent | Runs on every node; provides SVID to local workloads via socket | Per-node agent |
| CK Access Proxy | Intercepts inbound cross-CK requests; verifies SVID + grants | Sidecar process in every CK workload |
| NATS SPIFFE Plugin | Validates JWT-SVIDs on NATS connections; enforces topic ACLs | NATS server configuration |
| Distributed Filesystem mTLS | Requires client cert (SVID) on all filer connections | Filesystem TLS config |
| Identity Provider SPIFFE bridge | Links OIDC identity (human) to SVID (workload) in audit chain | Identity provider custom mapper |
