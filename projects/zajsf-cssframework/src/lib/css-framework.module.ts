import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FrameworkLibraryService, JsonSchemaFormModule, JsonSchemaFormService, WidgetLibraryModule, WidgetLibraryService } from '@zajsf/core';
import { CssFrameworkComponent } from './css-framework.component';
import { CssframeworkService } from './css-framework.service';



@NgModule({
  declarations: [
    CssFrameworkComponent
  ],
  imports: [
    JsonSchemaFormModule,
    CommonModule,
    WidgetLibraryModule,
  ],
  exports: [
    CssFrameworkComponent
  ],
  providers: [
    JsonSchemaFormService,
    FrameworkLibraryService,
    WidgetLibraryService,
    CssframeworkService
   // { provide: Framework, useClass: CssFramework, multi: true },
  ]
})
export class CssFrameworkModule { }
