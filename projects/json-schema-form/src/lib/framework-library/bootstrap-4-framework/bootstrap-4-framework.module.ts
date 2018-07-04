import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { Framework } from '../framework';
import { Bootstrap4FrameworkComponent } from './bootstrap-4-framework.component';
import { Bootstrap4Framework } from './bootstrap-4.framework';

@NgModule({
  imports:         [ CommonModule, WidgetLibraryModule ],
  declarations:    [ Bootstrap4FrameworkComponent ],
  exports:         [ Bootstrap4FrameworkComponent ],
  entryComponents: [ Bootstrap4FrameworkComponent ]
})
export class Bootstrap4FrameworkModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: Bootstrap4FrameworkModule,
      providers: [
        { provide: Framework, useClass: Bootstrap4Framework, multi: true }
      ]
    };
  }
}
