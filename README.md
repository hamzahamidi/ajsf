# AJSF (Angular JSON Schema Form)

**N.B:** For Angular6-json-schema-form please check [this documentation](https://github.com/hamzahamidi/ajsf/tree/angular6-json-schema-form).

<p align="center">
  <a href="https://github.com/hamzahamidi/ajsf/actions?query=workflow%3ACI+branch%3Amain"><img src="https://github.com/hamzahamidi/ajsf/workflows/CI/badge.svg" alt="CI Status"></a>
  <a href="https://codecov.io/gh/hamzahamidi/ajsf"><img src="https://codecov.io/gh/hamzahamidi/ajsf/branch/main/graph/badge.svg" alt="Code coverage"></a>
  <a href="https://www.npmjs.com/package/@ajsf/core"><img src="https://img.shields.io/npm/dm/@ajsf/core.svg?style=plastic" alt="npm number of downloads"></a>
  <a href="https://github.com/hamzahamidi/ajsf/blob/main/LICENSE"><img src="https://img.shields.io/github/license/hamzahamidi/ajsf.svg?style=social" alt="MIT licence"></a>
  <a href="https://app.netlify.com/sites/ajsf/deploys"><img src="https://api.netlify.com/api/v1/badges/6c5b5a1d-db7c-4d0e-8ac1-a4840d8812f0/deploy-status" alt="Netlify Status"></a>
</p>

Note: This project is a continuation of [dschnelldavis/Angular2-json-schema-form](https://github.com/dschnelldavis/angular2-json-schema-form) and is not affiliated with any organization.

A [JSON Schema](http://json-schema.org) Form builder for Angular, similar to, and mostly API compatible with:

* [JSON Schema Form](https://github.com/json-schema-form)'s [Angular Schema Form](http://schemaform.io) for [AngularJS](https://angularjs.org) ([examples](http://schemaform.io/examples/bootstrap-example.html))
* [Mozilla](https://blog.mozilla.org/services/)'s [React JSON Schema Form](https://github.com/mozilla-services/react-jsonschema-form) for [React](https://react.dev) ([examples](https://mozilla-services.github.io/react-jsonschema-form/)), and
* [Joshfire](http://www.joshfire.com)'s [JSON Form](http://github.com/joshfire/jsonform/wiki) for [jQuery](https://jquery.com) ([examples](http://ulion.github.io/jsonform/playground/))

## Packages

* [`@ajsf/core`](./README.md) [![npm version](https://img.shields.io/npm/v/@ajsf/core.svg)](https://www.npmjs.com/package/@ajsf/core)
* [`@ajsf/bootstrap3`](./projects/ajsf-bootstrap3/README.md) [![npm version](https://img.shields.io/npm/v/@ajsf/bootstrap3.svg)](https://www.npmjs.com/package/@ajsf/bootstrap3)
* [`@ajsf/bootstrap4`](./projects/ajsf-bootstrap4/README.md) [![npm version](https://img.shields.io/npm/v/@ajsf/bootstrap4.svg)](https://www.npmjs.com/package/@ajsf/bootstrap4)
* [`@ajsf/bootstrap5`](./projects/ajsf-bootstrap5/README.md) [![npm version](https://img.shields.io/npm/v/@ajsf/bootstrap5.svg)](https://www.npmjs.com/package/@ajsf/bootstrap5)
* [`@ajsf/material`](./projects/ajsf-material/README.md) [![npm version](https://img.shields.io/npm/v/@ajsf/material.svg)](https://www.npmjs.com/package/@ajsf/material)

## Version compatibility

From `14.0.0` onward, the `@ajsf` major matches the Angular major it targets, the same
convention Angular Material uses. For the newest Angular major supported by AJSF, install
the current release:

```shell
npm install @ajsf/material
```

npm uses the `latest` tag when no version is specified. If your application uses an older
Angular major, install the matching AJSF major instead:

```shell
npm install @ajsf/material@17   # for Angular 17
```

Peer ranges are bounded from `14.0.0` onward, so npm reports a clear resolution error
rather than installing a combination that was never built or tested. This also means a
plain install fails when the application is not on the newest supported Angular major.

`0.8.0` and earlier predate this scheme. They declare open peer ranges (`>=14.0.0`) and
were built against Angular 14. There is no release for Angular 15, which reached end of
life. See the [versions on npm](https://www.npmjs.com/package/@ajsf/core?activeTab=versions)
for what is currently available.

### Upgrading from `0.8.0` to `14.0.0`

`@ajsf/material` no longer depends on [`@angular/flex-layout`](https://github.com/angular/flex-layout),
which is deprecated and has no Angular 16 release. You can uninstall it unless something
else in your project uses it.

No code change is needed. `FlexLayoutRootComponent`, `FlexLayoutSectionComponent`, the
`ng-jsf-flex-layout` widget and layout options such as `fxFlex`, `fxFlexAlign` and
`fxLayoutGap` all behave as before. The version jump is the Angular-aligned scheme
starting, not a rewrite: `14.0.0` targets the same Angular 14 that `0.8.0` did.

## JSON Schema versions

Your existing schemas keep working. AJSF stays backward compatible with the older drafts,
and nothing you have today needs changing.

| Draft | Status |
| --- | --- |
| Draft 1, 2, 3, 4 | Supported, converted to draft 6 internally |
| Draft 6 | Supported directly |
| Draft 7 | Supported, including `if`, `then` and `else` |
| 2019-09, 2020-12 | Not supported yet |

Older drafts pass through `convertSchemaToDraft6` before the form is built. Keywords it
does not recognise are carried through untouched rather than dropped, which is why draft 7
schemas validate correctly.

Two limits are worth knowing about before you rely on them.

**Draft 7 conditionals validate, but the layout does not follow them.** `if`, `then` and
`else` are enforced, so a field that becomes required because of another field's value
really is required and the form will not submit without it. The layout is built once,
though, so that field is not marked as required until you try to submit. `readOnly` and
`writeOnly` are accepted and currently have no effect: they are annotations, and neither
the validator nor the widgets act on them.

**2020-12 is not supported yet.** A schema declaring
`"$schema": "https://json-schema.org/draft/2020-12/schema"` fails to compile and the form
does not render, so it fails loudly rather than quietly. It needs a newer validator, and
`prefixItems` replaces the array form of `items`, which is how AJSF recognises tuples.

## Check out the live demo and play with the examples

[Check out some examples here.](https://hamidihamza.com/ajsf)

The playground includes more than 70 JSON Schemas. You can render each one with Material Design, Bootstrap 3, Bootstrap 4, Bootstrap 5, or plain HTML.

## Installation

### To install from npm or Yarn and use in your own project

Pick the package for the UI you want. [`@ajsf/material`](https://www.npmjs.com/package/@ajsf/material) renders with [Angular Material](https://material.angular.io), and there are Bootstrap 3, Bootstrap 4 and Bootstrap 5 packages alongside it.

`@ajsf/material` renders Angular Material components, so it declares `@angular/material` and `@angular/cdk` as peer dependencies. Your app needs both installed, with a theme and animations set up. `ng add @angular/material` does all three:

```shell
ng add @angular/material
```

Then install AJSF. npm uses the current `latest` release when no version is specified:

```shell
npm install @ajsf/material
```

Or with [Yarn](https://yarnpkg.com):

```shell
yarn add @ajsf/material
```

For an older Angular major, install the matching AJSF major as described in
[Version compatibility](#version-compatibility).

Then import `MaterialDesignFrameworkModule` in your main application module like this:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { MaterialDesignFrameworkModule } from '@ajsf/material';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [ AppComponent ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialDesignFrameworkModule
  ],
  providers: [],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
```

`BrowserAnimationsModule` is required, not optional: the framework module pulls in `MatSelect`, `MatDatepicker`, `MatExpansion`, `MatTabs`, `MatStepper` and others that use animations, and without it the first form throws `Found the synthetic property @transformPanel`. Use `NoopAnimationsModule` instead if you want the components without the motion.

Four framework modules are available. Choose the one that matches the UI you want:

* `MaterialDesignFrameworkModule` from `@ajsf/material` for Material Design
* `Bootstrap3FrameworkModule` from `@ajsf/bootstrap3` for Bootstrap 3
* `Bootstrap4FrameworkModule` from `@ajsf/bootstrap4` for Bootstrap 4
* `Bootstrap5FrameworkModule` from `@ajsf/bootstrap5` for Bootstrap 5
* `JsonSchemaFormModule` from `@ajsf/core` for plain HTML (no styling)

It is also possible to load multiple frameworks and switch between them at runtime, like the example playground on GitHub. But most typical sites will just load one framework.

### To install from GitHub

To run [the library and the example playground from GitHub](https://github.com/hamzahamidi/ajsf), assuming you have [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Node](https://nodejs.org/en/download/) installed, enter the following in your terminal:

```shell
git clone https://github.com/hamzahamidi/ajsf.git ajsf
cd ajsf
npm ci
npm start
```

The repository ships a `package-lock.json`, so use npm rather than Yarn here: `npm ci` installs exactly the versions CI builds and tests with. See [`.nvmrc`](./.nvmrc) for the Node version.

This starts the example playground at `http://localhost:4200`.

The main directories are:

* `projects/ajsf-core`: Angular JSON Schema Form main library
* `projects/ajsf-bootstrap3`: Bootstrap 3 framework
* `projects/ajsf-bootstrap4`: Bootstrap 4 framework
* `projects/ajsf-bootstrap5`: Bootstrap 5 framework
* `projects/ajsf-material`: Angular Material framework
* `projects/ajsf-core/src/lib/framework-library`: framework library
* `projects/ajsf-core/src/lib/widget-library`: widget library
* `projects/ajsf-core/src/lib/shared`: utilities and helper functions
* `demo`: example playground application
* `demo/assets/example-schemas`: JSON Schema examples used in the playground

There is no generated API reference yet. The functions under `projects/ajsf-core/src/lib/shared` carry doc comments describing what they do; the widget and framework libraries mostly do not.

## Using Angular JSON Schema Form

### Basic use

For basic use, after loading JsonSchemaFormModule as described above, to display a form in your Angular component, simply add the following to your component's template:

```html
<json-schema-form
  loadExternalAssets="true"
  [schema]="yourJsonSchema"
  framework="no-framework"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

Here, `schema` is a valid JSON Schema object and `onSubmit` calls a function that processes the submitted form data. Sample schemas are available in `demo/assets/example-schemas`.

`framework` selects the template set to render with. The default is `no-framework`. The possible values are:

* `material-design` for Material Design
* `bootstrap-3` for Bootstrap 3
* `bootstrap-4` for Bootstrap 4
* `bootstrap-5` for Bootstrap 5
* `no-framework` for plain HTML

Setting `loadExternalAssets="true"` loads assets the display framework needs from a CDN. It is useful while trying the library out, but production sites should load those assets themselves. See [Loading external assets required by a framework](#loading-external-assets-required-by-a-framework) for details.

Note what this does and does not cover. For `bootstrap-4` and `bootstrap-5` it loads Bootstrap's CSS and JavaScript, so a form is styled straight away. For `material-design` it loads only the Material Icons and Roboto fonts: an Angular Material **theme is not included**, so add one to your app as `ng add @angular/material` offers to do, or the controls render unthemed.

### Data-only mode

Angular JSON Schema Form can also create a form entirely from a JSON object, with no schema, like so:

```html
<json-schema-form
  loadExternalAssets="true"
  [(ngModel)]="exampleJsonObject">
</json-schema-form>
```

```javascript
exampleJsonObject = {
  "first_name": "Jane", "last_name": "Doe", "age": 25, "is_company": false,
  "address": {
    "street_1": "123 Main St.", "street_2": null,
    "city": "Las Vegas", "state": "NV", "zip_code": "89123"
  },
  "phone_numbers": [
    { "number": "702-123-4567", "type": "cell" },
    { "number": "702-987-6543", "type": "work" }
  ], "notes": ""
};
```

In this mode, Angular JSON Schema Form automatically generates a schema from your data. The generated schema is relatively simple, compared to what you could create on your own. However, as the above example shows, it does detect and enforce string, number, and boolean values (nulls are also assumed to be strings), and automatically allows array elements to be added, removed, and reordered.

After displaying a form in this mode, use the `formSchema` and `formLayout` outputs to inspect the generated schema and layout. See [Debugging inputs and outputs](#debugging-inputs-and-outputs).

The `ngModel` input supports Angular's bidirectional data binding, so an `onSubmit` function is not always necessary.

### Advanced use

#### Additional inputs and outputs

For more control over your form, you may provide these additional inputs:

* `layout` array with a custom form layout (see Angular Schema Form's [form definitions](https://github.com/json-schema-form/angular-schema-form/blob/master/docs/index.md#form-definitions) for information about how to construct a form layout)
* `data` object to populate the form with default or previously submitted values
* `options` object to set any global options for the form
* `widgets` object to add custom widgets
* `language` string to set the error message language (currently supports `de`, `en`, `es`, `fr`, `it`, `pt`, and `zh`)
* `framework` string or object to set which framework to use

For `framework`, pass a custom framework object or the name of a loaded framework. The included names are `material-design`, `bootstrap-3`, `bootstrap-4`, `bootstrap-5`, and `no-framework`.

If you want more detailed output, you may provide additional functions for `onChanges` to read the values in real time as the form is being filled out, and you may implement your own custom validation indicators from the boolean `isValid` or the detailed `validationErrors` outputs.

Here is an example:

```html
<json-schema-form
  [schema]="yourJsonSchema"
  [layout]="yourJsonFormLayout"
  [(data)]="yourData"
  [options]="yourFormOptions"
  [widgets]="yourCustomWidgets"
  language="fr"
  framework="material-design"
  loadExternalAssets="true"
  (onChanges)="yourOnChangesFn($event)"
  (onSubmit)="yourOnSubmitFn($event)"
  (isValid)="yourIsValidFn($event)"
  (validationErrors)="yourValidationErrorsFn($event)">
</json-schema-form>
```

Note: If you prefer brackets around all your attributes, the following is functionally equivalent:

```html
<json-schema-form
[schema]="yourJsonSchema"
[layout]="yourJsonFormLayout"
[(data)]="yourData"
[options]="yourFormOptions"
[widgets]="yourCustomWidgets"
[language]="'fr'"
[framework]="'material-design'"
[loadExternalAssets]="true"
(onChanges)="yourOnChangesFn($event)"
(onSubmit)="yourOnSubmitFn($event)"
(isValid)="yourIsValidFn($event)"
(validationErrors)="yourValidationErrorsFn($event)">
</json-schema-form>
```

With this syntax, include the nested quotes (`"'` and `'"`) around language and framework names. Without the inner quotes, Angular reads the values as variables instead of strings. Attributes without brackets are read as strings and do not need inner quotes.

#### Single-input mode

You may also combine all your inputs into one compound object and include it as a `form` input, like so:

```javascript
const yourCompoundInputObject = {
  schema:    { ... },  // REQUIRED
  layout:    [ ... ],  // optional
  data:      { ... },  // optional
  options:   { ... },  // optional
  widgets:   { ... },  // optional
  language:   '...' ,  // optional
  framework:  '...'    // (or { ... }) optional
}
```

```html
<json-schema-form
  [form]="yourCompoundInputObject"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

You can also mix these two styles depending on your needs. In the example playground, all examples use the combined `form` input for `schema`, `layout`, and `data`, which enables each example to control those three inputs, but the playground uses separate inputs for `language` and `framework`, enabling it to change those settings independent of the example.

Combining inputs is useful when each form stores its data and schema together. Separate inputs are often clearer for one form or several forms with the same structure. A custom layout can still be stored with its schema and passed through the combined input.

#### Compatibility modes

If you have used Angular Schema Form for AngularJS, React JSON Schema Form, or JSON Form for jQuery, Angular JSON Schema Form recognizes their input names and custom input objects. It also accepts the [truncated draft 3 format supported by JSON Form](https://github.com/joshfire/jsonform/wiki#schema-shortcut). See [JSON Schema versions](#json-schema-versions) for the drafts AJSF supports.

Angular Schema Form (AngularJS) compatibility:

```html
<json-schema-form
  [schema]="yourJsonSchema"
  [form]="yourAngularSchemaFormLayout"
  [(model)]="yourData">
</json-schema-form>
```

React JSON Schema Form compatibility:

```html
<json-schema-form
  [schema]="yourJsonSchema"
  [UISchema]="yourReactJsonSchemaFormUISchema"
  [(formData)]="yourData">
</json-schema-form>
```

JSON Form (jQuery) compatibility:

```html
<json-schema-form
  [form]="{
    schema: yourJsonSchema,
    form: yourJsonFormLayout,
    customFormItems: yourJsonFormCustomFormItems,
    value: yourData
  }">
</json-schema-form>
```

Bidirectional data binding works with the `data`, `model`, `ngModel`, and `formData` inputs. It does not work with the combined `form` input.

#### Debugging inputs and outputs

Finally, Angular JSON Schema Form includes some additional inputs and outputs for debugging:

* `debug` input: activates debugging mode.
* `loadExternalAssets` input: loads the external JavaScript and CSS the selected framework needs from a CDN. Useful while trying the library out, but not reliable enough for production, where you should load those assets yourself. If the console reports that an asset failed to load (jQuery, for example, which Bootstrap 3 needs), reloading the page usually fixes it.
* `formSchema` and `formLayout` outputs: return the final schema and layout used to build the form. That shows how your inputs were modified, or, if you gave none, the ones generated from your data.

```html
<json-schema-form
  [schema]="yourJsonSchema"
  [debug]="true"
  loadExternalAssets="true"
  (formSchema)="showFormSchemaFn($event)"
  (formLayout)="showFormLayoutFn($event)">
</json-schema-form>
```

## Customizing

In addition to a large number of user-settable options, Angular JSON Schema Form also has the ability to load custom form control widgets and layout frameworks. All forms are constructed from these basic components. The default widget library includes all standard HTML 5 form controls, as well as several common layout patterns, such as multiple checkboxes and tab sets. The default framework library includes templates to style forms using Material Design, Bootstrap 3, Bootstrap 4, or Bootstrap 5 (or plain HTML with no formatting, which is not useful in production, but can be helpful for development and debugging).

### User settings

(TODO: List all available user settings, and configuration options for each.)

### Creating custom input validation error messages

You can easily add your own custom input validation error messages, either for individual control widgets, or for your entire form.

#### Setting error messages for individual controls or the entire form

To set messages for individual form controls, add them to that control's node in the form layout, like this:

```javascript
const yourFormLayout = [
  { key: 'name',
    title: 'Enter your name',
    validationMessages: {
      // Put your error messages for the 'name' field here
    }
  },
  { type: 'submit', title: 'Submit' }
]
```

To set messages for the entire form, add them to `defautWidgetOptions.validationMessages` in the form options. The `defautWidgetOptions` spelling is part of the public API and is preserved for compatibility.

```javascript
const yourFormOptions = {
  defautWidgetOptions: {
    validationMessages: {
      // Put your error messages for the entire form here
    }
  }
}
```

#### How to format error messages

The `validationMessages` object uses validator names as keys and messages as values. Messages may use any of these formats:

* String: A plain text message, which is always the same.
* String template: Text containing Angular template style `{{variables}}`, replaced with values from the returned error object.
* Function: A JavaScript function which accepts the error object as input, and returns a string error message.

Here are examples of all three error message types:

```javascript
validationMessages: {

  // String error message
  required: 'This field is required.',

  // String template error message
  // - minimumLength variable will be replaced
  minLength: 'Must be at least {{minimumLength}} characters long.',

  // Function error message
  // Example error: { minimumValue: 2, currentValue: 1 }
  minimum: function(error) {
    return `Must be at least ${error.minimumValue}; received ${error.currentValue}.`;
  }
}
```

The message key must match the validator error it handles. The table below lists the values available to each message.

#### Available input validation errors and object values

Here is a list of all the built-in JSON Schema errors, which data type each error is available for, and the values in their returned error objects:

Error name       | Data type | Returned error object values
-----------------|-----------|-----------------------------------------
required         |  any      | (none)
type             |  any      | requiredType,          currentValue
const            |  any      | requiredValue,         currentValue
enum             |  any      | allowedValues,         currentValue
minLength        |  string   | minimumLength,         currentLength
maxLength        |  string   | maximumLength,         currentLength
pattern          |  string   | requiredPattern,       currentValue
format           |  string   | requiredFormat,        currentValue
minimum          |  number   | minimumValue,          currentValue
exclusiveMinimum |  number   | exclusiveMinimumValue, currentValue
maximum          |  number   | maximumValue,          currentValue
exclusiveMaximum |  number   | exclusiveMaximumValue, currentValue
multipleOf       |  number   | multipleOfValue,       currentValue
minProperties    |  object   | minimumProperties,     currentProperties
maxProperties    |  object   | maximumProperties,     currentProperties
 dependencies  * |  object   | (varies, based on dependencies schema)
minItems         |  array    | minimumItems,          currentItems
maxItems         |  array    | maximumItems,          currentItems
uniqueItems      |  array    | duplicateItems
 contains      * |  array    | requiredItem

* Note: The `contains` and `dependencies` validators are still in development, and do not yet work correctly.

### Changing or adding widgets

To add a new widget or override an existing widget, either add an object containing your new widgets to the `widgets` input of the `<json-schema-form>` tag, or load the `WidgetLibraryService` and call `registerWidget(widgetType, widgetComponent)`, with a string type name and an Angular component to be used whenever a form needs that widget type.

Example:

```javascript
import { YourInputWidgetComponent } from './your-input-widget.component';
import { YourCustomWidgetComponent } from './your-custom-widget.component';
...
const yourNewWidgets = {
  'text': YourInputWidgetComponent,           // Replace the existing 'text' widget
  'custom-control': YourCustomWidgetComponent // Add a new 'custom-control' widget
}
```

Use the widget map in a form:

```html
<json-schema-form
  [schema]="yourJsonSchema"
  [widgets]="yourNewWidgets">
</json-schema-form>
```

You can also register widgets directly:

```javascript
import { WidgetLibraryService } from '@ajsf/core';
...
constructor(private widgetLibrary: WidgetLibraryService) { }
...
// Replace the existing 'text' widget:
widgetLibrary.registerWidget('text', YourInputWidgetComponent);
// Add new 'custom-control' widget:
widgetLibrary.registerWidget('custom-control', YourCustomWidgetComponent);
```

Call `getAllWidgets()` on `WidgetLibraryService` to inspect the registered widgets. Default widgets are in [`projects/ajsf-core/src/lib/widget-library`](https://github.com/hamzahamidi/ajsf/tree/main/projects/ajsf-core/src/lib/widget-library), and Material widgets are in [`projects/ajsf-material/src/lib/widgets`](https://github.com/hamzahamidi/ajsf/tree/main/projects/ajsf-material/src/lib/widgets). Bootstrap 3, Bootstrap 4 and Bootstrap 5 reformat the default widgets and do not provide custom widgets.

### Changing or adding frameworks

To change the active framework, either use the `framework` input of the `<json-schema-form>` tag, or load the `FrameworkLibraryService` and call `setFramework(yourCustomFramework)`, with either the name of an available framework ('bootstrap-3', 'bootstrap-4', 'bootstrap-5', 'material-design', or 'no-framework'), or with your own custom framework object, like so:

```javascript
import { YourFrameworkComponent } from './your-framework.component';
import { YourWidgetComponent } from './your-widget.component';
...
const yourCustomFramework = {
  framework: YourFrameworkComponent,                                // required
  widgets:     { 'your-widget-name': YourWidgetComponent,   ... },  // optional
  stylesheets: [ '//url-to-framework-external-style-sheet', ... ],  // optional
  scripts:     [ '//url-to-framework-external-script',      ... ]   // optional
}
```

Use the framework in a form:

```html
<json-schema-form
  [schema]="yourJsonSchema"
  [framework]="yourCustomFramework">
</json-schema-form>
```

You can also register it directly:

```javascript
import { FrameworkLibraryService } from '@ajsf/core';
...
constructor(private frameworkLibrary: FrameworkLibraryService) { }
...
frameworkLibrary.setFramework(yourCustomFramework);
```

The required `framework` key is the Angular component used to format each widget. The optional `widgets` object overrides or adds widgets. The optional `stylesheets` and `scripts` arrays contain external assets loaded when `loadExternalAssets` is `true`.

#### Loading external assets required by a framework

Most UI frameworks need external JavaScript or CSS assets. Load them in your application before rendering an Angular JSON Schema Form. See the setup guides for [Bootstrap](https://getbootstrap.com/docs/4.6/getting-started/introduction/) and [Angular Material](https://material.angular.io/guide/getting-started).

During development, Angular JSON Schema Form can load these resources for you in three ways:

* Call `setFramework` with a second parameter of `true` (e.g. `setFramework('material-design', true)`), or
* Add `loadExternalAssets: true` to your `options` object, or
* Add `loadExternalAssets="true"` to your `<json-schema-form>` tag, as shown above

Finally, if you want to see what scripts a particular framework will automatically load, after setting that framework you can call `getFrameworkStylesheets()` or `getFrameworkScripts()` from the `FrameworkLibraryService` to return the built-in arrays of URLs.

In production, load these assets in the application and remove `loadExternalAssets` to avoid loading them twice.

## Sponsors

[Support AJSF through GitHub Sponsors](https://github.com/sponsors/hamzahamidi). Sponsors are recognized here according to their selected tier.

## Contributing

See the [contributing guide](./CONTRIBUTING.md) for local setup, tests, and pull request guidance.

## License

[MIT](https://github.com/hamzahamidi/ajsf/blob/main/LICENSE)
