# Execution plan

Written after `18.0.0`. Covers the three things asked for together: fix the bugs,
refactor, and make the JSON Schema draft support cleaner. They are one sequence,
not three, and the order below is what the dependencies allow rather than what
the wish list suggests.

Related: [roadmap](./roadmap.md) is the index, [JSON Schema
drafts](./json-schema-drafts.md) has the draft detail, [Bootstrap class
drift](./bootstrap-class-drift.md) the framework detail.

## Two facts that set the shape

**The refactor is not the bug fix.** Of the 21 open audit findings, 18 are
independent: they live in layout building, widgets, JSON Pointer handling and
schema merging, and no planned refactor touches them. Two are fixed by moving to
one validator implementation, one by splitting the draft converter. Waiting for
the architecture work would leave 18 defects in place for four Angular majors and
fix none of them.

**Breaking changes are a scarce resource.** The package major is pinned to the
Angular major, Angular is at 22, so exactly four boundaries remain: 19, 20, 21,
22. Eight of the 21 findings are breaking, and the draft work has breaking steps
of its own. Finishing the Angular walk without spending those boundaries would
push the rest to Angular 23.

## What the corpus can referee

Measured, not assumed. Only 5 of the 21 findings move a baseline entry at all: 2,
7, 11, 12 and 14. The other 16 are invisible, because `countControls` selects
`input, select, textarea, mat-select, mat-slider` and the harness simulates no
clicks. Two consequences.

Every phase states its predicted baseline delta before the run, and a
mispredicted delta is a defect in the pull request rather than a baseline to
re-record. And the per-keyword unit suite is not something to build later: it is
the only signal most of this work has, so it starts in phase 3.

## Phases

**1. Pointer, copy and widget repairs. Ships at 18.1.0.** Findings 1, 8, 17, 18,
20, 4, 19 as four pull requests. Finding 1 is a total render failure: a property
name containing `/` or `~` throws and no form appears. Predicted corpus delta is
zero on all 400, and that is a hard assertion, because no property key in any of
the 84 example schemas contains either character.

**2. Array building. Ships at 18.2.0.** Findings 16, 2, 7. An array named by key
in a custom layout renders no fields and no Add button, and a recursive array
drops every item of the supplied data. Predicted delta is 10 entries for finding
2 and 5 for finding 7. Neither pinned throw is expected to clear.

**3. Validator keywords that never fire. Ships at 18.3.0.** Finding 9, and the
validator half of finding 10. `exclusiveMinimum` and `exclusiveMaximum` never
produce a control validator at all. Predicted delta is zero by construction:
`isValid` comes from ajv over the whole document and `formGroup.valid` is read
nowhere in the library. The specs written here are the first of the keyword
suite that phases 8 onward depend on.

**4. Split convertSchemaToDraft6. No release, reaches users at 19.0.0.** Finding
13. Detection, per draft downconversion and layout normalisation become three
functions with no behaviour change, so the acceptance criterion is that not one
of the 400 moves. The normaliser must keep the property level `required: true`
collection, which is ungated today.

**5. The breaking correctness boundary. Ships at 19.0.0.** Findings 3, 15, 11,
12, 14, 5, 6, 21, the layout residual of 10, the `getFlexAttribute` precedence
bug, and `defaultDraft` replacing the `optional` sniff with sniffing surviving as
an explicit opt in. `defaultDraft` is pinned to a literal draft rather than to
"the newest supported", which is what later makes new engines additive. Predicted
delta for `defaultDraft` is exactly 10 entries, `json-schema-draft01` and
`json-schema-draft02` across five legs, false to true.

**6. Toolchain only. Ships at 20.0.0.** Angular 20, the deferred
`use-application-builder` migration, and Karma to Vitest. Record the baseline
under both runners on the same commit and diff the two recordings, so runner
movement is isolated from everything else. The re-record is its own commit.

**7. Bootstrap 4 class drift. Ships at 20.1.0.** Cannot move a corpus case, since
`countControls` selects element names and not classes. Kept out of 20.0.0 so the
re-record diff is the only thing in that release.

**8. ajv 8 and the engine registry. Ships at 21.0.0.** ajv 6.12.6 to ajv 8,
`ajv-draft-04` for draft 4, a registry keyed on `$schema`, still drafts 4 through
7. Also measures whether running ajv over the whole document per keystroke is
acceptable, and produces the conditional layout design note.

**9. 2019-09 and 2020-12 engines. Ships at 21.1.0 onward.** Plus the
`prefixItems` mapping onto the tuple shape from phase 5. Legal at a minor because
a 2020-12 schema fails to compile today, so there is no working behaviour to
break, and because `defaultDraft` is a literal, so adding engines cannot
reinterpret the 75 schemas that declare no `$schema`.

