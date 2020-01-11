import { Route } from '@angular/router';

import { DemoComponent } from './demo.component';

export const routes: Route[] = [
  { path: '', component: DemoComponent },
  { path: '**', component: DemoComponent }
];
