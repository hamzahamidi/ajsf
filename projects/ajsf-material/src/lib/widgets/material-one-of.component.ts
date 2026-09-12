import { Component, Inject, Input, OnInit, Optional, ChangeDetectionStrategy } from '@angular/core';
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
      @if (!options?.notitle) {
        <mat-label>{{options?.title}}</mat-label>
      }
    
      @if (boundControl) {
        <mat-select
          [formControl]="formControl"
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [placeholder]="options?.notitle ? $safeNavigationMigration(options?.placeholder) : $safeNavigationMigration(options?.title)"
          [required]="$safeNavigationMigration(options?.required)"
          [style.width]="'100%'"
          (blur)="options.showErrors = true">
          @for (item of selectList; track item) {
            <mat-option [value]="$safeNavigationMigration(item?.value)">
              <span [innerHTML]="$safeNavigationMigration(item?.name)"></span>
            </mat-option>
          }
        </mat-select>
      }
    
      @if (!boundControl && !isFieldset) {
        <mat-select
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [disabled]="controlDisabled || options?.readonly"
          [placeholder]="options?.notitle ? $safeNavigationMigration(options?.placeholder) : $safeNavigationMigration(options?.title)"
          [required]="$safeNavigationMigration(options?.required)"
          [style.width]="'100%'"
          [value]="controlValue"
          (selectionChange)="updateValue($event)"
          (blur)="options.showErrors = true">
          @for (item of selectList; track item) {
            <mat-option [value]="$safeNavigationMigration(item?.value)">
              <span [innerHTML]="$safeNavigationMigration(item?.name)"></span>
            </mat-option>
          }
        </mat-select>
      }
    
      @if (!boundControl && isFieldset) {
        <mat-select
          [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
          [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
          [disabled]="controlDisabled || options?.readonly"
          [style.width]="'100%'"
          [value]="selectedValue"
          (selectionChange)="selectChild($event)">
          @for (item of selectList; track item) {
            <mat-option [value]="$safeNavigationMigration(item?.value)">
              <span [innerHTML]="$safeNavigationMigration(item?.name)"></span>
            </mat-option>
          }
        </mat-select>
      }
    
      @if (options?.description && (!options?.showErrors || !options?.errorMessage)) {
        <mat-hint
        align="end" [innerHTML]="$safeNavigationMigration(options?.description)"></mat-hint>
      }
    </mat-form-field>
    @if (options?.showErrors && options?.errorMessage) {
      <mat-error
      [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></mat-error>
    }
    
    @for (layoutItem of layoutNode?.items; track layoutItem; let i = $index) {
      <div>
        @if (isFieldset && selectedItem === i) {
          <select-framework-widget
            [dataIndex]="layoutNode?.dataType === 'array' ? (dataIndex || []).concat(i) : dataIndex"
            [layoutIndex]="(layoutIndex || []).concat(i)"
          [layoutNode]="layoutItem"></select-framework-widget>
        }
      </div>
    }`,
    styles: [`
    mat-error { font-size: 75%; margin-top: -1rem; margin-bottom: 0.5rem; }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
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
    if (this.isFieldset && this.formControl) {
      const val = this.formControl.value ?? this.controlValue;
      return this.fieldsetValueMap.get(val) ?? this._selectedItem;
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

    if (this.isFieldset && this.controlValue != null) {
      this.selectedValue = this.controlValue;
      this._selectedItem = this.fieldsetValueMap.get(this.controlValue)
        ?? (typeof this.controlValue === 'number' ? this.controlValue : 0);
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
