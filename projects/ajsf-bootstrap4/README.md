# @ajsf/bootstrap4

Bootstrap 4 framework for [AJSF](https://github.com/hamzahamidi/ajsf#readme), which builds Angular forms from JSON Schema.

## Getting started

Install the package and Bootstrap 4:

```shell
npm install @ajsf/bootstrap4 bootstrap@4
```

Add Bootstrap's stylesheet to the `styles` of the build target in `angular.json`:

```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "src/styles.css"
]
```

Import `Bootstrap4FrameworkModule` in the standalone component that renders the form. Nothing goes in `app.config.ts`:

```typescript
import { Component } from '@angular/core';
import { Bootstrap4FrameworkModule } from '@ajsf/bootstrap4';

@Component({
  selector: 'app-root',
  imports: [Bootstrap4FrameworkModule],
  templateUrl: './app.html',
})
export class App {
  schema = {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
      plan: { type: 'string', title: 'Plan', enum: ['free', 'pro', 'team'] },
    },
    required: ['name'],
  };

  onSubmit(data: any) {
    console.log(data);
  }
}
```

In an `NgModule` app, add `Bootstrap4FrameworkModule` to the module's `imports` instead.

Then render the form in the component's template:

```html
<json-schema-form
  [schema]="schema"
  framework="bootstrap-4"
  (onSubmit)="onSubmit($event)">
</json-schema-form>
```

`framework="bootstrap-4"` selects this package's templates. The other values are `material-design`, `primeng`, `bootstrap-3`, `bootstrap-5` and `no-framework`, the default.

To try the library without installing Bootstrap, bind `[loadExternalAssets]="true"` on `<json-schema-form>` instead, which loads Bootstrap 4 from a CDN. Load the assets yourself in production.

The [AJSF README](https://github.com/hamzahamidi/ajsf#readme) covers the other inputs and outputs, layouts, custom widgets and validation messages.

## Bootstrap 4 markup, corrected in 20.1.0

This package previously emitted Bootstrap 3 class names. It was created as a
copy of `@ajsf/bootstrap3` with the CDN URL changed, so classes Bootstrap 4
had dropped kept being rendered and silently did nothing. If you have written
CSS against the old output, these are the names that changed.

| Was | Is now | Why |
| --- | --- | --- |
| `has-error`, `has-success`, `has-feedback` | `is-invalid` on the field wrapper | Bootstrap 4 marks the field, not the container |
| `help-block` | `form-text text-muted` | Bootstrap 4's help text class |
| `form-control-feedback`, `glyphicon` | removed | Bootstrap 4 ships no glyphicons |
| `input-group-addon` | `input-group-prepend` or `input-group-append` wrapping `input-group-text` | Bootstrap 4's addon structure |
| `pull-right` | `float-right` | renamed in Bootstrap 4 |
| `control-label` | no class | Bootstrap 4 styles a plain label in a stacked form |
| `btn-default` | `btn-secondary` | Bootstrap 4's neutral button |

`form-group` and `sr-only` are unchanged, because Bootstrap 4 still defines
both.

Validation messages also behave differently, and this part applies to
`@ajsf/bootstrap3` and `@ajsf/bootstrap5` too. A message used to appear only
once the value had changed, so focusing a required field and leaving it empty
showed nothing. It now appears once the field has been touched or changed.
Error text and help text are also separate elements now, so you can style one
without the other.

## Checkbox and radio structure, changed in 22.1.0

Checkboxes and radios previously rendered the `<input>` inside its `<label>`,
which is the Bootstrap 3 shape this package was copied from. They now render
as siblings inside a `.form-check` wrapper, which is what Bootstrap 4
documents and what its state styling requires:

    <div class="form-check">
      <input class="form-check-input" id="control1" type="checkbox">
      <label class="form-check-label" for="control1">Accept</label>
    </div>

The inline variants (`checkboxes-inline`, `radios-inline`) moved the same way,
from the deleted Bootstrap 3 `checkbox-inline` and `radio-inline` classes to
`form-check form-check-inline` on the same sibling shape.

Toggle buttons (`checkboxbuttons`, `radiobuttons`) are unchanged. Bootstrap 4
documents those as `.btn-group-toggle` with the input inside the label, and
has no `.btn-check`.

If you wrote CSS selecting `label > input` or styling the label as the
control's ancestor, that is where the difference is.

## Array row layout, changed in 22.2.0

The remove button on an array item used to be the first child of the field
wrapper and floated, so it left normal flow and sat at the top of the row
rather than beside the control. It now shares a flex row with the field. Beside
a single control it aligns to that control's centre; when the item is a group
of fields it anchors at the group's top edge, because a group's midpoint moves
as its contents grow.

Two details matter if you have written CSS against the old output. Every field
gains one wrapper element between the outer `form-group` container and the field
itself, and that wrapper becomes a flex container only on a removable array
item. The invalid marker moved onto that wrapper, so a selector written as
`.input-group.is-invalid` no longer matches; the marker is now on the
element directly above it.

## Array titles, changed in 22.2.0

An array rendered its title twice: once as the field label, and again as the
fieldset legend, which the widget rebuilt from the raw property name. A
`phone_numbers` property showed "Phone Numbers" followed by "Phone_numbers".

The title now belongs to the widget, as it already did for a fieldset, so it
renders once, on the `<legend>` that names the group, in the normalised
spelling. If your CSS targets the array label through `labelHtmlClass`, it now
applies to the legend.

The required marker moves with the title. It was previously appended only to
the framework's own label, so a required fieldset, whose title the widget
already owned, rendered no asterisk at all; it now does.
