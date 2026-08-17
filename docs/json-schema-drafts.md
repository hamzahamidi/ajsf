# Supporting more JSON Schema drafts

Design note. Not implemented. Written after the Angular 17 release, while
deciding how to reach 2020-12 support.

## Where we are

Every incoming schema goes through `convertSchemaToDraft6` once, in
`json-schema-form.component.ts:492`, and the result replaces `jsf.schema`. That
single function currently does three unrelated jobs.

**It detects the draft.** From `$schema` when present, otherwise by sniffing for
legacy keywords.

**It downconverts for the validator.** Drafts 1 through 4 become draft 6, which
ajv 6.12.6 then validates.

**It normalises for the form builder.** The builder reads the converted schema,
not the original, and depends on the shapes conversion produces. For example
`form-group.functions.ts:377` treats `required` as an array, which is only true
after a draft 3 boolean `required` has been rewritten.

Two consequences follow.

Draft 7 already validates correctly, because the converter passes keywords it
does not recognise through untouched and ajv 6 supports draft 7 natively. The
README claimed drafts 3, 4 and 6 for years while draft 7 worked.

2020-12 fails at compile with `no schema with key or ref
https://json-schema.org/draft/2020-12/schema`. The form does not render.

## The proposal

Split the three jobs.

**A validation engine per draft, chosen by `$schema`.** This is the part that
makes new drafts cheap: adding one becomes adding an engine rather than
extending a converter. It needs ajv 8, whose 2019-09 and 2020-12 support lives
behind separate entry points (`ajv/dist/2019`, `ajv/dist/2020`), with
`ajv-draft-04` for draft 4. Schemas validate against the spec they declare, so
`unevaluatedProperties` and `$dynamicRef` work rather than being ignored.

**A layout normaliser, kept and renamed.** The builder still needs one internal
shape. This is the smaller honest job the current converter is half doing, and
it is where `prefixItems` would be mapped onto whatever the builder uses for
tuples.

**Draft detection as its own function**, so the rule is stated once.

## Why this is not just an ajv upgrade

Validation is the easy half. The builder references `if`, `then`, `else`,
`prefixItems`, `dependentRequired` and `unevaluatedProperties` exactly zero
times today. Two consequences that no engine change fixes:

A draft 7 `if` / `then` schema validates correctly now, and the layout still
does not mark the conditionally required field as required, because layout is
built once. The form refuses to submit and the user cannot see why.

2020-12 replaces the array form of `items` with `prefixItems`. Tuple detection
keys off `items` being an array (`layout.functions.ts:300`), so a 2020-12 tuple
would produce a wrong layout rather than an error. Silent, which is worse.

## The default draft

When `$schema` is absent the converter infers a draft from which legacy keywords
it finds. Measured:

    no $schema, modern schema        untouched, correct
    no $schema, one optional: true   infers draft 2, every other property becomes required
    no $schema, required: true       infers draft 3

The middle case is the problem. One `optional: true` anywhere makes every other
property required, and nothing in the schema asked for that.

Replace sniffing with a `defaultDraft` option defaulting to **draft 7**, decided
2026-08-17. `$schema` always wins when present. Sniffing goes entirely rather
than surviving behind an opt in.

Draft 7 is a literal rather than "the newest draft supported", and that is the
load bearing part. If the default tracked the newest engine, adding the 2019-09
and 2020-12 engines would silently reinterpret every schema that declares no
`$schema`, which is 75 of the 80 examples, and each new engine would become a
breaking change. Pinned to a literal, adding an engine is additive and can ship
at a minor.

It also costs nothing to schedule: ajv 6.12.6 already validates draft 7
natively, so `defaultDraft` does not have to wait for the ajv 8 move.

The `required: true` collection is not inference and stays, ungated. It converts
a draft 3 property keyword into the array shape the form builder needs, three of
the 80 examples use it, and removing it would loosen forms silently rather than
error.

This matches how JSON Schema itself reads an absent `$schema`: the newest
version the tool supports, not a guess from the contents.

## Order

1. Angular 18. Mechanical, and the corpus covers it well.
2. The three way split, with no behaviour change. Tests first.
3. `defaultDraft`, replacing sniffing. Breaking for anyone relying on the
   inference, so it ships at a major.
4. ajv 8 and the engine registry, still only drafts 4 through 7.
5. 2019-09 and 2020-12 engines, plus the layout work for `prefixItems`.
6. Conditional layout for `if` / `then` / `else`, which is the largest item and
   worth its own design note.

Steps 3 onwards change what validates. The package major is pinned to the
Angular major, so a breaking change can only ship at an Angular boundary.

## What the corpus will and will not catch

The 400 case baseline records rendered control counts and thrown errors per
example schema. It is a strong net for step 2, which should not move a single
case, and for anything that stops a form rendering.

It is a weak net for steps 3 onwards, because it records neither validity nor
which fields are required. A change that makes a schema validate differently is
largely invisible to it. Those steps need tests written against validation
results directly, not against rendering.
