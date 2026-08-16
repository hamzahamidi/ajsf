# Roadmap

Written after `17.2.0-rc.1`. Everything here was found while walking Angular 14
to 17 and is recorded so it does not have to be rediscovered. Items are ordered
by what they cost a user, not by how interesting they are.

Related: [JSON Schema drafts](./json-schema-drafts.md) has the detail for the
draft work summarised below.

## Now

### Finish the Angular walk: 18, 19, 20, 21, 22

Five majors. The corpus covers this well (control counts move when rendering
breaks), so it is the safest large change available.

Known ahead of time: Angular 18 raises the Node floor above the current
`.nvmrc` of 18.17.1, and `version:set` already syncs `engines` from the
installed CLI. Vitest arrives at 20, where Angular ships its own builder, and
the decision was to switch there rather than at 18, since before 20 it means
migrating twice.

`18.0.0` is also where the four merged validation fixes reach `latest`.

### Deprecate the Bootstrap 5 placeholder

`@ajsf/bootstrap5` has `latest` on the empty `0.0.0` stub, because npm claims
`latest` on a first publish whatever `--tag` says. `npm install @ajsf/bootstrap5`
returns an empty package until a stable release moves it.

    npm deprecate "@ajsf/bootstrap5@0.0.0" "Placeholder only, not a usable release."

### Fix the lodash dependency, which is currently wrong

All four published packages declare `lodash-es` and import plain `lodash`.
Source carries 19 `from 'lodash/...'` imports and zero `lodash-es` imports, and
plain `lodash` is declared nowhere. It resolves in this repository only because
karma and webpack-bundle-analyzer pull it in as development dependencies.

A consumer therefore installs an unused package and resolves the one actually
imported by luck. This has been shipping since before the Angular walk.

The fix is to remove it rather than to correct the name. Five functions are
used, and their transitive graph is 152 files:

    uniqueId        a counter, three lines
    map, filter     native, where they are used on arrays
    cloneDeep       structuredClone
    isEqual         the only one needing care

`isEqual` handles NaN, Dates, Maps and Sets, so a naive replacement would
differ quietly. Verify it against the corpus, which now records validity.

### Raise the Codecov project target

`codecov.yml` has `project: auto` because coverage was 56 percent when it was
written. It is 87 percent now, so the target can become a real number without
failing anything.

## Security

