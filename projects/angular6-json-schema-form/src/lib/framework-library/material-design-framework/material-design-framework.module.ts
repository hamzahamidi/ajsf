import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  MatAutocompleteModule, MatButtonModule, MatButtonToggleModule, MatCardModule,
  MatCheckboxModule, MatChipsModule, MatDatepickerModule, MatExpansionModule,
  MatFormFieldModule, MatIconModule, MatInputModule, MatNativeDateModule,
  MatRadioModule, MatSelectModule, MatSliderModule, MatSlideToggleModule,
  MatStepperModule, MatTabsModule, MatTooltipModule,
} from '@angular/material';
export const ANGULAR_MATERIAL_MODULES = [
  MatAutocompleteModule, MatButtonModule, MatButtonToggleModule, MatCardModule,
  MatCheckboxModule, MatChipsModule, MatDatepickerModule, MatExpansionModule,
  MatFormFieldModule, MatIconModule, MatInputModule, MatNativeDateModule,
  MatRadioModule, MatSelectModule, MatSliderModule, MatSlideToggleModule,
  MatStepperModule, MatTabsModule, MatTooltipModule,
];
/**
 * unused @angular/material modules:
 * MatDialogModule, MatGridListModule, MatListModule, MatMenuModule,
 * MatPaginatorModule, MatProgressBarModule, MatProgressSpinnerModule,
 * MatSidenavModule, MatSnackBarModule, MatSortModule, MatTableModule,
 * MatToolbarModule,
 */

import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { Framework } from '../framework';
import { MATERIAL_FRAMEWORK_COMPONENTS } from './index';
import { MaterialDesignFramework } from './material-design.framework';
import { WidgetLibraryService } from '../../widget-library/widget-library.service';
import { JsonSchemaFormModule } from '../../json-schema-form.module';
import { JsonSchemaFormService } from '../../json-schema-form.service';
import { FrameworkLibraryService } from '../framework-library.service';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, FlexLayoutModule,
    ...ANGULAR_MATERIAL_MODULES, WidgetLibraryModule, JsonSchemaFormModule
  ],
  declarations: [...MATERIAL_FRAMEWORK_COMPONENTS],
  exports: [JsonSchemaFormModule, ...MATERIAL_FRAMEWORK_COMPONENTS],
  providers: [JsonSchemaFormService, FrameworkLibraryService, WidgetLibraryService,
    { provide: Framework, useClass: MaterialDesignFramework, multi: true }
  ],
  entryComponents: [...MATERIAL_FRAMEWORK_COMPONENTS]
})
export class MaterialDesignFrameworkModule { }
