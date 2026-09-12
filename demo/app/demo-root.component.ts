import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'demo-root',
    template: `<router-outlet></router-outlet>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DemoRootComponent { }
