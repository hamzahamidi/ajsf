import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'primeng-stepper-widget',
    template: `
    <p-stepper [value]="selectedItem" (valueChange)="select($event)"
      [linear]="options?.linear || false"
      [style]="{'width': '100%'}">
      <p-step-list>
        <p-step *ngFor="let item of layoutNode?.items; let i = index" [value]="i">
          <span *ngIf="showAddTab || item.type !== '$ref'"
            [innerHTML]="setStepTitle(item, i)"></span>
        </p-step>
      </p-step-list>
      <p-step-panels>
        <p-step-panel *ngFor="let layoutItem of layoutNode?.items; let i = index"
          [value]="i">
          <ng-template #contentTemplate let-activateCallback="activateCallback">
            <select-framework-widget
              [class]="(options?.fieldHtmlClass || '') + ' ' + (options?.activeClass || '')"
              [dataIndex]="layoutNode?.dataType === 'array' ? (dataIndex || []).concat(i) : dataIndex"
              [layoutIndex]="(layoutIndex || []).concat(i)"
              [layoutNode]="layoutItem"></select-framework-widget>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
              <p-button *ngIf="i > 0"
                label="Back"
                severity="secondary"
                (onClick)="activateCallback(i - 1)"></p-button>
              <p-button *ngIf="i < itemCount"
                label="Next"
                (onClick)="activateCallback(i + 1)"></p-button>
            </div>
          </ng-template>
        </p-step-panel>
      </p-step-panels>
    </p-stepper>`,
    standalone: false
})
export class PrimengStepperComponent implements OnInit {
  options: any;
  itemCount: number;
  selectedItem = 0;
  showAddTab = true;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(private jsf: JsonSchemaFormService) {}

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
