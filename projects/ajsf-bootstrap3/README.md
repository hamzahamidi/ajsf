# @ajsf/bootstrap3

## Getting started

```shell
npm install @ajsf/bootstrap3
```

With YARN, run the following:

```shell
yarn add @ajsf/bootstrap3
```

Then import `Bootstrap3FrameworkModule` in your main application module if you want to use `bootstrap3` UI, like this:

```javascript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { Bootstrap3FrameworkModule } from '@ajsf/bootstrap3';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [ AppComponent ],
  imports: [
    Bootstrap3FrameworkModule
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
  framework="bootstrap-3"
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

Run `ng generate component component-name --project @ajsf/bootstrap3` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project @ajsf/bootstrap3`.
> Note: Don't forget to add `--project @ajsf/bootstrap3` or else it will be added to the default project in your `angular.json` file.

## Build

Run `ng build @ajsf/bootstrap3` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test @ajsf/bootstrap3` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
