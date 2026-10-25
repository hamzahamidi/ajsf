import { cloneDeep } from './clone-deep.function';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  ValidatorFn
} from '@angular/forms';
import { forEach, hasOwn } from './utility.functions';
import {
  applyPatternProperties,
  getControlValidators,
  getMatchingPatternProperty,
  getObjectPropertySchemaPointer,
  removeRecursiveReferences,
} from './json-schema.functions';
import {
  hasValue,
  inArray,
  isArray,
  isDate,
  isDefined,
  isEmpty,
  isObject,
  isPrimitive,
  SchemaPrimitiveType,
  toJavaScriptType,
  toSchemaType
} from './validator.functions';
import { JsonPointer, Pointer } from './jsonpointer.functions';
import { JsonValidators } from './json.validators';



/**
 * FormGroup function library:
 *
 * buildFormGroupTemplate:  Builds a FormGroupTemplate from schema
 *
 * buildFormGroup:          Builds an Angular FormGroup from a FormGroupTemplate
 *
 * mergeValues:
 *
 * setRequiredFields:
 *
 * formatFormData:
 *
 * getControl:
 *
 * A layout without a schema first generates a schema from its field keys.
 */

/**
 * 'buildFormGroupTemplate' function
 *
 * Builds a template for an Angular FormGroup from a JSON Schema.
 *
 * //  {any} jsf -
 * //  {any = null} nodeValue -
 * //  {boolean = true} mapArrays -
 * //  {string = ''} schemaPointer -
 * //  {string = ''} dataPointer -
 * //  {any = ''} templatePointer -
 * // {any} -
 */
interface FormGroupTemplateContext {
  jsf: any;
  nodeValue: any;
  setValues: boolean;
  schemaPointer: string;
  dataPointer: string;
  templatePointer: string;
  shortDataPointer: string;
  nodeOptions: Map<string, any>;
  validators: any;
}

export function buildFormGroupTemplate(
  jsf: any, nodeValue: any = null, setValues = true,
  schemaPointer = '', dataPointer = '', templatePointer = ''
) {
  const schema = JsonPointer.get(jsf.schema, schemaPointer);
  const hasProvidedValue = setValues && isDefined(nodeValue);
  if (setValues) {
    if (!isDefined(nodeValue) && (
      jsf.formOptions.setSchemaDefaults === true ||
      (jsf.formOptions.setSchemaDefaults === 'auto' && isEmpty(jsf.formValues))
    )) {
      nodeValue = JsonPointer.get(jsf.schema, schemaPointer + '/default');
    }
  } else {
    nodeValue = null;
  }
  const controlType = getFormGroupTemplateControlType(schema);
  const shortDataPointer =
    removeRecursiveReferences(dataPointer, jsf.dataRecursiveRefMap, jsf.arrayMap);
  if (!jsf.dataMap.has(shortDataPointer)) {
    jsf.dataMap.set(shortDataPointer, new Map());
  }
  const nodeOptions = jsf.dataMap.get(shortDataPointer);
  if (!hasProvidedValue && nodeOptions.has('layoutDefault') &&
    shouldSetLayoutDefault(jsf, templatePointer)
  ) {
    nodeValue = nodeOptions.get('layoutDefault');
  }
  registerFormGroupTemplateOptions(
    nodeOptions, schema, schemaPointer, templatePointer, controlType
  );
  const context: FormGroupTemplateContext = {
    jsf,
    nodeValue,
    setValues,
    schemaPointer,
    dataPointer,
    templatePointer,
    shortDataPointer,
    nodeOptions,
    validators: getControlValidators(schema, jsf.schema, schemaPointer, jsf.ajv)
  };
  return buildFormGroupTemplateForControl(context, schema, controlType);
}

function shouldSetLayoutDefault(jsf: any, templatePointer: string): boolean {
  return jsf.formOptions.setLayoutDefaults === true ||
    (jsf.formOptions.setLayoutDefaults === 'auto' &&
      (isEmpty(jsf.formValues) || templatePointer.endsWith('/controls/-')));
}

