# Roadmap

Written after `17.2.0-rc.1`. Everything here was found while walking Angular 14
to 17 and is recorded so it does not have to be rediscovered. Items are ordered
by what they cost a user, not by how interesting they are.

Related: [execution plan](./execution-plan.md) is the ordered sequence this feeds,
[JSON Schema drafts](./json-schema-drafts.md) has the detail for the draft work
summarised below.

## Now

### The Angular walk is finished

18, 19, 20, 21 and 22 are done, ending at 22.0.0 on 2026-09-12. The repository
is level with `@angular/core@latest` rather than behind it, so the next Angular
release is ordinary maintenance rather than catch-up.

What it cost, recorded because the next major will ask the same questions. The
Angular packages peer on each other by exact patch, so `ng update` on anything
but a frozen version set fails; read the real numbers off the `vNN-lts`
dist-tag. At 21 that was not enough on its own: PrimeNG pinned the previous
`@angular/cdk` and ships no `ng-update` metadata, so neither could move first
and the whole graph had to be declared and resolved in one install, with the
migrations run afterwards through `--migrate-only`. Each major also brought its
own toolchain: Vitest at 20, Vitest 4 and per project coverage output at 21,
TypeScript 6 at 22, which turns `strict` on by default and deprecates
`baseUrl`. The traps are written up in the agent notes.

The corpus paid for itself. It moved exactly once in five majors, at 22, and
the cause was PrimeNG's slider rendering an internal `<input>` rather than
anything in this library: one extra control per `range` field, which is what
identified it. Everything else rendered identically through a template rewrite
that touched every widget.

### The array layout defects

The checkbox and radio half of the work the Bootstrap pass in 20.1.0
deliberately stopped short of is done: Bootstrap 4 and 5 render checkboxes and
radios as siblings through their own widget components, described below under
Correctness. What is left is the array remove button and the duplicated array
title, described further down under Correctness, which still need a design
pass before code because they change shared widget structure rather than one
package's class list.

### The Codecov project target has a floor

Done. `codecov.yml` had `project: auto` alone because coverage was 56 percent
when it was written; the combined figure measured 77.22 percent on 2026-09-13,
so a floor of 76 percent now sits beside the ratchet. `auto` catches one large
drop, the floor catches slow erosion that every individual pull request would
otherwise pass. Raise the floor in steps, and only ever to a figure already
met.

## Security

16 open Dependabot alerts, every one of them development scope. Nothing in
runtime scope is left, so nothing an alert names reaches a consumer of
`@ajsf/*`.

It was 94 when this was written, 22 of those in runtime scope: 19 Angular and 3
`lodash-es`. Reaching Angular 20 closed the Angular ones, since they were
against versions the upgrade replaced, and lodash is gone from every package.
`@ajsf/core` depends on `ajv` and `tslib` only, and the five framework packages
on `@ajsf/core` and `tslib`.

So the remaining walk is no longer a security argument. The 16 development
alerts are worth one pass to confirm none affect the published artifacts, then
triaging in bulk.

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

### Bootstrap 4 markup, corrected in 20.1.0

The Bootstrap 4 package emitted a class list identical to the Bootstrap 3 one,
because it was created as a copy with the CDN URL changed. Labels, help text
and validation states all rendered unstyled. Fixed in 20.1.0, which also found
that issue #315 was two defects rather than one: the message was gated on
`dirty`, so a required field touched and left empty reported nothing, which no
class change addresses. That is `touched || dirty` now, in all three Bootstrap
packages.

Checkboxes and radios were left alone. Bootstrap 4 and 5 both want
`form-check-input` and `form-check-label` on sibling elements, the core widgets
nested the input inside the label, and emitting those names against the nested
shape would have looked conformant and done nothing. That was a restructure
rather than class drift, and it shipped separately in 22.1.0: see below.

Measured class by class in [Bootstrap class drift](./bootstrap-class-drift.md).

### Checkbox and radio markup, and what shares what

Bootstrap 4 and 5 now render checkboxes and radios as siblings through their
own widget components, each subclassing the corresponding `@ajsf/core` widget
and overriding template metadata only. Bootstrap 3, `@ajsf/core`'s plain HTML
output, `@ajsf/material` and `@ajsf/primeng` are unchanged: they keep the
nested form deliberately. Bootstrap 4's toggle buttons (`checkboxbuttons`,
`radiobuttons`) stay nested too, because Bootstrap 4 documents
`.btn-group-toggle` with the input inside the label and has no `.btn-check`.
Bootstrap 5's button sets render as siblings because it does.

