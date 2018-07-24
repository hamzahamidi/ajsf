import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { WidgetLibraryModule } from './widget-library/widget-library.module';

import { JsonSchemaFormComponent } from './json-schema-form.component';

import { NoFrameworkModule } from './framework-library/no-framework/no-framework.module';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    WidgetLibraryModule, NoFrameworkModule
  ],
  declarations: [JsonSchemaFormComponent],
  exports: [JsonSchemaFormComponent, WidgetLibraryModule]
})
export class JsonSchemaFormModule {}
