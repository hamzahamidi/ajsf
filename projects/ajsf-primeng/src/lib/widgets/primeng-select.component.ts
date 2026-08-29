import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService, buildTitleMap, isArray } from '@ajsf/core';

@Component({
    selector: 'primeng-select-widget',
    template: `
    <div [class]="options?.htmlClass || ''" [style.width]="'100%'">
      <label *ngIf="!options?.notitle"
        [attr.for]="'control' + layoutNode?._id">{{options?.title}}</label>
      <span *ngIf="options?.prefix || options?.fieldAddonLeft"
        [innerHTML]="options?.prefix || options?.fieldAddonLeft"></span>
      <p-select *ngIf="boundControl && !options?.multiple"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [inputId]="'control' + layoutNode?._id"
        [options]="selectList"
        [optionLabel]="'name'"
        [optionValue]="'value'"
        [group]="hasGroups"
        [optionGroupLabel]="'group'"
        [optionGroupChildren]="'items'"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [required]="options?.required"
        [fluid]="true"
        (onBlur)="options.showErrors = true"></p-select>
      <p-select *ngIf="!boundControl && !options?.multiple"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [inputId]="'control' + layoutNode?._id"
        [options]="selectList"
        [optionLabel]="'name'"
        [optionValue]="'value'"
        [group]="hasGroups"
        [optionGroupLabel]="'group'"
        [optionGroupChildren]="'items'"
        [disabled]="controlDisabled || options?.readonly"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [required]="options?.required"
        [ngModel]="controlValue"
        [fluid]="true"
        (onChange)="updateValue($event)"
        (onBlur)="options.showErrors = true"></p-select>
      <p-multiselect *ngIf="boundControl && options?.multiple"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [inputId]="'control' + layoutNode?._id"
        [options]="selectList"
        [optionLabel]="'name'"
        [optionValue]="'value'"
        [group]="hasGroups"
        [optionGroupLabel]="'group'"
        [optionGroupChildren]="'items'"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [fluid]="true"
        (onBlur)="options.showErrors = true"></p-multiselect>
      <p-multiselect *ngIf="!boundControl && options?.multiple"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [inputId]="'control' + layoutNode?._id"
        [options]="selectList"
        [optionLabel]="'name'"
        [optionValue]="'value'"
        [group]="hasGroups"
        [optionGroupLabel]="'group'"
        [optionGroupChildren]="'items'"
        [disabled]="controlDisabled || options?.readonly"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [ngModel]="controlValue"
        [fluid]="true"
        (onChange)="updateValue($event)"
        (onBlur)="options.showErrors = true"></p-multiselect>
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
export class PrimengSelectComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  selectList: any[] = [];
  hasGroups = false;
  isArray = isArray;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(private jsf: JsonSchemaFormService) {}

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.selectList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, !!this.options.required, !!this.options.flatList
    );
    this.hasGroups = this.selectList.some(item => isArray(item.items));
    if (this.hasGroups) {
      this.selectList = this.selectList.map(item =>
        isArray(item.items) ? item : { group: '', items: [item] }
      );
    }
    this.jsf.initializeControl(this, !this.options.readonly);
    if (!this.options.notitle && !this.options.description && this.options.placeholder) {
      this.options.description = this.options.placeholder;
    }
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, event.value);
  }
}
