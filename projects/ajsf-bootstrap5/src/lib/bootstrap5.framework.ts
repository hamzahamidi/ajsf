import {Injectable} from '@angular/core';
import {Framework} from '@ajsf/core';
import {Bootstrap5FrameworkComponent} from './bootstrap5-framework.component';

// Bootstrap 5 Framework
// https://github.com/ng-bootstrap/ng-bootstrap

@Injectable()
export class Bootstrap5Framework extends Framework {
  name = 'bootstrap-5';

  framework = Bootstrap5FrameworkComponent;

  stylesheets = [
    '//cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css'
  ];

  // Bootstrap 5 dropped jQuery, and the bundle build already contains Popper,
  // so this is one script where Bootstrap 4 needed three.
  scripts = [
    '//cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js',
  ];
}
