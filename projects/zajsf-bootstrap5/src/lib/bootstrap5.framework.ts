import { Injectable } from '@angular/core';
import { CssFramework, CssframeworkService } from '@zajsf/cssframework';
import { cssFrameworkCfgBootstrap5 } from './bootstrap5-cssframework';
import { Bootstrap5FrameworkComponent } from './bootstrap5-framework.component';

// Bootstrap 4 Framework
// https://github.com/ng-bootstrap/ng-bootstrap

@Injectable()
export class Bootstrap5Framework extends CssFramework {
  
  framework = Bootstrap5FrameworkComponent;

  constructor(public cssFWService:CssframeworkService){
    super(cssFrameworkCfgBootstrap5,cssFWService);
  }
}
