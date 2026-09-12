import { AbstractControl } from '@angular/forms';
import { buildTitleMap, isArray } from '../shared';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '../json-schema-form.service';


@Component({
    selector: 'select-widget',
    template: `
    <div
      [class]="options?.htmlClass || ''">
      @if (options?.title) {
        <label
          [attr.for]="'control' + layoutNode?._id"
          [class]="options?.labelHtmlClass || ''"
          [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></label>
      }
      @if (boundControl) {
        <select
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.readonly]="options?.readonly ? 'readonly' : null"
          [attr.required]="options?.required"
          [class]="options?.fieldHtmlClass || ''"
          [id]="'control' + layoutNode?._id"
          [name]="controlName">
          @for (selectItem of selectList; track selectItem) {
            <!-- ngValue, not value: the DOM coerces value to a string, so the
            None option wrote the four-character string "null" into the
            control and a numeric enum stored strings. -->
            @if (!isArray(selectItem?.items)) {
              <option
                [ngValue]="selectItem?.value">
                <span [innerHTML]="selectItem?.name"></span>
              </option>
            }
            @if (isArray(selectItem?.items)) {
              <optgroup
                [label]="selectItem?.group">
                @for (subItem of selectItem.items; track subItem) {
                  <option
                    [ngValue]="subItem?.value">
                    <span [innerHTML]="subItem?.name"></span>
                  </option>
                }
              </optgroup>
            }
          }
        </select>
      }
      @if (!boundControl) {
        <select
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [attr.readonly]="options?.readonly ? 'readonly' : null"
          [attr.required]="options?.required"
          [class]="options?.fieldHtmlClass || ''"
          [disabled]="controlDisabled"
          [id]="'control' + layoutNode?._id"
          [name]="controlName"
          (change)="updateValue($event)">
          @for (selectItem of selectList; track selectItem) {
            @if (!isArray(selectItem?.items)) {
              <option
                [selected]="selectItem?.value === controlValue"
                [value]="selectItem?.value">
                <span [innerHTML]="selectItem?.name"></span>
              </option>
            }
            @if (isArray(selectItem?.items)) {
              <optgroup
                [label]="selectItem?.group">
                @for (subItem of selectItem.items; track subItem) {
                  <option
                    [attr.selected]="subItem?.value === controlValue"
                    [value]="subItem?.value">
                    <span [innerHTML]="subItem?.name"></span>
                  </option>
                }
              </optgroup>
            }
          }
        </select>
      }
    </div>`,
    standalone: false
})
export class SelectComponent implements OnInit {
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
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.selectList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, !!this.options.required, !!this.options.flatList
    );
    this.jsf.initializeControl(this);
  }

  updateValue(event) {
    // The unbound select has no value accessor, so the DOM hands back every
    // selection as a string. Recover the typed value from the option list.
    const domValue = event.target.value;
    const flatItems = [];
    for (const item of this.selectList) {
      if (isArray(item.items)) { flatItems.push(...item.items); } else { flatItems.push(item); }
    }
    const matched = flatItems.find(item => `${item.value}` === domValue);
    this.jsf.updateValue(this, matched ? matched.value : domValue);
  }
}
