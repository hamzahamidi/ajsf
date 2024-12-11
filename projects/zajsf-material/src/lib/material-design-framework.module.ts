import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
    Framework,
    FrameworkLibraryService,
    JsonSchemaFormModule,
    JsonSchemaFormService,
    WidgetLibraryModule, WidgetLibraryService
} from '@zajsf/core';
import { CssFrameworkModule } from '@zajsf/cssframework';
import { MaterialDesignFramework } from './material-design.framework';
import { MATERIAL_FRAMEWORK_COMPONENTS } from './widgets/public_api';


/**
 * unused @angular/material modules:
 * MatDialogModule, MatGridListModule, MatListModule, MatMenuModule,
 * MatPaginatorModule, MatProgressBarModule, MatProgressSpinnerModule,
 * MatSidenavModule, MatSnackBarModule, MatSortModule, MatTableModule,
 * ,
 */
export const ANGULAR_MATERIAL_MODULES = [
  MatAutocompleteModule, MatButtonModule, MatButtonToggleModule, MatCardModule,
  MatCheckboxModule, MatChipsModule, MatDatepickerModule, MatExpansionModule,
  MatFormFieldModule, MatIconModule, MatInputModule, MatNativeDateModule,
  MatRadioModule, MatSelectModule, MatSliderModule, MatSlideToggleModule,
  MatStepperModule, MatTabsModule, MatTooltipModule,
  MatToolbarModule, MatMenuModule, MatToolbarModule,
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ...ANGULAR_MATERIAL_MODULES,
        WidgetLibraryModule,
        JsonSchemaFormModule,
        CssFrameworkModule
    ],
    declarations: [
        ...MATERIAL_FRAMEWORK_COMPONENTS,
    ],
    exports: [
        JsonSchemaFormModule,
        ...MATERIAL_FRAMEWORK_COMPONENTS,
    ],
    providers: [
        JsonSchemaFormService,
        FrameworkLibraryService,
        WidgetLibraryService,
        { provide: Framework, useClass: MaterialDesignFramework, multi: true },
    ]
})
export class MaterialDesignFrameworkModule {
  constructor() {

  }
}
