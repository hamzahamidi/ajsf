import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { effectiveMinimum, effectiveMaximum } from '../shared';

@Component({
    selector: 'number-widget',
    template: `
    <div [class]="options?.htmlClass || ''">
      @if (options?.title) {
        <label
          [attr.for]="'control' + layoutNode?._id"
          [class]="options?.labelHtmlClass || ''"
          [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="$safeNavigationMigration(options?.title)"></label>
      }
      @if (boundControl) {
        <input
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.max]="maxValue"
          [attr.min]="minValue"
          [attr.placeholder]="options?.placeholder"
          [attr.required]="options?.required"
          [attr.readonly]="options?.readonly ? 'readonly' : null"
          [attr.step]="options?.multipleOf || options?.step || 'any'"
          [class]="options?.fieldHtmlClass || ''"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          [readonly]="options?.readonly ? 'readonly' : null"
          [title]="lastValidNumber"
          [type]="layoutNode?.type === 'range' ? 'range' : 'number'">
      }
      @if (!boundControl) {
        <input
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.max]="maxValue"
          [attr.min]="minValue"
          [attr.placeholder]="options?.placeholder"
          [attr.required]="options?.required"
          [attr.readonly]="options?.readonly ? 'readonly' : null"
          [attr.step]="options?.multipleOf || options?.step || 'any'"
          [class]="options?.fieldHtmlClass || ''"
          [disabled]="controlDisabled"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          [readonly]="options?.readonly ? 'readonly' : null"
          [title]="lastValidNumber"
          [type]="layoutNode?.type === 'range' ? 'range' : 'number'"
          [value]="controlValue"
          (input)="updateValue($event)">
      }
      @if (layoutNode?.type === 'range') {
        <span [innerHTML]="controlValue"></span>
      }
    </div>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NumberComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  allowNegative = true;
  allowDecimal = true;
  allowExponents = false;
  lastValidNumber = '';

  get minValue() { return effectiveMinimum(this.options?.minimum, this.options?.exclusiveMinimum); }
  get maxValue() { return effectiveMaximum(this.options?.maximum, this.options?.exclusiveMaximum); }
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this);
    if (this.layoutNode.dataType === 'integer') { this.allowDecimal = false; }
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.target.value);
  }
}
