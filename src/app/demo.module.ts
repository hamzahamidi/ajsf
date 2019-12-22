import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AceEditorDirective } from './ace-editor.directive';
import { DemoComponent } from './demo.component';
import { DemoRootComponent } from './demo-root.component';
import { routes } from './demo.routes';
import { NoFrameworkModule } from 'angular6-json-schema-form';
import { Bootstrap4FrameworkModule } from 'ajsf-bootstrap4-framework';
import { Bootstrap3FrameworkModule } from 'ajsf-bootstrap3-framework';
import { MaterialDesignFrameworkModule } from 'ajsf-material-framework';

// To include JsonSchemaFormModule after downloading from NPM, use this instead:
//
//   import { JsonSchemaFormModule, NoFrameworkModule } from 'angular6-json-schema-form';
//
// but replace "NoFrameworkModule" with the framework you want to use,
// then import both JsonSchemaFormModule and the framework module, like this:
//
//   imports: [ ... NoFrameworkModule, JsonSchemaFormModule.forRoot(NoFrameworkModule) ... ]

@NgModule({
  declarations: [AceEditorDirective, DemoComponent, DemoRootComponent],
  imports: [
    BrowserModule, BrowserAnimationsModule, FlexLayoutModule, FormsModule,
    HttpClientModule, MatButtonModule, MatCardModule, MatCheckboxModule,
    MatIconModule, MatMenuModule, MatSelectModule, MatToolbarModule,
    RouterModule.forRoot(routes),
    Bootstrap4FrameworkModule,
    Bootstrap3FrameworkModule,
    MaterialDesignFrameworkModule,
    NoFrameworkModule
  ],
  bootstrap: [DemoRootComponent]
})

// Here, by loading 4 frameworks in JsonSchemaFormModule.forRoot(), the first,
// `NoFrameworkModule`, will be set active by default. But any of the 4 can
// be activated later by passing the framework's name to the <json-schema-form>
// tag's `framework` input. The names of these 4 frameworks are:
//   'no-framework'
//   'material-design-framework',
//   'bootstrap-3-framework'
//   'bootstrap-4-framework'

export class DemoModule { }
