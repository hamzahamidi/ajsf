import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService, effectiveMinimum, effectiveMaximum } from '@ajsf/core';

@Component({
    selector: 'primeng-number-widget',
    template: `
    <div [class]="options?.htmlClass || ''" [style.width]="'100%'">
      <label *ngIf="!options?.notitle"
        [attr.for]="'control' + layoutNode?._id">{{options?.title}}</label>
      <span *ngIf="options?.prefix || options?.fieldAddonLeft"
        [innerHTML]="options?.prefix || options?.fieldAddonLeft"></span>
      <p-inputnumber *ngIf="boundControl"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [inputId]="'control' + layoutNode?._id"
        [name]="controlName"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [readonly]="options?.readonly"
        [min]="minValue"
        [max]="maxValue"
        [step]="options?.multipleOf || options?.step || 1"
        [useGrouping]="false"
        [maxFractionDigits]="allowDecimal ? 10 : 0"
        [fluid]="true"
        (onBlur)="options.showErrors = true"></p-inputnumber>
      <p-inputnumber *ngIf="!boundControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [inputId]="'control' + layoutNode?._id"
        [name]="controlName"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [readonly]="options?.readonly"
        [disabled]="controlDisabled"
        [min]="minValue"
        [max]="maxValue"
        [step]="options?.multipleOf || options?.step || 1"
        [useGrouping]="false"
        [maxFractionDigits]="allowDecimal ? 10 : 0"
        [ngModel]="controlValue"
        [fluid]="true"
        (onInput)="updateValue($event)"
        (onBlur)="options.showErrors = true"></p-inputnumber>
      <span *ngIf="options?.suffix || options?.fieldAddonRight"
        [innerHTML]="options?.suffix || options?.fieldAddonRight"></span>
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