function getFormGroupTemplateControlType(schema: any): string {
  const schemaType: string | string[] = JsonPointer.get(schema, '/type');
  if ((hasOwn(schema, 'properties') || hasOwn(schema, 'patternProperties') ||
    hasOwn(schema, 'additionalProperties')) &&
    schemaType === 'object') {
    return 'FormGroup';
  }
  if ((hasOwn(schema, 'items') || hasOwn(schema, 'additionalItems')) &&
    schemaType === 'array') {
    return 'FormArray';
  }
  if (!schemaType && hasOwn(schema, '$ref')) {
    return '$ref';
  }
  return 'FormControl';
}

function registerFormGroupTemplateOptions(
  nodeOptions: Map<string, any>,
  schema: any,
  schemaPointer: string,
  templatePointer: string,
  controlType: string
): void {
  if (nodeOptions.has('schemaType')) { return; }
  nodeOptions.set('schemaPointer', schemaPointer);
  nodeOptions.set('schemaType', schema.type);
  if (schema.format) {
    nodeOptions.set('schemaFormat', schema.format);
    if (!schema.type) { nodeOptions.set('schemaType', 'string'); }
  }
  nodeOptions.set('templatePointer', templatePointer);
  nodeOptions.set('templateType', controlType);
}

function buildFormGroupTemplateForControl(
  context: FormGroupTemplateContext,
  schema: any,
  controlType: string
): any {
  switch (controlType) {
    case 'FormGroup':
      return buildObjectFormGroupTemplate(context, schema);
    case 'FormArray':
      return buildArrayFormGroupTemplate(context, schema);
    case '$ref':
      return buildReferenceFormGroupTemplate(context, schema);
    case 'FormControl':
      return buildPrimitiveFormGroupTemplate(context);
    default:
      return null;
  }
}

function buildObjectFormGroupTemplate(
  context: FormGroupTemplateContext,
  schema: any
): any {
  const controls: any = {};
  applyPatternProperties(schema, context.nodeValue);
  if (hasOwn(schema, 'ui:order') || hasOwn(schema, 'properties') ||
    hasOwn(schema, 'patternProperties') || hasOwn(schema, 'additionalProperties')) {
    const propertyKeys = getOrderedSchemaPropertyKeys(schema, context.nodeValue);
    propertyKeys.forEach(key => {
      const schemaPropertyPointer = getObjectPropertySchemaPointer(schema, key);
      if (!schemaPropertyPointer) { return; }
      if (schemaPropertyPointer === '/additionalProperties' && !isObject(schema.additionalProperties)) {
        return;
      }
      controls[key] = buildFormGroupTemplate(
        context.jsf,
        JsonPointer.get(context.nodeValue, [<string>key]),
        context.setValues,
        context.schemaPointer + schemaPropertyPointer,
        context.dataPointer + '/' + JsonPointer.escape(key),
        context.templatePointer + '/controls/' + JsonPointer.escape(key)
      );
    });
    context.jsf.formOptions.fieldsRequired = setRequiredFields(schema, controls);
  }
  return { controlType: 'FormGroup', controls, validators: context.validators };
}

function getOrderedSchemaPropertyKeys(schema: any, nodeValue: any): any[] {
  const properties = isObject(schema.properties) ? schema.properties : {};
  const propertyKeys = schema['ui:order'] || Object.keys(properties);
  if (propertyKeys.includes('*') && !hasOwn(properties, '*')) {
    const unnamedKeys = Object.keys(properties)
      .filter(key => !propertyKeys.includes(key));
    for (let i = propertyKeys.length - 1; i >= 0; i--) {
      if (propertyKeys[i] === '*') {
        propertyKeys.splice(i, 1, ...unnamedKeys);
      }
    }
  }
  const orderedKeys = [...propertyKeys];
  if (isObject(nodeValue)) {
    for (const key of Object.keys(nodeValue)) {
      const matchesPattern = getMatchingPatternProperty(schema, key) !== null;
      const isAdditionalProperty = isObject(schema.additionalProperties) && !hasOwn(properties, key);
      if ((matchesPattern || isAdditionalProperty) && !orderedKeys.includes(key)) orderedKeys.push(key);
    }
  }
  return orderedKeys;
}

