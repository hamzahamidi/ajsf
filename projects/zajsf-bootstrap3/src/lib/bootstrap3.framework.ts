import { Injectable } from '@angular/core';
import { CssFramework, CssframeworkService } from '@zajsf/cssframework';
import { cssFrameworkCfgBootstrap3 } from './bootstrap3-cssframework';
import { Bootstrap3FrameworkComponent } from './bootstrap3-framework.component';

// Bootstrap 3 Framework
// https://github.com/valor-software/ng2-bootstrap

@Injectable()
export class Bootstrap3Framework extends CssFramework {
  name = 'bootstrap-3';

  framework = Bootstrap3FrameworkComponent;

  constructor(public cssFWService:CssframeworkService){
    super(cssFrameworkCfgBootstrap3,cssFWService);
  }
}
