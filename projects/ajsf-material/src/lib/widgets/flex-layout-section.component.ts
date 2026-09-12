import { AbstractControl } from '@angular/forms';
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { JsonSchemaFormService } from '@ajsf/core';

@Component({
    selector: 'flex-layout-section-widget',
    template: `
    @if (containerType === 'div') {
      <div
        [class]="options?.htmlClass || ''"
        [class.expandable]="options?.expandable && !expanded"
        [class.expanded]="options?.expandable && expanded">
        @if (sectionTitle) {
          <label
            [class]="'legend ' + (options?.labelHtmlClass || '')"
            [innerHTML]="sectionTitle"
          (click)="toggleExpanded()"></label>
        }
        @if (expanded) {
          <flex-layout-root-widget
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
          [style.align-items]="getAlignItems()"></flex-layout-root-widget>
        }
        @if (options?.showErrors && options?.errorMessage) {
          <mat-error
          [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></mat-error>
        }
      </div>
    }
    
    @if (containerType === 'fieldset') {
      <fieldset
        [class]="options?.htmlClass || ''"
        [class.expandable]="options?.expandable && !expanded"
        [class.expanded]="options?.expandable && expanded"
        [disabled]="$safeNavigationMigration(options?.readonly)">
        @if (sectionTitle) {
          <legend
            [class]="'legend ' + (options?.labelHtmlClass || '')"
            [innerHTML]="sectionTitle"
          (click)="toggleExpanded()"></legend>
        }
        @if (expanded) {
          <flex-layout-root-widget
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
          [style.align-items]="getAlignItems()"></flex-layout-root-widget>
        }
        @if (options?.showErrors && options?.errorMessage) {
          <mat-error
          [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></mat-error>
        }
      </fieldset>
    }
    
    @if (containerType === 'card') {
      <mat-card appearance="outlined"
        [ngClass]="options?.htmlClass || ''"
        [class.expandable]="options?.expandable && !expanded"
        [class.expanded]="options?.expandable && expanded">
        @if (sectionTitle) {
          <mat-card-header>
            <legend
              [class]="'legend ' + (options?.labelHtmlClass || '')"
              [innerHTML]="sectionTitle"
            (click)="toggleExpanded()"></legend>
          </mat-card-header>
        }
        @if (expanded) {
          <mat-card-content>
            <fieldset [disabled]="$safeNavigationMigration(options?.readonly)">
              @if (expanded) {
                <flex-layout-root-widget
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
                [style.align-items]="getAlignItems()"></flex-layout-root-widget>
              }
            </fieldset>
          </mat-card-content>
        }
        <mat-card-footer>
          @if (options?.showErrors && options?.errorMessage) {
            <mat-error
            [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></mat-error>
          }
        </mat-card-footer>
      </mat-card>
    }
    
    @if (containerType === 'expansion-panel') {
      <mat-expansion-panel
        [expanded]="expanded"
        [hideToggle]="!options?.expandable">
        <mat-expansion-panel-header>
          <mat-panel-title>
            @if (sectionTitle) {
              <legend
                [class]="options?.labelHtmlClass"
                [innerHTML]="sectionTitle"
              (click)="toggleExpanded()"></legend>
            }
          </mat-panel-title>
        </mat-expansion-panel-header>
        <fieldset [disabled]="$safeNavigationMigration(options?.readonly)">
          @if (expanded) {
            <flex-layout-root-widget
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
            [style.align-items]="getAlignItems()"></flex-layout-root-widget>
          }
        </fieldset>
        @if (options?.showErrors && options?.errorMessage) {
          <mat-error
          [innerHTML]="$safeNavigationMigration(options?.errorMessage)"></mat-error>
        }
      </mat-expansion-panel>
    }`,
    styles: [`
    fieldset { border: 0; margin: 0; padding: 0; }
    .legend { font-weight: bold; }
    .expandable > .legend:before { content: '▶'; padding-right: .3em; }
    .expanded > .legend:before { content: '▼'; padding-right: .2em; }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
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

  // fxLayoutAlign="start center" used to come from @angular/flex-layout, which
  // is deprecated and has no Angular 16+ release. These map the same option
  // values onto justify-content and align-items, so schemas setting
  // fxLayoutAlign or fxLayoutGap keep working unchanged. The existing
  // [style.display], [style.flex-direction] and [style.flex-wrap] bindings
  // already cover what fxLayout did.
  private static readonly ALIGN = {
    start: 'flex-start', end: 'flex-end', center: 'center',
    'space-between': 'space-between', 'space-around': 'space-around',
    'space-evenly': 'space-evenly', stretch: 'stretch', baseline: 'baseline',
  };

  private fxAlign(position: number): string {
    const value = `${(this.options || {}).fxLayoutAlign || ''}`.trim().split(/\s+/)[position];
    return FlexLayoutSectionComponent.ALIGN[value] || null;
  }

  getJustifyContent(): string {
    return this.getFlexAttribute('justify-content') || this.fxAlign(0);
  }

  getAlignItems(): string {
    return this.getFlexAttribute('align-items') || this.fxAlign(1);
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
    }
  }
}
