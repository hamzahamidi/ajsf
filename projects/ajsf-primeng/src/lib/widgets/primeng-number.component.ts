import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService, effectiveMinimum, effectiveMaximum } from '@ajsf/core';

@Component({
    selector: 'primeng-number-widget',
    template: `
    <div [class]="options?.htmlClass || ''" [style.width]="'100%'">
      @if (!options?.notitle) {
        <label
        [attr.for]="'control' + layoutNode?._id">{{options?.title}}</label>
      }
      @if (options?.prefix || options?.fieldAddonLeft) {
        <span
        [innerHTML]="options?.prefix || options?.fieldAddonLeft"></span>
      }
      @if (boundControl) {
        <p-inputnumber
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [inputId]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          [placeholder]="options?.notitle ? $safeNavigationMigration(options?.placeholder) : $safeNavigationMigration(options?.title)"
          [readonly]="$safeNavigationMigration(options?.readonly)"
          [required]="$safeNavigationMigration(options?.required)"
          [min]="minValue"
          [max]="maxValue"
          [step]="options?.multipleOf || options?.step || 1"
          [useGrouping]="false"
          [maxFractionDigits]="allowDecimal ? 20 : 0"
          [fluid]="true"
        (onBlur)="options.showErrors = true"></p-inputnumber>
      }
      @if (!boundControl) {
        <p-inputnumber
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [inputId]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          [placeholder]="options?.notitle ? $safeNavigationMigration(options?.placeholder) : $safeNavigationMigration(options?.title)"
          [readonly]="$safeNavigationMigration(options?.readonly)"
          [required]="$safeNavigationMigration(options?.required)"
          [disabled]="controlDisabled"
          [min]="minValue"
          [max]="maxValue"
          [step]="options?.multipleOf || options?.step || 1"
          [useGrouping]="false"
          [maxFractionDigits]="allowDecimal ? 20 : 0"
          [ngModel]="controlValue"
          [fluid]="true"
          (onInput)="updateValue($event)"
        (onBlur)="options.showErrors = true"></p-inputnumber>
      }
      @if (options?.suffix || options?.fieldAddonRight) {
        <span
        [innerHTML]="options?.suffix || options?.fieldAddonRight"></span>
      }
      @if (options?.description && (!options?.showErrors || !options?.errorMessage)) {
        <small
        [innerHTML]="$safeNavigationMigration(options?.description)"></small>
      }
    </div>
    @if (options?.showErrors && options?.errorMessage) {
      <div class="p-error"
      [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></div>
    }`,
    styles: [`
    .p-error { font-size: 75%; margin-top: 0.25rem; }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PrimengNumberComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  allowDecimal = true;

  get minValue() { return effectiveMinimum(this.options?.minimum, this.options?.exclusiveMinimum); }
  get maxValue() { return effectiveMaximum(this.options?.maximum, this.options?.exclusiveMaximum); }
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(private jsf: JsonSchemaFormService) {}

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this);
    if (this.layoutNode.dataType === 'integer') { this.allowDecimal = false; }
    if (!this.options.notitle && !this.options.description && this.options.placeholder) {
      this.options.description = this.options.placeholder;
    }
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.value);
  }
}
