import {
  Component, ComponentFactoryResolver, ComponentRef, Input,
  OnChanges, OnInit, ViewChild, ViewContainerRef
} from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';

@Component({
  selector: 'select-widget-widget',
  template: `<div #widgetContainer></div>`,
})
export class SelectWidgetComponent implements OnChanges, OnInit {
  newComponent: ComponentRef<any> = null;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
  @ViewChild('widgetContainer', { read: ViewContainerRef })
    widgetContainer: ViewContainerRef;

  constructor(
    private componentFactory: ComponentFactoryResolver,
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.updateComponent();
  }

  ngOnChanges() {
    this.updateComponent();
  }

  updateComponent() {
    if (!this.newComponent && (this.layoutNode || {}).widget) {
      this.newComponent = this.widgetContainer.createComponent(
        this.componentFactory.resolveComponentFactory(this.layoutNode.widget)
      );
    }
    if (this.newComponent) {
      for (let input of ['layoutNode', 'layoutIndex', 'dataIndex']) {
        this.newComponent.instance[input] = this[input];
      }
    }
  }
}