function buildArrayFormGroupTemplate(
  context: FormGroupTemplateContext,
  schema: any
): any {
  const controls: any[] = [];
  const minItems = Math.max(schema.minItems || 0, context.nodeOptions.get('minItems') || 0);
  const maxItems = Math.min(schema.maxItems || 1000, context.nodeOptions.get('maxItems') || 1000);
  const additionalItemsPointer = getAdditionalItemsPointer(context, schema, maxItems);
  if (isArray(schema.items)) {
    buildTupleFormGroupTemplates(context, schema, controls, minItems, maxItems);
  }
  if (additionalItemsPointer) {
    buildListFormGroupTemplates(context, controls, additionalItemsPointer, maxItems);
  }
  return { controlType: 'FormArray', controls, validators: context.validators };
}

function getAdditionalItemsPointer(
  context: FormGroupTemplateContext,
  schema: any,
  maxItems: number
): string {
  if (!isArray(schema.items)) {
    return context.schemaPointer + '/items';
  }
  if (schema.items.length < maxItems && isObject(schema.additionalItems)) {
    return context.schemaPointer + '/additionalItems';
  }
  return null;
}

function buildTupleFormGroupTemplates(
  context: FormGroupTemplateContext,
  schema: any,
  controls: any[],
  minItems: number,
  maxItems: number
): void {
  const tupleItems = context.nodeOptions.get('tupleItems') ||
    Math.min(schema.items.length, maxItems);
  for (let i = 0; i < tupleItems; i++) {
    if (i < minItems) {
      controls.push(buildFormGroupTemplate(
        context.jsf, isArray(context.nodeValue) ? context.nodeValue[i] : context.nodeValue,
        context.setValues,
        context.schemaPointer + '/items/' + i,
        context.dataPointer + '/' + i,
        context.templatePointer + '/controls/' + i
      ));
      continue;
    }
    controls.push(buildTupleFormGroupTemplate(context, i));
  }
}

function buildTupleFormGroupTemplate(
  context: FormGroupTemplateContext,
  index: number
): any {
  const schemaRefPointer = removeRecursiveReferences(
    context.schemaPointer + '/items/' + index, context.jsf.schemaRecursiveRefMap
  );
  const itemRefPointer = removeRecursiveReferences(
    context.shortDataPointer + '/' + index, context.jsf.dataRecursiveRefMap, context.jsf.arrayMap
  );
  const itemRecursive = itemRefPointer !== context.shortDataPointer + '/' + index;
  registerFormGroupTemplateReference(
    context, schemaRefPointer, itemRefPointer, context.templatePointer + '/controls/' + index
  );
  if (isArray(context.nodeValue)) {
    return buildFormGroupTemplate(
      context.jsf, context.nodeValue[index], context.setValues,
      context.schemaPointer + '/items/' + index,
      context.dataPointer + '/' + index,
      context.templatePointer + '/controls/' + index
    );
  }
  if (itemRecursive) { return null; }
  return cloneDeep(context.jsf.templateRefLibrary[itemRefPointer]);
}

function buildListFormGroupTemplates(
  context: FormGroupTemplateContext,
  controls: any[],
  additionalItemsPointer: string,
  maxItems: number
): void {
  const schemaRefPointer = removeRecursiveReferences(
    additionalItemsPointer, context.jsf.schemaRecursiveRefMap
  );
  const itemRefPointer = removeRecursiveReferences(
    context.shortDataPointer + '/-', context.jsf.dataRecursiveRefMap, context.jsf.arrayMap
  );
  const itemRecursive = itemRefPointer !== context.shortDataPointer + '/-';
  registerFormGroupTemplateReference(
    context, schemaRefPointer, itemRefPointer, context.templatePointer + '/controls/-'
  );
  // Validators never carries 'required' here, the parent writes that later, so
  // for a recursive array this was always false and every supplied item was
  // dropped. Supplied data is finite, so filling from it still terminates.
  if (!itemRecursive || hasOwn(context.validators, 'required') || isArray(context.nodeValue)) {
    const arrayLength = getListFormGroupTemplateLength(context, itemRecursive, maxItems);
    for (let i = controls.length; i < arrayLength; i++) {
      controls.push(buildListFormGroupTemplate(context, schemaRefPointer, itemRefPointer, itemRecursive, i));
    }
  }
}

