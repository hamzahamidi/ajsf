import cloneDeep from 'lodash-es/cloneDeep';
import Ajv from 'ajv';
import jsonDraft6 from 'ajv/lib/refs/json-schema-draft-06.json';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import {
  buildFormGroup,
  buildFormGroupTemplate,
  formatFormData,
  getControl
  } from './shared/form-group.functions';
import { buildLayout, getLayoutNode } from './shared/layout.functions';
import { buildSchemaFromData, buildSchemaFromLayout, removeRecursiveReferences } from './shared/json-schema.functions';
import { enValidationMessages } from './locale/en-validation-messages';
import { frValidationMessages } from './locale/fr-validation-messages';
import { zhValidationMessages } from './locale/zh-validation-messages';
import {
  fixTitle,
  forEach,
  hasOwn,
  toTitleCase
  } from './shared/utility.functions';
import {
  hasValue,
  isArray,
  isDefined,
  isEmpty,
  isObject
  } from './shared/validator.functions';
import { Injectable } from '@angular/core';
import { JsonPointer } from './shared/jsonpointer.functions';
import { Subject } from 'rxjs';



export interface TitleMapItem {
  name?: string; value?: any; checked?: boolean; group?: string; items?: TitleMapItem[];
}
export interface ErrorMessages {
  [control_name: string]: { message: string | Function | Object, code: string }[];
}


@Injectable()
export class JsonSchemaFormService {
  JsonFormCompatibility = false;
  ReactJsonSchemaFormCompatibility = false;
  AngularSchemaFormCompatibility = false;
  tpldata: any = {};

  ajvOptions: any = { allErrors: true, jsonPointers: true, unknownFormats: 'ignore' };
  ajv: any = new Ajv(this.ajvOptions); // AJV: Another JSON Schema Validator
  validateFormData: any = null; // Compiled AJV function to validate active form's schema

  formValues: any = {}; // Internal form data (may not have correct types)
  data: any = {}; // Output form data (formValues, formatted with correct data types)
  schema: any = {}; // Internal JSON Schema
  layout: any[] = []; // Internal form layout
  formGroupTemplate: any = {}; // Template used to create formGroup
  formGroup: any = null; // Angular formGroup, which powers the reactive form
  framework: any = null; // Active framework component
  formOptions: any; // Active options, used to configure the form

  validData: any = null; // Valid form data (or null) (=== isValid ? data : null)
  isValid: boolean = null; // Is current form data valid?
  ajvErrors: any = null; // Ajv errors for current data
  validationErrors: any = null; // Any validation errors for current data
  dataErrors: any = new Map(); //
  formValueSubscription: any = null; // Subscription to formGroup.valueChanges observable (for un- and re-subscribing)
  dataChanges: Subject<any> = new Subject(); // Form data observable
  isValidChanges: Subject<any> = new Subject(); // isValid observable
  validationErrorChanges: Subject<any> = new Subject(); // validationErrors observable

  arrayMap: Map<string, number> = new Map(); // Maps arrays in data object and number of tuple values
  dataMap: Map<string, any> = new Map(); // Maps paths in form data to schema and formGroup paths
  dataRecursiveRefMap: Map<string, string> = new Map(); // Maps recursive reference points in form data
  schemaRecursiveRefMap: Map<string, string> = new Map(); // Maps recursive reference points in schema
  schemaRefLibrary: any = {}; // Library of schemas for resolving schema $refs
  layoutRefLibrary: any = { '': null }; // Library of layout nodes for adding to form
  templateRefLibrary: any = {}; // Library of formGroup templates for adding to form
  hasRootReference = false; // Does the form include a recursive reference to itself?

  language = 'en-US'; // Does the form include a recursive reference to itself?

