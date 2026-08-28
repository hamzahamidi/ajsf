import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'primeng-flex-layout-section-widget',
    template: `
    <div *ngIf="containerType === 'div'"
      [class]="options?.htmlClass || ''"
      [class.expandable]="options?.expandable && !expanded"
      [class.expanded]="options?.expandable && expanded">
      <label *ngIf="sectionTitle"
        [class]="'legend ' + (options?.labelHtmlClass || '')"
        [innerHTML]="sectionTitle"
        (click)="toggleExpanded()"></label>
      <primeng-flex-layout-root-widget *ngIf="expanded"
        [layout]="layoutNode.items"
        [dataIndex]="dataIndex"
        [layoutIndex]="layoutIndex"
        [isFlexItem]="getFlexAttribute('is-flex')"
        [class.form-flex-column]="getFlexAttribute('flex-direction') === 'column'"
        [class.form-flex-row]="getFlexAttribute('flex-direction') === 'row'"
        [style.display]="getFlexAttribute('display')"
        [style.flex-direction]="getFlexAttribute('flex-direction')"
        [style.flex-wrap]="getFlexAttribute('flex-wrap')"
        [style.justify-content]="getFlexAttribute('justify-content')"
        [style.align-items]="getFlexAttribute('align-items')"
        [style.align-content]="getFlexAttribute('align-content')"
        [style.gap]="options?.fxLayoutGap"
        [style.justify-content]="getJustifyContent()"
        [style.align-items]="getAlignItems()"></primeng-flex-layout-root-widget>
      <div *ngIf="options?.showErrors && options?.errorMessage"
        class="p-error"
        [innerHTML]="options?.errorMessage"></div>
    </div>

    <fieldset *ngIf="containerType === 'fieldset'"
      [class]="options?.htmlClass || ''"
      [class.expandable]="options?.expandable && !expanded"
      [class.expanded]="options?.expandable && expanded"
      [disabled]="options?.readonly">
      <legend *ngIf="sectionTitle"
        [class]="'legend ' + (options?.labelHtmlClass || '')"
        [innerHTML]="sectionTitle"
        (click)="toggleExpanded()"></legend>
      <primeng-flex-layout-root-widget *ngIf="expanded"
        [layout]="layoutNode.items"
        [dataIndex]="dataIndex"
        [layoutIndex]="layoutIndex"
        [isFlexItem]="getFlexAttribute('is-flex')"
        [class.form-flex-column]="getFlexAttribute('flex-direction') === 'column'"
        [class.form-flex-row]="getFlexAttribute('flex-direction') === 'row'"
        [style.display]="getFlexAttribute('display')"
        [style.flex-direction]="getFlexAttribute('flex-direction')"
        [style.flex-wrap]="getFlexAttribute('flex-wrap')"
        [style.justify-content]="getFlexAttribute('justify-content')"
        [style.align-items]="getFlexAttribute('align-items')"
        [style.align-content]="getFlexAttribute('align-content')"
        [style.gap]="options?.fxLayoutGap"
        [style.justify-content]="getJustifyContent()"
        [style.align-items]="getAlignItems()"></primeng-flex-layout-root-widget>
      <div *ngIf="options?.showErrors && options?.errorMessage"
        class="p-error"
        [innerHTML]="options?.errorMessage"></div>
    </fieldset>

    <div *ngIf="containerType === 'card'"
      class="p-card"
      [ngClass]="options?.htmlClass || ''"
      [class.expandable]="options?.expandable && !expanded"
      [class.expanded]="options?.expandable && expanded">
      <div *ngIf="sectionTitle" class="p-card-header">
        <legend
          [class]="'legend ' + (options?.labelHtmlClass || '')"
          [innerHTML]="sectionTitle"
          (click)="toggleExpanded()"></legend>
      </div>
      <div *ngIf="expanded" class="p-card-content">
        <fieldset [disabled]="options?.readonly">
          <primeng-flex-layout-root-widget *ngIf="expanded"
            [layout]="layoutNode.items"
            [dataIndex]="dataIndex"
            [layoutIndex]="layoutIndex"
            [isFlexItem]="getFlexAttribute('is-flex')"
            [class.form-flex-column]="getFlexAttribute('flex-direction') === 'column'"
            [class.form-flex-row]="getFlexAttribute('flex-direction') === 'row'"
            [style.display]="getFlexAttribute('display')"
            [style.flex-direction]="getFlexAttribute('flex-direction')"
            [style.flex-wrap]="getFlexAttribute('flex-wrap')"
            [style.justify-content]="getFlexAttribute('justify-content')"
            [style.align-items]="getFlexAttribute('align-items')"
            [style.align-content]="getFlexAttribute('align-content')"
            [style.gap]="options?.fxLayoutGap"
            [style.justify-content]="getJustifyContent()"
            [style.align-items]="getAlignItems()"></primeng-flex-layout-root-widget>
          </fieldset>
      </div>
      <div class="p-card-footer">
        <div *ngIf="options?.showErrors && options?.errorMessage"
          class="p-error"
          [innerHTML]="options?.errorMessage"></div>
      </div>
    </div>

    <div *ngIf="containerType === 'expansion-panel'"
      class="p-panel"
      [class.expanded]="expanded"
      [class.collapsed]="!expanded">
      <div class="p-panel-header" (click)="toggleExpanded()">
        <span *ngIf="sectionTitle"
          [class]="options?.labelHtmlClass"
          [innerHTML]="sectionTitle"></span>
        <span *ngIf="options?.expandable" class="p-panel-toggler">
          {{ expanded ? '&#x25BC;' : '&#x25B6;' }}
        </span>
      </div>
      <div *ngIf="expanded" class="p-panel-content">
        <fieldset [disabled]="options?.readonly">
          <primeng-flex-layout-root-widget
            [layout]="layoutNode.items"
            [dataIndex]="dataIndex"
            [layoutIndex]="layoutIndex"
            [isFlexItem]="getFlexAttribute('is-flex')"
            [class.form-flex-column]="getFlexAttribute('flex-direction') === 'column'"
            [class.form-flex-row]="getFlexAttribute('flex-direction') === 'row'"
            [style.display]="getFlexAttribute('display')"
            [style.flex-direction]="getFlexAttribute('flex-direction')"
            [style.flex-wrap]="getFlexAttribute('flex-wrap')"
            [style.justify-content]="getFlexAttribute('justify-content')"
            [style.align-items]="getFlexAttribute('align-items')"
            [style.align-content]="getFlexAttribute('align-content')"
            [style.gap]="options?.fxLayoutGap"
            [style.justify-content]="getJustifyContent()"
            [style.align-items]="getAlignItems()"></primeng-flex-layout-root-widget>
        </fieldset>
      </div>
      <div *ngIf="options?.showErrors && options?.errorMessage"
        class="p-error"
        [innerHTML]="options?.errorMessage"></div>
    </div>`,
    styles: [`
    fieldset { border: 0; margin: 0; padding: 0; }
    .legend { font-weight: bold; }
    .expandable > .legend:before { content: '▶'; padding-right: .3em; }
    .expanded > .legend:before { content: '▼'; padding-right: .2em; }
  `],
    standalone: false
})
export class PrimengFlexLayoutSectionComponent implements OnInit {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  controlDisabled = false;
  boundControl = false;
  options: any;
  expanded = true;
  containerType = 'div';
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  get sectionTitle() {
    return this.options.notitle ? null : this.jsf.setItemTitle(this);
  }

