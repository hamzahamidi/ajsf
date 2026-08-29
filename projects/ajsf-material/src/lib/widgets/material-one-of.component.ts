import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { JsonSchemaFormService, buildTitleMap } from '@ajsf/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

@Component({
    selector: 'material-one-of-widget',
    template: `
    <mat-form-field
      [appearance]="options?.appearance || matFormFieldDefaultOptions?.appearance || 'fill'"
      [class]="options?.htmlClass || ''"
      [floatLabel]="options?.floatLabel || matFormFieldDefaultOptions?.floatLabel || 'auto'"
      [style.width]="'100%'">
      <mat-label *ngIf="!options?.notitle">{{options?.title}}</mat-label>

      <mat-select *ngIf="boundControl"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [id]="'control' + layoutNode?._id"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [required]="options?.required"
        [style.width]="'100%'"
        (blur)="options.showErrors = true">
        <mat-option *ngFor="let item of selectList" [value]="item?.value">
          <span [innerHTML]="item?.name"></span>
        </mat-option>
      </mat-select>

      <mat-select *ngIf="!boundControl && !isFieldset"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [id]="'control' + layoutNode?._id"
        [disabled]="controlDisabled || options?.readonly"
        [placeholder]="options?.notitle ? options?.placeholder : options?.title"
        [required]="options?.required"
        [style.width]="'100%'"
        [value]="controlValue"
        (selectionChange)="updateValue($event)"
        (blur)="options.showErrors = true">
        <mat-option *ngFor="let item of selectList" [value]="item?.value">
          <span [innerHTML]="item?.name"></span>
        </mat-option>
      </mat-select>

      <mat-select *ngIf="!boundControl && isFieldset"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [id]="'control' + layoutNode?._id"
        [style.width]="'100%'"
        [value]="selectedValue"
        (selectionChange)="selectChild($event)">
        <mat-option *ngFor="let item of selectList" [value]="item?.value">
          <span [innerHTML]="item?.name"></span>
        </mat-option>
      </mat-select>

      <mat-hint *ngIf="options?.description && (!options?.showErrors || !options?.errorMessage)"
        align="end" [innerHTML]="options?.description"></mat-hint>
    </mat-form-field>
    <mat-error *ngIf="options?.showErrors && options?.errorMessage"
      [innerHTML]="options?.errorMessage"></mat-error>

    <div *ngFor="let layoutItem of layoutNode?.items; let i = index">
      <select-framework-widget *ngIf="isFieldset && selectedItem === i"
        [dataIndex]="layoutNode?.dataType === 'array' ? (dataIndex || []).concat(i) : dataIndex"
        [layoutIndex]="(layoutIndex || []).concat(i)"
        [layoutNode]="layoutItem"></select-framework-widget>
    </div>`,
    styles: [`
    mat-error { font-size: 75%; margin-top: -1rem; margin-bottom: 0.5rem; }
  `],
    standalone: false
})
export class MaterialOneOfComponent implements OnInit {
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

  constructor(
    @Inject(MAT_FORM_FIELD_DEFAULT_OPTIONS) @Optional() public matFormFieldDefaultOptions,
    private jsf: JsonSchemaFormService
  ) { }

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
