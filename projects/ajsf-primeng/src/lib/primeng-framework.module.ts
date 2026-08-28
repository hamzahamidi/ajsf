import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
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

export const PRIMENG_MODULES = [
  InputTextModule,
  TextareaModule,
  InputNumberModule,
  SelectModule,
  CheckboxModule,
  ToggleSwitchModule,
  RadioButtonModule,
  ButtonModule,
  SelectButtonModule,
];

@NgModule({
    imports: [
        JsonSchemaFormModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ...PRIMENG_MODULES,
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
