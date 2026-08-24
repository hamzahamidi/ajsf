# Roadmap

Written after `17.2.0-rc.1`. Everything here was found while walking Angular 14
to 17 and is recorded so it does not have to be rediscovered. Items are ordered
by what they cost a user, not by how interesting they are.

Related: [execution plan](./execution-plan.md) is the ordered sequence this feeds,
[JSON Schema drafts](./json-schema-drafts.md) has the detail for the draft work
summarised below.

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

The 3 `lodash-es` alerts are closed: lodash is gone from all five packages.
`@ajsf/core` now depends on `ajv` and `tslib` only, and the four framework
packages on `@ajsf/core` and `tslib`.

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

### Audit backlog, 2026-08-16

An audit of `@ajsf/core` reported 28 defects; 25 survived a three-lens
refutation panel. Four were fixed straight away, because they were unambiguous
specification violations confined to one file: `multipleOf` using a remainder,
`minLength` and `maxLength` counting UTF-16 units, and `minItems` exempting the
empty array. The rest, worst first:

    A property name containing / or ~ throws, and no form renders
    An array named by key in a custom layout renders no fields and no Add button
    Tuple slots are typed as list items, so a fixed slot gets a remove button
    checkboxes ignores every click when the enum values are not strings
    The auto-added "None" option stores the four-character string "null"
    disableInvalidSubmit is dead for a layout-declared submit, so onSubmit emits null
    A recursive array silently drops every item of the supplied data
    toDataPointer emits the key unescaped, producing a pointer it then rejects
    exclusiveMinimum and exclusiveMaximum never produce a control validator
    A nullable type such as ['string','null'] loses every validator
    mergeSchemas reads additionalProperties off the wrong object
    A combinedSchema.combinedSchema typo drops a conflicting additionalProperties
    convertSchemaToDraft6 appends a suffix to the id when writing $id
    mergeSchemas intersects tuple items by value rather than by position
    The array item template is cloned from the last tuple slot, not additionalItems
    An array layout node with an empty item list throws and the form fails
    setCopy accepts an empty pointer and writes a key named "undefined"
    forEachDeepCopy and getCopy flatten Date, Map and Set to an empty object
    buildTitleMap opens a duplicate group when a group name recurs non-adjacently
    remove on a Map does nothing while has() still reports the key

`minProperties` and `maxProperties` count declared properties rather than
entered values, so an untouched form already has every key. That is not fixed
here because it is the same disagreement as the item below: the hand-written
validator and ajv reading the same document differently. Fix it there.

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
unstyled. Bootstrap 5 had the same drift and is now migrated, spacing and
checks alike, without touching core. The same approach applies here. Measured
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

## Growth

### Four new framework packages, after the 19 release

Decided 2026-08-24, in this order:

    @ajsf/primeng     thick   the largest Angular component library not covered
    @ajsf/daisyui     thin    the Tailwind ecosystem at Bootstrap package cost
    @ajsf/ng-zorro    thick   gated on recorded demand
    @ajsf/ionic       thick   gated on recorded demand

They can start once `19.0.0` is promoted to `latest`. A package started there
is carried through the 20, 21 and 22 walk together with the existing five,
three extra upgrade legs, and that cost is accepted: the walk crosses those
majors regardless, so a sixth package rides the same pull requests. The
architecture items above (the ajv registry, one validator implementation,
conditional layout) reshape validation internals more than the widget facing
API, so the rework exposure for a new package is real but bounded.

Two package models exist and differ by six times. Thin applies classes around
core's HTML widgets: `@ajsf/bootstrap5` is 5 files, 339 lines. Thick replaces
widgets with the library's components: `@ajsf/material` is 19 widget components,
1,892 lines. PrimeNG, NG-ZORRO and Ionic are thick. daisyUI is thin, and like
the Bootstrap packages needs no dependency on Tailwind or daisyUI itself, since
the consumer brings the CSS. There is no version coupling to Tailwind majors.

Why this order. PrimeNG is the largest Angular component library AJSF does not
cover (roughly 771k weekly downloads against Material's 2.34M), its majors track
Angular's since v18, which fits the package major equals Angular major rule, and
ngx-formly, the closest competitor, ships PrimeNG, Ionic, Kendo and NG-ZORRO
integrations. daisyUI is second on cost rather than demand: Tailwind ecosystem
reach for thin package effort. Kendo was considered and dropped for commercial
licensing. Raw Tailwind was dropped because it provides no widgets, so a package
would amount to a house design system.

Demand evidence is thin everywhere: the tracker holds two closed PrimeNG
mentions (#134 and #151, both from the Angular 5 era) and zero for the others.
The npm figures measure those libraries' popularity, not demand for AJSF
integrations of them. A pinned "which framework next" issue collecting reactions
before ng-zorro and ionic are scheduled would turn the guess into data, and may
reorder them. Ionic also versions independently of Angular, which the
release tooling assumes, so it needs a versioning decision before any code.

Each package pays a permanent tax: 74 corpus entries per framework (370 becomes
444, then 518, 592 and 666), a suite and coverage leg in CI, the lockstep walk
through every future Angular major, and the OIDC first publish (npm cannot
configure a trusted publisher for a package that does not exist, so each needs
one manual placeholder publish, deprecated on the spot, before the workflow
takes over; the steps are in the agent notes). Widget selector names become
public API on first release, named in consumer layout schemas, so they are a
one shot decision.

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
