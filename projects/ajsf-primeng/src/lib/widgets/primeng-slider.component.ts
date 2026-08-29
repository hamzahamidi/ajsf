import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService, effectiveMinimum, effectiveMaximum } from '@ajsf/core';

@Component({
    selector: 'primeng-slider-widget',
    template: `
    <div [class]="options?.htmlClass || ''" [style.width]="'100%'">
      <label *ngIf="!options?.notitle"
        [attr.for]="'control' + layoutNode?._id">{{options?.title}}</label>

      <p-slider *ngIf="boundControl"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [min]="minValue"
        [max]="maxValue"
        [step]="options?.multipleOf || options?.step || 1"
        [style]="{'width': '100%'}"
        (onSlideEnd)="options.showErrors = true"></p-slider>

      <p-slider *ngIf="!boundControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [disabled]="controlDisabled || options?.readonly"
        [min]="minValue"
        [max]="maxValue"
        [step]="options?.multipleOf || options?.step || 1"
        [style]="{'width': '100%'}"
        [ngModel]="controlValue"
        (onChange)="updateValue($event)"
        (onSlideEnd)="options.showErrors = true"></p-slider>

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
export class PrimengSliderComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  get minValue() { return effectiveMinimum(this.options?.minimum, this.options?.exclusiveMinimum); }
  get maxValue() { return effectiveMaximum(this.options?.maximum, this.options?.exclusiveMaximum); }

  constructor(private jsf: JsonSchemaFormService) {}

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this, !this.options.readonly);
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, event.value);
  }
}
