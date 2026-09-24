# @ajsf/material

Angular Material framework for [AJSF](https://github.com/hamzahamidi/ajsf#readme), which builds Angular forms from JSON Schema.

## Getting started

`@ajsf/material` declares `@angular/material` and `@angular/cdk` as peer dependencies and needs a Material theme. `ng add @angular/material` installs both and writes a theme:

```shell
ng add @angular/material
npm install @ajsf/material
```

Import `MaterialDesignFrameworkModule` in the standalone component that renders the form. Nothing goes in `app.config.ts`, and no animations provider is needed:

```typescript
import { Component } from '@angular/core';
import { MaterialDesignFrameworkModule } from '@ajsf/material';

@Component({
  selector: 'app-root',
  imports: [MaterialDesignFrameworkModule],
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

In an `NgModule` app, add `MaterialDesignFrameworkModule` to the module's `imports` instead.

Then render the form in the component's template:

```html
<json-schema-form
  [schema]="schema"
  framework="material-design"
  (onSubmit)="onSubmit($event)">
</json-schema-form>
```

`framework="material-design"` selects this package's widgets. The other values are `primeng`, `bootstrap-3`, `bootstrap-4`, `bootstrap-5` and `no-framework`, the default.

This package takes the initial bundle of a new app to 1.40 MB, above the 1 MB `maximumError` budget `ng new` writes into `angular.json`, so raise the `initial` budget of the `production` configuration, for example to `"maximumWarning": "2MB"` and `"maximumError": "2.5MB"`.

The [AJSF README](https://github.com/hamzahamidi/ajsf#readme) covers the other inputs and outputs, layouts, custom widgets and validation messages.
