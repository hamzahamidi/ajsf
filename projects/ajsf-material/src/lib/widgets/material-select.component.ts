import { AbstractControl } from '@angular/forms';
import {Component, Inject, Input, OnInit, Optional} from '@angular/core';
import { JsonSchemaFormService, buildTitleMap, isArray } from '@ajsf/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

@Component({
    selector: 'material-select-widget',
    template: `
    <mat-form-field
      [appearance]="options?.appearance || matFormFieldDefaultOptions?.appearance || 'fill'"
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
        <mat-select
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.name]="controlName"
          [id]="'control' + layoutNode?._id"
          [multiple]="options?.multiple"
          [placeholder]="options?.notitle ? options?.placeholder : options?.title"
          [required]="options?.required"
          [style.width]="'100%'"
          (blur)="options.showErrors = true">
          @for (selectItem of selectList; track selectItem) {
            @if (!isArray(selectItem?.items)) {
              <mat-option
                [value]="selectItem?.value">
                <span [innerHTML]="selectItem?.name"></span>
              </mat-option>
            }
            @if (isArray(selectItem?.items)) {
              <mat-optgroup
                [label]="selectItem?.group">
                @for (subItem of selectItem.items; track subItem) {
                  <mat-option
                    [value]="subItem?.value">
                    <span [innerHTML]="subItem?.name"></span>
                  </mat-option>
                }
              </mat-optgroup>
            }
          }
        </mat-select>
      }
      @if (!boundControl) {
        <mat-select
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.name]="controlName"
          [disabled]="controlDisabled || options?.readonly"
          [id]="'control' + layoutNode?._id"
          [multiple]="options?.multiple"
          [placeholder]="options?.notitle ? options?.placeholder : options?.title"
          [required]="options?.required"
          [style.width]="'100%'"
          [value]="controlValue"
          (blur)="options.showErrors = true"
          (change)="updateValue($event)">
          @for (selectItem of selectList; track selectItem) {
            @if (!isArray(selectItem?.items)) {
              <mat-option
                [attr.selected]="selectItem?.value === controlValue"
                [value]="selectItem?.value">
                <span [innerHTML]="selectItem?.name"></span>
              </mat-option>
            }
            @if (isArray(selectItem?.items)) {
              <mat-optgroup
                [label]="selectItem?.group">
                @for (subItem of selectItem.items; track subItem) {
                  <mat-option
                    [attr.selected]="subItem?.value === controlValue"
                    [value]="subItem?.value">
                    <span [innerHTML]="subItem?.name"></span>
                  </mat-option>
                }
              </mat-optgroup>
            }
          }
        </mat-select>
      }
      @if (options?.suffix || options?.fieldAddonRight) {
        <span matSuffix
        [innerHTML]="options?.suffix || options?.fieldAddonRight"></span>
      }
      @if (options?.description && (!options?.showErrors || !options?.errorMessage)) {
        <mat-hint
        align="end" [innerHTML]="options?.description"></mat-hint>
      }
    </mat-form-field>
    @if (options?.showErrors && options?.errorMessage) {
      <mat-error
      [innerHTML]="options?.errorMessage"></mat-error>
    }`,
    styles: [`
    mat-error { font-size: 75%; margin-top: -1rem; margin-bottom: 0.5rem; }
    ::ng-deep json-schema-form mat-form-field .mat-mdc-form-field-wrapper .mat-form-field-flex
      .mat-form-field-infix { width: initial; }
  `],
    standalone: false
})
export class MaterialSelectComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  selectList: any[] = [];
  isArray = isArray;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    @Inject(MAT_FORM_FIELD_DEFAULT_OPTIONS) @Optional() public matFormFieldDefaultOptions,
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.selectList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, !!this.options.required, !!this.options.flatList
    );
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
