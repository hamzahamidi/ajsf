import { Component, Input } from '@angular/core';

@Component({
  selector: 'no-framework',
  template: `
    <select-widget-widget
      [dataIndex]="dataIndex"
      [layoutIndex]="layoutIndex"
      [layoutNode]="layoutNode"></select-widget-widget>`,
})
export class NoFrameworkComponent {
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
}
