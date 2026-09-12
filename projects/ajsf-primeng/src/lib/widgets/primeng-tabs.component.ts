import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'primeng-tabs-widget',
    template: `
    <p-tabs [value]="selectedItem" (valueChange)="select($event)"
      [style]="{'width': '100%'}">
      <p-tablist>
        @for (item of layoutNode?.items; track item; let i = $index) {
          @if (showAddTab || item.type !== '$ref') {
            <p-tab [value]="i">
              <span [innerHTML]="setTabTitle(item, i)"></span>
            </p-tab>
          }
        }
      </p-tablist>
    </p-tabs>
    @for (layoutItem of layoutNode?.items; track layoutItem; let i = $index) {
      <div
        [class]="options?.htmlClass || ''">
        @if (selectedItem === i) {
          <select-framework-widget
            [class]="(options?.fieldHtmlClass || '') + ' ' + (options?.activeClass || '') + ' ' + (options?.style?.selected || '')"
            [dataIndex]="layoutNode?.dataType === 'array' ? (dataIndex || []).concat(i) : dataIndex"
            [layoutIndex]="(layoutIndex || []).concat(i)"
          [layoutNode]="layoutItem"></select-framework-widget>
        }
      </div>
    }`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PrimengTabsComponent implements OnInit {
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

  setTabTitle(item: any, index: number): string {
    return this.jsf.setArrayItemTitle(this, item, index);
  }
}
