---
title: Proof Verification and Hash Chains
description: Evidence-based proof verification — how CKP proves that materialised state matches ontological declaration through occurrent tracking, SHA-256 hash chains, and tamper detection.
---

# Proof Verification and Hash Chains

## The Proof Principle

A CKP proof is not a record that a step was executed. A proof is **evidence that the outcome matches the ontological declaration**. This distinction is fundamental: recording "I ran kubectl apply" proves nothing about whether the resource exists or is healthy. Recording "I queried the resource and observed state X, which matches expected state Y" is evidence.

Every action substep MUST define:

1. **What** the expected state is (from the ontology)
2. **How** to verify it (the proof method)
3. **What** evidence constitutes proof (the actual observed state)
4. **Whether** expected matches actual (pass/fail)

If verification fails, the action MUST NOT proceed to the next step. The instance MUST NOT be sealed. The proof record MUST include the failure evidence.

## Proof Method Declaration

Each CKP class that can be materialised MUST declare its verification method in the kernel's `ontology.yaml`:

```yaml
# ontology.yaml -- proof methods for materialised resources
classes:
  ReconciliationEvent:
    is_a: ckp:SealedInstance
    attributes:
      project: { range: string, required: true }
    proof_methods:
      namespace_exists:
        method: kubectl_query
        query: "kubectl get namespace {namespace} -o jsonpath={.status.phase}"
        expected: "Active"
      pv_access_mode:
        method: kubectl_query
        query: "kubectl get pv {pv_name} -o jsonpath={.spec.accessModes[0]}"
        expected_per_loop:
          ck: "ReadOnlyMany"
          tool: "ReadOnlyMany"
          data: "ReadWriteMany"
      deployment_ready:
        method: kubectl_query
        query: "kubectl get deployment {name} -n {namespace} -o jsonpath={.status.readyReplicas}"
        expected: "1"
      httproute_accepted:
        method: kubectl_query
        query: "kubectl get httproute {name} -n {namespace} -o jsonpath={.status.parents[0].conditions[?(@.type==\"Accepted\")].status}"
        expected: "True"
```

## Occurrent Verification Structure

Every CKP action is an Occurrent (BFO:0000015 -- a bounded process in time). Each substep within an action is also an occurrent, linked to its parent via `prov:wasStartedBy`. Each substep MUST produce evidence with the following structure:

```yaml
step_urn: "ckp://Occurrent#CK.Operator/project.deploy/deploy.storage-{ts}"
step_type: "deploy.storage"
proof:
  method: "kubectl_query"
  checks:
    - name: "ck_volume_access_mode"
      query: "kubectl get pv ck-{project}-ck -o jsonpath={.spec.accessModes[0]}"
      expected: "ReadOnlyMany"
      actual: "ReadWriteMany"            # real observed value
      passed: false                       # expected != actual
      evidence_hash: "sha256:a3f8..."     # SHA-256 of raw kubectl output
    - name: "data_volume_access_mode"
      query: "kubectl get pv ck-{project}-data -o jsonpath={.spec.accessModes[0]}"
      expected: "ReadWriteMany"
      actual: "ReadWriteMany"
      passed: true
      evidence_hash: "sha256:b7c2..."
  all_passed: false                       # step fails
  timestamp: "2026-04-05T10:00:00Z"
```

::: danger Halt on Failure
If ANY check within a step fails, the entire step fails. Subsequent steps do not execute. The instance is NOT sealed. This fail-fast approach prevents cascading failures -- catching a misconfigured volume at step 2 prevents wasting time deploying processors that will fail at step 3.
:::

## Verification During Action Lifecycle

Verification is embedded in each lifecycle phase, not bolted on afterward.

