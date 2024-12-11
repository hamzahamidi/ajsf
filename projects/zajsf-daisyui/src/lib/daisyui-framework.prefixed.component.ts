import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { JsonSchemaFormService } from '@zajsf/core';

/**
* DaisyUI framework for Angular JSON Schema Form.
*
*/
@Component({
// tslint:disable-next-line:component-selector
selector: 'daisyui-framework-prefixed',
template: `
<div>
  <css-framework [layoutNode]="layoutNode" 
  [layoutIndex]="layoutIndex" 
  [dataIndex]="dataIndex"
  >
  </css-framework>
</div>
`,
styleUrls: ['./daisyui-framework.prefixed.component.scss'],
encapsulation:ViewEncapsulation.None
})
export class DaisyUIFrameworkComponentPrefixed implements OnInit, OnChanges {


frameworkInitialized = false;
widgetOptions: any; // Options passed to child widget
widgetLayoutNode: any; // layoutNode passed to child widget
options: any; // Options used in this framework
formControl: any = null;
debugOutput: any = '';
debug: any = '';
parentArray: any = null;
isOrderable = false;
@Input() layoutNode: any;
@Input() layoutIndex: number[];
@Input() dataIndex: number[];



constructor(
  public changeDetector: ChangeDetectorRef,
  public jsf: JsonSchemaFormService
) {
  
}



ngOnInit() {

}

ngOnChanges() {

}






}
