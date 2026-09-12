import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'none-widget',
    template: ``,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NoneComponent {
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
}
