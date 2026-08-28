import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
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
import { PRIMENG_FRAMEWORK_COMPONENTS } from './widgets/public_api';

@NgModule({
    imports: [
        JsonSchemaFormModule,
        CommonModule,
        ReactiveFormsModule,
        WidgetLibraryModule,
    ],
    declarations: [
        PrimengFrameworkComponent,
        ...PRIMENG_FRAMEWORK_COMPONENTS,
    ],
    exports: [
        JsonSchemaFormModule,
        PrimengFrameworkComponent,
        ...PRIMENG_FRAMEWORK_COMPONENTS,
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
