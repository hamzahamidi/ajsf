import { Component, Input } from '@angular/core';

/**
 * PrimeNG framework for Angular JSON Schema Form.
 *
 * The map is empty for now, so every widget resolves to core's own component.
 * PrimeNG widgets replace them one at a time. The selector is public API and
 * named in consumer layout schemas, so it does not change.
 */
@Component({
    selector: 'primeng-framework',
    templateUrl: './primeng-framework.component.html',
    standalone: false
})
export class PrimengFrameworkComponent {
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
}
