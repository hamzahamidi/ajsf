# @ajsf/primeng plan

The [roadmap](./roadmap.md) decided the framework expansion order on 2026-08-24
and put `@ajsf/primeng` first. This is the implementation plan for it. It is a
thick package, so it replaces core's HTML widgets with PrimeNG components rather
than styling them, the way `@ajsf/material` does. `@ajsf/bootstrap5` is the thin
model and is not the template here.

The package can start now: `19.0.0` is promoted and `latest` is on the 19 line.

## What a thick package is made of

`@ajsf/material` is the shape to mirror, 19 widget components and about 1,892
lines. A new package registers in four places before any widget compiles:

    angular.json                 a projects entry, build and test targets
    tsconfig.json                @ajsf/primeng -> dist/@ajsf/primeng in paths
    package.json                 build:primeng, postbuild:primeng, test:primeng,
                                 and the three wired into build:libs and coverage
    scripts/set-version.js       the package added to the lockstep version set

The framework itself is one module, one framework class carrying the widget map,
one framework component with its template and styles, and the widgets directory
with a public_api.ts. corpus.spec.ts and test.ts come across unchanged in shape.

## Widget map

Core resolves a layout node's type through the framework's widget map. The 19
material keys and their PrimeNG 19 components:

    root          FlexLayoutRootComponent, carried over unchanged
    section       FlexLayoutSectionComponent, carried over unchanged
    $ref          an add-reference component, core logic, no PrimeNG surface
    button        p-button
    button-group  p-selectbutton
    checkbox      p-checkbox, binary
    checkboxes    p-checkbox list
    chip-list     p-autocomplete, multiple on and typeahead off
    date          p-datepicker, formerly p-calendar
    file          p-fileupload
    number        p-inputnumber
    one-of        p-select, formerly p-dropdown
    radios        p-radiobutton
    select        p-select
    slider        p-slider
    stepper       p-stepper
    tabs          p-tabs, formerly p-tabView
    text          pInputText directive on a plain input
    textarea      pTextarea directive on a textarea

The aliases material declares stay identical, since they resolve to the keys
above: alt-date, any-of, card, color, expansion-panel, hidden, image, integer,
radiobuttons, range, submit, tagsinput, wizard.

PrimeNG moved on from several of these at v18 and v19, and the map takes the
current component in each case rather than the one a v17 mapping would reach for.
Three are renames: p-dropdown to p-select, p-calendar to p-datepicker, p-tabView
to p-tabs. Two are deprecations. Chips is deprecated in favour of AutoComplete in
multiple mode with typeahead off, which also serves the tagsinput alias directly.
Steps is deprecated in favour of Stepper, the component PrimeNG documents for
wizard style flows, which the wizard alias resolves to.

Two widgets are decided here rather than copied. Material's checkboxes is a
visible list of boxes with a select all and an indeterminate state, so this
package renders the same with p-checkbox and does not substitute p-multiselect,
a dropdown, which is a different control and would be an enhancement behind a
layout option, not the default. Material's stepper ships an empty template, so
there is no implementation to port; this package builds the stepper from the
schema against p-stepper.

## Selectors are a one shot decision

Widget selector names become public API on first release, named in consumer
layout schemas, and the freeze forbids renaming them later. Material uses
`material-<widget>-widget`. This package uses `primeng-<widget>-widget`, for
example `primeng-input-widget` and `primeng-number-widget`, fixed before the
first publish and not revisited.

## PrimeNG as a peer, theme brought by the consumer

PrimeNG 19 configures its theme through `providePrimeNG` and `@primeng/themes`
in the consumer application, not through a bundled CSS file. The package
peer depends on `primeng` at `^19.0.0` and does not bundle a theme, the same way
`@ajsf/material` peer depends on `@angular/material` and leaves theming to the
app. The consumer sets up PrimeNG once; the package only uses its components.

## Sequence

1. Scaffold the four registration points and an empty framework that resolves
   every core widget through core's own components, so the package builds and
   serves before a single PrimeNG widget exists. Predicted corpus delta is the
   74 new entries recorded fresh, since the package is a new framework leg.
2. Port the flex layout root and section and the add-reference component from
   material, the three that carry no library surface.
3. The widgets, grouped by how much each borrows from the material equivalent:
   the plain input and textarea, then number, select, one-of and the boolean
   controls, then the composite widgets, date, file, slider, the tag input, stepper and
   tabs. Each widget lands with its unit specs, following the number and slider
   specs added for finding 10.
4. corpus.spec.ts records the 74 entry baseline for the new leg. A mispredicted
   delta is a defect in the pull request, not a baseline to re record.
5. CI gains a test:primeng leg and a coverage leg, matching the existing five.

## The first publish is gated on a manual step

OIDC cannot perform a package's first publish: npm will not configure a trusted
publisher for a package that does not exist. Before the first release that
contains `@ajsf/primeng`, a placeholder `0.0.0` is published from a machine with
an npm login and deprecated on the spot, then the trusted publisher is added at
npmjs.com. The steps are in the agent notes under the OIDC trap. This needs the
maintainer's npm login and is the one part of this plan the release workflow
cannot do.

Once the placeholder exists and set-version.js includes the package, the next
lockstep version bump publishes all six together, and `@ajsf/primeng` ships at
the current 19 line like the rest.
