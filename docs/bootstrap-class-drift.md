# Bootstrap class drift

Why fields have no spacing in Bootstrap 5 and why checkboxes look unstyled in
Bootstrap 4. Measured against the live demo on 2026-08-16, Bootstrap 4.3.1 and
5.3.8 as pinned in each framework.

## Mechanism

`bootstrapN-framework.component.ts` appends classes to `options.htmlClass`, and
the template renders `<div [class]="options?.htmlClass || ''">`. Nothing else
supplies layout. When Bootstrap drops a class, the div keeps rendering it and
silently loses the styling, with no error anywhere.

## What is emitted

The Bootstrap 3 and Bootstrap 4 packages emit an identical class list. The
Bootstrap 4 package is a copy of the Bootstrap 3 one with the CDN URL changed,
so it serves Bootstrap 3 markup against Bootstrap 4 CSS.

Probed by comparing computed styles of a bare element against the same element
carrying the class. The two replacement columns differ, so read the one for the
package being changed.

    class                    BS4   fix for BS4        BS5   fix for BS5
    form-group               live  keep               DEAD  mb-3
    checkbox / radio         DEAD  form-check         DEAD  form-check
    control-label            DEAD  col-form-label     DEAD  form-label
    help-block               DEAD  form-text          DEAD  form-text
    form-control-feedback    DEAD  invalid-feedback   DEAD  invalid-feedback
    has-error / has-success  DEAD  is-invalid         DEAD  is-invalid
    input-group-addon        DEAD  input-group-text   DEAD  input-group-text
    pull-right               DEAD  float-right        DEAD  float-end
    glyphicon                DEAD  none, BS4 dropped  DEAD  none
    input-group-append       live  keep               DEAD  drop the wrapper
    sr-only                  live  keep               DEAD  visually-hidden

`form-group` is the only one Bootstrap 4 kept, which is why Bootstrap 4 has
vertical rhythm and Bootstrap 5 has none. It is the whole of the reported
symptom.

The Bootstrap 5 package is the better migrated of the two. Its template already
uses `float-end`, `visually-hidden`, `form-text`, `invalid-feedback`,
`is-invalid` and `input-group-text`. What it inherited unchanged is the class
list in the component class, which is where `form-group`, `checkbox` and
`radio` are added.

## Fixed

`form-group` became `mb-3` and `control-label` became `form-label`, both in the
Bootstrap 5 component class. That restores the vertical rhythm, which was the
reported symptom, and gives labels their half rem of separation. Two lines,
because both classes land on elements the framework template renders itself.

## Still open

`checkbox` and `radio` are not a rename. Bootstrap wants `form-check` on a
wrapper, `form-check-input` on the input and `form-check-label` on the label.
The framework can set the last two through `fieldHtmlClass` and
`itemLabelHtmlClass`, but `checkbox-widget` in core renders a bare `<label>`
holding an `<input>` and a `<span>`, with no wrapper for `form-check` to land
on. So it needs a core widget change, not a framework one, and it affects every
framework that renders a checkbox.

The Bootstrap 4 pass is larger still. Every row above needs its Bootstrap 4
column applied, and the result is a visible change for anyone relying on the
current output, so it wants its own release note rather than a quiet fix.

Bootstrap 3 is correct as it stands and should not be touched.

## Testing

The corpus cannot referee this. It records `controls`, `error` and `valid`, and
a class rename moves none of them. It needs DOM assertions in the framework
component specs instead, asserting the emitted class rather than its effect, so
the test does not depend on a CDN.

One caveat on the probe: it detects classes whose rules set properties on the
element itself. A purely contextual selector such as `.tab-content > .tab-pane`
reads as DEAD even when defined, so `tab-content` and `active` in the emitted
list are unverified rather than confirmed dead.
