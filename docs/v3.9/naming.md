---
title: "Naming"
description: "Kernels, tasks, and goals are addressed by name. The protocol's stable core lives at one fixed IRI, and the urn:ckp scheme names first-class domain types."
---

# Naming

A concept kernel is a named domain. The everyday surface today is **kernels, tasks, and goals**, each addressed by name, and each write lands as a sealed, proof-chained instance. Above that surface the protocol defines a stable core vocabulary at one fixed IRI, and a `urn:ckp:` scheme that names first-class domain types.

## Kernels are named domains

`kernel.create` opens a domain by name. The class is `ckp://Kernel#<name>`, and the call returns the kernel's id:

```sh
SELECT ckp.dispatch('kernel.create', '{"name":"mygame"}'::jsonb);
-- → {"id":"backlog:mygame","ok":true,"kernel":"mygame"}
```

Any name works; the kernel becomes the scope every instance in that domain belongs to.

## Tasks and goals target a kernel by name

A task is a governed, sealed work object that targets a kernel. `task.create` names the target kernel and the task's fields; the seal returns the instance id and its proof:

```sh
SELECT ckp.dispatch('task.create',
  '{"task":{"target_kernel":"mygame","title":"patrol sector 7"}}'::jsonb);
-- → {"id":"task-…","ok":true,"verified":true,"proof_digest":"7c1387a6…"}
```

An instance carries an id like `task-…` within its kernel. Goals name a kernel's objectives the same way. Reads — `instances.list`, `instance.get`, `instance.verify`, `instance.provenance` — address instances by that id and re-verify the seal.

## Adopter shapes load into the kernel's shape graph

A kernel's shapes — the SHACL that gates what its instances must carry — load into `urn:ckp:<kernel>/kernel/ck`. The demo kernel is armed with the `Task` and `Goal` shapes at first boot; adopting shapes into another kernel's `urn:ckp:<kernel>/kernel/ck` arms it the same way. The seal gate resolves an instance's fields against the shapes in that graph.

## Short keys resolve to declared properties

Inside a create, a developer writes short localnames for a kernel's fields — `title`, `target_kernel`. pgCK resolves each short key to its declared property IRI by reading the kernel's own shapes, the same `sh:path` declarations the seal gate reads. A key the kernel declares is accepted; a key it never declared is refused — the shape is the allow-list.

## The protocol core is stable

The core vocabulary — `ckp:Kernel`, `ckp:Proposal`, `ckp:Grant`, `ckp:Transition`, and the properties that shape them — lives at a single stable IRI: `https://conceptkernel.org/ontology/v3.8/core#`. That IRI names the protocol's vocabulary and holds steady across protocol releases; a `Task` is `https://conceptkernel.org/ontology/v3.8/core#Task` in a v3.9.1 kernel exactly as it reads on the page.

## The urn:ckp scheme names first-class domain types

The protocol defines a namespace for a project to model its own world under `urn:ckp:<project>/`, with a segment that says which kind of term follows:

| Tier | Grammar | Names | Example |
|---|---|---|---|
| Protocol core | `https://conceptkernel.org/ontology/v3.8/core#<Term>` | the protocol's own vocabulary | `…/core#Task` |
| Domain type | `urn:ckp:<project>/type\|prop\|shape/<Name>` | a project's classes, properties, shapes | `urn:ckp:demo/type/Ship` |
| Instance | `urn:ckp:<project>/<id>` | a sealed individual | `urn:ckp:demo/ship/endurance` |

```turtle
@prefix demo: <urn:ckp:demo/> .

demo:type/Ship    a rdfs:Class .
demo:prop/blocks  a rdf:Property .
demo:shape/Ship   a sh:NodeShape ; sh:targetClass demo:type/Ship .
```

- `urn:ckp:demo/type/Ship` — an `rdfs:Class` a kernel declares.
- `urn:ckp:demo/prop/blocks` — a property a kernel declares.
- `urn:ckp:demo/shape/Ship` — an `sh:NodeShape` that gates instances of the class.

This `type | prop | shape` scheme is the naming the protocol defines for first-class domain types — a project's own `Ship` with its own shape and its own create verb. It is the direction the **generic typed create** takes (CKP v3.9 §4): a `ckp.dispatch('instance.create', …)` whose payload is typed by the kernel's own sealed shape, so a game's `Ship` and a lab's `Sample` are first-class sealed instances. Modeling a domain onto kernels, tasks, and goals is the surface an adopter builds on today; first-class domain types are the naming the protocol reserves for that capability as it lands.

## The developer addresses meaning

Whether by kernel name today or by URN for a declared domain type, a developer names meaning, and the storage layout stays out of reach: no HTTP schema version, no graph id, no quad. The [client](/v3.9/client) speaks typed instances and names over the door, and pgCK — composing pgRDF beneath the door — turns those names into shaped, sealed, proof-chained state.

## Related

- [Ontology](/v3.9/ontology) — the classes, properties, and shapes a name refers to.
- [Concept Kernel](/v3.9/concept-kernel) — the sovereign unit each kernel scopes.
- [Client](/v3.9/client) — the cklib surface that speaks names and typed instances over the door.
