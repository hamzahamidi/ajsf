import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'primeng-datepicker-widget',
    template: `
    <div [class]="options?.htmlClass || ''" [style.width]="'100%'">
      @if (!options?.notitle) {
        <label
        [attr.for]="'control' + layoutNode?._id">{{options?.title}}</label>
      }
    
      @if (boundControl) {
        <p-datepicker
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [inputId]="'control' + layoutNode?._id"
          [placeholder]="options?.notitle ? options?.placeholder : options?.title"
          [readonlyInput]="options?.readonly"
          [required]="options?.required"
          [minDate]="minDate"
          [maxDate]="maxDate"
          [showIcon]="true"
          [fluid]="true"
          [showButtonBar]="true"
          dataType="string"
          dateFormat="yy-mm-dd"
        (onBlur)="options.showErrors = true"></p-datepicker>
      }
    
      @if (!boundControl) {
        <p-datepicker
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [inputId]="'control' + layoutNode?._id"
          [disabled]="controlDisabled || options?.readonly"
          [placeholder]="options?.notitle ? options?.placeholder : options?.title"
          [readonlyInput]="options?.readonly"
          [required]="options?.required"
          [minDate]="minDate"
          [maxDate]="maxDate"
          [showIcon]="true"
          [fluid]="true"
          [showButtonBar]="true"
          dataType="string"
          dateFormat="yy-mm-dd"
          [ngModel]="controlValue"
          (ngModelChange)="updateValue($event)"
        (onBlur)="options.showErrors = true"></p-datepicker>
      }
    
      @if (options?.description && (!options?.showErrors || !options?.errorMessage)) {
        <small
        [innerHTML]="options?.description"></small>
      }
    </div>
    @if (options?.showErrors && options?.errorMessage) {
      <div class="p-error"
      [innerHTML]="options?.errorMessage"></div>
    }`,
    styles: [`
    .p-error { font-size: 75%; margin-top: 0.25rem; }
  `],
    standalone: false
})
export class PrimengDatepickerComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  minDate: Date;
  maxDate: Date;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(private jsf: JsonSchemaFormService) {}

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this, !this.options.readonly);
    if (this.options.minimum) {
      this.minDate = this.parseLocalDate(this.options.minimum);
    }
    if (this.options.maximum) {
      this.maxDate = this.parseLocalDate(this.options.maximum);
    }
    if (!this.options.notitle && !this.options.description && this.options.placeholder) {
      this.options.description = this.options.placeholder;
    }
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, event);
  }

  private parseLocalDate(value: string): Date {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
}
