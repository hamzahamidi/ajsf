import { Component, Input } from '@angular/core';

@Component({
    selector: 'none-widget',
    template: ``,
    standalone: false
})
export class NoneComponent {
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
}
