# @ajsf/bootstrap5

## Getting started

```shell
npm install @ajsf/bootstrap5@latest
```

With YARN, run the following:

```shell
yarn add @ajsf/bootstrap5@latest
```

Then import `Bootstrap5FrameworkModule` in your main application module if you want to use `bootstrap5` UI, like this:

```javascript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { Bootstrap5FrameworkModule } from '@ajsf/bootstrap5';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [ AppComponent ],
  imports: [
    Bootstrap5FrameworkModule
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
  framework="bootstrap-5"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

Where `schema` is a valid JSON schema object, and `onSubmit` calls a function to process the submitted JSON form data. If you don't already have your own schemas, you can find a bunch of samples to test with in the `demo/assets/example-schemas` folder, as described above.

`framework` is for the template you want to use, the default value is `no-framwork`. The possible values are:

* `material-design` for  Material Design.
* `bootstrap-3` for Bootstrap 3.
* `bootstrap-5` for 'Bootstrap 5.
* `no-framework` for (plain HTML).

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

## Code scaffolding

Run `ng generate component component-name --project @ajsf/bootstrap5` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project @ajsf/bootstrap5`.
> Note: Don't forget to add `--project @ajsf/bootstrap5` or else it will be added to the default project in your `angular.json` file.

## Build

Run `ng build @ajsf/bootstrap5` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test @ajsf/bootstrap5` to execute the unit tests via [Karma](https://karma-runner.github.io).
