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
import { Bootstrap4FrameworkComponent } from './bootstrap4-framework.component';
import { Bootstrap4Framework } from './bootstrap4.framework';

@NgModule({
    imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
        CssFrameworkModule
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
        { provide: Framework, useClass: Bootstrap4Framework, multi: true },
    ]
})
export class Bootstrap4FrameworkModule {
}
