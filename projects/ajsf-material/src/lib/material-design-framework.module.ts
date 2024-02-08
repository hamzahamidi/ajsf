import {
  Framework,
  FrameworkLibraryService,
  JsonSchemaFormModule,
  JsonSchemaFormService,
  WidgetLibraryModule,
  WidgetLibraryService,
} from "@ajsf/core";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from "@angular/material/legacy-autocomplete";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatLegacyCardModule as MatCardModule } from "@angular/material/legacy-card";
import { MatLegacyCheckboxModule as MatCheckboxModule } from "@angular/material/legacy-checkbox";
import { MatLegacyChipsModule as MatChipsModule } from "@angular/material/legacy-chips";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { MatLegacyRadioModule as MatRadioModule } from "@angular/material/legacy-radio";
import { MatLegacySelectModule as MatSelectModule } from "@angular/material/legacy-select";
import { MatLegacySlideToggleModule as MatSlideToggleModule } from "@angular/material/legacy-slide-toggle";
import { MatLegacySliderModule as MatSliderModule } from "@angular/material/legacy-slider";
import { MatStepperModule } from "@angular/material/stepper";
import { MatLegacyTabsModule as MatTabsModule } from "@angular/material/legacy-tabs";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { MatLegacyMenuModule as MatMenuModule } from "@angular/material/legacy-menu";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MaterialDesignFramework } from "./material-design.framework";
import { MATERIAL_FRAMEWORK_COMPONENTS } from "./widgets/public_api";

/**
 * unused @angular/material modules:
 * MatDialogModule, MatGridListModule, MatListModule, MatMenuModule,
 * MatPaginatorModule, MatProgressBarModule, MatProgressSpinnerModule,
 * MatSidenavModule, MatSnackBarModule, MatSortModule, MatTableModule,
 * ,
 */
export const ANGULAR_MATERIAL_MODULES = [
  MatAutocompleteModule,
  MatButtonModule,
  MatButtonToggleModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDatepickerModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatNativeDateModule,
  MatRadioModule,
  MatSelectModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatStepperModule,
  MatTabsModule,
  MatTooltipModule,
  MatToolbarModule,
  MatMenuModule,
  MatToolbarModule,
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ...ANGULAR_MATERIAL_MODULES,
    WidgetLibraryModule,
    JsonSchemaFormModule,
  ],
  declarations: [...MATERIAL_FRAMEWORK_COMPONENTS],
  exports: [JsonSchemaFormModule, ...MATERIAL_FRAMEWORK_COMPONENTS],
  providers: [
    JsonSchemaFormService,
    FrameworkLibraryService,
    WidgetLibraryService,
    { provide: Framework, useClass: MaterialDesignFramework, multi: true },
  ],
})
export class MaterialDesignFrameworkModule {
  constructor() {}
}