  // Default global form options
  defaultFormOptions: any = {
    addSubmit: 'auto', // Add a submit button if layout does not have one?
    // for addSubmit: true = always, false = never,
    // 'auto' = only if layout is undefined (form is built from schema alone)
    debug: false, // Show debugging output?
    disableInvalidSubmit: true, // Disable submit if form invalid?
    formDisabled: false, // Set entire form as disabled? (not editable, and disables outputs)
    formReadonly: false, // Set entire form as read only? (not editable, but outputs still enabled)
    fieldsRequired: false, // (set automatically) Are there any required fields in the form?
    framework: 'no-framework', // The framework to load
    loadExternalAssets: false, // Load external css and JavaScript for framework?
    pristine: { errors: true, success: true },
    supressPropertyTitles: false,
    setSchemaDefaults: 'auto', // Set fefault values from schema?
    // true = always set (unless overridden by layout default or formValues)
    // false = never set
    // 'auto' = set in addable components, and everywhere if formValues not set
    setLayoutDefaults: 'auto', // Set fefault values from layout?
    // true = always set (unless overridden by formValues)
    // false = never set
    // 'auto' = set in addable components, and everywhere if formValues not set
    validateOnRender: 'auto', // Validate fields immediately, before they are touched?
    // true = validate all fields immediately
    // false = only validate fields after they are touched by user
    // 'auto' = validate fields with values immediately, empty fields after they are touched
    widgets: {}, // Any custom widgets to load
    defautWidgetOptions: { // Default options for form control widgets
      listItems: 1, // Number of list items to initially add to arrays with no default value
      addable: true, // Allow adding items to an array or $ref point?
      orderable: true, // Allow reordering items within an array?
      removable: true, // Allow removing items from an array or $ref point?
      enableErrorState: true, // Apply 'has-error' class when field fails validation?
      // disableErrorState: false, // Don't apply 'has-error' class when field fails validation?
      enableSuccessState: true, // Apply 'has-success' class when field validates?
      // disableSuccessState: false, // Don't apply 'has-success' class when field validates?
      feedback: false, // Show inline feedback icons?
      feedbackOnRender: false, // Show errorMessage on Render?
      notitle: false, // Hide title?
      disabled: false, // Set control as disabled? (not editable, and excluded from output)
      readonly: false, // Set control as read only? (not editable, but included in output)
      returnEmptyFields: true, // return values for fields that contain no data?
      validationMessages: {} // set by setLanguage()
    },
  };

  constructor() {
    this.setLanguage(this.language);
    this.ajv.addMetaSchema(jsonDraft6);
  }

  setLanguage(language: string = 'en-US') {
    this.language = language;
    const languageValidationMessages = {
        fr: frValidationMessages,
        en: enValidationMessages,
        zh: zhValidationMessages
    };
    const languageCode = language.slice(0, 2);

    const validationMessages = languageValidationMessages[languageCode];

    this.defaultFormOptions.defautWidgetOptions.validationMessages =
      cloneDeep(validationMessages);
  }

  getData() { return this.data; }

  getSchema() { return this.schema; }

  getLayout() { return this.layout; }

  resetAllValues() {
    this.JsonFormCompatibility = false;
    this.ReactJsonSchemaFormCompatibility = false;
    this.AngularSchemaFormCompatibility = false;
    this.tpldata = {};
    this.validateFormData = null;
    this.formValues = {};
    this.schema = {};
    this.layout = [];
    this.formGroupTemplate = {};
    this.formGroup = null;
    this.framework = null;
    this.data = {};
    this.validData = null;
    this.isValid = null;
    this.validationErrors = null;
    this.arrayMap = new Map();
    this.dataMap = new Map();
    this.dataRecursiveRefMap = new Map();
    this.schemaRecursiveRefMap = new Map();
    this.layoutRefLibrary = {};
    this.schemaRefLibrary = {};
    this.templateRefLibrary = {};
    this.formOptions = cloneDeep(this.defaultFormOptions);
  }

