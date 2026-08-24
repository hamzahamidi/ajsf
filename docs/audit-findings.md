# Audit findings

The execution plan schedules work by finding number, but the numbers themselves
were only ever recorded in a chat transcript. Recovering the scope of rc.3 meant
grepping a 37 MB session log, which is not a repeatable way to run a release.
This file is the durable record. Add to it rather than to a transcript.

Related: [execution plan](./execution-plan.md) schedules these.

## Status

Findings 1, 2, 4, 7, 8, 9, 16, 17, 18, 19, 20 shipped in 18.1.0 through 18.3.0.
Finding 3 shipped at `19.0.0-rc.2`, finding 13 and the draft work at
`19.0.0-rc.1`, finding 15 at `19.0.0-rc.3`.

Findings 5 (the select widget storing the string "null" for the None option),
6 (disableInvalidSubmit dead for a layout-declared submit) and 21
(minProperties and maxProperties counting declared rather than entered values)
shipped at 19.0.0-rc.4.

Still open: the layout residual of 10.

The three allOf defects did not ship together. The two that are contained, the
`additionalProperties` assignment and the positional tuple merge, went first. The
`properties` level confusion is held back because fixing it activates a branch
that has never run, so a consumer bisecting a regression can land on one change
rather than three.

## The allOf merging findings, 11, 12 and 14

All three live in `merge-schemas.function.ts`. They share one file, so they ship
as one step. Corpus signal is capped at 15 entries: `json-schema-draft04`,
`json-schema-draft06` and `ng-jsf-deep-ref` are the only three example schemas
using `allOf`, across five framework legs.

The numbering of 11 against 12 could not be recovered, only that both are allOf
merging defects with corpus signal. They are recorded here by description, which
is what a fix needs anyway.

**`additionalProperties: false` writes a key named after a local variable.**
The branch handling `additionalProperties === false` in either schema assigns
`combinedSchema.combinedSchema = false` where it means
`combinedSchema[key] = false`. So `false` never overrides the other value, and a
merged schema carries a junk `combinedSchema: false` entry into form building.

**The `properties` case looks for `additionalProperties` inside `properties`.**
Fixed.
In that branch `schemaValue` is `schema.properties`, so
`hasOwn(schemaValue, 'additionalProperties')` asks whether the schema declares a
property literally *named* `additionalProperties`, and
`schemaValue.additionalProperties === false` reads that property's subschema.
`additionalProperties` is a sibling of `properties`, not a member of it. The
`combinedObject` side repeats the confusion. Two consequences: the whole
additionalProperties-aware branch of property merging is unreachable for a normal
schema, and a schema that does happen to have a property of that name has its
merging silently altered, including `!hasOwn(combinedObject,
'additionalProperties')` blocking every new key.

**Tuple `items` are intersected rather than merged by position.** This is finding
14, fixed. When both schemas give `items` as an array it keeps only entries that appear
in both, comparing with `deepEqual`, which is set semantics. A tuple's `items` is
positional: `items[i]` constrains element `i`. Merging
`[{type: 'string'}, {type: 'number'}]` with
`[{type: 'string'}, {type: 'boolean'}]` yields `[{type: 'string'}]`, so slot 1 is
dropped and a two slot tuple becomes a one slot tuple. Position 0 survives only
because the two happened to be identical.

Finding 14 is what makes `prefixItems` a mapping at 21 rather than a second
layout rewrite, so the positional shape it produces has to be the shape phase 9
maps onto.

## Found while fixing the above, not in the original audit

**Two `items` branches are unreachable.** The `items` case tests
`isArray(a) && isArray(b)`, then `isObject(a) && isObject(b)`, then the two mixed
array-and-object combinations. `isArray` implies `isObject` here, so the second
test catches array plus object and the last two branches never run. The effect is
that `items: [ {...} ]` merged with `items: { ... }` is merged key by key and
comes back as an object with numeric keys, `{ 0: {...}, minLength: 1 }`, rather
than the object being applied to each tuple slot. Pinned as a BUG in
`merge-schemas.function.spec.ts`.

Fixed with the `properties` level confusion, since both change how a merged
schema is shaped rather than correcting a single assignment.

## An escape hatch worth revisiting

`mergeSchemas` returns `{ allOf: [ ...schemas ] }` from roughly twenty branches
whenever it cannot merge, which is a correct answer for a validator and a poor one
here. Neither `layout.functions.ts` nor `form-group.functions.ts` handles `allOf`,
so a schema that comes back unmerged from `getSubSchema` has no field building
path and its fields do not render. ajv still validates the original schema, so
this costs fields rather than correctness. Not scheduled, and worth measuring
before it is.
