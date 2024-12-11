import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { JsonSchemaFormService } from '@zajsf/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'material-slider-widget',
  template: `
    <mat-slider discrete *ngIf="boundControl"
      
      [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
      [id]="'control' + layoutNode?._id"
      [max]="options?.maximum"
      [min]="options?.minimum"
      [step]="options?.multipleOf || options?.step || 'any'"
      [style.width]="'100%'"
      (blur)="options.showErrors = true">
        <input matSliderThumb [formControl]="formControl" />
      </mat-slider>
    <mat-slider discrete *ngIf="!boundControl"
      [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
      [disabled]="controlDisabled || options?.readonly"
      [id]="'control' + layoutNode?._id"
      [max]="options?.maximum"
      [min]="options?.minimum"
      [step]="options?.multipleOf || options?.step || 'any'"
      [style.width]="'100%'"
      (blur)="options.showErrors = true" #ngSlider>
        <input matSliderThumb [value]="controlValue" 
        (change)="updateValue({source: ngSliderThumb, parent: ngSlider, value: ngSliderThumb.value})"
        #ngSliderThumb="matSliderThumb" />
    </mat-slider>
    <mat-error *ngIf="options?.showErrors && options?.errorMessage"
      [innerHTML]="options?.errorMessage"></mat-error>`,
    styles: [` mat-error { font-size: 75%; } `],
})
export class MaterialSliderComponent implements OnInit {
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
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.jsf.initializeControl(this, !this.options.readonly);
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, event.value);
  }
}