The same shape blocks validation. Bootstrap reveals `.invalid-feedback` only as
a following sibling of the element carrying `.is-invalid`, and
`select-widget-widget` renders its own host element plus a container div
between the field wrapper and the real input, so the control and its message
can never be siblings. Bootstrap 4 and 5 therefore both put `is-invalid` on the
wrapper, which shows the message but does not mark the control.

### The array remove button and the duplicated array title

Two defects shared by all three Bootstrap packages, measured in
[Bootstrap class drift](./bootstrap-class-drift.md) and untouched by the 20.1.0
pass because neither is class drift. The remove button floats, so it leaves
normal flow and pins to the top of its row rather than aligning with the input
beside it: 44px against the input's centre on Bootstrap 5, 39px on Bootstrap 4.
Fixing it means making that row a flex container, which is a change to shared
framework templates. An array also renders its title twice, once as the field
label and again as a heading taken raw from the property name, so
`phone_numbers` shows "Phone Numbers" followed by "Phone_numbers".

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

### Four new framework packages, one shipped

Decided 2026-08-24, in this order:

    @ajsf/primeng     thick   shipped at 19.2.0
    @ajsf/daisyui     thin    next, after 20.0.0
    @ajsf/ng-zorro    thick   gated on recorded demand
    @ajsf/ionic       thick   gated on recorded demand

`@ajsf/primeng` published with the rest of the lockstep at 19.2.0, so there are
six packages now rather than five. daisyUI was gated on `20.0.0`, which shipped,
so it is unblocked: the reason for waiting was that a package added before the
walk crossed 20 would gain a Karma configuration, a suite and a coverage leg
that the Vitest migration would then have to move again.

A package started after 20.0.0 is carried through the 21 and 22 walk together
with the existing six, two extra upgrade legs, and that cost is accepted: the
walk crosses those majors regardless, so a seventh package rides the same pull
requests. The architecture items above (the ajv registry, one validator
implementation, conditional layout) reshape validation internals more than the
widget facing API, so the rework exposure for a new package is real but
bounded.

Two package models exist and differ by six times. Thin applies classes around
core's HTML widgets: `@ajsf/bootstrap5` is 5 files, 339 lines. Thick replaces
widgets with the library's components: `@ajsf/material` is 19 widget components,
1,892 lines. PrimeNG, NG-ZORRO and Ionic are thick. daisyUI is thin, and like
the Bootstrap packages needs no dependency on Tailwind or daisyUI itself, since
the consumer brings the CSS. There is no version coupling to Tailwind majors.

Why this order. PrimeNG went first as the largest Angular component library
AJSF did not cover (roughly 771k weekly downloads against Material's 2.34M),
its majors track Angular's since v18, which fits the package major equals
Angular major rule, and ngx-formly, the closest competitor, ships PrimeNG,
Ionic, Kendo and NG-ZORRO integrations. daisyUI is second on cost rather than
demand: Tailwind ecosystem reach for thin package effort. Kendo was considered
and dropped for commercial licensing. Raw Tailwind was dropped because it
provides no widgets, so a package would amount to a house design system.

Demand evidence is thin everywhere: the tracker holds two closed PrimeNG
mentions (#134 and #151, both from the Angular 5 era) and zero for the others.
The npm figures measure those libraries' popularity, not demand for AJSF
integrations of them. A pinned "which framework next" issue collecting reactions
before ng-zorro and ionic are scheduled would turn the guess into data, and may
reorder them. Ionic also versions independently of Angular, which the
release tooling assumes, so it needs a versioning decision before any code.

Each package pays a permanent tax: 74 corpus entries per framework, a suite and
coverage leg in CI, the lockstep walk through every future Angular major, and
the OIDC first publish. PrimeNG paid all four and the figures held: the baseline
went from 370 to 444 exactly as predicted, and `@ajsf/primeng@0.0.0` was
published by hand because npm cannot configure a trusted publisher for a
package that does not exist. The next three take the baseline to 518, 592 and
666.

The placeholder step has a second half that is easy to lose. npm claims `latest`
on a first publish whatever `--tag` says, so the stub owns `latest` until a
stable release moves it, and `latest` cannot be removed. Deprecate the stub on
the spot: `@ajsf/bootstrap5@0.0.0` sat undeprecated from 17.2.0-rc.1 until
19.2.0 had already shipped. Both stubs are deprecated now. The steps are in the
agent notes.

Widget selector names become public API on first release, named in consumer
layout schemas, so they are a one shot decision.

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