  ngOnInit() {
    this.jsf.initializeControl(this);
    this.options = this.layoutNode.options || {};
    this.expanded = typeof this.options.expanded === 'boolean' ?
      this.options.expanded : !this.options.expandable;
    switch (this.layoutNode.type) {
      case 'section': case 'array': case 'fieldset': case 'advancedfieldset':
      case 'authfieldset': case 'optionfieldset': case 'selectfieldset':
        this.containerType = 'fieldset';
        break;
      case 'card':
        this.containerType = 'card';
        break;
      case 'expansion-panel':
        this.containerType = 'expansion-panel';
        break;
      default: // 'div', 'flex', 'tab', 'conditional', 'actions'
        this.containerType = 'div';
    }
  }

  toggleExpanded() {
    if (this.options.expandable) { this.expanded = !this.expanded; }
  }

  private static readonly ALIGN = {
    start: 'flex-start', end: 'flex-end', center: 'center',
    'space-between': 'space-between', 'space-around': 'space-around',
    'space-evenly': 'space-evenly', stretch: 'stretch', baseline: 'baseline',
  };

  private fxAlign(position: number): string {
    const value = `${(this.options || {}).fxLayoutAlign || ''}`.trim().split(/\s+/)[position];
    return PrimengFlexLayoutSectionComponent.ALIGN[value] || null;
  }

  getJustifyContent(): string {
    return this.getFlexAttribute('justify-content') || this.fxAlign(0);
  }

  getAlignItems(): string {
    return this.getFlexAttribute('align-items') || this.fxAlign(1);
  }

  getFlexAttribute(attribute: string) {
    const flexActive: boolean =
      this.layoutNode.type === 'flex' ||
      !!this.options.displayFlex ||
      this.options.display === 'flex';
    // if (attribute !== 'flex' && !flexActive) { return null; }
    switch (attribute) {
      case 'is-flex':
        return flexActive;
      case 'display':
        return flexActive ? 'flex' : 'initial';
      case 'flex-direction': case 'flex-wrap':
        const index = ['flex-direction', 'flex-wrap'].indexOf(attribute);
        return (this.options['flex-flow'] || '').split(/\s+/)[index] ||
          this.options[attribute] || ['column', 'nowrap'][index];
      case 'justify-content': case 'align-items': case 'align-content':
        return this.options[attribute];
    }
  }
}