  /**
   * 'buildRemoteError' function
   *
   * Example errors:
   * {
   *   last_name: [ {
   *     message: 'Last name must by start with capital letter.',
   *     code: 'capital_letter'
   *   } ],
   *   email: [ {
   *     message: 'Email must be from example.com domain.',
   *     code: 'special_domain'
   *   }, {
   *     message: 'Email must contain an @ symbol.',
   *     code: 'at_symbol'
   *   } ]
   * }
   * //{ErrorMessages} errors
   */
  buildRemoteError(errors: ErrorMessages) {
    forEach(errors, (value, key) => {
      if (key in this.formGroup.controls) {
        for (const error of value) {
          const err = {};
          err[error['code']] = error['message'];
          this.formGroup.get(key).setErrors(err, { emitEvent: true });
        }
      }
    });
  }

  validateData(newValue: any, updateSubscriptions = true): void {

    // Format raw form data to correct data types
    this.data = formatFormData(
      newValue, this.dataMap, this.dataRecursiveRefMap,
      this.arrayMap, this.formOptions.returnEmptyFields
    );
    this.isValid = this.validateFormData(this.data);
    this.validData = this.isValid ? this.data : null;
    const compileErrors = errors => {
      const compiledErrors = {};
      (errors || []).forEach(error => {
        if (!compiledErrors[error.dataPath]) { compiledErrors[error.dataPath] = []; }
        compiledErrors[error.dataPath].push(error.message);
      });
      return compiledErrors;
    };
    this.ajvErrors = this.validateFormData.errors;
    this.validationErrors = compileErrors(this.validateFormData.errors);
    if (updateSubscriptions) {
      this.dataChanges.next(this.data);
      this.isValidChanges.next(this.isValid);
      this.validationErrorChanges.next(this.ajvErrors);
    }
  }

  buildFormGroupTemplate(formValues: any = null, setValues = true) {
    this.formGroupTemplate = buildFormGroupTemplate(this, formValues, setValues);
  }

  buildFormGroup() {
    this.formGroup = <FormGroup>buildFormGroup(this.formGroupTemplate);
    if (this.formGroup) {
      this.compileAjvSchema();
      this.validateData(this.formGroup.value);

      // Set up observables to emit data and validation info when form data changes
      if (this.formValueSubscription) { this.formValueSubscription.unsubscribe(); }
      this.formValueSubscription = this.formGroup.valueChanges
        .subscribe(formValue => this.validateData(formValue));
    }
  }

  buildLayout(widgetLibrary: any) {
    this.layout = buildLayout(this, widgetLibrary);
  }

  setOptions(newOptions: any) {
    if (isObject(newOptions)) {
      const addOptions = cloneDeep(newOptions);
      // Backward compatibility for 'defaultOptions' (renamed 'defautWidgetOptions')
      if (isObject(addOptions.defaultOptions)) {
        Object.assign(this.formOptions.defautWidgetOptions, addOptions.defaultOptions);
        delete addOptions.defaultOptions;
      }
      if (isObject(addOptions.defautWidgetOptions)) {
        Object.assign(this.formOptions.defautWidgetOptions, addOptions.defautWidgetOptions);
        delete addOptions.defautWidgetOptions;
      }
      Object.assign(this.formOptions, addOptions);

      // convert disableErrorState / disableSuccessState to enable...
      const globalDefaults = this.formOptions.defautWidgetOptions;
      ['ErrorState', 'SuccessState']
        .filter(suffix => hasOwn(globalDefaults, 'disable' + suffix))
        .forEach(suffix => {
          globalDefaults['enable' + suffix] = !globalDefaults['disable' + suffix];
          delete globalDefaults['disable' + suffix];
        });
    }
  }

  compileAjvSchema() {
    if (!this.validateFormData) {

      // if 'ui:order' exists in properties, move it to root before compiling with ajv
      if (Array.isArray(this.schema.properties['ui:order'])) {
        this.schema['ui:order'] = this.schema.properties['ui:order'];
        delete this.schema.properties['ui:order'];
      }
      this.ajv.removeSchema(this.schema);
      this.validateFormData = this.ajv.compile(this.schema);
    }
  }