function getListFormGroupTemplateLength(
  context: FormGroupTemplateContext,
  itemRecursive: boolean,
  maxItems: number
): number {
  const templateLength = itemRecursive ? 0 :
    (context.nodeOptions.get('tupleItems') + context.nodeOptions.get('listItems')) || 0;
  const valueLength = isArray(context.nodeValue) ? context.nodeValue.length : 0;
  return Math.min(Math.max(templateLength, valueLength), maxItems);
}

function buildListFormGroupTemplate(
  context: FormGroupTemplateContext,
  schemaRefPointer: string,
  itemRefPointer: string,
  itemRecursive: boolean,
  index: number
): any {
  if (isArray(context.nodeValue)) {
    return buildFormGroupTemplate(
      context.jsf, context.nodeValue[index], context.setValues,
      schemaRefPointer,
      context.dataPointer + '/-',
      context.templatePointer + '/controls/-'
    );
  }
  if (itemRecursive) { return null; }
  return cloneDeep(context.jsf.templateRefLibrary[itemRefPointer]);
}

function registerFormGroupTemplateReference(
  context: FormGroupTemplateContext,
  schemaRefPointer: string,
  itemRefPointer: string,
  templatePointer: string
): void {
  if (hasOwn(context.jsf.templateRefLibrary, itemRefPointer)) { return; }
  context.jsf.templateRefLibrary[itemRefPointer] = null;
  context.jsf.templateRefLibrary[itemRefPointer] = buildFormGroupTemplate( // NOSONAR
    context.jsf, null, context.setValues, schemaRefPointer, itemRefPointer, templatePointer
  );
}

function buildReferenceFormGroupTemplate(
  context: FormGroupTemplateContext,
  schema: any
): any {
  const schemaRef = JsonPointer.compile(schema.$ref);
  const dataRef = JsonPointer.toDataPointer(schemaRef, schema);
  const refPointer = removeRecursiveReferences(
    dataRef, context.jsf.dataRecursiveRefMap, context.jsf.arrayMap
  );
  if (refPointer && !hasOwn(context.jsf.templateRefLibrary, refPointer)) {
    context.jsf.templateRefLibrary[refPointer] = null;
    const newTemplate = buildFormGroupTemplate(
      context.jsf, context.setValues, context.setValues, schemaRef
    );
    if (newTemplate) {
      context.jsf.templateRefLibrary[refPointer] = newTemplate;
    } else {
      delete context.jsf.templateRefLibrary[refPointer];
    }
  }
  return null;
}

function buildPrimitiveFormGroupTemplate(context: FormGroupTemplateContext): any {
  const value = {
    value: context.setValues && isPrimitive(context.nodeValue) ? context.nodeValue : null,
    disabled: context.nodeOptions.get('disabled') || false
  };
  return { controlType: 'FormControl', value, validators: context.validators };
}

/**
 * 'buildFormGroup' function
 *
 * // {any} template -
 * // {AbstractControl}
*/
export function buildFormGroup(template: any): AbstractControl {
  if (!hasOwn(template, 'controlType')) return null;
  const validatorFns = buildValidatorFunctions(template);
  const validatorFn = getContainerValidator(template.controlType, validatorFns);
  switch (template.controlType) {
    case 'FormGroup':
      return new UntypedFormGroup(buildGroupControls(template), validatorFn);
    case 'FormArray':
      return buildArrayControl(template, validatorFn);
    case 'FormControl':
      return new UntypedFormControl(template.value, validatorFns);
    default:
      return null;
  }
}

