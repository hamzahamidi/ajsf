import { Injectable } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { cloneDeep } from './shared/clone-deep.function';
import Ajv from 'ajv';
import jsonDraft6 from 'ajv/dist/refs/json-schema-draft-06.json';
import addFormats from 'ajv-formats';
import {
  buildFormGroup,
  buildFormGroupTemplate,
  formatFormData,
  getControl,
  fixTitle,
  forEach,
  hasOwn,
  toTitleCase,
  buildLayout,
  getLayoutNode,
  buildSchemaFromData,
  buildSchemaFromLayout,
  removeRecursiveReferences,
  hasValue,
  isArray,
  isDefined,
  isEmpty,
  isObject,
  JsonPointer
} from './shared';
import {
  deValidationMessages,
  enValidationMessages,
  esValidationMessages,
  frValidationMessages,
  itValidationMessages,
  ptValidationMessages,
  zhValidationMessages
} from './locale';


export interface TitleMapItem {
  name?: string;
  value?: any;
  checked?: boolean;
  group?: string;
  items?: TitleMapItem[];
}
export interface ErrorMessages {
  [control_name: string]: {
    message: string | Function | Object;
    code: string;
  }[];
}

type ConditionValue = { supported: true; value: unknown } | { supported: false };

const UNSUPPORTED_CONDITION: ConditionValue = { supported: false };

function splitConditionComparison(expression: string) {
  let inString = false;
  let escaped = false;
  for (let index = 0; index < expression.length - 2; index += 1) {
    const character = expression[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    const operator = expression.slice(index, index + 3);
    if (operator === '===' || operator === '!==') {
      return {
        left: expression.slice(0, index).trim(),
        operator,
        right: expression.slice(index + 3).trim()
      };
    }
  }
  return null;
}

function parseConditionLiteral(source: string): ConditionValue {
  if (source === 'true') { return { supported: true, value: true }; }
  if (source === 'false') { return { supported: true, value: false }; }
  if (source === 'null') { return { supported: true, value: null }; }
  if (source === 'undefined') { return { supported: true, value: undefined }; }
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(source)) {
    return { supported: true, value: Number(source) };
  }
  if (source.startsWith('"') && source.endsWith('"')) {
    try {
      return { supported: true, value: JSON.parse(source) };
    } catch {
      return UNSUPPORTED_CONDITION;
    }
  }
  return UNSUPPORTED_CONDITION;
}

function readConditionReference(
  source: string, model: unknown, arrayIndices: number[]
): ConditionValue {
  if (source.startsWith('model.')) return readModelReference(source, model);
  if (source.startsWith('arrayIndices[') && source.endsWith(']')) {
    return readArrayIndexReference(source, arrayIndices);
  }
  return UNSUPPORTED_CONDITION;
}

function readModelReference(source: string, model: unknown): ConditionValue {
  const keys = source.slice('model.'.length).split('.');
  if (keys.some(key =>
    !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) && !/^\d+$/.test(key)
  )) {
    return UNSUPPORTED_CONDITION;
  }
  let value: any = model;
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if (value === null || typeof value !== 'object') {
      return UNSUPPORTED_CONDITION;
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) {
      return index === keys.length - 1
        ? { supported: true, value: undefined }
        : UNSUPPORTED_CONDITION;
    }
    if (!Object.hasOwn(descriptor, 'value')) return UNSUPPORTED_CONDITION;
    value = descriptor.value;
  }
  return { supported: true, value };
}

function readArrayIndexReference(source: string, arrayIndices: number[]): ConditionValue {
  const indexSource = source.slice('arrayIndices['.length, -1);
  if (!/^\d+$/.test(indexSource)) return UNSUPPORTED_CONDITION;
  return { supported: true, value: arrayIndices?.[Number(indexSource)] };
}

function evaluateConditionFunctionBody(
  source: string, model: unknown, arrayIndices: number[]
): ConditionValue {
  let expression = source.trim();
  if (!expression.startsWith('return ')) { return UNSUPPORTED_CONDITION; }
  expression = expression.slice('return '.length).trim();
  if (expression.endsWith(';')) { expression = expression.slice(0, -1).trim(); }
  const comparison = splitConditionComparison(expression);
  if (!comparison) { return UNSUPPORTED_CONDITION; }
  const actual = readConditionReference(comparison.left, model, arrayIndices);
  const expected = parseConditionLiteral(comparison.right);
  if (!actual.supported || !expected.supported) { return UNSUPPORTED_CONDITION; }
  return {
    supported: true,
    value: comparison.operator === '==='
      ? actual.value === expected.value
      : actual.value !== expected.value
  };
}

