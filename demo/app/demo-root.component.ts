import { Component } from '@angular/core';
import { environment } from '../environments/environment';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'demo-root',
  template: `<router-outlet></router-outlet>
  <div>build:{{build}}, ver:{{env?.version}}, angular:{{env?.angularVersion}}, material:{{env?.materialVersion}}</div>
  `
})
export class DemoRootComponent {

  env=environment;
  build=this.env.production?"prd":"dev";
  
 }
