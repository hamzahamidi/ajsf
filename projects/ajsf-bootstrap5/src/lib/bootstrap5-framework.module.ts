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
import {Bootstrap5Framework} from './bootstrap5.framework';
import {Bootstrap5FrameworkComponent} from './bootstrap5-framework.component';
import {BOOTSTRAP5_FRAMEWORK_COMPONENTS} from './widgets/public_api';

@NgModule({
    imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
    ],
    declarations: [
        Bootstrap5FrameworkComponent,
        ...BOOTSTRAP5_FRAMEWORK_COMPONENTS,
    ],
    exports: [
        JsonSchemaFormModule,
        Bootstrap5FrameworkComponent,
        ...BOOTSTRAP5_FRAMEWORK_COMPONENTS,
    ],
    providers: [
        JsonSchemaFormService,
        FrameworkLibraryService,
        WidgetLibraryService,
        { provide: Framework, useClass: Bootstrap5Framework, multi: true },
    ]
})
export class Bootstrap5FrameworkModule {
}
