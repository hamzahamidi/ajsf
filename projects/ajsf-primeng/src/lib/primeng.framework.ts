import { Injectable } from '@angular/core';
import { Framework } from '@ajsf/core';
import { PrimengFrameworkComponent } from './primeng-framework.component';

// PrimeNG Framework
// https://primeng.org

@Injectable()
export class PrimengFramework extends Framework {
  name = 'primeng';

  framework = PrimengFrameworkComponent;
}