**10. One validator implementation. Ships at 22.0.0.** ajv errors mapped onto
controls by JSON pointer. `JsonValidators` and `getControlValidators` are
deprecated and stay exported: both are public API through `shared/index.ts`, and
the freeze runs while the walk does.

**11. Conditional layout, opt in. Ships at 22.1.0 onward.** `if`, `then` and
`else` driving the layout behind a flag that defaults to off.

**12. After the freeze lifts.** Removing the deprecated validators, and `hasOwn`
revisited alone with a full corpus run.

## Every breaking step ships as a release candidate

Decided 2026-08-17. The 19.0.0 work is not one release. Each step is published as
`19.0.0-rc.N`, which carries a hyphen and so goes to the `next` dist-tag, leaving
`latest` on 18.3.0 until the series is finished. A consumer opts in with
`npm install @ajsf/core@next` and can report against a single change rather than
against a pile of them.

That fixes the order, because `version:set` writes the Angular peer ranges from
the major it is given. An `rc` numbered 19 cannot be cut while the workspace is
on Angular 18, so the upgrade comes first:

    19.0.0-rc.0   Angular 19 itself, no behaviour change
    19.0.0-rc.1   the converter split, ajv 8, draft 7 default, draft 4 floor
    19.0.0-rc.2   tuple slot semantics: finding 3
    19.0.0-rc.3   the array item template, and the two contained allOf defects
    19.0.0-rc.4   the allOf shaping defects, then the widget and submit changes
    19.0.0        promoted to latest once the series has been exercised

Numbering is per step rather than per finding, so a step can carry more than one
finding when they share a file. What matters is that a consumer bisecting a
regression lands on a change small enough to read, which the corpus cannot do for
them: five of the eight breaking findings are invisible to it.

Only the final stable release moves `latest`. A release candidate that turns out
wrong is abandoned rather than patched, since nothing depends on it by default.

## Finding 15, fixed at rc.3

`buildLayout` built the template a new array item is cloned from out of
`newNode.items[newNode.items.length - 1]`, the last item that already exists. On a
tuple array that is the last fixed slot, so the Add button handed back a copy of
it: the measured template for a two slot tuple with `additionalItems` carried
`title: 'Second'`, `dataPointer: '/pair/1'`, `arrayItemType: 'tuple'` and no
`options.removable` at all, so every added item duplicated the last fixed slot and
could not then be removed.

`buildLayoutFromSchema` already did this correctly, computing
`schemaPointer + '/additionalItems'` (or `'/items'` when `items` is a single
schema) and building the node. The two paths had diverged; the fix points the
custom layout path at the same source.

The clone is kept where it is right. A list array's last item genuinely is the
template, and only a tuple slot is the wrong thing to copy, so the guard is the
last item's `arrayItemType === 'tuple'` rather than the array having tuple items.
The `forEach` that nulls `_id` and slices `dataPointer` runs on the clone branch
only: a node from `buildLayoutFromSchema` arrives with no id and a relative
pointer already, so sharing that post processing would have sliced twice.

Seven specs on `buildLayout`, not the component test this section previously
called for. The template is readable straight out of `layoutRefLibrary`, so no
click has to be simulated to assert its shape. Five of the seven fail without the
fix, naming the defect: `'Second'` for `'Extra'`, `'tuple'` for `'list'`,
`'/pair/1'` unchanged, and `options.removable` undefined. The other two pin the
clone path that stays.

Corpus delta was predicted at zero on all 370 and measured at zero. The harness
presses no buttons, so the template is never materialised.

## Three decisions

**Decided 2026-08-17: sniffing goes, `defaultDraft` defaults to draft 7, and the
`required: true` collection stays ungated.** Draft 7 as a literal rather than "the
newest supported" is what keeps the 2019-09 and 2020-12 engines additive, and ajv
6.12.6 already validates draft 7, so this does not wait for ajv 8. The earlier
figure of 9 corpus schemas carrying property level `required: true` was wrong: a
raw grep counted the layout node feature and the JSONForm shorthand as well. It
reaches 3 of the 80.

**Patch findings 9 and 10 now, or wait for phase 10?** Roughly twelve lines that
phase 10 deletes. Recommend patching, because the specs proving them are the
keyword suite the later phases cannot ship without, and writing them at 18.3.0
removes the risk of that suite arriving late.

**Concentrate the eight breaking findings at 19.0.0, or spread them?** Recommend
concentrating, while noting the cost: 5 of the 8 are invisible to the corpus, so
a regression reported against 19.0.0 has no automated way to attribute itself.

## Least confident

The ajv 8 surface. Only 6.12.6 is installed here, so the moved refs path, the
`dataPath` to `instancePath` rename, strict mode and the removed options are all
unverified in this repository. Confirm each against an installed ajv 8 before
phase 8 is scheduled, because they decide whether it is a swap or a rewrite.

Whether any consumer imports `JsonValidators` directly. Nothing here can settle
it, which is why phases 10 and 12 deprecate before removing.