```
project.deploy lifecycle with verification:

  1. deploy.accepted
     proof: project instance exists and validates against CK.Project ontology
     method: load_schema() + validate_instance()
     fail -> reject with "invalid project declaration"

  2. deploy.storage
     proof: volumes created with correct access modes per three-loop spec
     method: kubectl get pv -> check accessModes per loop
     fail -> rollback created resources, reject

  3. deploy.processors
     proof: deployment created, pods running, readiness probe passing
     method: kubectl get deployment -> check readyReplicas > 0
     fail -> rollback, reject

  4. deploy.routing
     proof: HTTPRoute accepted by gateway controller
     method: kubectl get httproute -> check status.conditions Accepted=True
     fail -> rollback, reject

  5. deploy.ready
     proof: external endpoint returns HTTP 200
     method: curl -sI https://{hostname}/ -> check status code
     fail -> mark degraded (don't rollback -- partially working)

  Each step: if proof fails -> action stops, instance NOT sealed,
             proof record includes failure evidence
```

## Three-Loop Separation Proof

The separation axiom MUST be verified at materialisation time. CK and TOOL loops share a single ReadOnlyMany volume; the DATA loop uses a separate ReadWriteMany volume. This is not optional -- incorrect access modes break the security model.

| Loop | Volume | Required Access | Proof Method |
|------|--------|----------------|--------------|
| CK + TOOL | `{ns}-ck` | ReadOnlyMany | `kubectl get pv -o jsonpath={.spec.accessModes[0]}` |
| DATA | `{ns}-data` | ReadWriteMany | Same query, different PV |

If ANY volume has the wrong access mode, the deployment MUST fail. The proof record MUST include the actual access mode observed.

## Proof for Create, Update, and Destroy

Each lifecycle operation has distinct proof requirements.

### Create (project.deploy)

| Step | Proof | Method |
|------|-------|--------|
| Files generated | All awakening files exist | `os.path.isfile()` per file |
| Schema valid | `conceptkernel.yaml` validates against CKP schema | `cklib.schema.validate_instance()` |
| Ontology non-empty | `ontology.yaml` has non-empty classes | `cklib.schema.has_schema()` |
| Volumes correct | Access modes match three-loop spec | kubectl query |
| Deployment running | `readyReplicas >= 1` | kubectl query |
| Route accepted | HTTPRoute status `Accepted=True` | kubectl query |
| Endpoint reachable | HTTP 200 from hostname | curl |

### Update (re-deploy on existing)

| Step | Proof | Method |
|------|-------|--------|
| Diff computed | Desired vs actual state delta recorded | kubectl diff |
| Resources updated | Apply succeeded | kubectl apply return code |
| No regression | All existing probes still pass | Re-run create proofs |
| Version pinned | `serving.json` active version matches mounted ref | Compare file contents |

### Destroy (project.teardown)

| Step | Proof | Method |
|------|-------|--------|
| Compute removed | Deployments, Services, Routes deleted | kubectl get returns NotFound |
| Data preserved | PVCs still Bound, PVs still exist | kubectl get pv/pvc |
| Namespace retained | Namespace still Active | kubectl get namespace |
| No orphans | No pods running in namespace | kubectl get pods returns empty |

## Proof Record Structure

The sealed proof record for a completed action:

```yaml
proof_id: "proof-project.deploy-{ts}"
action_urn: "ckp://Action#CK.Operator/project.deploy-{ts}"
kernel_urn: "ckp://Kernel#CK.Operator:v1.0"
started_at: "2026-04-05T10:00:00Z"
ended_at: "2026-04-05T10:00:05Z"
outcome: "PASS"                # PASS only if ALL steps passed
steps: 5
chain_valid: true
final_hash: "sha256:33b0..."
evidence:
  - step: "deploy.storage"
    checks: 3
    passed: 3
    failed: 0
    evidence_hashes: ["sha256:a3f8...", "sha256:b7c2...", "sha256:c1d3..."]
  - step: "deploy.processors"
    checks: 2
    passed: 2
    failed: 0
  - step: "deploy.routing"
    checks: 1
    passed: 1
    failed: 0
  - step: "deploy.ready"
    checks: 1
    passed: 1
    failed: 0
total_checks: 7
total_passed: 7
total_failed: 0
prov:wasGeneratedBy: "ckp://Action#CK.Operator/project.deploy-{ts}"
prov:wasAttributedTo: "ckp://Kernel#CK.Operator:v1.0"
prov:generatedAtTime: "2026-04-05T10:00:05Z"
```

