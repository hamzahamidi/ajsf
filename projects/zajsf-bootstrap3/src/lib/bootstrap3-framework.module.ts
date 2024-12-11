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
import { Bootstrap3FrameworkComponent } from './bootstrap3-framework.component';
import { Bootstrap3Framework } from './bootstrap3.framework';

@NgModule({
    imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
        CssFrameworkModule
    ],
    declarations: [
        Bootstrap3FrameworkComponent,
    ],
    exports: [
        JsonSchemaFormModule,
        Bootstrap3FrameworkComponent,
    ],
    providers: [
        JsonSchemaFormService,
        FrameworkLibraryService,
        WidgetLibraryService,
        { provide: Framework, useClass: Bootstrap3Framework, multi: true },
    ]
})
export class Bootstrap3FrameworkModule {
}