function splitExpressionOutsideQuotes(
  expression: string,
  delimiter: string
): string[] {
  const parts: string[] = [];
  let quote = '';
  let escaped = false;
  let start = 0;
  for (let index = 0; index < expression.length; index++) {
    const character = expression[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = '';
      }
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (expression.startsWith(delimiter, index)) {
      parts.push(expression.slice(start, index));
      index += delimiter.length - 1;
      start = index + 1;
    }
  }
  if (parts.length === 0) {
    return [expression];
  }
  parts.push(expression.slice(start));
  return parts;
}

function isQuotedLiteral(expression: string): boolean {
  const quote = expression[0];
  if ((quote !== "'" && quote !== '"') || expression.at(-1) !== quote) {
    return false;
  }
  let escaped = false;
  for (let index = 1; index < expression.length - 1; index++) {
    const character = expression[index];
    if (escaped) {
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === quote) {
      return false;
    }
  }
  return true;
}

function nextTemplateExpression(text: string, searchIndex: number): { start: number; end: number }|null {
  let start = -1;
  for (let index = searchIndex; index < text.length; index += 1) {
    const character = text[index];
    if (character === '\n' || character === '\r' || character === '\u2028' || character === '\u2029') {
      start = -1;
      continue;
    }
    if (start === -1 && character === '{' && text[index + 1] === '{') {
      start = index;
    } else if (start !== -1 && character === '}' && text[index + 1] === '}') {
      if (index > start + 2) { return { start, end: index }; }
      start = -1;
    }
  }
  return null;
}

@Injectable()
export class JsonSchemaFormService {
  JsonFormCompatibility = false;
  ReactJsonSchemaFormCompatibility = false;
  AngularSchemaFormCompatibility = false;
  tpldata: any = {};

