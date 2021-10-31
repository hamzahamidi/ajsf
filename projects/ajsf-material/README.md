# @ajsf/material

## Getting started

```shell
npm install @ajsf/material@latest
```

With YARN, run the following:

```shell
yarn add @ajsf/material@latest
```

Then import `MaterialDesignFrameworkModule` in your main application module if you want to use `material-angular` UI, like this:

```javascript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MaterialDesignFrameworkModule } from '@ajsf/material';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [ AppComponent ],
  imports: [
    MaterialDesignFrameworkModule
  ],
  providers: [],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
```

For basic use, after loading JsonSchemaFormModule as described above, to display a form in your Angular component, simply add the following to your component's template:

```html
<json-schema-form
  loadExternalAssets="true"
  [schema]="yourJsonSchema"
  framework="material-design"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

Where `schema` is a valid JSON schema object, and `onSubmit` calls a function to process the submitted JSON form data. If you don't already have your own schemas, you can find a bunch of samples to test with in the `demo/assets/example-schemas` folder, as described above.

`framework` is for the template you want to use, the default value is `no-framwork`. The possible values are:

* `material-design` for  Material Design.
* `bootstrap-3` for Bootstrap 3.
* `bootstrap-4` for 'Bootstrap 4.
* `no-framework` for (plain HTML).

## Code scaffolding

Run `ng generate component component-name --project @ajsf/material` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project @ajsf/material`.
> Note: Don't forget to add `--project @ajsf/material` or else it will be added to the default project in your `angular.json` file.

## Build

Run `ng build @ajsf/material` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test @ajsf/material` to execute the unit tests via [Karma](https://karma-runner.github.io).
