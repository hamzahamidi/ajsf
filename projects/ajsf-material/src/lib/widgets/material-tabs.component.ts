import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'material-tabs-widget',
    template: `
    <nav mat-tab-nav-bar
      [attr.aria-label]="options?.label || options?.title || ''"
      [tabPanel]="tabPanel"
      [style.width]="'100%'">
      @for (item of layoutNode?.items; track item; let i = $index) {
        <a mat-tab-link
          [active]="selectedItem === i"
          (click)="select(i)">
          @if (showAddTab || item.type !== '$ref') {
            <span
            [innerHTML]="setTabTitle(item, i)"></span>
          }
        </a>
      }
    </nav>
    <!-- MDC requires mat-tab-nav-bar to reference a mat-tab-nav-panel, which
    did not exist before v15. It wraps the content the nav switches. -->
    <div mat-tab-nav-panel #tabPanel>
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
      }
    </div>`,
    styles: [` a { cursor: pointer; } `],
    standalone: false
})
export class MaterialTabsComponent implements OnInit {
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

  setTabTitle(item: any, index: number): string {
    return this.jsf.setArrayItemTitle(this, item, index);
  }
}
