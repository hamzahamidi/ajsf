import { Injectable } from '@angular/core';

import { Framework } from '../framework';

// Material Design Framework
// https://github.com/angular/material2
import { FlexLayoutRootComponent } from './flex-layout-root.component';
import { FlexLayoutSectionComponent } from './flex-layout-section.component';
import { MaterialAddReferenceComponent } from './material-add-reference.component';
import { MaterialOneOfComponent } from './material-one-of.component';
import { MaterialButtonComponent } from './material-button.component';
import { MaterialButtonGroupComponent } from './material-button-group.component';
import { MaterialCheckboxComponent } from './material-checkbox.component';
import { MaterialCheckboxesComponent } from './material-checkboxes.component';
import { MaterialChipListComponent } from './material-chip-list.component';
import { MaterialDatepickerComponent } from './material-datepicker.component';
import { MaterialFileComponent } from './material-file.component';
import { MaterialInputComponent } from './material-input.component';
import { MaterialNumberComponent } from './material-number.component';
import { MaterialRadiosComponent } from './material-radios.component';
import { MaterialSelectComponent } from './material-select.component';
import { MaterialSliderComponent } from './material-slider.component';
import { MaterialStepperComponent } from './material-stepper.component';
import { MaterialTabsComponent } from './material-tabs.component';
import { MaterialTextareaComponent } from './material-textarea.component';
import { MaterialDesignFrameworkComponent } from './material-design-framework.component';

@Injectable()
export class MaterialDesignFramework extends Framework {
  name = 'material-design';

  framework = MaterialDesignFrameworkComponent;

  stylesheets = [
    '//fonts.googleapis.com/icon?family=Material+Icons',
    '//fonts.googleapis.com/css?family=Roboto:300,400,500,700',
  ];

  widgets = {
    'root':            FlexLayoutRootComponent,
    'section':         FlexLayoutSectionComponent,
    '$ref':            MaterialAddReferenceComponent,
    'button':          MaterialButtonComponent,
    'button-group':    MaterialButtonGroupComponent,
    'checkbox':        MaterialCheckboxComponent,
    'checkboxes':      MaterialCheckboxesComponent,
    'chip-list':       MaterialChipListComponent,
    'date':            MaterialDatepickerComponent,
    'file':            MaterialFileComponent,
    'number':          MaterialNumberComponent,
    'one-of':          MaterialOneOfComponent,
    'radios':          MaterialRadiosComponent,
    'select':          MaterialSelectComponent,
    'slider':          MaterialSliderComponent,
    'stepper':         MaterialStepperComponent,
    'tabs':            MaterialTabsComponent,
    'text':            MaterialInputComponent,
    'textarea':        MaterialTextareaComponent,
    'alt-date':        'date',
    'any-of':          'one-of',
    'card':            'section',
    'color':           'text',
    'expansion-panel': 'section',
    'hidden':          'none',
    'image':           'none',
    'integer':         'number',
    'radiobuttons':    'button-group',
    'range':           'slider',
    'submit':          'button',
    'tagsinput':       'chip-list',
    'wizard':          'stepper',
  };
}
