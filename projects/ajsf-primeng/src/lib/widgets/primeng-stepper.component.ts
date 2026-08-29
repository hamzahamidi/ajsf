import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'primeng-stepper-widget',
    template: `
    <p-stepper [value]="selectedItem" (valueChange)="select($event)"
      [linear]="options?.linear || false"
      [style]="{'width': '100%'}">
      <p-step-list>
        <ng-container *ngFor="let item of layoutNode?.items; let i = index">
          <p-step *ngIf="showAddTab || item.type !== '$ref'" [value]="i">
            <span [innerHTML]="setStepTitle(item, i)"></span>
          </p-step>
        </ng-container>
      </p-step-list>
      <p-step-panels>
        <ng-container *ngFor="let layoutItem of layoutNode?.items; let i = index">
          <p-step-panel *ngIf="showAddTab || layoutItem.type !== '$ref'"
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
                <p-button *ngIf="hasNextVisible(i)"
                  label="Next"
                  (onClick)="activateCallback(i + 1)"></p-button>
              </div>
            </ng-template>
          </p-step-panel>
        </ng-container>
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
    if (index >= this.layoutNode.items.length) { return; }
    if (this.layoutNode.items[index].type === '$ref') {
      if (!this.showAddTab) { return; }
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

  hasNextVisible(currentIndex: number): boolean {
    const next = currentIndex + 1;
    if (next > this.itemCount) { return false; }
    const nextItem = this.layoutNode.items[next];
    if (nextItem?.type === '$ref' && !this.showAddTab) { return false; }
    return true;
  }

  setStepTitle(item: any, index: number): string {
    return this.jsf.setArrayItemTitle(this, item, index);
  }
}
