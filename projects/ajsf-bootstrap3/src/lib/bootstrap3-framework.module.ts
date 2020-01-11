import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  Framework,
  JsonSchemaFormService,
  WidgetLibraryService,
  FrameworkLibraryService,
  JsonSchemaFormModule,
  WidgetLibraryModule
} from '@ajsf/core';
import {Bootstrap3Framework} from './bootstrap3.framework';
import {Bootstrap3FrameworkComponent} from './bootstrap3-framework.component';

@NgModule({
  imports: [
    JsonSchemaFormModule,
    CommonModule,
    WidgetLibraryModule,
  ],
  declarations: [
    Bootstrap3FrameworkComponent,
  ],
  exports: [
    JsonSchemaFormModule,
    Bootstrap3FrameworkComponent,
  ],
  providers: [
    JsonSchemaFormService,
    FrameworkLibraryService,
    WidgetLibraryService,
    {provide: Framework, useClass: Bootstrap3Framework, multi: true},
  ],
  entryComponents: [Bootstrap3FrameworkComponent]
})
export class Bootstrap3FrameworkModule {
}
