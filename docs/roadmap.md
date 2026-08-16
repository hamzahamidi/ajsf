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

The 3 `lodash-es` alerts are not reachable. They are `_.template` code
injection and prototype pollution in `_.unset` and array paths. The library
imports only `cloneDeep`, `filter`, `isEqual`, `map` and `uniqueId`. Worth
confirming again after any lodash upgrade rather than assuming.

The 72 development alerts are worth one pass to confirm none of them affect the
published artifacts, then triaging in bulk.

## Correctness

### Group C: the deferred bugs

Four helpers were left alone deliberately during the fix work, because each is
load bearing. Call sites counted across the four packages:

    isEmpty    47   treats Date, Map, Set and RegExp as empty
    isNumber   21   global isNaN, so null, '', true and [] are all numbers
    hasOwn    134   returns the element rather than a boolean for a numeric key
    getType    21   getType('') is 'integer', falls out of isNumber

`isEmpty` is the one to schedule first. Roughly fifteen of its call sites are
the `if (isEmpty(control.value)) { return null; }` guard at the top of a
validator, so a Date valued or Map valued control bypasses validation
completely today. Fixing it turns those guards back on, which is the point and
also why it cannot land during an upgrade.

`isNumber` cascades into `getType`, `isPrimitive`, `toJavaScriptType` and
`merge-schemas`. Fixing it makes `type('number')` stop accepting `true`. Wide,
and no user has asked for it.

`hasOwn` at 134 call sites is the largest blast radius in the library for the
smallest visible payoff. Revisit alone, after the walk, with a full corpus run.

### Bugs frozen into the corpus baseline

Six of the 400 baseline entries record a thrown error as expected behaviour,
including `value.forEach is not a function` on `jsf-fields-checkboxbuttons` and
`Cannot set properties of undefined` on `ng-jsf-layout-only`. They are real
bugs pinned so that a regression is visible. Anyone fixing one must update the
baseline in the same commit, and should not read a red corpus as their own
mistake.

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

### Conditional layout

`if`, `then` and `else` validate correctly today and the layout ignores them, so
a field that becomes required through a condition is enforced without being
shown as required until submit. The layout is built once. This is the largest
item on this page and deserves its own design note before any code.

## Size and shape

Five files carry most of the library:

    1068  shared/layout.functions.ts
    1012  shared/jsonpointer.functions.ts
     909  shared/json.validators.ts
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
