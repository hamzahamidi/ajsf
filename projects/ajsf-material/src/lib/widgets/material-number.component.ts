import {Component, Inject, Input, OnInit, Optional, ChangeDetectionStrategy} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { JsonSchemaFormService, effectiveMinimum, effectiveMaximum } from '@ajsf/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

@Component({
    selector: 'material-number-widget',
    template: `
    <mat-form-field [appearance]="options?.appearance || matFormFieldDefaultOptions?.appearance || 'fill'"
      [class]="options?.htmlClass || ''"
      [floatLabel]="options?.floatLabel || matFormFieldDefaultOptions?.floatLabel || 'auto'"
      [hideRequiredMarker]="options?.hideRequired ? 'true' : 'false'"
      [style.width]="'100%'">
      @if (!options?.notitle) {
        <mat-label>{{options?.title}}</mat-label>
      }
      @if (options?.prefix || options?.fieldAddonLeft) {
        <span matPrefix
        [innerHTML]="options?.prefix || options?.fieldAddonLeft"></span>
      }
      @if (boundControl) {
        <input matInput
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.max]="maxValue"
          [attr.min]="minValue"
          [attr.step]="options?.multipleOf || options?.step || 'any'"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          [placeholder]="options?.notitle ? $safeNavigationMigration(options?.placeholder) : $safeNavigationMigration(options?.title)"
          [readonly]="options?.readonly ? 'readonly' : null"
          [required]="$safeNavigationMigration(options?.required)"
          [style.width]="'100%'"
          [type]="'number'"
          (blur)="options.showErrors = true">
      }
      @if (!boundControl) {
        <input matInput
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.max]="maxValue"
          [attr.min]="minValue"
          [attr.step]="options?.multipleOf || options?.step || 'any'"
          [disabled]="controlDisabled"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          [placeholder]="options?.notitle ? $safeNavigationMigration(options?.placeholder) : $safeNavigationMigration(options?.title)"
          [readonly]="options?.readonly ? 'readonly' : null"
          [required]="$safeNavigationMigration(options?.required)"
          [style.width]="'100%'"
          [type]="'number'"
          [value]="controlValue"
          (input)="updateValue($event)"
          (blur)="options.showErrors = true">
      }
      @if (options?.suffix || options?.fieldAddonRight) {
        <span matSuffix
        [innerHTML]="options?.suffix || options?.fieldAddonRight"></span>
      }
      @if (layoutNode?.type === 'range') {
        <mat-hint align="start"
        [innerHTML]="controlValue"></mat-hint>
      }
      @if (options?.description && (!options?.showErrors || !options?.errorMessage)) {
        <mat-hint
        align="end" [innerHTML]="$safeNavigationMigration(options?.description)"></mat-hint>
      }
    </mat-form-field>
    @if (options?.showErrors && options?.errorMessage) {
      <mat-error
      [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></mat-error>
    }`,
    styles: [`
    mat-error { font-size: 75%; margin-top: -1rem; margin-bottom: 0.5rem; }
    ::ng-deep json-schema-form mat-form-field .mat-mdc-form-field-wrapper .mat-form-field-flex
      .mat-form-field-infix { width: initial; }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MaterialNumberComponent implements OnInit {
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
    @Inject(MAT_FORM_FIELD_DEFAULT_OPTIONS) @Optional() public matFormFieldDefaultOptions,
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this);
    if (this.layoutNode.dataType === 'integer') { this.allowDecimal = false; }
    if (!this.options.notitle && !this.options.description && this.options.placeholder) {
      this.options.description = this.options.placeholder;
    }
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.target.value);
  }
}
