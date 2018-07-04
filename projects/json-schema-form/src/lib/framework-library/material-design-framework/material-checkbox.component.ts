import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { hasOwn } from './../../shared/utility.functions';

@Component({
  selector: 'material-checkbox-widget',
  template: `
    <mat-checkbox *ngIf="boundControl && !showSlideToggle"
      [formControl]="formControl"
      align="left"
      [color]="options?.color || 'primary'"
      [id]="'control' + layoutNode?._id"
      labelPosition="after"
      [name]="controlName"
      (blur)="options.showErrors = true">
      <span *ngIf="options?.title"
        class="checkbox-name"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></span>
    </mat-checkbox>
    <mat-checkbox *ngIf="!boundControl && !showSlideToggle"
      align="left"
      [color]="options?.color || 'primary'"
      [disabled]="controlDisabled || options?.readonly"
      [id]="'control' + layoutNode?._id"
      labelPosition="after"
      [name]="controlName"
      [checked]="isChecked"
      (blur)="options.showErrors = true"
      (change)="updateValue($event)">
      <span *ngIf="options?.title"
        class="checkbox-name"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></span>
    </mat-checkbox>
    <mat-slide-toggle *ngIf="boundControl && showSlideToggle"
      [formControl]="formControl"
      align="left"
      [color]="options?.color || 'primary'"
      [id]="'control' + layoutNode?._id"
      labelPosition="after"
      [name]="controlName"
      (blur)="options.showErrors = true">
      <span *ngIf="options?.title"
        class="checkbox-name"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></span>
    </mat-slide-toggle>
    <mat-slide-toggle *ngIf="!boundControl && showSlideToggle"
      align="left"
      [color]="options?.color || 'primary'"
      [disabled]="controlDisabled || options?.readonly"
      [id]="'control' + layoutNode?._id"
      labelPosition="after"
      [name]="controlName"
      [checked]="isChecked"
      (blur)="options.showErrors = true"
      (change)="updateValue($event)">
      <span *ngIf="options?.title"
        class="checkbox-name"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></span>
    </mat-slide-toggle>
    <mat-error *ngIf="options?.showErrors && options?.errorMessage"
      [innerHTML]="options?.errorMessage"></mat-error>`,
  styles: [`
    .checkbox-name { white-space: nowrap; }
    mat-error { font-size: 75%; }
  `],
})
export class MaterialCheckboxComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  trueValue: any = true;
  falseValue: any = false;
  showSlideToggle = false;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

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
      this.showSlideToggle = true;
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
