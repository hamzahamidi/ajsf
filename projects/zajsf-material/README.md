# @zajsf/material

This module is a dependency of the [zajsf project][npm_core_ver] and is meant to work as a framework installation module for using Angular Material Design in the forms.

## Getting started

If you are unfamiliar with with the zajsf project, it is highly recommended to 
first have a look at the [@zajsf pages][npm_core_ver] for examples, demos, options and documentation.

```shell
npm install @zajsf/core@latest @zajsf/cssframework@latest @zajsf/material@latest
```

With YARN, run the following:

```shell
yarn add @zajsf/core@latest @zajsf/cssframework@latest @zajsf/material@latest
```

include the themes scss in your applications sass file(typically "styles.scss" under "src" folder -see angular docs for more details) 
```scss
@import "node_modules/@zajsf/material/assets/material-design-themes.scss";
```

Then import `MaterialDesignFrameworkModule` in your main application module if you want to use `material-angular` UI, like this:

```javascript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MaterialDesignFrameworkModule } from '@zajsf/material';

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
  [theme]="yourTheme"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

Where `schema` is a valid JSON schema object, and `onSubmit` calls a function to process the submitted JSON form data. If you don't already have your own schemas, you can find a bunch of samples to test with in the `demo/assets/example-schemas` folder, as described above.

`framework` is for the template you want to use, the default value is `no-framwork`. The possible values are:


* `material-design` for  Material Design.
* `bootstrap-3` for Bootstrap 3 (if installed).
* `bootstrap-4` for Bootstrap 4 (if installed).
* `bootstrap-5` for Bootstrap 5.(if installed).
* `daisyui` for DaisyUi (if installed).
* `no-framework` for (plain HTML).

`theme` is for the framework theme you want to use. 
The possible values for this framework are:

* `material_default` for the default theme.
* `indigo-pink` for the indigo & pink theme.
* `purple-green` for the purple & green theme.
* `deeppurple-amber` for the deep purple & amber theme.
* `pink-bluegrey` for the pink & blue-grey theme.

the list of available themes can also be gotten using the 
FrameworkLibraryService(found in '@zajsf/core'): 
 ```typescript
 getFrameworkThemes()
 ``` 
 method

## Custom theming

Custom theming can be achieved in the following way:

Adding a new theme:
the first step will be to create the entire theme (see the specific frameworks underlying documentation for how this can be done), then add the theme as
a css class

```sass
.material_custom {
    @include mat.core-color($custom-pink-theme);
    @include mat.all-component-colors($custom-pink-theme);
    @include mat.button-color($custom-pink-theme);
}

```
after making the css available, the theme will need to be registered using the  
FrameworkLibraryService(found in '@zajsf/core'):
for example 

```typescript
  constructor(
    .
    private frameworkLibrary: FrameworkLibraryService,
    .
    .
  ) { 

    frameworkLibrary.registerTheme({name:'material_custom',text:'Material custom theme'})

  }

```

## Code scaffolding

Run `ng generate component component-name --project @zajsf/material` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project @zajsf/material`.
> Note: Don't forget to add `--project @zajsf/material` or else it will be added to the default project in your `angular.json` file.

## Build

Run `ng build @zajsf/material` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test @zajsf/material` to execute the unit tests via [Karma](https://karma-runner.github.io).

[npm_core_ver]:https://www.npmjs.com/package/@zajsf/core