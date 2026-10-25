import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService } from '../json-schema-form.service';

@Component({
    selector: 'wizard-widget',
    template: `
    <div [class]="(options?.htmlClass || '') + ' jsf-wizard'">
      @if (activeItem) {
        <div class="jsf-wizard-step" role="group" aria-live="polite"
          [attr.aria-label]="setStepTitle(activeItem, selectedItem)">
          <div class="jsf-wizard-step-title"
            [innerHTML]="setStepTitle(activeItem, selectedItem)"></div>
          <select-framework-widget
            [class]="options?.fieldHtmlClass || ''"
            [dataIndex]="layoutNode?.dataType === 'array' ? (dataIndex || []).concat(selectedItem) : dataIndex"
            [layoutIndex]="(layoutIndex || []).concat(selectedItem)"
            [layoutNode]="activeItem"></select-framework-widget>
        </div>
      }
      <nav [class]="options?.navigationHtmlClass || ''" aria-label="Wizard navigation">
        @if (selectedItem > 0) {
          <button type="button" [class]="options?.buttonHtmlClass || ''"
            (click)="previous()">{{ options?.previousLabel || 'Previous' }}</button>
        }
        @if (hasNextVisible(selectedItem)) {
          <button type="button" [class]="options?.buttonHtmlClass || ''"
            (click)="next()">{{ options?.nextLabel || 'Next' }}</button>
        }
      </nav>
    </div>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class WizardComponent implements OnInit {
  options: any = {};
  itemCount = 0;
  selectedItem = 0;
  showAddStep = false;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(private readonly jsf: JsonSchemaFormService) { }

  get activeItem(): any {
    return this.layoutNode?.items?.[this.selectedItem];
  }

  ngOnInit(): void {
    this.options = this.layoutNode?.options || {};
    this.updateControl();
  }

  previous(): void {
    if (this.selectedItem > 0) { this.selectedItem--; }
  }

  next(): void {
    if (this.hasNextVisible(this.selectedItem)) {
      this.select(this.selectedItem + 1);
    }
  }

  select(index: number): void {
    const items = this.layoutNode?.items || [];
    if (index < 0 || index >= items.length) { return; }
    if (items[index].type === '$ref') {
      if (!this.showAddStep) { return; }
      this.jsf.addItem({
        layoutNode: items[index],
        layoutIndex: (this.layoutIndex || []).concat(index),
        dataIndex: this.layoutNode?.dataType === 'array'
          ? (this.dataIndex || []).concat(index)
          : this.dataIndex || [],
      });
      this.updateControl();
    }
    this.selectedItem = index;
  }

  updateControl(): void {
    const items = this.layoutNode?.items || [];
    this.itemCount = Math.max(items.length - 1, 0);
    const lastItem = items[items.length - 1];
    this.showAddStep = lastItem?.type === '$ref' &&
      this.itemCount < (lastItem.options?.maxItems || 1000);
  }

  hasNextVisible(currentIndex: number): boolean {
    const nextIndex = currentIndex + 1;
    if (currentIndex < 0 || nextIndex > this.itemCount) { return false; }
    const nextItem = this.layoutNode?.items?.[nextIndex];
    return nextItem?.type !== '$ref' || this.showAddStep;
  }

  setStepTitle(item: any, index: number): string {
    return this.jsf.setArrayItemTitle(this, item, index) || `Step ${index + 1}`;
  }
}
