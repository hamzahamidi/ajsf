import {Injectable} from '@angular/core';
import {Framework} from '@ajsf/core';
import {
  FlexLayoutRootComponent,
  FlexLayoutSectionComponent,
  MaterialAddReferenceComponent,
  MaterialButtonComponent,
  MaterialButtonGroupComponent,
  MaterialCheckboxComponent,
  MaterialCheckboxesComponent,
  MaterialChipListComponent,
  MaterialDatepickerComponent,
  MaterialDesignFrameworkComponent,
  MaterialFileComponent,
  MaterialInputComponent,
  MaterialNumberComponent,
  MaterialOneOfComponent,
  MaterialRadiosComponent,
  MaterialSelectComponent,
  MaterialSliderComponent,
  MaterialStepperComponent,
  MaterialTabsComponent,
  MaterialTextareaComponent
} from './widgets/public_api';


// Material Design Framework
// https://github.com/angular/material2

@Injectable()
export class MaterialDesignFramework extends Framework {
  name = 'material-design';

  framework = MaterialDesignFrameworkComponent;

  stylesheets = [
    '//fonts.googleapis.com/icon?family=Material+Icons',
    '//fonts.googleapis.com/css?family=Roboto:300,400,500,700',
  ];

  widgets = {
    'root': FlexLayoutRootComponent,
    'section': FlexLayoutSectionComponent,
    '$ref': MaterialAddReferenceComponent,
    'button': MaterialButtonComponent,
    'button-group': MaterialButtonGroupComponent,
    'checkbox': MaterialCheckboxComponent,
    'checkboxes': MaterialCheckboxesComponent,
    'chip-list': MaterialChipListComponent,
    'date': MaterialDatepickerComponent,
    'file': MaterialFileComponent,
    'number': MaterialNumberComponent,
    'one-of': MaterialOneOfComponent,
    'radios': MaterialRadiosComponent,
    'select': MaterialSelectComponent,
    'slider': MaterialSliderComponent,
    'stepper': MaterialStepperComponent,
    'tabs': MaterialTabsComponent,
    'text': MaterialInputComponent,
    'textarea': MaterialTextareaComponent,
    'alt-date': 'date',
    'any-of': 'one-of',
    'card': 'section',
    'color': 'text',
    'expansion-panel': 'section',
    'hidden': 'none',
    'image': 'none',
    'integer': 'number',
    'radiobuttons': 'button-group',
    'range': 'slider',
    'submit': 'button',
    'tagsinput': 'chip-list',
    'wizard': 'stepper',
  };
}
