import { Injectable } from '@angular/core';

import { Framework } from '../framework';

// No framework - plain HTML controls (styles from form layout only)
import { NoFrameworkComponent } from './no-framework.component';

@Injectable()
export class NoFramework extends Framework {
  name = 'no-framework';

  framework = NoFrameworkComponent;
}
