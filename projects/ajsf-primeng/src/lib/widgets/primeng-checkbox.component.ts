import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'primeng-checkbox-widget',
    template: `
    <p-checkbox *ngIf="boundControl && !showToggleSwitch"
      [formControl]="formControl"
      [binary]="true"
      [inputId]="'control' + layoutNode?._id"
      [name]="controlName"
      (onBlur)="options.showErrors = true">
    </p-checkbox>
    <label *ngIf="boundControl && !showToggleSwitch && options?.title"
      class="checkbox-name"
      [attr.for]="'control' + layoutNode?._id"
      [style.display]="options?.notitle ? 'none' : ''"
      [innerHTML]="options?.title"></label>

    <p-checkbox *ngIf="!boundControl && !showToggleSwitch"
      [binary]="true"
      [disabled]="controlDisabled || options?.readonly"
      [inputId]="'control' + layoutNode?._id"
      [name]="controlName"
      [ngModel]="isChecked"
      (onChange)="updateValue($event)"
      (onBlur)="options.showErrors = true">
    </p-checkbox>
    <label *ngIf="!boundControl && !showToggleSwitch && options?.title"
      class="checkbox-name"
      [attr.for]="'control' + layoutNode?._id"
      [style.display]="options?.notitle ? 'none' : ''"
      [innerHTML]="options?.title"></label>

    <p-toggleswitch *ngIf="boundControl && showToggleSwitch"
      [formControl]="formControl"
      [inputId]="'control' + layoutNode?._id"
      [name]="controlName"
      (onBlur)="options.showErrors = true">
    </p-toggleswitch>
    <label *ngIf="boundControl && showToggleSwitch && options?.title"
      class="checkbox-name"
      [attr.for]="'control' + layoutNode?._id"
      [style.display]="options?.notitle ? 'none' : ''"
      [innerHTML]="options?.title"></label>

    <p-toggleswitch *ngIf="!boundControl && showToggleSwitch"
      [disabled]="controlDisabled || options?.readonly"
      [inputId]="'control' + layoutNode?._id"
      [name]="controlName"
      [ngModel]="isChecked"
      (onChange)="updateValue($event)"
      (onBlur)="options.showErrors = true">
    </p-toggleswitch>
    <label *ngIf="!boundControl && showToggleSwitch && options?.title"
      class="checkbox-name"
      [attr.for]="'control' + layoutNode?._id"
      [style.display]="options?.notitle ? 'none' : ''"
      [innerHTML]="options?.title"></label>

    <div class="p-error" *ngIf="options?.showErrors && options?.errorMessage"
      [innerHTML]="options?.errorMessage"></div>`,
    styles: [`
    .checkbox-name { white-space: nowrap; }
    .p-error { font-size: 75%; margin-top: 0.25rem; }
  `],
    standalone: false
})
export class PrimengCheckboxComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  trueValue: any = true;
  falseValue: any = false;
  showToggleSwitch = false;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(private jsf: JsonSchemaFormService) {}

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this, !this.options.readonly);
    if (this.controlValue === null || this.controlValue === undefined) {
      this.controlValue = false;
      this.jsf.updateValue(this, this.falseValue);
    }
    if (this.layoutNode.type === 'slide-toggle' ||
      this.layoutNode.format === 'slide-toggle'
    ) {
      this.showToggleSwitch = true;
    }
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, event.checked ? this.trueValue : this.falseValue);
  }

  get isChecked() {
    return this.jsf.getFormControlValue(this) === this.trueValue;
  }
}
