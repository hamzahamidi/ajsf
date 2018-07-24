import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { dateToString, hasOwn, stringToDate } from '../../shared';

@Component({
  selector: 'material-datepicker-widget',
  template: `
    <mat-form-field [style.width]="'100%'">
      <span matPrefix *ngIf="options?.prefix || options?.fieldAddonLeft"
        [innerHTML]="options?.prefix || options?.fieldAddonLeft"></span>
      <input matInput *ngIf="boundControl"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [id]="'control' + layoutNode?._id"
        [max]="options?.maximum"
        [matDatepicker]="picker"
        [min]="options?.minimum"
        [name]="controlName"
        [placeholder]="options?.title"
        [required]="options?.required"
        [style.width]="'100%'"
        (blur)="options.showErrors = true">
      <input matInput *ngIf="!boundControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [disabled]="controlDisabled || options?.readonly"
        [id]="'control' + layoutNode?._id"
        [max]="options?.maximum"
        [matDatepicker]="picker"
        [min]="options?.minimum"
        [name]="controlName"
        [placeholder]="options?.title"
        [required]="options?.required"
        [style.width]="'100%'"
        [value]="dateValue"
        (blur)="options.showErrors = true"
        (change)="updateValue($event)"
        (input)="updateValue($event)">
      <span matSuffix *ngIf="options?.suffix || options?.fieldAddonRight"
        [innerHTML]="options?.suffix || options?.fieldAddonRight"></span>
      <mat-hint *ngIf="options?.description && (!options?.showErrors || !options?.errorMessage)"
        align="end" [innerHTML]="options?.description"></mat-hint>
      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
    </mat-form-field>
    <mat-datepicker #picker
      (selectedChanged)="updateValue($event)"></mat-datepicker>
    <mat-error *ngIf="options?.showErrors && options?.errorMessage"
      [innerHTML]="options?.errorMessage"></mat-error>`,
  styles: [`
    mat-error { font-size: 75%; margin-top: -1rem; margin-bottom: 0.5rem; }
    ::ng-deep mat-form-field .mat-form-field-wrapper .mat-form-field-flex
      .mat-form-field-infix { width: initial; }
  `],
})
export class MaterialDatepickerComponent implements OnInit, OnChanges {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  dateValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  autoCompleteList: string[] = [];
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this, !this.options.readonly);
    this.setControlDate(this.controlValue);
    if (!this.options.notitle && !this.options.description && this.options.placeholder) {
      this.options.description = this.options.placeholder;
    }
  }

  ngOnChanges() {
    this.setControlDate(this.controlValue);
  }

  setControlDate(dateString: string) {
    this.dateValue = stringToDate(dateString);
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, dateToString(event, this.options));
  }
}
