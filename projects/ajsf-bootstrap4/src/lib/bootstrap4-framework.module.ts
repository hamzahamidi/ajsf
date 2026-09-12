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
import {BOOTSTRAP4_FRAMEWORK_COMPONENTS} from './widgets/public_api';

@NgModule({
    imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
    ],
    declarations: [
        Bootstrap4FrameworkComponent,
        ...BOOTSTRAP4_FRAMEWORK_COMPONENTS,
    ],
    exports: [
        JsonSchemaFormModule,
        Bootstrap4FrameworkComponent,
        ...BOOTSTRAP4_FRAMEWORK_COMPONENTS,
    ],
    providers: [
        JsonSchemaFormService,
        FrameworkLibraryService,
        WidgetLibraryService,
        { provide: Framework, useClass: Bootstrap4Framework, multi: true },
    ]
})
export class Bootstrap4FrameworkModule {
}
