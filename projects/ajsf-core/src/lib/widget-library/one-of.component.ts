import { AbstractControl } from '@angular/forms';
import { buildTitleMap } from '../shared';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService } from '../json-schema-form.service';

@Component({
    selector: 'one-of-widget',
    template: `
    <div [class]="options?.htmlClass || ''">
      @if (options?.title) {
        <label
          [attr.for]="'control' + layoutNode?._id"
          [class]="options?.labelHtmlClass || ''"
          [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="$safeNavigationMigration(options?.title)"></label>
      }
      @if (boundControl) {
        <select
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [class]="options?.fieldHtmlClass || ''"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          (blur)="options.showErrors = true">
          @for (selectItem of selectList; track selectItem) {
            @if (!selectItem?.items) {
              <option [ngValue]="$safeNavigationMigration(selectItem?.value)">
                <span [innerHTML]="$safeNavigationMigration(selectItem?.name)"></span>
              </option>
            }
            @if (selectItem?.items) {
              <optgroup [label]="$safeNavigationMigration(selectItem?.group)">
                @for (subItem of selectItem.items; track subItem) {
                  <option [ngValue]="$safeNavigationMigration(subItem?.value)">
                    <span [innerHTML]="$safeNavigationMigration(subItem?.name)"></span>
                  </option>
                }
              </optgroup>
            }
          }
        </select>
      }
      @if (!boundControl) {
        <select
          [ngModel]="isFieldset ? selectedValue : controlValue"
          [ngModelOptions]="{standalone: true}"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [class]="options?.fieldHtmlClass || ''"
          [disabled]="controlDisabled || options?.readonly"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [name]="controlName"
          (ngModelChange)="onUnboundValueChange($event)"
          (blur)="options.showErrors = true">
          @for (selectItem of selectList; track selectItem) {
            @if (!selectItem?.items) {
              <option [ngValue]="$safeNavigationMigration(selectItem?.value)">
                <span [innerHTML]="$safeNavigationMigration(selectItem?.name)"></span>
              </option>
            }
            @if (selectItem?.items) {
              <optgroup [label]="$safeNavigationMigration(selectItem?.group)">
                @for (subItem of selectItem.items; track subItem) {
                  <option [ngValue]="$safeNavigationMigration(subItem?.value)">
                    <span [innerHTML]="$safeNavigationMigration(subItem?.name)"></span>
                  </option>
                }
              </optgroup>
            }
          }
        </select>
      }
      @if (options?.description && (!options?.showErrors || !options?.errorMessage)) {
        <small [innerHTML]="$safeNavigationMigration(options?.description)"></small>
      }
      @if (options?.showErrors && options?.errorMessage) {
        <div
          [class]="options?.errorHtmlClass || ''"
        [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></div>
      }
      @for (layoutItem of layoutNode?.items; track layoutItem; let i = $index) {
        @if (isFieldset && selectedItem === i) {
          <select-framework-widget
            [dataIndex]="layoutNode?.dataType === 'array' ? (dataIndex || []).concat(i) : dataIndex"
            [layoutIndex]="(layoutIndex || []).concat(i)"
          [layoutNode]="layoutItem"></select-framework-widget>
        }
      }
    </div>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class OneOfComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  selectList: any[] = [];
  isFieldset = false;
  selectedValue: any = 0;
  private selectedItemIndex = 0;
  private readonly fieldsetValueMap: Map<any, number> = new Map();
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(private readonly jsf: JsonSchemaFormService) { }

  get selectedItem(): number {
    if (this.isFieldset && this.boundControl) {
      const value = this.formControl?.value ?? this.controlValue;
      return this.fieldsetValueMap.get(value) ?? this.selectedItemIndex;
    }
    return this.selectedItemIndex;
  }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.isFieldset =
      (this.layoutNode.type === 'selectfieldset' || this.layoutNode.type === 'optionfieldset') &&
      Array.isArray(this.layoutNode.items) && this.layoutNode.items.length > 0;

    this.initializeSelectList();
    this.initializeFieldsetValueMap();
    this.initializeControl();
    this.selectInitialFieldsetValue();
  }

  private initializeSelectList() {
    if (this.isFieldset && !this.hasExplicitFieldsetOptions()) {
      this.selectList = this.layoutNode.items.map((item, index) => ({
        name: item.options?.legend || item.options?.title || item.name || `Option ${index + 1}`,
        value: index,
      }));
      return;
    }
    this.selectList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum,
      !!this.options.required,
      !!this.options.flatList
    );
  }

  private initializeFieldsetValueMap() {
    if (!this.isFieldset || !this.hasExplicitFieldsetOptions()) { return; }
    let itemIndex = 0;
    for (const entry of this.selectList) {
      const items = Array.isArray(entry.items) ? entry.items : [entry];
      for (const item of items) {
        if (item.value == null) { continue; }
        if (itemIndex === 0) { this.selectedValue = item.value; }
        this.fieldsetValueMap.set(item.value, itemIndex++);
      }
    }
  }

  private initializeControl() {
    if (!this.isFieldset || this.hasExplicitFieldsetOptions()) {
      this.jsf.initializeControl(this, !this.options.readonly);
    }
  }

  private selectInitialFieldsetValue() {
    if (this.isFieldset && this.controlValue != null) {
      this.selectedValue = this.controlValue;
      this.selectedItemIndex = this.fieldsetValueMap.get(this.controlValue)
        ?? (typeof this.controlValue === 'number' ? this.controlValue : 0);
    }
  }

  private hasExplicitFieldsetOptions() {
    return !!(this.options.titleMap || this.options.enum);
  }

  onUnboundValueChange(value: any) {
    if (this.isFieldset) {
      this.selectChild(value);
    } else {
      this.updateValue(value);
    }
  }

  selectChild(value: any) {
    this.selectedValue = value;
    this.selectedItemIndex = this.fieldsetValueMap.get(value)
      ?? (typeof value === 'number' ? value : 0);
  }

  updateValue(value: any) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, value);
  }
}
