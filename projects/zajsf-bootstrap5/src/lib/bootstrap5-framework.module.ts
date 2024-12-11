import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
    Framework,
    FrameworkLibraryService,
    JsonSchemaFormModule,
    JsonSchemaFormService,
    WidgetLibraryModule,
    WidgetLibraryService
} from '@zajsf/core';
import { CssFrameworkModule } from '@zajsf/cssframework';
import { Bootstrap5FrameworkComponent } from './bootstrap5-framework.component';
import { Bootstrap5Framework } from './bootstrap5.framework';

@NgModule({
    imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
        CssFrameworkModule
    ],
    declarations: [
        Bootstrap5FrameworkComponent,
    ],
    exports: [
        JsonSchemaFormModule,
        Bootstrap5FrameworkComponent,
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
