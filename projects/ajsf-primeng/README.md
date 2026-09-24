# @ajsf/primeng

PrimeNG framework for [AJSF](https://github.com/hamzahamidi/ajsf#readme), which builds Angular forms from JSON Schema.

## Getting started

Install the package and PrimeNG at your Angular major, with a theme package. For Angular 22:

```shell
npm install @ajsf/primeng@22 primeng@22 @primeuix/themes
```

npm adds `@angular/cdk`, which PrimeNG declares as a peer dependency. `@angular/animations` is not needed: PrimeNG 22 neither declares nor imports it.

PrimeNG is configured by the consuming application, not by this package. Set up `providePrimeNG` with a preset from `@primeuix/themes` once, in `app.config.ts`:

```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    providePrimeNG({ theme: { preset: Aura } }),
  ]
};
```

Import `PrimengFrameworkModule` in the standalone component that renders the form:

```typescript
import { Component } from '@angular/core';
import { PrimengFrameworkModule } from '@ajsf/primeng';

@Component({
  selector: 'app-root',
  imports: [PrimengFrameworkModule],
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

In an `NgModule` app, add `PrimengFrameworkModule` to the module's `imports` and the `providePrimeNG(...)` call to its `providers` instead.

Then render the form in the component's template:

```html
<json-schema-form
  [schema]="schema"
  framework="primeng"
  (onSubmit)="onSubmit($event)">
</json-schema-form>
```

`framework="primeng"` selects this package's widgets. The other values are `material-design`, `bootstrap-3`, `bootstrap-4`, `bootstrap-5` and `no-framework`, the default.

This package takes the initial bundle of a new app to 1.55 MB, above the 1 MB `maximumError` budget `ng new` writes into `angular.json`, so raise the `initial` budget of the `production` configuration, for example to `"maximumWarning": "2MB"` and `"maximumError": "2.5MB"`.

PrimeNG 22 checks for a PrimeUI license key when the app starts. Without one it logs `[PrimeUI] PrimeUI license is not configured.` and shows an "Invalid PrimeUI License" notice in the corner of the page. That comes from PrimeNG, not from this package; PrimeNG's own documentation covers its license terms and how to configure a key.

The [AJSF README](https://github.com/hamzahamidi/ajsf#readme) covers the other inputs and outputs, layouts, custom widgets and validation messages.
