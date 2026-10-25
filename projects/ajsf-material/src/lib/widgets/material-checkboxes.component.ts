import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { buildTitleMap, JsonSchemaFormService, TitleMapItem } from '@ajsf/core';

@Component({
    selector: 'material-checkboxes-widget',
    template: `
    <div>
      <mat-checkbox type="checkbox"
        [checked]="allChecked"
        [color]="options?.color || 'primary'"
        [disabled]="controlDisabled || options?.readonly"
        [indeterminate]="someChecked"
        [name]="$safeNavigationMigration(options?.name)"
        [attr.aria-controls]="'control' + $safeNavigationMigration(layoutNode?._id)"
        (blur)="options.showErrors = true"
        (change)="updateAllValues($event)">
        <span class="checkbox-name" [innerHTML]="$safeNavigationMigration(options?.name)"></span>
      </mat-checkbox>
      @if (options?.title) {
        <label
          [id]="'control' + $safeNavigationMigration(layoutNode?._id) + 'Title'"
          class="title"
          [class]="options?.labelHtmlClass || ''"
          [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="$safeNavigationMigration(options?.title)"></label>
      }
      <mat-selection-list
        [attr.aria-label]="options?.notitle || !options?.title ? (options?.name || options?.title || 'Options') : null"
        [attr.aria-labelledby]="options?.title && !options?.notitle ? 'control' + $safeNavigationMigration(layoutNode?._id) + 'Title' : null"
        [class.horizontal-list]="horizontalList"
        [disabled]="controlDisabled || options?.readonly"
        [id]="'control' + $safeNavigationMigration(layoutNode?._id)"
        [multiple]="true"
        [color]="options?.color || 'primary'"
        (blur)="options.showErrors = true"
        (selectionChange)="updateValueFromSelection($event)">
        @for (checkboxItem of checkboxList; track checkboxItem) {
          <mat-list-option
            [class]="options?.htmlClass || ''"
            [disabled]="controlDisabled || options?.readonly"
            [selected]="checkboxItem.checked"
            [value]="checkboxItem.value"
            (blur)="options.showErrors = true">
            <span class="checkbox-name" [innerHTML]="$safeNavigationMigration(checkboxItem?.name)"></span>
          </mat-list-option>
        }
      </mat-selection-list>
      @if (options?.showErrors && options?.errorMessage) {
        <mat-error
        [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></mat-error>
      }
    </div>`,
    styles: [`
    .title { font-weight: bold; }
    .horizontal-list { display: flex; flex-wrap: wrap; }
    .horizontal-list mat-list-option { width: auto; }
    .checkbox-name { white-space: nowrap; }
    mat-error { font-size: 75%; }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MaterialCheckboxesComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  horizontalList = false;
  formArray: AbstractControl;
  checkboxList: TitleMapItem[] = [];
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private readonly jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.horizontalList = this.layoutNode.type === 'checkboxes-inline' ||
      this.layoutNode.type === 'checkboxbuttons';
    this.jsf.initializeControl(this);
    this.checkboxList = buildTitleMap(
      this.options.titleMap || this.options.enumNames, this.options.enum, true
    );
    if (this.boundControl) {
      const formArray = this.jsf.getFormControl(this);
      for (const checkboxItem of this.checkboxList) {
        checkboxItem.checked = formArray.value.includes(checkboxItem.value);
      }
    }
  }

  get allChecked(): boolean {
    return this.checkboxList.filter(t => t.checked).length === this.checkboxList.length;
  }

  get someChecked(): boolean {
    const checkedItems = this.checkboxList.filter(t => t.checked).length;
    return checkedItems > 0 && checkedItems < this.checkboxList.length;
  }

  updateValue() {
    this.options.showErrors = true;
    if (this.boundControl) {
      this.jsf.updateArrayCheckboxList(this, this.checkboxList);
    }
  }

  updateValueFromSelection(event: any) {
    const selected = event.source.options.toArray().map((option: any) => option.selected);
    this.checkboxList.forEach((item, index) => item.checked = !!selected[index]);
    this.updateValue();
  }

  updateAllValues(event: any) {
    this.options.showErrors = true;
    this.checkboxList.forEach(t => t.checked = event.checked);
    this.updateValue();
  }
}
