import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService, TitleMapItem, buildTitleMap } from '@ajsf/core';

@Component({
    selector: 'primeng-checkboxes-widget',
    template: `
    <div>
      <p-checkbox
        [binary]="true"
        [ngModel]="allChecked"
        [indeterminate]="someChecked"
        [disabled]="controlDisabled || options?.readonly"
        [name]="options?.name"
        (onChange)="updateAllValues($event)"
        (onBlur)="options.showErrors = true">
      </p-checkbox>
      <span class="checkbox-name" [innerHTML]="options?.name"></span>
      <label *ngIf="options?.title"
        class="title"
        [class]="options?.labelHtmlClass || ''"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></label>
      <ul class="checkbox-list" [class.horizontal-list]="horizontalList">
        <li *ngFor="let checkboxItem of checkboxList"
          [class]="options?.htmlClass || ''">
          <p-checkbox
            [(ngModel)]="checkboxItem.checked"
            [binary]="true"
            [disabled]="controlDisabled || options?.readonly"
            [name]="checkboxItem?.name"
            (onChange)="updateValue()"
            (onBlur)="options.showErrors = true">
          </p-checkbox>
          <span class="checkbox-name" [innerHTML]="checkboxItem?.name"></span>
        </li>
      </ul>
      <div class="p-error" *ngIf="options?.showErrors && options?.errorMessage"
        [innerHTML]="options?.errorMessage"></div>
    </div>`,
    styles: [`
    .title { font-weight: bold; }
    .checkbox-list { list-style-type: none; }
    .horizontal-list > li { display: inline-block; margin-right: 10px; zoom: 1; }
    .checkbox-name { white-space: nowrap; }
    .p-error { font-size: 75%; margin-top: 0.25rem; }
  `],
    standalone: false
})
export class PrimengCheckboxesComponent implements OnInit {
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

  constructor(private jsf: JsonSchemaFormService) {}

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

  updateAllValues(event: any) {
    this.options.showErrors = true;
    this.checkboxList.forEach(t => t.checked = event.checked);
    this.updateValue();
  }
}
