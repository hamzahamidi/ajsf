# @ajsf/bootstrap4

## Getting started

```shell
npm install @ajsf/bootstrap4@latest
```

With YARN, run the following:

```shell
yarn add @ajsf/bootstrap4@latest
```

Then import `Bootstrap4FrameworkModule` in your main application module if you want to use `bootstrap4` UI, like this:

```javascript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { Bootstrap4FrameworkModule } from '@ajsf/bootstrap4';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [ AppComponent ],
  imports: [
    Bootstrap4FrameworkModule
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
  framework="bootstrap-4"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

Where `schema` is a valid JSON schema object, and `onSubmit` calls a function to process the submitted JSON form data. If you don't already have your own schemas, you can find a bunch of samples to test with in the `demo/assets/example-schemas` folder, as described above.

`framework` is for the template you want to use, the default value is `no-framwork`. The possible values are:

* `material-design` for  Material Design.
* `bootstrap-3` for Bootstrap 3.
* `bootstrap-4` for 'Bootstrap 4.
* `no-framework` for (plain HTML).

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

## Code scaffolding

Run `ng generate component component-name --project @ajsf/bootstrap4` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project @ajsf/bootstrap4`.
> Note: Don't forget to add `--project @ajsf/bootstrap4` or else it will be added to the default project in your `angular.json` file.

## Build

Run `ng build @ajsf/bootstrap4` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test @ajsf/bootstrap4` to execute the unit tests via [Karma](https://karma-runner.github.io).
