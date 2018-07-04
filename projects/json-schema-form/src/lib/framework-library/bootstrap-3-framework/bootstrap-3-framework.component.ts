import { ChangeDetectorRef, Component, Input, OnChanges, OnInit } from '@angular/core';

import * as _ from 'lodash';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import {
  addClasses, hasOwn, inArray, isArray, JsonPointer, toTitleCase
} from '../../shared';

/**
 * Bootstrap 3 framework for Angular JSON Schema Form.
 *
 */
@Component({
  selector: 'bootstrap-3-framework',
  template: `
    <div
      [class]="options?.htmlClass || ''"
      [class.has-feedback]="options?.feedback && options?.isInputWidget &&
        (formControl?.dirty || options?.feedbackOnRender)"
      [class.has-error]="options?.enableErrorState && formControl?.errors &&
        (formControl?.dirty || options?.feedbackOnRender)"
      [class.has-success]="options?.enableSuccessState && !formControl?.errors &&
        (formControl?.dirty || options?.feedbackOnRender)">

      <button *ngIf="showRemoveButton"
        class="close pull-right"
        type="button"
        (click)="removeItem()">
        <span aria-hidden="true">&times;</span>
        <span class="sr-only">Close</span>
      </button>
      <div *ngIf="options?.messageLocation === 'top'">
          <p *ngIf="options?.helpBlock"
          class="help-block"
          [innerHTML]="options?.helpBlock"></p>
      </div>

      <label *ngIf="options?.title && layoutNode?.type !== 'tab'"
        [attr.for]="'control' + layoutNode?._id"
        [class]="options?.labelHtmlClass || ''"
        [class.sr-only]="options?.notitle"
        [innerHTML]="options?.title"></label>
      <p *ngIf="layoutNode?.type === 'submit' && jsf?.formOptions?.fieldsRequired">
        <strong class="text-danger">*</strong> = required fields
      </p>
      <div [class.input-group]="options?.fieldAddonLeft || options?.fieldAddonRight">
        <span *ngIf="options?.fieldAddonLeft"
          class="input-group-addon"
          [innerHTML]="options?.fieldAddonLeft"></span>

        <select-widget-widget
          [layoutNode]="widgetLayoutNode"
          [dataIndex]="dataIndex"
          [layoutIndex]="layoutIndex"></select-widget-widget>

        <span *ngIf="options?.fieldAddonRight"
          class="input-group-addon"
          [innerHTML]="options?.fieldAddonRight"></span>
      </div>

      <span *ngIf="options?.feedback && options?.isInputWidget &&
          !options?.fieldAddonRight && !layoutNode.arrayItem &&
          (formControl?.dirty || options?.feedbackOnRender)"
        [class.glyphicon-ok]="options?.enableSuccessState && !formControl?.errors"
        [class.glyphicon-remove]="options?.enableErrorState && formControl?.errors"
        aria-hidden="true"
        class="form-control-feedback glyphicon"></span>
      <div *ngIf="options?.messageLocation !== 'top'">
        <p *ngIf="options?.helpBlock"
          class="help-block"
          [innerHTML]="options?.helpBlock"></p>
      </div>
    </div>

    <div *ngIf="debug && debugOutput">debug: <pre>{{debugOutput}}</pre></div>
  `,
  styles: [`
    :host /deep/ .list-group-item .form-control-feedback { top: 40; }
    :host /deep/ .checkbox,
    :host /deep/ .radio { margin-top: 0; margin-bottom: 0; }
    :host /deep/ .checkbox-inline,
    :host /deep/ .checkbox-inline + .checkbox-inline,
    :host /deep/ .checkbox-inline + .radio-inline,
    :host /deep/ .radio-inline,
    :host /deep/ .radio-inline + .radio-inline,
    :host /deep/ .radio-inline + .checkbox-inline { margin-left: 0; margin-right: 10px; }
    :host /deep/ .checkbox-inline:last-child,
    :host /deep/ .radio-inline:last-child { margin-right: 0; }
    :host /deep/ .ng-invalid.ng-touched { border: 1px solid #f44336; }
  `],
})
export class Bootstrap3FrameworkComponent implements OnInit, OnChanges {
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
  ) { }

  get showRemoveButton(): boolean {
    if (!this.options.removable || this.options.readonly ||
      this.layoutNode.type === '$ref'
    ) { return false; }
    if (this.layoutNode.recursiveReference) { return true; }
    if (!this.layoutNode.arrayItem || !this.parentArray) { return false; }
    // If array length <= minItems, don't allow removing any items
    return this.parentArray.items.length - 1 <= this.parentArray.options.minItems ? false :
      // For removable list items, allow removing any item
      this.layoutNode.arrayItemType === 'list' ? true :
      // For removable tuple items, only allow removing last item in list
      this.layoutIndex[this.layoutIndex.length - 1] === this.parentArray.items.length - 2;
  }

  ngOnInit() {
    this.initializeFramework();
    if (this.layoutNode.arrayItem && this.layoutNode.type !== '$ref') {
      this.parentArray = this.jsf.getParentNode(this);
      if (this.parentArray) {
        this.isOrderable = this.layoutNode.arrayItemType === 'list' &&
          !this.options.readonly && this.parentArray.options.orderable;
      }
    }
  }

  ngOnChanges() {
    if (!this.frameworkInitialized) { this.initializeFramework(); }
  }

  initializeFramework() {
    if (this.layoutNode) {
      this.options = _.cloneDeep(this.layoutNode.options);
      this.widgetLayoutNode = {
        ...this.layoutNode,
        options: _.cloneDeep(this.layoutNode.options)
      };
      this.widgetOptions = this.widgetLayoutNode.options;
      this.formControl = this.jsf.getFormControl(this);

      this.options.isInputWidget = inArray(this.layoutNode.type, [
        'button', 'checkbox', 'checkboxes-inline', 'checkboxes', 'color',
        'date', 'datetime-local', 'datetime', 'email', 'file', 'hidden',
        'image', 'integer', 'month', 'number', 'password', 'radio',
        'radiobuttons', 'radios-inline', 'radios', 'range', 'reset', 'search',
        'select', 'submit', 'tel', 'text', 'textarea', 'time', 'url', 'week'
      ]);

      this.options.title = this.setTitle();

      this.options.htmlClass =
        addClasses(this.options.htmlClass, 'schema-form-' + this.layoutNode.type);
      if (this.layoutNode.type !== 'flex')  {
          this.options.htmlClass =
            this.layoutNode.type === 'array' ?
              addClasses(this.options.htmlClass, 'list-group') :
            this.layoutNode.arrayItem && this.layoutNode.type !== '$ref' ?
              addClasses(this.options.htmlClass, 'list-group-item') :
              addClasses(this.options.htmlClass, 'form-group');
      }
      this.widgetOptions.htmlClass = '';
      this.options.labelHtmlClass =
        addClasses(this.options.labelHtmlClass, 'control-label');
      this.widgetOptions.activeClass =
        addClasses(this.widgetOptions.activeClass, 'active');
      this.options.fieldAddonLeft =
        this.options.fieldAddonLeft || this.options.prepend;
      this.options.fieldAddonRight =
        this.options.fieldAddonRight || this.options.append;

      // Add asterisk to titles if required
      if (this.options.title && this.layoutNode.type !== 'tab' &&
        !this.options.notitle && this.options.required  &&
        !this.options.title.includes('*')
      ) {
        this.options.title += ' <strong class="text-danger">*</strong>';
      }
      // Set miscelaneous styles and settings for each control type
      switch (this.layoutNode.type) {
        // Checkbox controls
        case 'checkbox': case 'checkboxes':
          this.widgetOptions.htmlClass = addClasses(
            this.widgetOptions.htmlClass, 'checkbox');
        break;
        case 'checkboxes-inline':
          this.widgetOptions.htmlClass = addClasses(
            this.widgetOptions.htmlClass, 'checkbox');
          this.widgetOptions.itemLabelHtmlClass = addClasses(
            this.widgetOptions.itemLabelHtmlClass, 'checkbox-inline');
        break;
        // Radio controls
        case 'radio': case 'radios':
          this.widgetOptions.htmlClass = addClasses(
            this.widgetOptions.htmlClass, 'radio');
        break;
        case 'radios-inline':
          this.widgetOptions.htmlClass = addClasses(
            this.widgetOptions.htmlClass, 'radio');
          this.widgetOptions.itemLabelHtmlClass = addClasses(
            this.widgetOptions.itemLabelHtmlClass, 'radio-inline');
        break;
        // Button sets - checkboxbuttons and radiobuttons
        case 'checkboxbuttons': case 'radiobuttons':
          this.widgetOptions.htmlClass = addClasses(
            this.widgetOptions.htmlClass, 'btn-group');
          this.widgetOptions.itemLabelHtmlClass = addClasses(
            this.widgetOptions.itemLabelHtmlClass, 'btn');
          this.widgetOptions.itemLabelHtmlClass = addClasses(
            this.widgetOptions.itemLabelHtmlClass, this.options.style || 'btn-default');
          this.widgetOptions.fieldHtmlClass = addClasses(
            this.widgetOptions.fieldHtmlClass, 'sr-only');
        break;
        // Single button controls
        case 'button': case 'submit':
          this.widgetOptions.fieldHtmlClass = addClasses(
            this.widgetOptions.fieldHtmlClass, 'btn');
          this.widgetOptions.fieldHtmlClass = addClasses(
            this.widgetOptions.fieldHtmlClass, this.options.style || 'btn-info');
        break;
        // Containers - arrays and fieldsets
        case 'array': case 'fieldset': case 'section': case 'conditional':
        case 'advancedfieldset': case 'authfieldset':
        case 'selectfieldset': case 'optionfieldset':
          this.options.messageLocation = 'top';
        break;
        case 'tabarray': case 'tabs':
          this.widgetOptions.htmlClass = addClasses(
            this.widgetOptions.htmlClass, 'tab-content');
          this.widgetOptions.fieldHtmlClass = addClasses(
            this.widgetOptions.fieldHtmlClass, 'tab-pane');
          this.widgetOptions.labelHtmlClass = addClasses(
            this.widgetOptions.labelHtmlClass, 'nav nav-tabs');
        break;
        // 'Add' buttons - references
        case '$ref':
          this.widgetOptions.fieldHtmlClass = addClasses(
            this.widgetOptions.fieldHtmlClass, 'btn pull-right');
          this.widgetOptions.fieldHtmlClass = addClasses(
            this.widgetOptions.fieldHtmlClass, this.options.style || 'btn-default');
          this.options.icon = 'glyphicon glyphicon-plus';
        break;
        // Default - including regular inputs
        default:
          this.widgetOptions.fieldHtmlClass = addClasses(
            this.widgetOptions.fieldHtmlClass, 'form-control');
      }

      if (this.formControl) {
        this.updateHelpBlock(this.formControl.status);
        this.formControl.statusChanges.subscribe(status => this.updateHelpBlock(status));

        if (this.options.debug) {
          let vars: any[] = [];
          this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
        }
      }
      this.frameworkInitialized = true;
    }

  }

  updateHelpBlock(status) {
    this.options.helpBlock = status === 'INVALID' &&
      this.options.enableErrorState && this.formControl.errors &&
      (this.formControl.dirty || this.options.feedbackOnRender) ?
        this.jsf.formatErrors(this.formControl.errors, this.options.validationMessages) :
        this.options.description || this.options.help || null;
  }

  setTitle(): string {
    switch (this.layoutNode.type) {
      case 'button': case 'checkbox': case 'section': case 'help': case 'msg':
      case 'submit': case 'message': case 'tabarray': case 'tabs': case '$ref':
        return null;
      case 'advancedfieldset':
        this.widgetOptions.expandable = true;
        this.widgetOptions.title = 'Advanced options';
        return null;
      case 'authfieldset':
        this.widgetOptions.expandable = true;
        this.widgetOptions.title = 'Authentication settings';
        return null;
      case 'fieldset':
        this.widgetOptions.title = this.options.title;
        return null;
      default:
        this.widgetOptions.title = null;
        return this.jsf.setItemTitle(this);
    }
  }

  removeItem() {
    this.jsf.removeItem(this);
  }
}