function buildValidatorFunctions(template: any): ValidatorFn[] {
  const validatorFns: ValidatorFn[] = [];
  if (!hasOwn(template, 'validators')) return validatorFns;
  forEach(template.validators, (parameters, validator) => {
    if (typeof JsonValidators[validator] === 'function') {
      validatorFns.push(JsonValidators[validator].apply(null, parameters));
    }
  });
  return validatorFns;
}

function getContainerValidator(controlType: string, validatorFns: ValidatorFn[]): ValidatorFn {
  if (!validatorFns.length || !inArray(controlType, ['FormGroup', 'FormArray'])) return null;
  return validatorFns.length > 1 ? JsonValidators.compose(validatorFns) : validatorFns[0];
}

function buildGroupControls(template: any): { [key: string]: AbstractControl } {
  const controls: { [key: string]: AbstractControl } = {};
  forEach(template.controls, (controlTemplate, key) => {
    const control = buildFormGroup(controlTemplate);
    if (control) controls[key] = control;
  });
  return controls;
}

function buildArrayControl(template: any, validatorFn: ValidatorFn): AbstractControl {
  const controls = (template.controls || [])
    .map(controlTemplate => buildFormGroup(controlTemplate))
    .filter(Boolean);
  return new UntypedFormArray(controls, validatorFn);
}

/**
 * 'mergeValues' function
 *
 * //  {any[]} ...valuesToMerge - Multiple values to merge
 * // {any} - Merged values
 */
export function mergeValues(...valuesToMerge) {
  let mergedValues: any = null;
  for (const currentValue of valuesToMerge) {
    if (!isEmpty(currentValue)) mergedValues = mergeCurrentValue(mergedValues, currentValue);
  }
  return mergedValues;
}

function mergeCurrentValue(merged: any, current: any): any {
  if (isInitialContainerValue(merged, current)) return cloneInitialContainer(current, merged);
  if (typeof current !== 'object') return current;
  if (isObject(merged) && isObject(current)) return Object.assign(merged, current);
  if (isObject(merged) && isArray(current)) return mergeObjectWithArray(merged, current);
  if (isArray(merged) && isObject(current)) return mergeArrayWithObject(merged, current);
  if (isArray(merged) && isArray(current)) return mergeArrayValues(merged, current);
  return merged;
}

function isInitialContainerValue(merged: any, current: any): boolean {
  return typeof current === 'object' && (isEmpty(merged) || typeof merged !== 'object');
}

function cloneInitialContainer(current: any, fallback: any): any {
  if (isArray(current)) return [...current];
  if (isObject(current)) return { ...current };
  return fallback;
}

function mergeObjectWithArray(objectValue: any, arrayValue: any[]): any[] {
  const mergedValues = [];
  for (const value of arrayValue) mergedValues.push(mergeValues(objectValue, value));
  return mergedValues;
}

function mergeArrayWithObject(arrayValue: any[], objectValue: any): any[] {
  const mergedValues = [];
  for (const value of arrayValue) mergedValues.push(mergeValues(value, objectValue));
  return mergedValues;
}

function mergeArrayValues(left: any[], right: any[]): any[] {
  const mergedValues = [];
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (index < left.length && index < right.length) {
      mergedValues.push(mergeValues(left[index], right[index]));
    } else if (index < left.length) {
      mergedValues.push(left[index]);
    } else if (index < right.length) {
      mergedValues.push(right[index]);
    }
  }
  return mergedValues;
}

/**
 * 'setRequiredFields' function
 *
 * // {schema} schema - JSON Schema
 * // {object} formControlTemplate - Form Control Template object
 * // {boolean} - true if any fields have been set to required, false if not
 */
export function setRequiredFields(schema: any, formControlTemplate: any): boolean {
  let fieldsRequired = false;
  if (hasOwn(schema, 'required') && !isEmpty(schema.required)) {
    fieldsRequired = true;
    const requiredArray = isArray(schema.required) ? schema.required : [schema.required];
    forEach(requiredArray,
      key => JsonPointer.set(formControlTemplate,
        '/' + JsonPointer.escape(key) + '/validators/required', [])
    );
  }
  return fieldsRequired;

}

