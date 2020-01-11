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
import {Bootstrap4Framework} from './bootstrap4.framework';
import {Bootstrap4FrameworkComponent} from './bootstrap4-framework.component';

@NgModule({
  imports: [
    JsonSchemaFormModule,
    CommonModule,
    WidgetLibraryModule,
  ],
  declarations: [
    Bootstrap4FrameworkComponent,
  ],
  exports: [
    JsonSchemaFormModule,
    Bootstrap4FrameworkComponent,
  ],
  providers: [
    JsonSchemaFormService,
    FrameworkLibraryService,
    WidgetLibraryService,
    {provide: Framework, useClass: Bootstrap4Framework, multi: true},
  ],
  entryComponents: [
    Bootstrap4FrameworkComponent,
  ]
})
export class Bootstrap4FrameworkModule {
}
