import { Framework } from '../framework';
import { Injectable } from '@angular/core';
import { NoFrameworkComponent } from './no-framework.component';
// No framework - plain HTML controls (styles from form layout only)

@Injectable()
export class NoFramework extends Framework {
  name = 'no-framework';

  framework = NoFrameworkComponent;
}
