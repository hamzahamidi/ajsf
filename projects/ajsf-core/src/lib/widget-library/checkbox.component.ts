import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService } from '../json-schema-form.service';


@Component({
    selector: 'checkbox-widget',
    template: `
    <label
      [attr.for]="'control' + layoutNode?._id"
      [class]="options?.itemLabelHtmlClass || ''">
      @if (boundControl) {
        <input
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [indeterminate]="isIndeterminate"
        [class]="(options?.fieldHtmlClass || '') + (isChecked ?
          (' ' + (options?.activeClass || '') + ' ' + (options?.style?.selected || '')) :
          (' ' + (options?.style?.unselected || '')))"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          [readonly]="options?.readonly ? 'readonly' : null"
          type="checkbox"
          (click)="handleClick($event)">
      }
      @if (!boundControl) {
        <input
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [checked]="isChecked ? 'checked' : null"
          [indeterminate]="isIndeterminate"
        [class]="(options?.fieldHtmlClass || '') + (isChecked ?
          (' ' + (options?.activeClass || '') + ' ' + (options?.style?.selected || '')) :
          (' ' + (options?.style?.unselected || '')))"
          [disabled]="controlDisabled"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          [readonly]="options?.readonly ? 'readonly' : null"
          [value]="controlValue"
          type="checkbox"
          (click)="handleClick($event)"
          (change)="handleChange($event)">
      }
      @if (options?.title) {
        <span
          [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="$safeNavigationMigration(options?.title)"></span>
      }
    </label>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CheckboxComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  trueValue: any = true;
  falseValue: any = false;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private readonly jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this);
    this.controlValue ??= this.options.title;
  }

  updateValue(event) {
    event.preventDefault();
    if (this.options?.ternary) {
      const currentValue = this.jsf.getFormControlValue(this);
      const nextValue = currentValue === null || currentValue === undefined
        ? this.trueValue
        : currentValue === this.trueValue ? this.falseValue : null;
      this.jsf.updateValue(this, nextValue);
      return;
    }
    this.jsf.updateValue(this, event.target.checked ? this.trueValue : this.falseValue);
  }

  handleClick(event): void {
    if (this.options?.ternary) { this.updateValue(event); }
  }

  handleChange(event): void {
    if (!this.options?.ternary) { this.updateValue(event); }
  }

  get isIndeterminate() {
    const value = this.jsf.getFormControlValue(this);
    return this.options?.ternary && (value === null || value === undefined);
  }

  get isChecked() {
    return this.jsf.getFormControlValue(this) === this.trueValue;
  }
}
