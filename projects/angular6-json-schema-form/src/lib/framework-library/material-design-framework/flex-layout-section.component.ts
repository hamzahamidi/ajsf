import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { JsonSchemaFormService } from '../../json-schema-form.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'flex-layout-section-widget',
  template: `
    <div *ngIf="containerType === 'div'"
      [class]="options?.htmlClass || ''"
      [class.expandable]="options?.expandable && !expanded"
      [class.expanded]="options?.expandable && expanded">
      <label *ngIf="sectionTitle"
        [class]="'legend ' + (options?.labelHtmlClass || '')"
        [innerHTML]="sectionTitle"
        (click)="toggleExpanded()"></label>
      <flex-layout-root-widget *ngIf="expanded"
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
        [fxLayout]="getFlexAttribute('layout')"
        [fxLayoutGap]="options?.fxLayoutGap"
        [fxLayoutAlign]="options?.fxLayoutAlign"
        [attr.fxFlexFill]="options?.fxLayoutAlign"></flex-layout-root-widget>
      <mat-error *ngIf="options?.showErrors && options?.errorMessage"
        [innerHTML]="options?.errorMessage"></mat-error>
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
      <flex-layout-root-widget *ngIf="expanded"
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
        [fxLayout]="getFlexAttribute('layout')"
        [fxLayoutGap]="options?.fxLayoutGap"
        [fxLayoutAlign]="options?.fxLayoutAlign"
        [attr.fxFlexFill]="options?.fxLayoutAlign"></flex-layout-root-widget>
      <mat-error *ngIf="options?.showErrors && options?.errorMessage"
        [innerHTML]="options?.errorMessage"></mat-error>
    </fieldset>

    <mat-card *ngIf="containerType === 'card'"
      [ngClass]="options?.htmlClass || ''"
      [class.expandable]="options?.expandable && !expanded"
      [class.expanded]="options?.expandable && expanded">
      <mat-card-header *ngIf="sectionTitle">
        <legend
          [class]="'legend ' + (options?.labelHtmlClass || '')"
          [innerHTML]="sectionTitle"
          (click)="toggleExpanded()"></legend>
      </mat-card-header>
      <mat-card-content *ngIf="expanded">
        <fieldset [disabled]="options?.readonly">
          <flex-layout-root-widget *ngIf="expanded"
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
            [fxLayout]="getFlexAttribute('layout')"
            [fxLayoutGap]="options?.fxLayoutGap"
            [fxLayoutAlign]="options?.fxLayoutAlign"
            [attr.fxFlexFill]="options?.fxLayoutAlign"></flex-layout-root-widget>
          </fieldset>
      </mat-card-content>
      <mat-card-footer>
        <mat-error *ngIf="options?.showErrors && options?.errorMessage"
          [innerHTML]="options?.errorMessage"></mat-error>
      </mat-card-footer>
    </mat-card>

    <mat-expansion-panel *ngIf="containerType === 'expansion-panel'"
      [expanded]="expanded"
      [hideToggle]="!options?.expandable">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <legend *ngIf="sectionTitle"
            [class]="options?.labelHtmlClass"
            [innerHTML]="sectionTitle"
            (click)="toggleExpanded()"></legend>
        </mat-panel-title>
      </mat-expansion-panel-header>
      <fieldset [disabled]="options?.readonly">
        <flex-layout-root-widget *ngIf="expanded"
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
          [fxLayout]="getFlexAttribute('layout')"
          [fxLayoutGap]="options?.fxLayoutGap"
          [fxLayoutAlign]="options?.fxLayoutAlign"
          [attr.fxFlexFill]="options?.fxLayoutAlign"></flex-layout-root-widget>
      </fieldset>
      <mat-error *ngIf="options?.showErrors && options?.errorMessage"
        [innerHTML]="options?.errorMessage"></mat-error>
    </mat-expansion-panel>`,
  styles: [`
    fieldset { border: 0; margin: 0; padding: 0; }
    .legend { font-weight: bold; }
    .expandable > .legend:before { content: '▶'; padding-right: .3em; }
    .expanded > .legend:before { content: '▼'; padding-right: .2em; }
  `],
})
export class FlexLayoutSectionComponent implements OnInit {
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

  // Set attributes for flexbox container
  // (child attributes are set in flex-layout-root.component)
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
      case 'layout':
        return (this.options.fxLayout || 'row') +
          this.options.fxLayoutWrap ? ' ' + this.options.fxLayoutWrap : '';

    }
  }
}
