import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Framework, FrameworkLibraryService, JsonSchemaFormModule, JsonSchemaFormService, WidgetLibraryModule, WidgetLibraryService } from '@zajsf/core';

import { CssFrameworkModule } from '@zajsf/cssframework';
import { DaisyUIFrameworkComponent } from './daisyui-framework.component';
import { DaisyUIFrameworkComponentPrefixed } from './daisyui-framework.prefixed.component';
import { DaisyUIFramework } from './daisyui.framework';
import { DaisyUITabsComponent } from './widgets/daisyui-tabs.component';



@NgModule({
  declarations: [
    DaisyUIFrameworkComponent,
    DaisyUIFrameworkComponentPrefixed,
    DaisyUITabsComponent
  ],
  imports: [
    JsonSchemaFormModule,
    CommonModule,
    WidgetLibraryModule,
    CssFrameworkModule
  ],
  exports: [
    DaisyUIFrameworkComponent,
    DaisyUIFrameworkComponentPrefixed,
    JsonSchemaFormModule,
    DaisyUITabsComponent
  ],
  providers: [
    JsonSchemaFormService,
    FrameworkLibraryService,
    WidgetLibraryService,
    
    { provide: Framework, useClass: DaisyUIFramework, multi: true }
]
})
export class DaisyUIFrameworkModule { }
