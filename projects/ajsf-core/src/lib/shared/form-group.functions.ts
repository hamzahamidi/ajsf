import { cloneDeep } from './clone-deep.function';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  ValidatorFn
} from '@angular/forms';
import { forEach, hasOwn } from './utility.functions';
import { getControlValidators, removeRecursiveReferences } from './json-schema.functions';
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
 * TODO: add buildFormGroupTemplateFromLayout function
 * buildFormGroupTemplateFromLayout: Builds a FormGroupTemplate from a form layout
 */

/**
 * 'buildFormGroupTemplate' function
 *
 * Builds a template for an Angular FormGroup from a JSON Schema.
 *
 * TODO: add support for pattern properties
 * https://spacetelescope.github.io/understanding-json-schema/reference/object.html
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
  // TODO: If nodeValue still not set, check layout for default value
  const controlType = getFormGroupTemplateControlType(schema);
  const shortDataPointer =
    removeRecursiveReferences(dataPointer, jsf.dataRecursiveRefMap, jsf.arrayMap);
  if (!jsf.dataMap.has(shortDataPointer)) {
    jsf.dataMap.set(shortDataPointer, new Map());
  }
  const nodeOptions = jsf.dataMap.get(shortDataPointer);
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
    validators: getControlValidators(schema)
  };
  return buildFormGroupTemplateForControl(context, schema, controlType);
}

function getFormGroupTemplateControlType(schema: any): string {
  const schemaType: string | string[] = JsonPointer.get(schema, '/type');
  if ((hasOwn(schema, 'properties') || hasOwn(schema, 'additionalProperties')) &&
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
  if (hasOwn(schema, 'ui:order') || hasOwn(schema, 'properties')) {
    const propertyKeys = getOrderedSchemaPropertyKeys(schema);
    propertyKeys
      .filter(key => hasOwn(schema.properties, key) || hasOwn(schema, 'additionalProperties'))
      .forEach(key => controls[key] = buildFormGroupTemplate(
        context.jsf,
        JsonPointer.get(context.nodeValue, [<string>key]),
        context.setValues,
        context.schemaPointer + (hasOwn(schema.properties, key) ?
          '/properties/' + JsonPointer.escape(key) : '/additionalProperties'
        ),
        context.dataPointer + '/' + JsonPointer.escape(key),
        context.templatePointer + '/controls/' + JsonPointer.escape(key)
      ));
    context.jsf.formOptions.fieldsRequired = setRequiredFields(schema, controls);
  }
  return { controlType: 'FormGroup', controls, validators: context.validators };
}

function getOrderedSchemaPropertyKeys(schema: any): any[] {
  const propertyKeys = schema['ui:order'] || Object.keys(schema.properties);
  if (propertyKeys.includes('*') && !hasOwn(schema.properties, '*')) {
    const unnamedKeys = Object.keys(schema.properties)
      .filter(key => !propertyKeys.includes(key));
    for (let i = propertyKeys.length - 1; i >= 0; i--) {
      if (propertyKeys[i] === '*') {
        propertyKeys.splice(i, 1, ...unnamedKeys);
      }
    }
  }
  return propertyKeys;
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
  const validatorFns: ValidatorFn[] = [];
  let validatorFn: ValidatorFn = null;
  if (hasOwn(template, 'validators')) {
    forEach(template.validators, (parameters, validator) => {
      if (typeof JsonValidators[validator] === 'function') {
        validatorFns.push(JsonValidators[validator].apply(null, parameters));
      }
    });
    if (validatorFns.length &&
      inArray(template.controlType, ['FormGroup', 'FormArray'])
    ) {
      validatorFn = validatorFns.length > 1 ?
        JsonValidators.compose(validatorFns) : validatorFns[0];
    }
  }
  if (hasOwn(template, 'controlType')) {
    switch (template.controlType) {
      case 'FormGroup': {
        const groupControls: { [key: string]: AbstractControl } = {};
        forEach(template.controls, (controls, key) => {
          const newControl: AbstractControl = buildFormGroup(controls);
          if (newControl) { groupControls[key] = newControl; }
        });
        return new UntypedFormGroup(groupControls, validatorFn);
      }
      case 'FormArray':
        return new UntypedFormArray(
          (template.controls || [])
            .map(controls => buildFormGroup(controls))
            .filter(Boolean),
          validatorFn
        );
      case 'FormControl':
        return new UntypedFormControl(template.value, validatorFns);
    }
  }
  return null;
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
    if (!isEmpty(currentValue)) {
      if (typeof currentValue === 'object' &&
        (isEmpty(mergedValues) || typeof mergedValues !== 'object')
      ) {
        if (isArray(currentValue)) {
          mergedValues = [...currentValue];
        } else if (isObject(currentValue)) {
          mergedValues = { ...currentValue };
        }
      } else if (typeof currentValue !== 'object') {
        mergedValues = currentValue;
      } else if (isObject(mergedValues) && isObject(currentValue)) {
        Object.assign(mergedValues, currentValue);
      } else if (isObject(mergedValues) && isArray(currentValue)) {
        const newValues = [];
        for (const value of currentValue) {
          newValues.push(mergeValues(mergedValues, value));
        }
        mergedValues = newValues;
      } else if (isArray(mergedValues) && isObject(currentValue)) {
        const newValues = [];
        for (const value of mergedValues) {
          newValues.push(mergeValues(value, currentValue));
        }
        mergedValues = newValues;
      } else if (isArray(mergedValues) && isArray(currentValue)) {
        const newValues = [];
        for (let i = 0; i < Math.max(mergedValues.length, currentValue.length); i++) {
          if (i < mergedValues.length && i < currentValue.length) {
            newValues.push(mergeValues(mergedValues[i], currentValue[i]));
          } else if (i < mergedValues.length) {
            newValues.push(mergedValues[i]);
          } else if (i < currentValue.length) {
            newValues.push(currentValue[i]);
          }
        }
        mergedValues = newValues;
      }
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
  JsonPointer.forEachDeep(formData, (value, dataPointer) => {

    // If returnEmptyFields === true,
    // add empty arrays and objects to all allowed keys
    if (returnEmptyFields && isArray(value)) {
      JsonPointer.set(formattedData, dataPointer, []);
    } else if (returnEmptyFields && isObject(value) && !isDate(value)) {
      JsonPointer.set(formattedData, dataPointer, {});
    } else {
      const genericPointer =
        JsonPointer.has(dataMap, [dataPointer, 'schemaType']) ? dataPointer :
          removeRecursiveReferences(dataPointer, recursiveRefMap, arrayMap);
      if (JsonPointer.has(dataMap, [genericPointer, 'schemaType'])) {
        const schemaType: SchemaPrimitiveType | SchemaPrimitiveType[] =
          dataMap.get(genericPointer).get('schemaType');
        if (schemaType === 'null') {
          JsonPointer.set(formattedData, dataPointer, null);
        } else if ((hasValue(value) || returnEmptyFields) &&
          inArray(schemaType, ['string', 'integer', 'number', 'boolean'])
        ) {
          const newValue = (fixErrors || (value === null && returnEmptyFields)) ?
            toSchemaType(value, schemaType) : toJavaScriptType(value, schemaType);
          if (isDefined(newValue) || returnEmptyFields) {
            JsonPointer.set(formattedData, dataPointer, newValue);
          }
        }

        // Finish incomplete 'date-time' entries
        if (dataMap.get(genericPointer).get('schemaFormat') === 'date-time') {
          // "2000-03-14T01:59:26.535" -> "2000-03-14T01:59:26.535Z" (add "Z")
          if (/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s][0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?$/i.test(value)) {
            JsonPointer.set(formattedData, dataPointer, `${value}Z`);
            // "2000-03-14T01:59" -> "2000-03-14T01:59:00Z" (add ":00Z")
          } else if (/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s][0-2]\d:[0-5]\d$/i.test(value)) {
            JsonPointer.set(formattedData, dataPointer, `${value}:00Z`);
            // "2000-03-14" -> "2000-03-14T00:00:00Z" (add "T00:00:00Z")
          } else if (fixErrors && /^\d\d\d\d-[0-1]\d-[0-3]\d$/i.test(value)) {
            JsonPointer.set(formattedData, dataPointer, `${value}:00:00:00Z`);
          }
        }
      } else if (typeof value !== 'object' || isDate(value) ||
        (value === null && returnEmptyFields)
      ) {
        console.error('formatFormData error: ' +
          `Schema type not found for form value at ${genericPointer}`);
        console.error('dataMap', dataMap);
        console.error('recursiveRefMap', recursiveRefMap);
        console.error('genericPointer', genericPointer);
      }
    }
  });
  return formattedData;
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
