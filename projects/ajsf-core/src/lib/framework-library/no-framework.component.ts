import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'no-framework',
    templateUrl: './no-framework.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NoFrameworkComponent {
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
}