interface FormDataFormattingContext {
  formattedData: any;
  dataMap: Map<string, any>;
  recursiveRefMap: Map<string, string>;
  arrayMap: Map<string, number>;
  returnEmptyFields: boolean;
  fixErrors: boolean;
}

/**
 * 'formatFormData' function
 *
 * // {any} formData - Angular FormGroup data object
 * // {Map<string, any>} dataMap -
 * // {Map<string, string>} recursiveRefMap -
 * // {Map<string, number>} arrayMap -
 * // {boolean = false} fixErrors - if TRUE, tries to fix data
 * // {any} - formatted data object
 */
export function formatFormData(
  formData: any, dataMap: Map<string, any>,
  recursiveRefMap: Map<string, string>, arrayMap: Map<string, number>,
  returnEmptyFields = false, fixErrors = false
): any {
  if (formData === null || typeof formData !== 'object') { return formData; }
  const formattedData = isArray(formData) ? [] : {};
  const context: FormDataFormattingContext = {
    formattedData,
    dataMap,
    recursiveRefMap,
    arrayMap,
    returnEmptyFields,
    fixErrors,
  };
  JsonPointer.forEachDeep(formData, (value, dataPointer) =>
    formatFormDataEntry(value, dataPointer, context)
  );
  return formattedData;
}

function formatFormDataEntry(
  value: any,
  dataPointer: string,
  context: FormDataFormattingContext,
): void {
  if (addEmptyFormDataContainer(value, dataPointer, context)) return;
  const genericPointer = JsonPointer.has(context.dataMap, [dataPointer, 'schemaType'])
    ? dataPointer
    : removeRecursiveReferences(dataPointer, context.recursiveRefMap, context.arrayMap);
  const schemaOptions = JsonPointer.has(context.dataMap, [genericPointer, 'schemaType'])
    ? context.dataMap.get(genericPointer)
    : undefined;
  if (schemaOptions) {
    formatKnownFormDataValue(value, dataPointer, schemaOptions, context);
  } else {
    logMissingFormDataSchemaType(value, genericPointer, context);
  }
}

function addEmptyFormDataContainer(
  value: any,
  dataPointer: string,
  context: FormDataFormattingContext,
): boolean {
  if (!context.returnEmptyFields) return false;
  if (isArray(value)) {
    JsonPointer.set(context.formattedData, dataPointer, []);
    return true;
  }
  if (isObject(value) && !isDate(value)) {
    JsonPointer.set(context.formattedData, dataPointer, {});
    return true;
  }
  return false;
}

function formatKnownFormDataValue(
  value: any,
  dataPointer: string,
  schemaOptions: Map<string, any>,
  context: FormDataFormattingContext,
): void {
  const schemaType: SchemaPrimitiveType | SchemaPrimitiveType[] = schemaOptions.get('schemaType');
  if (schemaType === 'null') {
    JsonPointer.set(context.formattedData, dataPointer, null);
  } else if ((hasValue(value) || context.returnEmptyFields) &&
    inArray(schemaType, ['string', 'integer', 'number', 'boolean'])
  ) {
    const newValue = (context.fixErrors || (value === null && context.returnEmptyFields))
      ? toSchemaType(value, schemaType)
      : toJavaScriptType(value, schemaType);
    if (isDefined(newValue) || context.returnEmptyFields) {
      JsonPointer.set(context.formattedData, dataPointer, newValue);
    }
  }
  completeDateTimeFormData(value, dataPointer, schemaOptions, context);
}

