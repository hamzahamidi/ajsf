# @ajsf/primeng

## Getting started

```shell
npm install @ajsf/primeng@latest
```

With YARN, run the following:

```shell
yarn add @ajsf/primeng@latest
```

### PrimeNG needs @angular/animations at your Angular patch version

Install `@angular/animations` at the same patch version as the rest of your
Angular framework packages. PrimeNG 20 declares it as a peer dependency, and
Angular 20 no longer adds it to a new project, so npm resolves it on its own.
The Angular framework packages peer on each other by exact patch, so a version
npm picks freely can leave the install unresolvable:

```shell
# if your @angular/* packages are 20.3.31
npm install @angular/animations@20.3.31
```

Without it, installing `@ajsf/primeng` alongside `primeng` can fail with
`ERESOLVE`, reporting that `@angular/animations` peers `@angular/common` at a
version other than the one you have.

This is a PrimeNG installation requirement rather than an `@ajsf/primeng` one,
which is why it is not declared as a peer here: a range such as `^20.0.0` would
not fix it, because npm could still choose a patch that disagrees with yours.

Then import `PrimengFrameworkModule` in your main application module if you want to use `primeng` UI, like this:

```javascript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { PrimengFrameworkModule } from '@ajsf/primeng';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [ AppComponent ],
  imports: [
    PrimengFrameworkModule
  ],
  providers: [],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
```

PrimeNG is configured by the consuming application, not by this package. Set up
`providePrimeNG` with a theme preset from `@primeuix/themes` once, as PrimeNG's own
installation guide describes. This package uses PrimeNG components and leaves the
theme to you.

For basic use, after loading the module as described above, to display a form in your Angular component, simply add the following to your component's template:

```html
<json-schema-form
  [schema]="yourJsonSchema"
  framework="primeng"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

Where `schema` is a valid JSON schema object, and `onSubmit` calls a function to process the submitted JSON form data.

## Build

Run `ng build @ajsf/primeng` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test @ajsf/primeng` to execute the unit tests via [Karma](https://karma-runner.github.io).