  buildSchemaFromData(data?: any, requireAllFields = false): any {
    if (data) { return buildSchemaFromData(data, requireAllFields); }
    this.schema = buildSchemaFromData(this.formValues, requireAllFields);
  }

  buildSchemaFromLayout(layout?: any): any {
    if (layout) { return buildSchemaFromLayout(layout); }
    this.schema = buildSchemaFromLayout(this.layout);
  }


  setTpldata(newTpldata: any = {}): void {
    this.tpldata = newTpldata;
  }

  parseText(
    text = '', value: any = {}, values: any = {}, key: number | string = null
  ): string {
    if (!text || !/{{.+?}}/.test(text)) { return text; }
    return text.replace(/{{(.+?)}}/g, (...a) =>
      this.parseExpression(a[1], value, values, key, this.tpldata)
    );
  }

  parseExpression(
    expression = '', value: any = {}, values: any = {},
    key: number | string = null, tpldata: any = null
  ) {
    if (typeof expression !== 'string') { return ''; }
    const index = typeof key === 'number' ? (key + 1) + '' : (key || '');
    expression = expression.trim();
    if ((expression[0] === '\'' || expression[0] === '"') &&
      expression[0] === expression[expression.length - 1] &&
      expression.slice(1, expression.length - 1).indexOf(expression[0]) === -1
    ) {
      return expression.slice(1, expression.length - 1);
    }
    if (expression === 'idx' || expression === '$index') { return index; }
    if (expression === 'value' && !hasOwn(values, 'value')) { return value; }
    if (['"', '\'', ' ', '||', '&&', '+'].every(delim => expression.indexOf(delim) === -1)) {
      const pointer = JsonPointer.parseObjectPath(expression);
      return pointer[0] === 'value' && JsonPointer.has(value, pointer.slice(1)) ?
        JsonPointer.get(value, pointer.slice(1)) :
        pointer[0] === 'values' && JsonPointer.has(values, pointer.slice(1)) ?
          JsonPointer.get(values, pointer.slice(1)) :
          pointer[0] === 'tpldata' && JsonPointer.has(tpldata, pointer.slice(1)) ?
            JsonPointer.get(tpldata, pointer.slice(1)) :
            JsonPointer.has(values, pointer) ? JsonPointer.get(values, pointer) : '';
    }
    if (expression.indexOf('[idx]') > -1) {
      expression = expression.replace(/\[idx\]/g, <string>index);
    }
    if (expression.indexOf('[$index]') > -1) {
      expression = expression.replace(/\[$index\]/g, <string>index);
    }
    // TODO: Improve expression evaluation by parsing quoted strings first
    // let expressionArray = expression.match(/([^"']+|"[^"]+"|'[^']+')/g);
    if (expression.indexOf('||') > -1) {
      return expression.split('||').reduce((all, term) =>
        all || this.parseExpression(term, value, values, key, tpldata), ''
      );
    }
    if (expression.indexOf('&&') > -1) {
      return expression.split('&&').reduce((all, term) =>
        all && this.parseExpression(term, value, values, key, tpldata), ' '
      ).trim();
    }
    if (expression.indexOf('+') > -1) {
      return expression.split('+')
        .map(term => this.parseExpression(term, value, values, key, tpldata))
        .join('');
    }
    return '';
  }

  setArrayItemTitle(
    parentCtx: any = {}, childNode: any = null, index: number = null
  ): string {
    const parentNode = parentCtx.layoutNode;
    const parentValues: any = this.getFormControlValue(parentCtx);
    const isArrayItem =
      (parentNode.type || '').slice(-5) === 'array' && isArray(parentValues);
    const text = JsonPointer.getFirst(
      isArrayItem && childNode.type !== '$ref' ? [
        [childNode, '/options/legend'],
        [childNode, '/options/title'],
        [parentNode, '/options/title'],
        [parentNode, '/options/legend'],
      ] : [
          [childNode, '/options/title'],
          [childNode, '/options/legend'],
          [parentNode, '/options/title'],
          [parentNode, '/options/legend']
        ]
    );
    if (!text) { return text; }
    const childValue = isArray(parentValues) && index < parentValues.length ?
      parentValues[index] : parentValues;
    return this.parseText(text, childValue, parentValues, index);
  }