function completeDateTimeFormData(
  value: any,
  dataPointer: string,
  schemaOptions: Map<string, any>,
  context: FormDataFormattingContext,
): void {
  if (schemaOptions.get('schemaFormat') !== 'date-time') return;
  if (/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s][0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?$/i.test(value)) {
    JsonPointer.set(context.formattedData, dataPointer, `${value}Z`);
  } else if (/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s][0-2]\d:[0-5]\d$/i.test(value)) {
    JsonPointer.set(context.formattedData, dataPointer, `${value}:00Z`);
  } else if (context.fixErrors && /^\d\d\d\d-[0-1]\d-[0-3]\d$/i.test(value)) {
    JsonPointer.set(context.formattedData, dataPointer, `${value}:00:00:00Z`);
  }
}

function logMissingFormDataSchemaType(
  value: any,
  genericPointer: string,
  context: FormDataFormattingContext,
): void {
  if (typeof value === 'object' && !isDate(value) &&
    !(value === null && context.returnEmptyFields)
  ) return;
  console.error('formatFormData error: ' +
    `Schema type not found for form value at ${genericPointer}`);
  console.error('dataMap', context.dataMap);
  console.error('recursiveRefMap', context.recursiveRefMap);
  console.error('genericPointer', genericPointer);
}

function getControlFromInvalidInput(formGroup: any, dataPointer: Pointer): any {
  if (!JsonPointer.isJsonPointer(dataPointer)) {
    // If dataPointer input is not a valid JSON pointer, check to
    // see if it is instead a valid object path, using dot notation.
    if (typeof dataPointer === 'string') {
      const formControl = formGroup.get(dataPointer);
      if (formControl) { return formControl; }
    }
    console.error(`getControl error: Invalid JSON Pointer: ${dataPointer}`);
  }
  if (!isObject(formGroup)) {
    console.error(`getControl error: Invalid formGroup: ${formGroup}`);
  }
  return null;
}

function getAngularFormControl(formGroup: any, dataPointerArray: string[]): any {
  // If formGroup input is a real formGroup (not a formGroup template)
  // try using formGroup.get() to return the control
  if (typeof formGroup.get === 'function' &&
    dataPointerArray.every(key => !key.includes('.'))
  ) {
    return formGroup.get(dataPointerArray.join('.'));
  }
  return null;
}

function getControlFromTemplate(
  formGroup: any, dataPointerArray: string[], dataPointer: Pointer
): any {
  // If formGroup input is a formGroup template,
  // or formGroup.get() failed to return the control,
  // search the formGroup object for dataPointer's control
  let subGroup = formGroup;
  for (const key of dataPointerArray) {
    if (hasOwn(subGroup, 'controls')) { subGroup = subGroup.controls; }
    if (isArray(subGroup) && (key === '-')) {
      subGroup = subGroup[subGroup.length - 1];
    } else if (hasOwn(subGroup, key)) {
      subGroup = subGroup[key];
    } else {
      console.error(`getControl error: Unable to find "${key}" item in FormGroup.`);
      console.error(dataPointer);
      console.error(formGroup);
      return;
    }
  }
  return subGroup;
}

/**
 * 'getControl' function
 *
 * Uses a JSON Pointer for a data object to retrieve a control from
 * an Angular formGroup or formGroup template. (Note: though a formGroup
 * template is much simpler, its basic structure is idential to a formGroup).
 *
 * If the optional third parameter 'returnGroup' is set to TRUE, the group
 * containing the control is returned, rather than the control itself.
 *
 * // {FormGroup} formGroup - Angular FormGroup to get value from
 * // {Pointer} dataPointer - JSON Pointer (string or array)
 * // {boolean = false} returnGroup - If true, return group containing control
 * // {group} - Located value (or null, if no control found)
 */
export function getControl(
  formGroup: any, dataPointer: Pointer, returnGroup = false
): any {
  if (!isObject(formGroup) || !JsonPointer.isJsonPointer(dataPointer)) {
    return getControlFromInvalidInput(formGroup, dataPointer);
  }
  let dataPointerArray = JsonPointer.parse(dataPointer);
  if (returnGroup) { dataPointerArray = dataPointerArray.slice(0, -1); }
  const formControl = getAngularFormControl(formGroup, dataPointerArray);
  if (formControl) { return formControl; }
  return getControlFromTemplate(formGroup, dataPointerArray, dataPointer);
}
