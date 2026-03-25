# Ontology

The ontology layer is the type system of the Concept Kernel Protocol. It provides semantic grounding for every concept through formal schema definitions and constraint validation.

## LinkML Schemas

Every concept kernel defines its structure using [LinkML](https://linkml.io/) — a modeling language for linked data:

```yaml
classes:
  Cat:
    description: A domesticated feline
    is_a: Mammal
    slots:
      - name
      - breed
      - coat_color
    slot_usage:
      name:
        required: true

slots:
  name:
    range: string
  breed:
    range: CatBreed
  coat_color:
    range: string

enums:
  CatBreed:
    permissible_values:
      Persian: {}
      Siamese: {}
      MaineCoon: {}
```

LinkML provides inheritance (`is_a`), typed slots, enumerations, and cardinality constraints out of the box.

## SHACL Validation

Beyond schema structure, each kernel enforces **SHACL shapes** — constraint rules that validate data at runtime:

```turtle
ex:CatShape a sh:NodeShape ;
    sh:targetClass ex:Cat ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1 ;
        sh:datatype xsd:string ;
    ] ;
    sh:property [
        sh:path ex:breed ;
        sh:in ( "Persian" "Siamese" "MaineCoon" ) ;
    ] .
```

SHACL constraints are:
- **Aggregated** across the concept graph during burst propagation
- **Enforced** before any mutation is committed
- **Stored** per-concept in the kernel's `shacl/` directory

## Type Alignment with BFO

CKP aligns its upper ontology with the [Basic Formal Ontology (BFO)](https://basic-formal-ontology.org/), providing a principled foundation for categorizing concepts into:

- **Continuants** — Entities that persist through time (objects, qualities)
- **Occurrents** — Entities that unfold in time (processes, events)

This alignment ensures interoperability with biomedical ontologies, industrial standards, and other BFO-aligned systems.

## Ontology Registration

When a new concept is admitted, its ontology is registered through the `CK_Ontology` kernel:

1. LinkML schema is parsed and validated
2. SHACL shapes are extracted or generated
3. RDF triples are stored in the triplestore (Oxigraph)
4. Relationships to existing concepts are established
5. The concept becomes queryable via SPARQL

---

<div style="text-align: center; padding: 2rem 0;">
  <a href="https://discord.gg/sTbfxV9xyU" style="display: inline-block; padding: 0.6rem 1.5rem; background: #5865F2; color: white; border-radius: 6px; font-weight: 600; text-decoration: none;">Discuss Ontology on Discord</a>
</div>