  setItemTitle(ctx: any) {
    return !ctx.options.title && /^(\d+|-)$/.test(ctx.layoutNode.name) ?
      null :
      this.parseText(
        ctx.options.title || toTitleCase(ctx.layoutNode.name),
        this.getFormControlValue(this),
        (this.getFormControlGroup(this) || <any>{}).value,
        ctx.dataIndex[ctx.dataIndex.length - 1]
      );
  }

  evaluateCondition(layoutNode: any, dataIndex: number[]): boolean {
    const arrayIndex = dataIndex && dataIndex[dataIndex.length - 1];
    let result = true;
    if (hasValue((layoutNode.options || {}).condition)) {
      if (typeof layoutNode.options.condition === 'string') {
        let pointer = layoutNode.options.condition;
        if (hasValue(arrayIndex)) {
          pointer = pointer.replace('[arrayIndex]', `[${arrayIndex}]`);
        }
        pointer = JsonPointer.parseObjectPath(pointer);
        result = !!JsonPointer.get(this.data, pointer);
        if (!result && pointer[0] === 'model') {
          result = !!JsonPointer.get({ model: this.data }, pointer);
        }
      } else if (typeof layoutNode.options.condition === 'function') {
        result = layoutNode.options.condition(this.data);
      } else if (typeof layoutNode.options.condition.functionBody === 'string') {
        try {
          const dynFn = new Function(
            'model', 'arrayIndices', layoutNode.options.condition.functionBody
          );
          result = dynFn(this.data, dataIndex);
        } catch (e) {
          result = true;
          console.error('condition functionBody errored out on evaluation: ' + layoutNode.options.condition.functionBody);
        }
      }
    }
    return result;
  }

  initializeControl(ctx: any, bind = true): boolean {
    if (!isObject(ctx)) { return false; }
    if (isEmpty(ctx.options)) {
      ctx.options = !isEmpty((ctx.layoutNode || {}).options) ?
        ctx.layoutNode.options : cloneDeep(this.formOptions);
    }
    ctx.formControl = this.getFormControl(ctx);
    ctx.boundControl = bind && !!ctx.formControl;
    if (ctx.formControl) {
      ctx.controlName = this.getFormControlName(ctx);
      ctx.controlValue = ctx.formControl.value;
      ctx.controlDisabled = ctx.formControl.disabled;
      ctx.options.errorMessage = ctx.formControl.status === 'VALID' ? null :
        this.formatErrors(ctx.formControl.errors, ctx.options.validationMessages);
      ctx.options.showErrors = this.formOptions.validateOnRender === true ||
        (this.formOptions.validateOnRender === 'auto' && hasValue(ctx.controlValue));
      ctx.formControl.statusChanges.subscribe(status =>
        ctx.options.errorMessage = status === 'VALID' ? null :
          this.formatErrors(ctx.formControl.errors, ctx.options.validationMessages)
      );
      ctx.formControl.valueChanges.subscribe(value => {
        if (!!value) { ctx.controlValue = value; }
      });
    } else {
      ctx.controlName = ctx.layoutNode.name;
      ctx.controlValue = ctx.layoutNode.value || null;
      const dataPointer = this.getDataPointer(ctx);
      if (bind && dataPointer) {
        console.error(`warning: control "${dataPointer}" is not bound to the Angular FormGroup.`);
      }
    }
    return ctx.boundControl;
  }

