import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JsonSchemaFormComponent } from './json-schema-form.component';
import { NgModule } from '@angular/core';
import { NoFrameworkModule } from './framework-library/no-framework/no-framework.module';
import { WidgetLibraryModule } from './widget-library/widget-library.module';

import { SchemaValidatorFactory } from './schema-validator-factory';
import { AjvSchemaValidatorFactory } from './ajv-schema-validator-factory';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    WidgetLibraryModule, NoFrameworkModule
  ],
  declarations: [JsonSchemaFormComponent],
  providers: [
    { provide: SchemaValidatorFactory, useClass: AjvSchemaValidatorFactory }
  ],
  exports: [JsonSchemaFormComponent, WidgetLibraryModule]
})
export class JsonSchemaFormModule {}
