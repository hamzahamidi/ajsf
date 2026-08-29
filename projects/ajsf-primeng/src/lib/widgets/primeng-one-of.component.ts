import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { JsonSchemaFormService, buildTitleMap } from '@ajsf/core';

@Component({
    selector: 'primeng-one-of-widget',
    template: `
    <div [class]="options?.htmlClass || ''" [style.width]="'100%'">
      <label *ngIf="!options?.notitle"
        [attr.for]="'control' + layoutNode?._id">{{options?.title}}</label>

      <p-select *ngIf="boundControl"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [inputId]="'control' + layoutNode?._id"
        [options]="selectList"
        [optionLabel]="'name'"
        [optionValue]="'value'"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [required]="options?.required"
        [fluid]="true"
        (onBlur)="options.showErrors = true"></p-select>

      <p-select *ngIf="!boundControl && !isFieldset"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [inputId]="'control' + layoutNode?._id"
        [options]="selectList"
        [optionLabel]="'name'"
        [optionValue]="'value'"
        [disabled]="controlDisabled || options?.readonly"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [required]="options?.required"
        [ngModel]="controlValue"
        [fluid]="true"
        (onChange)="updateValue($event)"
        (onBlur)="options.showErrors = true"></p-select>

      <p-select *ngIf="!boundControl && isFieldset"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [inputId]="'control' + layoutNode?._id"
        [options]="selectList"
        [optionLabel]="'name'"
        [optionValue]="'value'"
        [ngModel]="selectedValue"
        [fluid]="true"
        (onChange)="selectChild($event)"
        (onBlur)="options.showErrors = true"></p-select>

      <small *ngIf="options?.description && (!options?.showErrors || !options?.errorMessage)"
        [innerHTML]="options?.description"></small>

      <div *ngFor="let layoutItem of layoutNode?.items; let i = index">
        <select-framework-widget *ngIf="isFieldset && selectedItem === i"
          [dataIndex]="layoutNode?.dataType === 'array' ? (dataIndex || []).concat(i) : dataIndex"
          [layoutIndex]="(layoutIndex || []).concat(i)"
          [layoutNode]="layoutItem"></select-framework-widget>
      </div>
    </div>
    <div class="p-error" *ngIf="options?.showErrors && options?.errorMessage"
      [innerHTML]="options?.errorMessage"></div>`,
    styles: [`
    .p-error { font-size: 75%; margin-top: 0.25rem; }
  `],
    standalone: false
})
export class PrimengOneOfComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  selectList: any[] = [];
  isFieldset = false;
  selectedValue: any = 0;
  private _selectedItem = 0;
  private fieldsetValueMap: Map<any, number> = new Map();
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(private jsf: JsonSchemaFormService) {}

  get selectedItem(): number {
    if (this.isFieldset && this.boundControl) {
      const val = this.formControl?.value ?? this.controlValue;
      return this.fieldsetValueMap.get(val) ?? 0;
    }
    return this._selectedItem;
  }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    const type = this.layoutNode.type;
    this.isFieldset = (type === 'selectfieldset' || type === 'optionfieldset')
      && Array.isArray(this.layoutNode.items) && this.layoutNode.items.length > 0;

    if (this.isFieldset && !this.options.titleMap && !this.options.enum) {
      this.selectList = this.layoutNode.items.map((item, i) => ({
        name: item.options?.legend || item.options?.title || item.name || `Option ${i + 1}`,
        value: i
      }));
    } else {
      this.selectList = buildTitleMap(
        this.options.titleMap || this.options.enumNames,
        this.options.enum, !!this.options.required, !!this.options.flatList
      );
    }

    if (this.isFieldset && (this.options.titleMap || this.options.enum)) {
      let idx = 0;
      for (const entry of this.selectList) {
        if (entry.value != null && entry.value !== '') {
          if (idx === 0) { this.selectedValue = entry.value; }
          this.fieldsetValueMap.set(entry.value, idx++);
        }
      }
    }

    if (!this.isFieldset || this.options.titleMap || this.options.enum) {
      this.jsf.initializeControl(this, !this.options.readonly);
    }
  }

  selectChild(event) {
    this.selectedValue = event.value;
    this._selectedItem =
      this.fieldsetValueMap.get(event.value) ?? event.value;
  }

  updateValue(event) {
    this.options.showErrors = true;
    this.jsf.updateValue(this, event.value);
  }
}
