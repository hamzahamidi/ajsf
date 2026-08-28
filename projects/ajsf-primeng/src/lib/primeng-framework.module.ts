import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Framework,
  JsonSchemaFormService,
  WidgetLibraryService,
  FrameworkLibraryService,
  JsonSchemaFormModule,
  WidgetLibraryModule
} from '@ajsf/core';
import { PrimengFramework } from './primeng.framework';
import { PrimengFrameworkComponent } from './primeng-framework.component';

@NgModule({
    imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
    ],
    declarations: [
        PrimengFrameworkComponent,
    ],
    exports: [
        JsonSchemaFormModule,
        PrimengFrameworkComponent,
    ],
    providers: [
        JsonSchemaFormService,
        FrameworkLibraryService,
        WidgetLibraryService,
        { provide: Framework, useClass: PrimengFramework, multi: true },
    ]
})
export class PrimengFrameworkModule {
}