## Hash Chain Algorithm

At completion, the parent action's proof is built from the SHA-256 hash chain of all substep occurrents. The rationale for hash chaining is tamper detection: if any step's evidence is modified after the fact, the chain breaks.

### Occurrent Structure

Each step in an action MUST produce:

```yaml
step_urn: "ckp://Occurrent#{KernelName}/{action}/{step_type}-{timestamp_ms}"
step_type: "deploy.namespace"
timestamp: "2026-04-05T09:46:10Z"
detail: { namespace: "ck-delvinator" }
verifications:
  - check: "namespace_generated"
    passed: true
hash: "ef0cdf2b..."                       # SHA-256 of (step_type + detail + parent_hash)
parent_hash: "df87330c..."                 # hash of previous step (chain link)
```

### Chain Computation

```
step[0].hash = SHA-256(step_type + JSON(detail) + action_urn_hash)
step[N].hash = SHA-256(step_type + JSON(detail) + step[N-1].hash)
```

Verification: walk the chain from step 0 to step N, recomputing each hash. If any link breaks, the proof is invalid.

::: warning Not Blockchain
This is not blockchain -- there is no distributed consensus -- but it provides local integrity guarantees that are sufficient for audit. The hash chain detects post-hoc modification of proof records.
:::

### Action Proof Summary

On action completion, the proof summarises the chain:

```yaml
action_urn: "ckp://Action#CK.Operator/project.deploy-{ts}"
kernel_urn: "ckp://Kernel#CK.Operator:v1.0"
started_at: "2026-04-05T09:46:10Z"
ended_at: "2026-04-05T09:46:12Z"
steps: 10
chain_valid: true
all_verified: true
final_hash: "33b08503..."
prov:wasAssociatedWith: "ckp://Kernel#CK.Operator:v1.0"
```

### Storage

Action proofs MUST be stored in the kernel's `storage/proof/` directory as `proof-{action}-{timestamp}.json`. They are sealed instances and MUST NOT be modified after creation.

## Ontology Grounding

| Concept | Published Class | Ontology Module |
|---------|----------------|-----------------|
| Proof record | `ckp:ProofRecord` | proof.ttl |
| Individual check | `ckp:ProofCheck` | proof.ttl |
| Check outcome | `ckp:ProofOutcome` (PASS / FAIL / PARTIAL) | proof.ttl |
| Check type | `ckp:CheckType` (SCHEMA / SHACL / PROVENANCE / STRUCTURE / INTEGRITY / OPERATIONAL) | proof.ttl |
| Evidence hash | `ckp:data_hash` | proof.ttl |
| Proof method | `ckp:ProofMethod` | proof.ttl |

## Conformance Requirements

| Criterion | Level |
|-----------|-------|
| Every materialised resource type MUST define proof methods | REQUIRED |
| Proof verification MUST execute at each substep, not after completion | REQUIRED |
| Actions MUST halt if any verification fails | REQUIRED |
| Proof records MUST include actual observed values, not just pass/fail | REQUIRED |
| Evidence MUST be hashed (SHA-256) for tamper detection | REQUIRED |
| Instances MUST NOT be sealed if proof contains any failure | REQUIRED |
| Every action that creates or modifies instances MUST produce a hash-chained proof | REQUIRED |
| Proofs MUST include PROV-O fields | REQUIRED |
| Proofs MUST be stored in `storage/proof/` | REQUIRED |
| Each substep MUST include actual evidence, not just pass/fail | REQUIRED |
| Sealed proofs MUST NOT be modified after creation | REQUIRED |
| Implementations SHOULD support rollback on verification failure | RECOMMENDED |
| Implementations SHOULD publish verification events to NATS | RECOMMENDED |
