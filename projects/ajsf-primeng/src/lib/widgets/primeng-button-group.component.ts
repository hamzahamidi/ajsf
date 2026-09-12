import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService, buildTitleMap } from '@ajsf/core';

@Component({
    selector: 'primeng-button-group-widget',
    template: `
    <div>
      @if (options?.title) {
        <div>
          <label
            [attr.for]="'control' + layoutNode?._id"
            [class]="options?.labelHtmlClass || ''"
            [style.display]="options?.notitle ? 'none' : ''"
          [innerHTML]="options?.title"></label>
        </div>
      }
      @if (boundControl) {
        <p-selectbutton
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [options]="radiosList"
          [optionLabel]="'name'"
          [optionValue]="'value'"
        [disabled]="controlDisabled || options?.readonly"></p-selectbutton>
      }
      @if (!boundControl) {
        <p-selectbutton
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [options]="radiosList"
          [optionLabel]="'name'"
          [optionValue]="'value'"
          [disabled]="controlDisabled || options?.readonly"
          [ngModel]="controlValue"
        (onChange)="updateValue($event)"></p-selectbutton>
      }
      @if (options?.showErrors && options?.errorMessage) {
        <div class="p-error"
        [innerHTML]="options?.errorMessage"></div>
      }
    </div>`,
    styles: [` .p-error { font-size: 75%; margin-top: 0.25rem; } `],
    standalone: false
})
export class PrimengButtonGroupComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  radiosList: any[] = [];
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(private jsf: JsonSchemaFormService) {}

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.radiosList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, true
    );
    this.jsf.initializeControl(this);
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, event.value);
  }
}