  formatErrors(errors: any, validationMessages: any = {}): string {
    if (isEmpty(errors)) { return null; }
    if (!isObject(validationMessages)) { validationMessages = {}; }
    const addSpaces = string => string[0].toUpperCase() + (string.slice(1) || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
    const formatError = (error) => typeof error === 'object' ?
      Object.keys(error).map(key =>
        error[key] === true ? addSpaces(key) :
          error[key] === false ? 'Not ' + addSpaces(key) :
            addSpaces(key) + ': ' + formatError(error[key])
      ).join(', ') :
      addSpaces(error.toString());
    const messages = [];
    return Object.keys(errors)
      // Hide 'required' error, unless it is the only one
      .filter(errorKey => errorKey !== 'required' || Object.keys(errors).length === 1)
      .map(errorKey =>
        // If validationMessages is a string, return it
        typeof validationMessages === 'string' ? validationMessages :
          // If custom error message is a function, return function result
          typeof validationMessages[errorKey] === 'function' ?
            validationMessages[errorKey](errors[errorKey]) :
            // If custom error message is a string, replace placeholders and return
            typeof validationMessages[errorKey] === 'string' ?
              // Does error message have any {{property}} placeholders?
              !/{{.+?}}/.test(validationMessages[errorKey]) ?
                validationMessages[errorKey] :
                // Replace {{property}} placeholders with values
                Object.keys(errors[errorKey])
                  .reduce((errorMessage, errorProperty) => errorMessage.replace(
                    new RegExp('{{' + errorProperty + '}}', 'g'),
                    errors[errorKey][errorProperty]
                  ), validationMessages[errorKey]) :
              // If no custom error message, return formatted error data instead
              addSpaces(errorKey) + ' Error: ' + formatError(errors[errorKey])
      ).join('<br>');
  }

  updateValue(ctx: any, value: any): void {

    // Set value of current control
    ctx.controlValue = value;
    if (ctx.boundControl) {
      ctx.formControl.setValue(value);
      ctx.formControl.markAsDirty();
    }
    ctx.layoutNode.value = value;

    // Set values of any related controls in copyValueTo array
    if (isArray(ctx.options.copyValueTo)) {
      for (const item of ctx.options.copyValueTo) {
        const targetControl = getControl(this.formGroup, item);
        if (isObject(targetControl) && typeof targetControl.setValue === 'function') {
          targetControl.setValue(value);
          targetControl.markAsDirty();
        }
      }
    }
  }

  updateArrayCheckboxList(ctx: any, checkboxList: TitleMapItem[]): void {
    const formArray = <FormArray>this.getFormControl(ctx);

    // Remove all existing items
    while (formArray.value.length) { formArray.removeAt(0); }

    // Re-add an item for each checked box
    const refPointer = removeRecursiveReferences(
      ctx.layoutNode.dataPointer + '/-', this.dataRecursiveRefMap, this.arrayMap
    );
    for (const checkboxItem of checkboxList) {
      if (checkboxItem.checked) {
        const newFormControl = buildFormGroup(this.templateRefLibrary[refPointer]);
        newFormControl.setValue(checkboxItem.value);
        formArray.push(newFormControl);
      }
    }
    formArray.markAsDirty();
  }

  getFormControl(ctx: any): AbstractControl {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) ||
      ctx.layoutNode.type === '$ref'
    ) { return null; }
    return getControl(this.formGroup, this.getDataPointer(ctx));
  }

  getFormControlValue(ctx: any): AbstractControl {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) ||
      ctx.layoutNode.type === '$ref'
    ) { return null; }
    const control = getControl(this.formGroup, this.getDataPointer(ctx));
    return control ? control.value : null;
  }

  getFormControlGroup(ctx: any): FormArray | FormGroup {
    if (!ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer)) { return null; }
    return getControl(this.formGroup, this.getDataPointer(ctx), true);
  }

  getFormControlName(ctx: any): string {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) || !hasValue(ctx.dataIndex)
    ) { return null; }
    return JsonPointer.toKey(this.getDataPointer(ctx));
  }

  getLayoutArray(ctx: any): any[] {
    return JsonPointer.get(this.layout, this.getLayoutPointer(ctx), 0, -1);
  }

  getParentNode(ctx: any): any {
    return JsonPointer.get(this.layout, this.getLayoutPointer(ctx), 0, -2);
  }

  getDataPointer(ctx: any): string {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) || !hasValue(ctx.dataIndex)
    ) { return null; }
    return JsonPointer.toIndexedPointer(
      ctx.layoutNode.dataPointer, ctx.dataIndex, this.arrayMap
    );
  }

  getLayoutPointer(ctx: any): string {
    if (!hasValue(ctx.layoutIndex)) { return null; }
    return '/' + ctx.layoutIndex.join('/items/');
  }

  isControlBound(ctx: any): boolean {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) || !hasValue(ctx.dataIndex)
    ) { return false; }
    const controlGroup = this.getFormControlGroup(ctx);
    const name = this.getFormControlName(ctx);
    return controlGroup ? hasOwn(controlGroup.controls, name) : false;
  }

  addItem(ctx: any, name?: string): boolean {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.$ref) ||
      !hasValue(ctx.dataIndex) || !hasValue(ctx.layoutIndex)
    ) { return false; }

    // Create a new Angular form control from a template in templateRefLibrary
    const newFormGroup = buildFormGroup(this.templateRefLibrary[ctx.layoutNode.$ref]);

    // Add the new form control to the parent formArray or formGroup
    if (ctx.layoutNode.arrayItem) { // Add new array item to formArray
      (<FormArray>this.getFormControlGroup(ctx)).push(newFormGroup);
    } else { // Add new $ref item to formGroup
      (<FormGroup>this.getFormControlGroup(ctx))
        .addControl(name || this.getFormControlName(ctx), newFormGroup);
    }

    // Copy a new layoutNode from layoutRefLibrary
    const newLayoutNode = getLayoutNode(ctx.layoutNode, this);
    newLayoutNode.arrayItem = ctx.layoutNode.arrayItem;
    if (ctx.layoutNode.arrayItemType) {
      newLayoutNode.arrayItemType = ctx.layoutNode.arrayItemType;
    } else {
      delete newLayoutNode.arrayItemType;
    }
    if (name) {
      newLayoutNode.name = name;
      newLayoutNode.dataPointer += '/' + JsonPointer.escape(name);
      newLayoutNode.options.title = fixTitle(name);
    }

    // Add the new layoutNode to the form layout
    JsonPointer.insert(this.layout, this.getLayoutPointer(ctx), newLayoutNode);

    return true;
  }

  moveArrayItem(ctx: any, oldIndex: number, newIndex: number): boolean {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) ||
      !hasValue(ctx.dataIndex) || !hasValue(ctx.layoutIndex) ||
      !isDefined(oldIndex) || !isDefined(newIndex) || oldIndex === newIndex
    ) { return false; }

    // Move item in the formArray
    const formArray = <FormArray>this.getFormControlGroup(ctx);
    const arrayItem = formArray.at(oldIndex);
    formArray.removeAt(oldIndex);
    formArray.insert(newIndex, arrayItem);
    formArray.updateValueAndValidity();

    // Move layout item
    const layoutArray = this.getLayoutArray(ctx);
    layoutArray.splice(newIndex, 0, layoutArray.splice(oldIndex, 1)[0]);
    return true;
  }

  removeItem(ctx: any): boolean {
    if (
      !ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer) ||
      !hasValue(ctx.dataIndex) || !hasValue(ctx.layoutIndex)
    ) { return false; }

    // Remove the Angular form control from the parent formArray or formGroup
    if (ctx.layoutNode.arrayItem) { // Remove array item from formArray
      (<FormArray>this.getFormControlGroup(ctx))
        .removeAt(ctx.dataIndex[ctx.dataIndex.length - 1]);
    } else { // Remove $ref item from formGroup
      (<FormGroup>this.getFormControlGroup(ctx))
        .removeControl(this.getFormControlName(ctx));
    }

    // Remove layoutNode from layout
    JsonPointer.remove(this.layout, this.getLayoutPointer(ctx));
    return true;
  }
}
