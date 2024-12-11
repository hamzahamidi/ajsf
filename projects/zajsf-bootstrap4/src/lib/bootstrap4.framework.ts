import { Injectable } from '@angular/core';
import { CssFramework, CssframeworkService } from '@zajsf/cssframework';
import { cssFrameworkCfgBootstrap4 } from './bootstrap4-cssframework';
import { Bootstrap4FrameworkComponent } from './bootstrap4-framework.component';

// Bootstrap 4 Framework
// https://github.com/ng-bootstrap/ng-bootstrap

@Injectable()
export class Bootstrap4Framework extends CssFramework {
  
  framework = Bootstrap4FrameworkComponent;

  constructor(public cssFWService:CssframeworkService){
    super(cssFrameworkCfgBootstrap4,cssFWService);
  }
}
