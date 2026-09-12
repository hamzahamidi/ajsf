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
import {Bootstrap5CheckboxComponent} from './widgets/bootstrap5-checkbox.component';
import {Bootstrap5CheckboxesComponent} from './widgets/bootstrap5-checkboxes.component';

@NgModule({
    imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
    ],
    declarations: [
        Bootstrap5FrameworkComponent,
        Bootstrap5CheckboxComponent,
        Bootstrap5CheckboxesComponent,
    ],
    exports: [
        JsonSchemaFormModule,
        Bootstrap5FrameworkComponent,
        Bootstrap5CheckboxComponent,
        Bootstrap5CheckboxesComponent,
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
