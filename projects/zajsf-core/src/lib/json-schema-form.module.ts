import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { JsonSchemaFormComponent } from './json-schema-form.component';
import { NoFrameworkModule } from './framework-library/no-framework.module';
import { WidgetLibraryModule } from './widget-library/widget-library.module';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    WidgetLibraryModule, NoFrameworkModule
  ],
  declarations: [JsonSchemaFormComponent],
  exports: [JsonSchemaFormComponent, WidgetLibraryModule]
})
export class JsonSchemaFormModule {
}
