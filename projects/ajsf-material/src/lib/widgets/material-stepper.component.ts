import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'material-stepper-widget',
    template: `
    <mat-stepper
      [selectedIndex]="selectedItem"
      [linear]="options?.linear || false"
      (selectionChange)="select($event.selectedIndex)">
      <mat-step *ngFor="let item of layoutNode?.items; let i = index">
        <ng-template matStepLabel>
          <span *ngIf="showAddTab || item.type !== '$ref'"
            [innerHTML]="setStepTitle(item, i)"></span>
        </ng-template>
        <ng-template matStepContent>
          <select-framework-widget
            [class]="(options?.fieldHtmlClass || '') + ' ' + (options?.activeClass || '')"
            [dataIndex]="layoutNode?.dataType === 'array' ? (dataIndex || []).concat(i) : dataIndex"
            [layoutIndex]="(layoutIndex || []).concat(i)"
            [layoutNode]="item"></select-framework-widget>
          <div style="margin-top: 16px">
            <button mat-button matStepperPrevious *ngIf="i > 0" type="button">Back</button>
            <button mat-button matStepperNext *ngIf="i < itemCount" type="button">Next</button>
          </div>
        </ng-template>
      </mat-step>
    </mat-stepper>`,
    standalone: false
})
export class MaterialStepperComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  itemCount: number;
  selectedItem = 0;
  showAddTab = true;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.itemCount = this.layoutNode.items.length - 1;
    this.updateControl();
  }

  select(index) {
    if (this.layoutNode.items[index].type === '$ref') {
      this.jsf.addItem({
        layoutNode: this.layoutNode.items[index],
        layoutIndex: this.layoutIndex.concat(index),
        dataIndex: this.dataIndex.concat(index)
      });
      this.updateControl();
    }
    this.selectedItem = index;
  }

  updateControl() {
    this.itemCount = this.layoutNode.items.length - 1;
    const lastItem = this.layoutNode.items[this.layoutNode.items.length - 1];
    this.showAddTab = lastItem.type === '$ref' &&
      this.itemCount < (lastItem.options.maxItems || 1000);
  }

  setStepTitle(item: any, index: number): string {
    return this.jsf.setArrayItemTitle(this, item, index);
  }
}
