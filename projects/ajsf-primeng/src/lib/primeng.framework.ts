import { Injectable } from '@angular/core';
import { Framework } from '@ajsf/core';
import { PrimengFrameworkComponent } from './primeng-framework.component';
import { PrimengFlexLayoutRootComponent } from './widgets/primeng-flex-layout-root.component';
import { PrimengFlexLayoutSectionComponent } from './widgets/primeng-flex-layout-section.component';
import { PrimengAddReferenceComponent } from './widgets/primeng-add-reference.component';
import { PrimengInputComponent } from './widgets/primeng-input.component';
import { PrimengTextareaComponent } from './widgets/primeng-textarea.component';
import { PrimengNumberComponent } from './widgets/primeng-number.component';
import { PrimengSelectComponent } from './widgets/primeng-select.component';
import { PrimengOneOfComponent } from './widgets/primeng-one-of.component';
import { PrimengCheckboxComponent } from './widgets/primeng-checkbox.component';
import { PrimengCheckboxesComponent } from './widgets/primeng-checkboxes.component';
import { PrimengRadiosComponent } from './widgets/primeng-radios.component';
import { PrimengButtonComponent } from './widgets/primeng-button.component';
import { PrimengButtonGroupComponent } from './widgets/primeng-button-group.component';
import { PrimengDatepickerComponent } from './widgets/primeng-datepicker.component';
import { PrimengSliderComponent } from './widgets/primeng-slider.component';
import { PrimengTabsComponent } from './widgets/primeng-tabs.component';
import { PrimengFileComponent } from './widgets/primeng-file.component';
import { PrimengChipListComponent } from './widgets/primeng-chip-list.component';
import { PrimengStepperComponent } from './widgets/primeng-stepper.component';

@Injectable()
export class PrimengFramework extends Framework {
  name = 'primeng';

  framework = PrimengFrameworkComponent;

  widgets = {
    'root': PrimengFlexLayoutRootComponent,
    'section': PrimengFlexLayoutSectionComponent,
    '$ref': PrimengAddReferenceComponent,
    'text': PrimengInputComponent,
    'textarea': PrimengTextareaComponent,
    'number': PrimengNumberComponent,
    'select': PrimengSelectComponent,
    'one-of': PrimengOneOfComponent,
    'checkbox': PrimengCheckboxComponent,
    'checkboxes': PrimengCheckboxesComponent,
    'radios': PrimengRadiosComponent,
    'button': PrimengButtonComponent,
    'button-group': PrimengButtonGroupComponent,
    'date': PrimengDatepickerComponent,
    'slider': PrimengSliderComponent,
    'tabs': PrimengTabsComponent,
    'file': PrimengFileComponent,
    'chip-list': PrimengChipListComponent,
    'stepper': PrimengStepperComponent,
    'any-of': 'one-of',
    'integer': 'number',
    'radiobuttons': 'button-group',
    'submit': 'button',
    'card': 'section',
    'color': 'text',
    'expansion-panel': 'section',
    'hidden': 'none',
    'image': 'none',
    'alt-date': 'date',
    'range': 'slider',
    'tagsinput': 'chip-list',
    'wizard': 'stepper',
  };
}
