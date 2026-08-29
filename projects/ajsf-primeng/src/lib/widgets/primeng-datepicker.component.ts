import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'primeng-datepicker-widget',
    template: `
    <div [class]="options?.htmlClass || ''" [style.width]="'100%'">
      <label *ngIf="!options?.notitle"
        [attr.for]="'control' + layoutNode?._id">{{options?.title}}</label>

      <p-datepicker *ngIf="boundControl"
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
        (onBlur)="options.showErrors = true"></p-datepicker>

      <p-datepicker *ngIf="!boundControl"
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
        [ngModel]="dateValue"
        (onSelect)="updateValue($event)"
        (onBlur)="options.showErrors = true"></p-datepicker>

      <small *ngIf="options?.description && (!options?.showErrors || !options?.errorMessage)"
        [innerHTML]="options?.description"></small>
    </div>
    <div class="p-error" *ngIf="options?.showErrors && options?.errorMessage"
      [innerHTML]="options?.errorMessage"></div>`,
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
  dateValue: Date;
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
      this.minDate = new Date(this.options.minimum);
    }
    if (this.options.maximum) {
      this.maxDate = new Date(this.options.maximum);
    }
    if (this.controlValue) {
      this.dateValue = new Date(this.controlValue);
    }
    if (!this.options.notitle && !this.options.description && this.options.placeholder) {
      this.options.description = this.options.placeholder;
    }
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, event);
  }
}
