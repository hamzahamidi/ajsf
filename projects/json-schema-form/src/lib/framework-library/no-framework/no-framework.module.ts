import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { Framework } from '../framework';
// No framework - plain HTML controls (styles from form layout only)
import { NoFrameworkComponent } from './no-framework.component';
import { NoFramework } from './no.framework';

@NgModule({
  imports:         [ CommonModule, WidgetLibraryModule ],
  declarations:    [ NoFrameworkComponent ],
  exports:         [ NoFrameworkComponent ],
  entryComponents: [ NoFrameworkComponent ]
})
export class NoFrameworkModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: NoFrameworkModule,
      providers: [
        { provide: Framework, useClass: NoFramework, multi: true }
      ]
    };
  }
}
