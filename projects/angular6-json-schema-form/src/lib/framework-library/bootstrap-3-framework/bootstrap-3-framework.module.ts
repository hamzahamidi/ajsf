import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { Framework } from '../framework';
import { Bootstrap3FrameworkComponent } from './bootstrap-3-framework.component';
import { Bootstrap3Framework } from './bootstrap-3.framework';

import { WidgetLibraryService } from '../../widget-library/widget-library.service';
import { JsonSchemaFormModule } from '../../json-schema-form.module';
import { JsonSchemaFormService } from '../../json-schema-form.service';
import { FrameworkLibraryService } from '../framework-library.service';


@NgModule({
  imports: [JsonSchemaFormModule, CommonModule, WidgetLibraryModule],
  declarations: [Bootstrap3FrameworkComponent],
  exports: [JsonSchemaFormModule, Bootstrap3FrameworkComponent],
  providers: [JsonSchemaFormService, FrameworkLibraryService, WidgetLibraryService,
    { provide: Framework, useClass: Bootstrap3Framework, multi: true }
  ],
  entryComponents: [Bootstrap3FrameworkComponent]
})
export class Bootstrap3FrameworkModule { }