94 open Dependabot alerts sounds worse than it is, and the split matters:

    72  development scope   never reach a consumer of @ajsf/*
    22  runtime scope       19 Angular, 3 lodash-es

The 19 Angular alerts are fixed by the walk above, since they are all against
versions the upgrade replaces. That is the strongest practical argument for
finishing it.

The 3 `lodash-es` alerts are not reachable twice over. They are `_.template`
code injection and prototype pollution in `_.unset` and array paths, none of
which the library calls, and `lodash-es` is not imported at all: the code
imports plain `lodash`, as the item above describes. Removing the dependency
closes them.

The 72 development alerts are worth one pass to confirm none of them affect the
published artifacts, then triaging in bulk.

## Correctness

### Group C: what is left

Four helpers were deferred during the fix work because each is load bearing.
Two are now done and took two others with them.

`isEmpty` reported a Date, Map, Set and RegExp as empty, so roughly fifteen
validator guards skipped those values entirely. Fixed.

`isNumber` used the global isNaN, so null, the empty string, booleans, arrays
and Dates all counted as numbers. Fixed, and it repaired `getType('')`,
`isPrimitive([])`, and the NaN that `toJavaScriptType` and `toSchemaType`
returned for dates, booleans and the empty string.

`hasOwn` is the remainder, at 134 call sites. It returns the element rather
than a boolean for a numeric key on an array, so `hasOwn([0, 1], 0)` is `0` and
reads as false. It is the largest reach in the library for the smallest visible
payoff, and nothing user facing depends on it. Revisit alone, after the walk,
with a full corpus run.

### Bugs frozen into the corpus baseline

Six of the 400 baseline entries record a thrown error as expected behaviour,
including `value.forEach is not a function` on `jsf-fields-checkboxbuttons` and
`Cannot set properties of undefined` on `ng-jsf-layout-only`. They are real
bugs pinned so that a regression is visible. Anyone fixing one must update the
baseline in the same commit, and should not read a red corpus as their own
mistake.

### Bootstrap 4 is Bootstrap 3 markup

The Bootstrap 4 package emits a class list identical to the Bootstrap 3 one, so
checkboxes, radios, labels, help text and validation states all render
unstyled. Bootstrap 5 had the same drift and its spacing half is fixed; the
checkbox half needs a wrapper element that core does not render today. Measured
class by class in [Bootstrap class drift](./bootstrap-class-drift.md).

### fxLayout has never worked

`getFlexAttribute('layout')` reads `(a || 'row') + b ? ' ' + b : ''`. `+` binds
tighter than `?:`, so it always returns `' ' + fxLayoutWrap` and `fxLayout:
'column'` evaluates to `" undefined"`. Fixing it changes rendering for anyone
using the option, which is why it was left. It needs its own pull request and a
corpus run.

## Architecture

### Split convertSchemaToDraft6

It does three jobs: detect the draft, downconvert for the validator, and
normalise for the form builder. The builder reads the converted schema, so the
third job is load bearing. Splitting them makes a new draft an added engine
rather than an extended converter. Detail in
[JSON Schema drafts](./json-schema-drafts.md).

### A default draft instead of sniffing

With no `$schema` the converter infers a draft from which legacy keywords it
finds, and a single `optional: true` makes every other property required. A
`defaultDraft` option replaces the guess.

### ajv 6 to ajv 8

ajv is pinned at 6.12.6 and effectively unmaintained. ajv 8 is also the
prerequisite for 2019-09 and 2020-12, whose support lives behind separate entry
points. Worth doing as its own change, separate from the draft work, so a
failure has one cause.

### JSON Schema is validated twice, by two implementations

`json-schema-form.service.ts:249` runs `validateFormData(this.data)`, an ajv
function compiled from the whole schema, and uses its output for `isValid` and
`validationErrors`. Separately, `getControlValidators` builds a validator per
control out of `JsonValidators`, which is a hand written implementation of the
same specification. Both run against the same data.

That duplication is where most of the bugs found during the Angular walk lived.
`exclusiveMinimum` was an exclusive maximum, `uniqueItems` never reported a
duplicate, and `dependencies` made any form using it permanently invalid. ajv
gets all three right, and has for years.

The duplication is not gratuitous. Angular reactive forms want a `ValidatorFn`
per control so a field can carry its own error state, while ajv reports
document level errors keyed by JSON pointer. Mapping ajv errors back onto
controls by pointer is a known pattern and would delete most of
`json.validators.ts`, which is 895 lines.

Two things to establish before committing to it. Whether running ajv on the
whole document per keystroke is acceptable, or whether errors should be mapped
from the existing single run. And whether consumers depend on `JsonValidators`
directly, since it is exported from `public_api.ts` and removing it is a
breaking change on its own.

This is worth more than any single fix left on this page, because it removes
the class of bug rather than instances of it.

### Not zod, and not lodash, for the type helpers

Both come up. Neither fits.

zod validates shapes authored in TypeScript at build time. AJSF receives an
arbitrary JSON Schema at run time and has no compile time type to describe, and
zod would not touch `isNumber` or `isEmpty`, which are internal predicates
rather than schema validation.

lodash cannot replace the predicates either, because the semantics differ on
purpose. `isNumber('3')` has to be true, since a form input is a string and a
schema may carry `"3"`, while lodash says false. `isNumber(NaN)` has to be
false, while lodash says true. `_.isEmpty(new Date())` is true in lodash, which
is the same bug fixed in `isEmpty` here.

### Conditional layout

`if`, `then` and `else` validate correctly today and the layout ignores them, so
a field that becomes required through a condition is enforced without being
shown as required until submit. The layout is built once. This is the largest
item on this page and deserves its own design note before any code.

## Size and shape

Five files carry most of the library:

    1068  shared/layout.functions.ts
    1012  shared/jsonpointer.functions.ts
     895  shared/json.validators.ts
     883  json-schema-form.service.ts
     788  shared/json-schema.functions.ts

They are now covered (87 percent), which makes splitting them safe in a
way it was not before. Do it opportunistically, when a change already touches
one, rather than as a project of its own. Splitting a file nobody is editing
buys nothing and costs review.

## Documentation

The source is bimodal. `shared/` carries prose doc comments on roughly 90
percent of exported functions, while `widget-library/` has none in 25 of 26
files, and the two services the README tells users to call, `WidgetLibraryService`
and `FrameworkLibraryService`, have none at all.

An autogenerated API reference would therefore be rich for internals and empty
for the public surface, which is backwards. Two cheap fixes first: convert the
26 trailing comments on the `<json-schema-form>` inputs and outputs to doc
comments, and generate the widget reference from the `widgetLibrary` map, which
has 80 entries and 38 explanatory comments already. Compodoc after that, not
Docusaurus: it reads Angular source directly and adds no second toolchain.

## Testing

The 400 case corpus records two fields per case, `controls` and `error`. It is a
strong net for anything that changes what renders and a weak one for anything
that changes what validates. That distinction decides which changes it can
referee, and it is why the draft work needs tests written against validation
results directly.

The baseline was recorded in headless Chrome. Moving to Vitest at Angular 20
means re-recording it, which should be its own commit with the diff read case by
case, never bundled into another change.
