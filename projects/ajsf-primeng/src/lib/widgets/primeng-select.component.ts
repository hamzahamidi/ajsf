import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService, buildTitleMap, isArray } from '@ajsf/core';

@Component({
    selector: 'primeng-select-widget',
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
      @if (boundControl && !options?.multiple) {
        <p-select
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [inputId]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [options]="selectList"
          [optionLabel]="'name'"
          [optionValue]="'value'"
          [group]="hasGroups"
          [optionGroupLabel]="'group'"
          [optionGroupChildren]="'items'"
          [placeholder]="options?.notitle ? $safeNavigationMigration(options?.placeholder) : $safeNavigationMigration(options?.title)"
          [required]="$safeNavigationMigration(options?.required)"
          [fluid]="true"
        (onBlur)="options.showErrors = true"></p-select>
      }
      @if (!boundControl && !options?.multiple) {
        <p-select
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [inputId]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [options]="selectList"
          [optionLabel]="'name'"
          [optionValue]="'value'"
          [group]="hasGroups"
          [optionGroupLabel]="'group'"
          [optionGroupChildren]="'items'"
          [disabled]="controlDisabled || options?.readonly"
          [placeholder]="options?.notitle ? $safeNavigationMigration(options?.placeholder) : $safeNavigationMigration(options?.title)"
          [required]="$safeNavigationMigration(options?.required)"
          [ngModel]="controlValue"
          [fluid]="true"
          (onChange)="updateValue($event)"
        (onBlur)="options.showErrors = true"></p-select>
      }
      @if (boundControl && options?.multiple) {
        <p-multiselect
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [inputId]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [options]="selectList"
          [optionLabel]="'name'"
          [optionValue]="'value'"
          [group]="hasGroups"
          [optionGroupLabel]="'group'"
          [optionGroupChildren]="'items'"
          [placeholder]="options?.notitle ? $safeNavigationMigration(options?.placeholder) : $safeNavigationMigration(options?.title)"
          [fluid]="true"
        (onBlur)="options.showErrors = true"></p-multiselect>
      }
      @if (!boundControl && options?.multiple) {
        <p-multiselect
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [inputId]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [options]="selectList"
          [optionLabel]="'name'"
          [optionValue]="'value'"
          [group]="hasGroups"
          [optionGroupLabel]="'group'"
          [optionGroupChildren]="'items'"
          [disabled]="controlDisabled || options?.readonly"
          [placeholder]="options?.notitle ? $safeNavigationMigration(options?.placeholder) : $safeNavigationMigration(options?.title)"
          [ngModel]="controlValue"
          [fluid]="true"
          (onChange)="updateValue($event)"
        (onBlur)="options.showErrors = true"></p-multiselect>
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
