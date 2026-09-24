# @ajsf/bootstrap3

Bootstrap 3 framework for [AJSF](https://github.com/hamzahamidi/ajsf#readme), which builds Angular forms from JSON Schema.

## Getting started

Install the package and Bootstrap 3:

```shell
npm install @ajsf/bootstrap3 bootstrap@3
```

Add Bootstrap's stylesheet to the `styles` of the build target in `angular.json`:

```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "src/styles.css"
]
```

Import `Bootstrap3FrameworkModule` in the standalone component that renders the form. Nothing goes in `app.config.ts`:

```typescript
import { Component } from '@angular/core';
import { Bootstrap3FrameworkModule } from '@ajsf/bootstrap3';

@Component({
  selector: 'app-root',
  imports: [Bootstrap3FrameworkModule],
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

In an `NgModule` app, add `Bootstrap3FrameworkModule` to the module's `imports` instead.

Then render the form in the component's template:

```html
<json-schema-form
  [schema]="schema"
  framework="bootstrap-3"
  (onSubmit)="onSubmit($event)">
</json-schema-form>
```

`framework="bootstrap-3"` selects this package's templates. The other values are `material-design`, `primeng`, `bootstrap-4`, `bootstrap-5` and `no-framework`, the default.

To try the library without installing Bootstrap, bind `[loadExternalAssets]="true"` on `<json-schema-form>` instead, which loads Bootstrap 3 from a CDN. Load the assets yourself in production.

The [AJSF README](https://github.com/hamzahamidi/ajsf#readme) covers the other inputs and outputs, layouts, custom widgets and validation messages.

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
