import {Injectable} from '@angular/core';
import {Framework} from '@ajsf/core';
import {Bootstrap4FrameworkComponent} from './bootstrap4-framework.component';
import {Bootstrap4CheckboxComponent} from './widgets/bootstrap4-checkbox.component';
import {Bootstrap4CheckboxesComponent} from './widgets/bootstrap4-checkboxes.component';
import {Bootstrap4RadiosComponent} from './widgets/bootstrap4-radios.component';

// Bootstrap 4 Framework
// https://github.com/ng-bootstrap/ng-bootstrap

@Injectable()
export class Bootstrap4Framework extends Framework {
  name = 'bootstrap-4';

  framework = Bootstrap4FrameworkComponent;

  widgets = {
    'checkbox': Bootstrap4CheckboxComponent,
    'checkboxes': Bootstrap4CheckboxesComponent,
    'radios': Bootstrap4RadiosComponent,
  };

  stylesheets = [
    '//stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css'
  ];

  scripts = [
    '//code.jquery.com/jquery-3.3.1.slim.min.js',
    '//cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js',
    '//stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js',
  ];
}
