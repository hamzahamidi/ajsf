import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { Framework } from '../framework';
// No framework - plain HTML controls (styles from form layout only)
import { NoFrameworkComponent } from './no-framework.component';
import { NoFramework } from './no.framework';

import { WidgetLibraryService } from '../../widget-library/widget-library.service';
import { JsonSchemaFormService } from '../../json-schema-form.service';
import { FrameworkLibraryService } from '../framework-library.service';

@NgModule({
  imports: [CommonModule, WidgetLibraryModule],
  declarations: [NoFrameworkComponent],
  exports: [NoFrameworkComponent],
  providers: [JsonSchemaFormService, FrameworkLibraryService, WidgetLibraryService,
    { provide: Framework, useClass: NoFramework, multi: true }
  ],
  entryComponents: [NoFrameworkComponent]
})
export class NoFrameworkModule { }
