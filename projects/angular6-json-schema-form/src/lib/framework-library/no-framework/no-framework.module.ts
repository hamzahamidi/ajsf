import { CommonModule } from '@angular/common';
import { Framework } from '../framework';
import { FrameworkLibraryService } from '../framework-library.service';
import { JsonSchemaFormService } from '../../json-schema-form.service';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { NoFramework } from './no.framework';
import { NoFrameworkComponent } from './no-framework.component';
import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { WidgetLibraryService } from '../../widget-library/widget-library.service';

// No framework - plain HTML controls (styles from form layout only)

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
