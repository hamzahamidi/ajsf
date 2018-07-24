import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { Framework } from '../framework';
import { Bootstrap4FrameworkComponent } from './bootstrap-4-framework.component';
import { Bootstrap4Framework } from './bootstrap-4.framework';
import { WidgetLibraryService } from '../../widget-library/widget-library.service';
import { JsonSchemaFormModule } from '../../json-schema-form.module';
import { JsonSchemaFormService } from '../../json-schema-form.service';
import { FrameworkLibraryService } from '../framework-library.service';

@NgModule({
  imports: [JsonSchemaFormModule, CommonModule, WidgetLibraryModule],
  declarations: [Bootstrap4FrameworkComponent],
  exports: [JsonSchemaFormModule, Bootstrap4FrameworkComponent],
  providers: [JsonSchemaFormService, FrameworkLibraryService, WidgetLibraryService,
    { provide: Framework, useClass: Bootstrap4Framework, multi: true }
  ],
  entryComponents: [Bootstrap4FrameworkComponent]
})
export class Bootstrap4FrameworkModule { }
