# @zajsf/bootstrap3
This module is a dependency of the [zajsf project][npm_core_ver] and is meant to work as a framework installation module for using Bootstrap 3 in the forms.

## Getting started

If you are unfamiliar with with the zajsf project, it is highly recommended to 
first have a look at the [@zajsf pages][npm_core_ver] for examples, demos, options and documentation.

```shell
npm install @zajsf/core@latest @zajsf/cssframework@latest @zajsf/bootstrap3@latest
```

With YARN, run the following:

```shell
yarn add @zajsf/core@latest @zajsf/cssframework@latest @zajsf/bootstrap3@latest
```

Then import `Bootstrap3FrameworkModule` in your main application module if you want to use `bootstrap3` UI, like this:

```javascript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { Bootstrap3FrameworkModule } from '@zajsf/bootstrap3';

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
  [theme]="yourTheme"
  (onSubmit)="yourOnSubmitFn($event)">
</json-schema-form>
```

Where `schema` is a valid JSON schema object, and `onSubmit` calls a function to process the submitted JSON form data. If you don't already have your own schemas, you can find a bunch of samples to test with in the `demo/assets/example-schemas` folder, as described above.

`framework` is for the template you want to use, the default value is `no-framwork`. The possible values are:

* `material-design` for  Material Design (if installed).
* `bootstrap-3` for Bootstrap 3.
* `bootstrap-4` for Bootstrap 4 (if installed).
* `bootstrap-5` for Bootstrap 5 (if installed).
* `daisyui` for DaisyUi (if installed).
* `no-framework` for (plain HTML).

`theme` is for the framework theme you want to use. 
The possible values for this framework are:

* `bootstrap3_default` for the default theme.

the list of available themes can also be gotten using the 
FrameworkLibraryService(found in '@zajsf/core'): 
 ```typescript
 getFrameworkThemes()
 ``` 
 method 

## Custom theming

Custom theming can be achieved in two ways:

* the simplest is to overwrite the default theme(or any other themes) with css rules:
css changes can be made using the `data-bs-theme` attribute selector
so for example to change the .btn class of the default theme, you would
include the following rule in your application's styles

```css
[data-bs-theme="bootstrap3_default"] .btn {
    border-radius: 1rem
}
```

* the other method is to add a new theme:
the first step will be to create the entire theme (see the specific frameworks underlying documentation for how this can be done) and have it use the `data-bs-theme` attribute selector for example:

```css
[data-bs-theme="bootstrap3_custom"] {
    background-color: green;
    font: 15px Arial, sans-serif;
    .
    .
    .
}
[data-bs-theme="bootstrap3_custom"] .btn {
    border-color: coral;
    .
    .
    .
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

    frameworkLibrary.registerTheme({name:'bootstrap3_custom',text:'Bootstrap3 custom theme'})

  }

```

## Framework assets

Framework assets are typically third party assets (mainly js and css files) that are loaded at runtime for the particular framework's styling and effects to activate.
By default these assets are loaded from built in cdn urls. These assets can also be self hosted or loaded from different urls if need be.
To use custom urls the following steps must be followed:


* create a file called assets.json somewhere in your app src folder
* edit the assets.json file so that it contains both 'stylesheets' and 'scripts' properties-ex:

```
{

    "stylesheets": [
      "http://some.domain/css/style1.css",
      "http://some.domain/css/style2.css",
      "localstyle.css",
      ...
      ],
    "scripts": [
      "http://some.domain/css/script1.js",
      "localscript.js",
      ...
    ]

}

```
* adapt your apps angular.json assets config accordingly, for example:
    
```
	"projects": {
        "<your project name>": {
			...
            "architect": {
                "build": {
                    "builder": "@angular-devkit/build-angular:browser",
                    "options": {
                        ...
                        "assets": [
                            ...
                            {
                                "glob": "assets.json",
                                "input": "src",
                                "output": "/assets/bootstrap-3"
                            },
                            {
                                "glob": "localstyle.css",
                                "input": "./some/path/to/framework/cssfolder/",
                                "output": "/assets/bootstrap-3/cssframework"
                            },
                            {
                                "glob": "localscript.js",
                                "input": "./some/path/to/framework/jsfolder/",
                                "output": "/assets/bootstrap-3/cssframework"
                            }
                        ],
						...
```
Note that relative asset urls will be assumed to reside under "/assets/bootstrap-3/cssframework" and the assets.json file must output to "/assets/bootstrap-3"

for convenince a default assets.json file is included for including the framework assets
from the node_modules folder, this assumes that the third party libraries were installed locally with npm and that they will reside in the "/assets/bootstrap-3/cssframework" deployment folder. In this case, the following config can be used and adapted similar to above:

```
...
                        "assets": [
                            ...
                           {
                                "glob": "**/*",
                                "input": "./node_modules/@zajsf/bootstrap3/assets",
                                "output": "/assets/bootstrap-3"
                            },
                            {
                                "glob": "jquery.min.js",
                                "input": "./node_modules/jquery/dist/",
                                "output": "/assets/bootstrap-3/cssframework"
                            },
                            {
                                "glob": "bootstrap.min.js",
                                "input": "./node_modules/bootstrap/dist/js/",
                                "output": "/assets/bootstrap-3/cssframework"
                            },
                            {
                                "glob": "bootstrap.min.css",
                                "input": "./node_modules/bootstrap/dist/css/",
                                "output": "/assets/bootstrap-3/cssframework"
                            },
                            {
                                "glob": "bootstrap-theme.min.css",
                                "input": "./node_modules/bootstrap/dist/css/",
                                "output": "/assets/bootstrap-3/cssframework"
                            }
                        ],
```





## Code scaffolding

Run `ng generate component component-name --project @zajsf/bootstrap3` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project @zajsf/bootstrap3`.
> Note: Don't forget to add `--project @zajsf/bootstrap3` or else it will be added to the default project in your `angular.json` file.

## Build

Run `ng build @zajsf/bootstrap3` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test @zajsf/bootstrap3` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

[npm_core_ver]:https://www.npmjs.com/package/@zajsf/core
