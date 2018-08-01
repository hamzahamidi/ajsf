import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { JsonSchemaFormModule } from '../../json-schema-form.module';
import { JsonSchemaFormService } from '../../json-schema-form.service';
import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { WidgetLibraryService } from '../../widget-library/widget-library.service';
import { Framework } from '../framework';
import { FrameworkLibraryService } from '../framework-library.service';
import { Bootstrap3FrameworkComponent } from './bootstrap-3-framework.component';
import { Bootstrap3Framework } from './bootstrap-3.framework';




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
