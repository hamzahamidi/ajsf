import { Bootstrap4FrameworkComponent } from './bootstrap-4-framework.component';
import { Framework } from '../framework';
import { Injectable } from '@angular/core';

// Bootstrap 4 Framework
// https://github.com/ng-bootstrap/ng-bootstrap

@Injectable()
export class Bootstrap4Framework extends Framework {
  name = 'bootstrap-4';

  framework = Bootstrap4FrameworkComponent;

  stylesheets = [
    '//stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css'
  ];

  scripts = [
    '//code.jquery.com/jquery-3.3.1.slim.min.js',
    '//cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js',
    '//stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js',
  ];
}
