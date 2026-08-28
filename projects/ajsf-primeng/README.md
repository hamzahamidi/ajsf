# @ajsf/primeng

## Getting started

```shell
npm install @ajsf/primeng@latest
```

With YARN, run the following:

```shell
yarn add @ajsf/primeng@latest
```

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
`providePrimeNG` with a theme preset from `@primeng/themes` once, as PrimeNG's own
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
