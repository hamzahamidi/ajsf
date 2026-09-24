# @ajsf/bootstrap5

Bootstrap 5 framework for [AJSF](https://github.com/hamzahamidi/ajsf#readme), which builds Angular forms from JSON Schema.

## Getting started

Install the package and Bootstrap 5:

```shell
npm install @ajsf/bootstrap5 bootstrap@5
```

Add Bootstrap's stylesheet to the `styles` of the build target in `angular.json`:

```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "src/styles.css"
]
```

Import `Bootstrap5FrameworkModule` in the standalone component that renders the form. Nothing goes in `app.config.ts`:

```typescript
import { Component } from '@angular/core';
import { Bootstrap5FrameworkModule } from '@ajsf/bootstrap5';

@Component({
  selector: 'app-root',
  imports: [Bootstrap5FrameworkModule],
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

In an `NgModule` app, add `Bootstrap5FrameworkModule` to the module's `imports` instead.

Then render the form in the component's template:

```html
<json-schema-form
  [schema]="schema"
  framework="bootstrap-5"
  (onSubmit)="onSubmit($event)">
</json-schema-form>
```

`framework="bootstrap-5"` selects this package's templates. The other values are `material-design`, `primeng`, `bootstrap-3`, `bootstrap-4` and `no-framework`, the default.

To try the library without installing Bootstrap, bind `[loadExternalAssets]="true"` on `<json-schema-form>` instead, which loads Bootstrap 5 from a CDN. Load the assets yourself in production.

The [AJSF README](https://github.com/hamzahamidi/ajsf#readme) covers the other inputs and outputs, layouts, custom widgets and validation messages.

## Checkbox and radio structure, changed in 22.1.0

Checkboxes and radios previously rendered the `<input>` inside its `<label>`,
which is the Bootstrap 3 shape this package was copied from. They now render
as siblings inside a `.form-check` wrapper, which is what Bootstrap 5
documents and what its state styling requires:

    <div class="form-check">
      <input class="form-check-input" id="control1" type="checkbox">
      <label class="form-check-label" for="control1">Accept</label>
    </div>

Every variant takes this sibling shape, including toggle buttons
(`checkboxbuttons`, `radiobuttons`) and the inline forms (`checkboxes-inline`,
`radios-inline`), because Bootstrap 5 styles its `.btn-check` toggle buttons
through a sibling input too, unlike Bootstrap 4's nested `.btn-group-toggle`.

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
