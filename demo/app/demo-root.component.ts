import { Component } from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'demo-root',
    template: `<router-outlet></router-outlet>`,
    standalone: false
})
export class DemoRootComponent { }
