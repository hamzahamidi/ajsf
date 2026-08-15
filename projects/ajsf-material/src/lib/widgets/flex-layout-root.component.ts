import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'flex-layout-root-widget',
  template: `
    <div *ngFor="let layoutNode of layout; let i = index"
      [class.form-flex-item]="isFlexItem"
      [style.flex-grow]="getFlexAttribute(layoutNode, 'flex-grow')"
      [style.flex-shrink]="getFlexAttribute(layoutNode, 'flex-shrink')"
      [style.flex-basis]="getFlexBasis(layoutNode)"
      [style.align-self]="getAlignSelf(layoutNode)"
      [style.order]="getOrder(layoutNode)"
      [style.max-width]="getMaxWidth(layoutNode)"
      [style.margin-left]="getOffset(layoutNode)">
      <select-framework-widget *ngIf="showWidget(layoutNode)"
        [dataIndex]="layoutNode?.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || [])"
        [layoutIndex]="(layoutIndex || []).concat(i)"
        [layoutNode]="layoutNode"></select-framework-widget>
    </div>`,
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FlexLayoutRootComponent {
  @Input() dataIndex: number[];
  @Input() layoutIndex: number[];
  @Input() layout: any[];
  @Input() isFlexItem = false;

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  removeItem(item) {
    this.jsf.removeItem(item);
  }

  // fxFlex="30%" and friends used to come from @angular/flex-layout, which is
  // deprecated and has no Angular 16+ release. These translate the same option
  // values to the CSS the directives were compiling to, so schemas that set
  // fxFlex, fxFlexOrder, fxFlexOffset or fxFlexAlign keep working unchanged.
  private static readonly SELF_ALIGN = {
    start: 'flex-start', end: 'flex-end', center: 'center',
    baseline: 'baseline', stretch: 'stretch',
  };

  getFlexBasis(node: any): string {
    return (node?.options || {}).fxFlex || this.getFlexAttribute(node, 'flex-basis');
  }

  getMaxWidth(node: any): string {
    const fxFlex = (node?.options || {}).fxFlex;
    return fxFlex && `${fxFlex}`.trim().endsWith('%') ? fxFlex : null;
  }

  getAlignSelf(node: any): string {
    const options = node?.options || {};
    return options['align-self'] ||
      FlexLayoutRootComponent.SELF_ALIGN[options.fxFlexAlign] || null;
  }

  getOrder(node: any): string {
    const options = node?.options || {};
    return options.order || options.fxFlexOrder || null;
  }

  getOffset(node: any): string {
    return (node?.options || {}).fxFlexOffset || null;
  }

  // Set attributes for flexbox child
  // (container attributes are set in flex-layout-section.component)
  getFlexAttribute(node: any, attribute: string) {
    const index = ['flex-grow', 'flex-shrink', 'flex-basis'].indexOf(attribute);
    return ((node.options || {}).flex || '').split(/\s+/)[index] ||
      (node.options || {})[attribute] || ['1', '1', 'auto'][index];
  }

  showWidget(layoutNode: any): boolean {
    return this.jsf.evaluateCondition(layoutNode, this.dataIndex);
  }
}