  ajvOptions: any = {
    allErrors: true,
    // ajv 8 removed jsonPointers, whose behaviour is now the default, and
    // unknownFormats, which strict mode subsumes. Strict would reject 58 of the
    // 80 bundled examples, mostly for the keywords this library hoists into
    // schemas itself, so it stays off. Formats left ajv core in 8, so without
    // ajv-formats below every 'format' keyword would be silently ignored.
    strict: false,
  };
  ajv: any = addFormats(new Ajv(this.ajvOptions)); // AJV: Another JSON Schema Validator
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
    autocomplete: true, // Allow the web browser to remember previous form submission values as defaults
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
    defautWidgetOptions: {
      // Default options for form control widgets
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
      // No 'disabled' default: updateInputOptions copies these defaults into
      // every layout node, and the submit widgets read hasOwn(options,
      // 'disabled') as an explicit override, so a default made
      // disableInvalidSubmit unreachable for any layout-declared submit.
      readonly: false, // Set control as read only? (not editable, but included in output)
      returnEmptyFields: true, // return values for fields that contain no data?
      validationMessages: {} // set by setLanguage()
    }
  };

  constructor() {
    this.setLanguage(this.language);
    this.ajv.addMetaSchema(jsonDraft6);
  }

  setLanguage(language: string = 'en-US') {
    this.language = language;
    const languageValidationMessages = {
      de: deValidationMessages,
      en: enValidationMessages,
      es: esValidationMessages,
      fr: frValidationMessages,
      it: itValidationMessages,
      pt: ptValidationMessages,
      zh: zhValidationMessages,
    };
    const languageCode = language.slice(0, 2);

    const validationMessages = languageValidationMessages[languageCode];

    this.defaultFormOptions.defautWidgetOptions.validationMessages = cloneDeep(
      validationMessages
    );
  }

  getData() {
    return this.data;
  }

  getSchema() {
    return this.schema;
  }

  getLayout() {
    return this.layout;
  }

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
      newValue,
      this.dataMap,
      this.dataRecursiveRefMap,
      this.arrayMap,
      this.formOptions.returnEmptyFields
    );
    this.isValid = this.validateFormData(this.data);
    this.validData = this.isValid ? this.data : null;
    const compileErrors = errors => {
      const compiledErrors = {};
      (errors || []).forEach(error => {
        if (!compiledErrors[error.instancePath]) {
          compiledErrors[error.instancePath] = [];
        }
        compiledErrors[error.instancePath].push(error.message);
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
    this.formGroupTemplate = buildFormGroupTemplate(
      this,
      formValues,
      setValues
    );
  }

  buildFormGroup() {
    this.formGroup = <UntypedFormGroup>buildFormGroup(this.formGroupTemplate);
    if (this.formGroup) {
      this.compileAjvSchema();
      this.validateData(this.formGroup.value);

      // Set up observables to emit data and validation info when form data changes
      if (this.formValueSubscription) {
        this.formValueSubscription.unsubscribe();
      }
      this.formValueSubscription = this.formGroup.valueChanges.subscribe(
        formValue => this.validateData(formValue)
      );
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
        Object.assign(
          this.formOptions.defautWidgetOptions,
          addOptions.defaultOptions
        );
        delete addOptions.defaultOptions;
      }
      if (isObject(addOptions.defautWidgetOptions)) {
        Object.assign(
          this.formOptions.defautWidgetOptions,
          addOptions.defautWidgetOptions
        );
        delete addOptions.defautWidgetOptions;
      }
      Object.assign(this.formOptions, addOptions);

      // convert disableErrorState / disableSuccessState to enable...
      const globalDefaults = this.formOptions.defautWidgetOptions;
      ['ErrorState', 'SuccessState']
        .filter(suffix => hasOwn(globalDefaults, 'disable' + suffix))
        .forEach(suffix => {
          globalDefaults['enable' + suffix] = !globalDefaults[
            'disable' + suffix
          ];
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
    if (data) {
      return buildSchemaFromData(data, requireAllFields);
    }
    this.schema = buildSchemaFromData(this.formValues, requireAllFields);
  }

  buildSchemaFromLayout(layout?: any): any {
    if (layout) {
      return buildSchemaFromLayout(layout);
    }
    this.schema = buildSchemaFromLayout(this.layout);
  }

  setTpldata(newTpldata: any = {}): void {
    this.tpldata = newTpldata;
  }

  parseText(
    text = '',
    value: any = {},
    values: any = {},
    key: number | string = null
  ): string {
    if (!text) { return text; }
    let expression = nextTemplateExpression(text, 0);
    if (expression === null) { return text; }
    let result = '';
    let cursor = 0;
    while (expression !== null) {
      result += text.slice(cursor, expression.start);
      result += this.parseExpression(
        text.slice(expression.start + 2, expression.end), value, values, key, this.tpldata
      );
      cursor = expression.end + 2;
      expression = nextTemplateExpression(text, cursor);
    }
    return result + text.slice(cursor);
  }

  private resolveTextPointer(pointer, value, values, tpldata) {
    const path = pointer.slice(1);
    if (pointer[0] === 'value' && JsonPointer.has(value, path)) {
      return JsonPointer.get(value, path);
    }
    if (pointer[0] === 'values' && JsonPointer.has(values, path)) {
      return JsonPointer.get(values, path);
    }
    if (pointer[0] === 'tpldata' && JsonPointer.has(tpldata, path)) {
      return JsonPointer.get(tpldata, path);
    }
    return JsonPointer.has(values, pointer) ? JsonPointer.get(values, pointer) : '';
  }

  parseExpression(
    expression = '',
    value: any = {},
    values: any = {},
    key: number | string = null,
    tpldata: any = null
  ) {
    if (typeof expression !== 'string') {
      return '';
    }
    const index = typeof key === 'number' ? key + 1 + '' : key || '';
    expression = expression.trim();
    if (expression === 'idx' || expression === '$index') {
      return index;
    }
    if (expression === 'value' && !hasOwn(values, 'value')) {
      return value;
    }
    const orTerms = splitExpressionOutsideQuotes(expression, '||');
    if (orTerms.length > 1) {
      return orTerms.reduce(
        (all, term) =>
          all || this.parseExpression(term, value, values, key, tpldata),
        ''
      );
    }
    const andTerms = splitExpressionOutsideQuotes(expression, '&&');
    if (andTerms.length > 1) {
      return andTerms
        .reduce(
          (all, term) =>
            all && this.parseExpression(term, value, values, key, tpldata),
          ' '
        )
        .trim();
    }
    const additionTerms = splitExpressionOutsideQuotes(expression, '+');
    if (additionTerms.length > 1) {
      return additionTerms
        .map(term => this.parseExpression(term, value, values, key, tpldata))
        .join('');
    }
    if (isQuotedLiteral(expression)) {
      return expression.slice(1, -1);
    }
    if (expression.includes('[idx]')) {
      expression = expression.replaceAll('[idx]', <string>index);
    }
    if (expression.includes('[$index]')) {
      expression = expression.replace(/\[$index\]/g, <string>index);
    }
    if (
      !expression.includes(' ') &&
      !expression.includes("'") &&
      !expression.includes('"')
    ) {
      const pointer = JsonPointer.parseObjectPath(expression);
      return this.resolveTextPointer(pointer, value, values, tpldata);
    }
    return '';
  }

  setArrayItemTitle(
    parentCtx: any = {},
    childNode: any = null,
    index: number = null
  ): string {
    const parentNode = parentCtx.layoutNode;
    const parentValues: any = this.getFormControlValue(parentCtx);
    const isArrayItem =
      (parentNode.type || '').slice(-5) === 'array' && isArray(parentValues);
    const text = JsonPointer.getFirst(
      isArrayItem && childNode.type !== '$ref'
        ? [
          [childNode, '/options/legend'],
          [childNode, '/options/title'],
          [parentNode, '/options/title'],
          [parentNode, '/options/legend']
        ]
        : [
          [childNode, '/options/title'],
          [childNode, '/options/legend'],
          [parentNode, '/options/title'],
          [parentNode, '/options/legend']
        ]
    );
    if (!text) {
      return text;
    }
    const childValue =
      isArray(parentValues) && index < parentValues.length
        ? parentValues[index]
        : parentValues;
    return this.parseText(text, childValue, parentValues, index);
  }

  setItemTitle(ctx: any) {
    return !ctx.options.title && /^(\d+|-)$/.test(ctx.layoutNode.name)
      ? null
      : this.parseText(
        ctx.options.title || toTitleCase(ctx.layoutNode.name),
        this.getFormControlValue(this),
        (this.getFormControlGroup(this) || <any>{}).value,
        ctx.dataIndex[ctx.dataIndex.length - 1]
      );
  }

  evaluateCondition(layoutNode: any, dataIndex: number[]): boolean {
    const condition = layoutNode.options?.condition;
    if (!hasValue(condition)) { return true; }
    if (typeof condition === 'string') {
      return this.evaluateStringCondition(condition, dataIndex);
    }
    if (typeof condition === 'function') { return condition(this.data); }
    if (typeof condition.functionBody === 'string') {
      return this.evaluateFunctionBodyCondition(condition.functionBody, dataIndex);
    }
    return true;
  }

  private evaluateStringCondition(condition: string, dataIndex: number[]): boolean {
    const arrayIndex = dataIndex?.at(-1);
    let path = condition;
    if (hasValue(arrayIndex)) {
      path = path.replace('[arrayIndex]', `[${arrayIndex}]`);
    }
    const pointer = JsonPointer.parseObjectPath(path);
    const result = !!JsonPointer.get(this.data, pointer);
    return !result && pointer[0] === 'model'
      ? !!JsonPointer.get({ model: this.data }, pointer)
      : result;
  }

  private evaluateFunctionBodyCondition(functionBody: string, dataIndex: number[]): boolean {
    const evaluation = evaluateConditionFunctionBody(functionBody, this.data, dataIndex);
    if (evaluation.supported) {
      return !!evaluation.value;
    }
    console.error(
      'condition functionBody is not a supported comparison expression: ' +
      functionBody
    );
    return true;
  }

  initializeControl(ctx: any, bind = true): boolean {
    if (!isObject(ctx)) {
      return false;
    }
    if (isEmpty(ctx.options)) {
      ctx.options = !isEmpty(ctx.layoutNode?.options)
        ? ctx.layoutNode.options
        : cloneDeep(this.formOptions);
    }
    ctx.formControl = this.getFormControl(ctx);
    ctx.boundControl = bind && !!ctx.formControl;
    if (ctx.formControl) {
      ctx.controlName = this.getFormControlName(ctx);
      ctx.controlValue = ctx.formControl.value;
      ctx.controlDisabled = ctx.formControl.disabled;
      ctx.options.errorMessage =
        ctx.formControl.status === 'VALID'
          ? null
          : this.formatErrors(
            ctx.formControl.errors,
            ctx.options.validationMessages
          );
      ctx.options.showErrors =
        this.formOptions.validateOnRender === true ||
        (this.formOptions.validateOnRender === 'auto' &&
          hasValue(ctx.controlValue));
      ctx.formControl.statusChanges.subscribe(
        status =>
          (ctx.options.errorMessage =
            status === 'VALID'
              ? null
              : this.formatErrors(
                ctx.formControl.errors,
                ctx.options.validationMessages
              ))
      );
      ctx.formControl.valueChanges.subscribe(value => {
        if (value) {
          ctx.controlValue = value;
        }
      });
    } else {
      ctx.controlName = ctx.layoutNode.name;
      ctx.controlValue = ctx.layoutNode.value || null;
      const dataPointer = this.getDataPointer(ctx);
      if (bind && dataPointer) {
        console.error(
          `warning: control "${dataPointer}" is not bound to the Angular FormGroup.`
        );
      }
    }
    return ctx.boundControl;
  }

  formatErrors(errors: any, validationMessages: any = {}): string {
    if (isEmpty(errors)) {
      return null;
    }
    if (!isObject(validationMessages)) {
      validationMessages = {};
    }
    const addSpaces = string =>
      string[0].toUpperCase() +
      (string.slice(1) || '')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replaceAll('_', ' ');
    const formatErrorValue = (key, error) => {
      if (error === true) { return addSpaces(key); }
      if (error === false) { return 'Not ' + addSpaces(key); }
      return addSpaces(key) + ': ' + formatError(error);
    };
    const formatError = error => {
      if (typeof error !== 'object') { return addSpaces(error.toString()); }
      return Object.keys(error).map(key => formatErrorValue(key, error[key])).join(', ');
    };
    const messageForError = errorKey => {
      if (typeof validationMessages === 'string') { return validationMessages; }
      const validationMessage = validationMessages[errorKey];
      if (typeof validationMessage === 'function') {
        return validationMessage(errors[errorKey]);
      }
      if (typeof validationMessage !== 'string') {
        return addSpaces(errorKey) + ' Error: ' + formatError(errors[errorKey]);
      }
      const errorProperties = errors[errorKey];
      if (
        !validationMessage.includes('{{') ||
        !validationMessage.includes('}}') ||
        errorProperties == null
      ) {
        return validationMessage;
      }
      return Object.keys(errorProperties).reduce(
        (errorMessage, errorProperty) =>
          errorMessage.replaceAll(
            '{{' + errorProperty + '}}',
            errorProperties[errorProperty]
          ),
        validationMessage
      );
    };
    const messages = [];
    return (
      Object.keys(errors)
        // Hide 'required' error, unless it is the only one
        .filter(
          errorKey =>
            errorKey !== 'required' || Object.keys(errors).length === 1
        )
        .map(messageForError)
        .join('<br>')
    );
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
        if (
          isObject(targetControl) &&
          typeof targetControl.setValue === 'function'
        ) {
          targetControl.setValue(value);
          targetControl.markAsDirty();
        }
      }
    }
  }

  updateArrayCheckboxList(ctx: any, checkboxList: TitleMapItem[]): void {
    this.updateArrayValue(
      ctx,
      checkboxList.filter(item => item.checked).map(item => item.value)
    );
  }

  updateArrayValue(ctx: any, values: any[]): void {
    const formArray = <UntypedFormArray>this.getFormControl(ctx);
    ctx.controlValue = values;
    ctx.layoutNode.value = values;

    if (!formArray) {
      return;
    }

    while (formArray.length) {
      formArray.removeAt(0);
    }

    // Re-add an item for each checked box
    const refPointer = removeRecursiveReferences(
      ctx.layoutNode.dataPointer + '/-',
      this.dataRecursiveRefMap,
      this.arrayMap
    );
    for (const value of values) {
      const newFormControl = buildFormGroup(
        this.templateRefLibrary[refPointer]
      );
      newFormControl.setValue(value);
      formArray.push(newFormControl);
    }
    formArray.markAsDirty();
  }

  getFormControl(ctx: any): AbstractControl {
    if (
      !ctx.layoutNode ||
      !isDefined(ctx.layoutNode.dataPointer) ||
      ctx.layoutNode.type === '$ref'
    ) {
      return null;
    }
    return getControl(this.formGroup, this.getDataPointer(ctx));
  }

  getFormControlValue(ctx: any): AbstractControl {
    if (
      !ctx.layoutNode ||
      !isDefined(ctx.layoutNode.dataPointer) ||
      ctx.layoutNode.type === '$ref'
    ) {
      return null;
    }
    const control = getControl(this.formGroup, this.getDataPointer(ctx));
    return control ? control.value : null;
  }

  getFormControlGroup(ctx: any): UntypedFormArray | UntypedFormGroup {
    if (!ctx.layoutNode || !isDefined(ctx.layoutNode.dataPointer)) {
      return null;
    }
    return getControl(this.formGroup, this.getDataPointer(ctx), true);
  }

  getFormControlName(ctx: any): string {
    if (
      !ctx.layoutNode ||
      !isDefined(ctx.layoutNode.dataPointer) ||
      !hasValue(ctx.dataIndex)
    ) {
      return null;
    }
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
      !ctx.layoutNode ||
      !isDefined(ctx.layoutNode.dataPointer) ||
      !hasValue(ctx.dataIndex)
    ) {
      return null;
    }
    return JsonPointer.toIndexedPointer(
      ctx.layoutNode.dataPointer,
      ctx.dataIndex,
      this.arrayMap
    );
  }

  getLayoutPointer(ctx: any): string {
    if (!hasValue(ctx.layoutIndex)) {
      return null;
    }
    return '/' + ctx.layoutIndex.join('/items/');
  }

  isControlBound(ctx: any): boolean {
    if (
      !ctx.layoutNode ||
      !isDefined(ctx.layoutNode.dataPointer) ||
      !hasValue(ctx.dataIndex)
    ) {
      return false;
    }
    const controlGroup = this.getFormControlGroup(ctx);
    const name = this.getFormControlName(ctx);
    return controlGroup ? hasOwn(controlGroup.controls, name) : false;
  }

  addItem(ctx: any, name?: string): boolean {
    if (
      !ctx.layoutNode ||
      !isDefined(ctx.layoutNode.$ref) ||
      !hasValue(ctx.dataIndex) ||
      !hasValue(ctx.layoutIndex)
    ) {
      return false;
    }

    // Create a new Angular form control from a template in templateRefLibrary
    const newFormGroup = buildFormGroup(
      this.templateRefLibrary[ctx.layoutNode.$ref]
    );

    // Add the new form control to the parent formArray or formGroup
    if (ctx.layoutNode.arrayItem) {
      // Add new array item to formArray
      (<UntypedFormArray>this.getFormControlGroup(ctx)).push(newFormGroup);
    } else {
      // Add new $ref item to formGroup
      (<UntypedFormGroup>this.getFormControlGroup(ctx)).addControl(
        name || this.getFormControlName(ctx),
        newFormGroup
      );
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
      !ctx.layoutNode ||
      !isDefined(ctx.layoutNode.dataPointer) ||
      !hasValue(ctx.dataIndex) ||
      !hasValue(ctx.layoutIndex) ||
      !isDefined(oldIndex) ||
      !isDefined(newIndex) ||
      oldIndex === newIndex
    ) {
      return false;
    }

    // Move item in the formArray
    const formArray = <UntypedFormArray>this.getFormControlGroup(ctx);
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
      !ctx.layoutNode ||
      !isDefined(ctx.layoutNode.dataPointer) ||
      !hasValue(ctx.dataIndex) ||
      !hasValue(ctx.layoutIndex)
    ) {
      return false;
    }

    // Remove the Angular form control from the parent formArray or formGroup
    if (ctx.layoutNode.arrayItem) {
      // Remove array item from formArray
      (<UntypedFormArray>this.getFormControlGroup(ctx)).removeAt(
        ctx.dataIndex[ctx.dataIndex.length - 1]
      );
    } else {
      // Remove $ref item from formGroup
      (<UntypedFormGroup>this.getFormControlGroup(ctx)).removeControl(
        this.getFormControlName(ctx)
      );
    }

    // Remove layoutNode from layout
    JsonPointer.remove(this.layout, this.getLayoutPointer(ctx));
    return true;
  }
}
