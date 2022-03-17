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
    '//stackpath.bootstrapcdn.com/bootstrap/5.1.3/css/bootstrap.min.css'
  ];

  scripts = [
/*    '//code.jquery.com/jquery-3.3.1.slim.min.js',
    '//cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js',
    '//stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js',
    */
  ];
}
