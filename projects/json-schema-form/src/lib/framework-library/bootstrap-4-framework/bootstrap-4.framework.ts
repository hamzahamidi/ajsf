import { Injectable } from '@angular/core';

import { Framework } from '../framework';

// Bootstrap 4 Framework
// https://github.com/ng-bootstrap/ng-bootstrap
import { Bootstrap4FrameworkComponent } from './bootstrap-4-framework.component';


@Injectable()
export class Bootstrap4Framework extends Framework {
  name = 'bootstrap-4';

  framework = Bootstrap4FrameworkComponent;

  stylesheets = [
    '//maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/css/bootstrap.min.css'
  ];

  scripts = [
    '//code.jquery.com/jquery-3.2.1.slim.min.js',
    '//cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js',
    '//maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/js/bootstrap.min.js',
  ];
}
