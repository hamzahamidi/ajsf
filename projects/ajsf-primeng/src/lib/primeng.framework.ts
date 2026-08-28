import { Injectable } from '@angular/core';
import { Framework } from '@ajsf/core';
import { PrimengFrameworkComponent } from './primeng-framework.component';
import { PrimengFlexLayoutRootComponent } from './widgets/primeng-flex-layout-root.component';
import { PrimengFlexLayoutSectionComponent } from './widgets/primeng-flex-layout-section.component';
import { PrimengAddReferenceComponent } from './widgets/primeng-add-reference.component';
import { PrimengInputComponent } from './widgets/primeng-input.component';
import { PrimengTextareaComponent } from './widgets/primeng-textarea.component';

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
    'card': 'section',
    'color': 'text',
    'expansion-panel': 'section',
    'hidden': 'none',
    'image': 'none',
  };
}
