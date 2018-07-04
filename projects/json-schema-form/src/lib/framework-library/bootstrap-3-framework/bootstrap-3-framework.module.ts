import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { Framework } from '../framework';
import { Bootstrap3FrameworkComponent } from './bootstrap-3-framework.component';
import { Bootstrap3Framework } from './bootstrap-3.framework';

@NgModule({
  imports:         [ CommonModule, WidgetLibraryModule ],
  declarations:    [ Bootstrap3FrameworkComponent ],
  exports:         [ Bootstrap3FrameworkComponent ],
  entryComponents: [ Bootstrap3FrameworkComponent ]
})
export class Bootstrap3FrameworkModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: Bootstrap3FrameworkModule,
      providers: [
        { provide: Framework, useClass: Bootstrap3Framework, multi: true }
      ]
    };
  }
}
