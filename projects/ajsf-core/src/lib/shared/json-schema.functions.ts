import { cloneDeep } from './clone-deep.function';
import { forEach, hasOwn, mergeFilteredObject } from './utility.functions';
import {
  getType,
  hasValue,
  inArray,
  isArray,
  isDefined,
  isNumber,
  isObject,
  isString
  } from './validator.functions';
import { JsonPointer } from './jsonpointer.functions';
import { mergeSchemas } from './merge-schemas.function';


/**
 * JSON Schema function library:
 *
 * buildSchemaFromData:
 *
 * getFromSchema:
 *
 * removeRecursiveReferences:
 *
 * getInputType:
 *
 * checkInlineType:
 *
 * isInputRequired:
 *
 * updateInputOptions:
 *
 * getTitleMapFromOneOf:
 *
 * getControlValidators:
 *
 * resolveSchemaReferences:
 *
 * getSubSchema:
 *
 * combineAllOf:
 *
 * fixRequiredArrayProperties:
 */

function getLayoutOption(layoutItem: any, option: string): any {
  if (hasOwn(layoutItem, option)) { return layoutItem[option]; }
  return isObject(layoutItem.options) ? layoutItem.options[option] : undefined;
}

function getLayoutPath(layoutItem: any): string[] {
  const key = isString(layoutItem) ? layoutItem :
    isObject(layoutItem) ? layoutItem.dataPointer || layoutItem.key : null;
  if (!isString(key) || !key || key === '*') { return []; }
  const path = JsonPointer.isJsonPointer(key)
    ? JsonPointer.parse(key)
    : JsonPointer.parseObjectPath(key);
  return (path || []).map(segment => segment === '' ? '-' : segment);
}

function combineLayoutPath(parentPath: string[], itemPath: string[]): string[] {
  if (!parentPath.length || parentPath.every((segment, index) => itemPath[index] === segment)) {
    return itemPath;
  }
  return [...parentPath, ...itemPath];
}

function layoutEnumValues(layoutItem: any): any[] {
  const explicitEnum = getLayoutOption(layoutItem, 'enum');
  if (isArray(explicitEnum)) { return explicitEnum; }
  const titleMap = getLayoutOption(layoutItem, 'titleMap');
  if (isArray(titleMap)) {
    const values: any[] = [];
    const addValues = (items: any[]) => items.forEach(item => {
      if (isArray(item)) { values.push(item); }
      else if (isObject(item) && isArray(item.items)) { addValues(item.items); }
      else if (isObject(item) && hasOwn(item, 'value')) { values.push(item.value); }
      else if (!isObject(item)) { values.push(item); }
    });
    addValues(titleMap);
    return values;
  }
  if (isObject(titleMap)) { return Object.values(titleMap); }
  return [];
}

function getLayoutValueType(value: any): string {
  if (value === null) { return 'null'; }
  if (typeof value === 'boolean') { return 'boolean'; }
  if (typeof value === 'number') { return Number.isInteger(value) ? 'integer' : 'number'; }
  if (typeof value === 'string') { return 'string'; }
  if (isArray(value)) { return 'array'; }
  return 'object';
}

function layoutSchemaFromItem(layoutItem: any): any {
  if (!isObject(layoutItem)) { return { type: 'string' }; }
  if (isObject(layoutItem.schema)) { return cloneDeep(layoutItem.schema); }
  const widget = layoutItem.type || layoutItem.widget || '';
  const enumValues = layoutEnumValues(layoutItem);
  const types = [...new Set(enumValues.map(getLayoutValueType))];
  const inferredType = types.length === 1 ? types[0] : types.length ? types : 'string';
  let schema: any;
  if (widget === 'section' || widget === 'fieldset' || widget === 'flex' || widget === 'object') {
    schema = { type: 'object', properties: {} };
  } else if (widget === 'array' || widget === 'tabarray') {
    schema = { type: 'array', items: { type: 'object', properties: {} } };
  } else if (widget === 'checkboxes' || widget === 'checkboxes-inline' || widget === 'checkboxbuttons') {
    schema = { type: 'array', items: { type: inferredType, enum: enumValues } };
  } else if (widget === 'checkbox') {
    schema = { type: 'boolean' };
  } else if (widget === 'number' || widget === 'range') {
    schema = { type: 'number' };
  } else if (widget === 'integer' || widget === 'updown') {
    schema = { type: 'integer' };
  } else if (widget === 'select' || widget === 'radios' || widget === 'radio' || widget === 'one-of') {
    schema = { type: inferredType };
  } else if (['email', 'url', 'date', 'datetime-local', 'date-time', 'alt-date', 'alt-datetime'].includes(widget)) {
    schema = {
      type: 'string',
      format: {
        email: 'email', url: 'uri', date: 'date', 'datetime-local': 'date-time',
        'date-time': 'date-time', 'alt-date': 'date', 'alt-datetime': 'date-time'
      }[widget]
    };
  } else if (['submit', 'reset', 'button', 'image', 'message', 'help', 'html', 'none', 'root', 'tabs', 'tab'].includes(widget)) {
    return null;
  } else {
    schema = { type: 'string' };
  }
  if (enumValues.length && schema.type !== 'array') { schema.enum = enumValues; }
  const metadata = ['title', 'description', 'default', 'minimum', 'maximum', 'exclusiveMinimum',
    'exclusiveMaximum', 'multipleOf', 'minLength', 'maxLength', 'pattern', 'minItems', 'maxItems',
    'uniqueItems', 'minProperties', 'maxProperties', 'format'];
  metadata.forEach(key => {
    const value = getLayoutOption(layoutItem, key);
    if (isDefined(value) && !hasOwn(schema, key)) { schema[key] = cloneDeep(value); }
  });
  return schema;
}

function ensureLayoutSchemaNode(rootSchema: any, path: string[]): { node: any; parent: any; key: string } {
  let node = rootSchema;
  let parent: any = null;
  let key = '';
  path.forEach(segment => {
    parent = node;
    key = segment;
    if (segment === '-') {
      node.type = 'array';
      if (!isObject(node.items)) { node.items = { type: 'object', properties: {} }; }
      node = node.items;
    } else if (/^\d+$/.test(segment)) {
      node.type = 'array';
      if (!isArray(node.items)) { node.items = []; }
      while (node.items.length <= Number(segment)) {
        node.items.push({ type: 'object', properties: {} });
      }
      node = node.items[Number(segment)];
    } else {
      if (node.type === 'array') {
        if (!isObject(node.items)) { node.items = { type: 'object', properties: {} }; }
        parent = node;
        key = segment;
        node = node.items;
      }
      node.type = 'object';
      if (!isObject(node.properties)) { node.properties = {}; }
      if (!isObject(node.properties[segment])) {
        node.properties[segment] = {};
      }
      parent = node;
      key = segment;
      node = node.properties[segment];
    }
  });
  return { node, parent, key };
}

function mergeLayoutSchema(target: any, schema: any): void {
  Object.keys(schema).forEach(key => {
    if (key === 'properties' && isObject(schema.properties)) {
      if (!isObject(target.properties)) { target.properties = {}; }
      Object.keys(schema.properties).forEach(property => {
        if (isObject(target.properties[property]) && isObject(schema.properties[property])) {
          mergeLayoutSchema(target.properties[property], schema.properties[property]);
        } else {
          target.properties[property] = cloneDeep(schema.properties[property]);
        }
      });
    } else if (key === 'items' && isObject(target.items) && !isArray(target.items) &&
      isObject(schema.items) && !isArray(schema.items)
    ) {
      mergeLayoutSchema(target.items, schema.items);
    } else if (key === 'items' && isArray(target.items) && isArray(schema.items)) {
      schema.items.forEach((item, index) => {
        if (isObject(target.items[index]) && isObject(item)) {
          mergeLayoutSchema(target.items[index], item);
        } else {
          target.items[index] = cloneDeep(item);
        }
      });
    } else if (key === 'required' && isArray(schema.required)) {
      target.required = [...new Set([...(isArray(target.required) ? target.required : []), ...schema.required])];
    } else if (key !== 'required') {
      target[key] = cloneDeep(schema[key]);
    }
  });
}

function addLayoutRequiredPath(schema: any, path: string[]): void {
  let node = schema;
  path.forEach(segment => {
    if (segment === '-') { node = node.items; return; }
    if (/^\d+$/.test(segment)) { node = node.items[Number(segment)]; return; }
    node.required = node.required || [];
    if (!node.required.includes(segment)) { node.required.push(segment); }
    node = node.properties[segment];
  });
}

/** Builds a simple JSON Schema from a complete layout when no schema is supplied. */
export function buildSchemaFromLayout(layout: any[]) {
  if (!isArray(layout)) { return; }
  const schema: any = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {}
  };
  const walk = (items: any[], parentPath: string[] = [], requiredByParent = false) => {
    items.forEach(item => {
      const itemPath = getLayoutPath(item);
      const path = itemPath.length ? combineLayoutPath(parentPath, itemPath) : [];
      const itemSchema = layoutSchemaFromItem(item);
      const required = requiredByParent || getLayoutOption(item, 'required') === true;
      if (path.length && itemSchema) {
        const target = ensureLayoutSchemaNode(schema, path);
        mergeLayoutSchema(target.node, itemSchema);
        if (required) { addLayoutRequiredPath(schema, path); }
      }
      if (isObject(item) && isArray(item.items)) {
        const widget = item.type || item.widget;
        const childPath = path.length
          ? widget === 'array' || widget === 'tabarray' ? [...path, '-'] : path
          : parentPath;
        walk(item.items, childPath, required);
      }
    });
  };
  walk(layout);
  return schema;
}

/**
 * 'buildSchemaFromData' function
 *
 * Build a JSON Schema from a data object
 *
 * //   data - The data object
 * //  { boolean = false } requireAllFields - Require all fields?
 * //  { boolean = true } isRoot - is root
 * //  - The new JSON Schema
 */
export function buildSchemaFromData(
  data, requireAllFields = false, isRoot = true
) {
  const newSchema: any = {};
  const getFieldType = (value: any): string => {
    const fieldType = getType(value, 'strict');
    return { integer: 'number', null: 'string' }[fieldType] || fieldType;
  };
  const buildSubSchema = (value) =>
    buildSchemaFromData(value, requireAllFields, false);
  if (isRoot) { newSchema.$schema = 'http://json-schema.org/draft-07/schema#'; }
  newSchema.type = getFieldType(data);
  if (newSchema.type === 'object') {
    newSchema.properties = {};
    if (requireAllFields) { newSchema.required = []; }
    for (const key of Object.keys(data)) {
      newSchema.properties[key] = buildSubSchema(data[key]);
      if (requireAllFields) { newSchema.required.push(key); }
    }
  } else if (newSchema.type === 'array') {
    newSchema.items = data.map(buildSubSchema);
    // If all items are the same type, use an object for items instead of an array
    if ((new Set(data.map(getFieldType))).size === 1) {
      newSchema.items = newSchema.items.reduce((a, b) => ({ ...a, ...b }), {});
    }
    if (requireAllFields) { newSchema.minItems = 1; }
  }
  return newSchema;
}

function hasSchemaShape(schema, type) {
  if (type === 'object') return hasOwn(schema, 'properties');
  if (type === 'array') return hasOwn(schema, 'items') || hasOwn(schema, 'additionalItems');
  return true;
}

function getUnionSchemaType(schema, schemaTypes) {
  for (const type of ['object', 'array', 'string', 'number', 'integer', 'boolean']) {
    if (inArray(type, schemaTypes) && hasSchemaShape(schema, type)) return type;
  }
  return 'unknown';
}

/**
 * 'getFromSchema' function
 *
 * Uses a JSON Pointer for a value within a data object to retrieve
 * the schema for that value within schema for the data object.
 *
 * The optional third parameter can also be set to return something else:
 * 'schema' (default): the schema for the value indicated by the data pointer
 * 'parentSchema': the schema for the value's parent object or array
 * 'schemaPointer': a pointer to the value's schema within the object's schema
 * 'parentSchemaPointer': a pointer to the schema for the value's parent object or array
 *
 * //   schema - The schema to get the sub-schema from
 * //  { Pointer } dataPointer - JSON Pointer (string or array)
 * //  { string = 'schema' } returnType - what to return?
 * //  - The located sub-schema
 */
function findArraySchemaChild(subSchema, key, schemaPointer) {
  let subSchemaFound = false;
  if (hasOwn(subSchema, 'items')) {
    if (isObject(subSchema.items)) {
      subSchemaFound = true;
      subSchema = subSchema.items;
      schemaPointer.push('items');
    } else if (isArray(subSchema.items) && !Number.isNaN(Number(key)) &&
      subSchema.items.length >= +key
    ) {
      subSchemaFound = true;
      subSchema = subSchema.items[+key];
      schemaPointer.push('items', key);
    }
  }
  if (!subSchemaFound && isObject(subSchema.additionalItems)) {
    subSchemaFound = true;
    subSchema = subSchema.additionalItems;
    schemaPointer.push('additionalItems');
  } else if (subSchema.additionalItems !== false) {
    subSchemaFound = true;
    subSchema = {};
    schemaPointer.push('additionalItems');
  }
  return { subSchema, subSchemaFound };
}

function findObjectSchemaChild(subSchema, key, schemaPointer) {
  let subSchemaFound = false;
  if (isObject(subSchema.properties) && hasOwn(subSchema.properties, key)) {
    subSchemaFound = true;
    subSchema = subSchema.properties[key];
    schemaPointer.push('properties', key);
  } else if (isObject(subSchema.additionalProperties)) {
    subSchemaFound = true;
    subSchema = subSchema.additionalProperties;
    schemaPointer.push('additionalProperties');
  } else if (subSchema.additionalProperties !== false) {
    subSchemaFound = true;
    subSchema = {};
    schemaPointer.push('additionalProperties');
  }
  return { subSchema, subSchemaFound };
}

export function getFromSchema(schema, dataPointer, returnType = 'schema') {
  const dataPointerArray: any[] = JsonPointer.parse(dataPointer);
  if (dataPointerArray === null) {
    console.error(`getFromSchema error: Invalid JSON Pointer: ${dataPointer}`);
    return null;
  }
  let subSchema = schema;
  const schemaPointer = [];
  const length = dataPointerArray.length;
  if (returnType.startsWith('parent')) { dataPointerArray.length--; }
  for (let i = 0; i < length; ++i) {
    const key = dataPointerArray[i];
    let subSchemaFound = false;
    if (typeof subSchema !== 'object') {
      console.error(`getFromSchema error: Unable to find "${key}" key in schema.`);
      console.error(schema);
      console.error(dataPointer);
      return null;
    }
    if (subSchema.type === 'array' && (!Number.isNaN(Number(key)) || key === '-')) {
      const result = findArraySchemaChild(subSchema, key, schemaPointer);
      subSchema = result.subSchema;
      subSchemaFound = result.subSchemaFound;
    } else if (subSchema.type === 'object') {
      const result = findObjectSchemaChild(subSchema, key, schemaPointer);
      subSchema = result.subSchema;
      subSchemaFound = result.subSchemaFound;
    }
    if (!subSchemaFound) {
      console.error(`getFromSchema error: Unable to find "${key}" item in schema.`);
      console.error(schema);
      console.error(dataPointer);
      return;
    }
  }
  return returnType.endsWith('Pointer') ? schemaPointer : subSchema;
}

/**
 * 'removeRecursiveReferences' function
 *
 * Checks a JSON Pointer against a map of recursive references and returns
 * a JSON Pointer to the shallowest equivalent location in the same object.
 *
 * Using this functions enables an object to be constructed with unlimited
 * recursion, while maintaing a fixed set of metadata, such as field data types.
 * The object can grow as large as it wants, and deeply recursed nodes can
 * just refer to the metadata for their shallow equivalents, instead of having
 * to add additional redundant metadata for each recursively added node.
 *
 * Example:
 *
 * pointer:         '/stuff/and/more/and/more/and/more/and/more/stuff'
 * recursiveRefMap: [['/stuff/and/more/and/more', '/stuff/and/more/']]
 * returned:        '/stuff/and/more/stuff'
 *
 * //  { Pointer } pointer -
 * //  { Map<string, string> } recursiveRefMap -
 * //  { Map<string, number> = new Map() } arrayMap - optional
 * // { string } -
 */
export function removeRecursiveReferences(
  pointer, recursiveRefMap, arrayMap = new Map()
) {
  if (!pointer) { return ''; }
  let genericPointer =
    JsonPointer.toGenericPointer(JsonPointer.compile(pointer), arrayMap);
  if (!genericPointer.includes('/')) { return genericPointer; }
  let possibleReferences = true;
  while (possibleReferences) {
    possibleReferences = false;
    recursiveRefMap.forEach((toPointer, fromPointer) => {
      if (JsonPointer.isSubPointer(toPointer, fromPointer)) {
        while (JsonPointer.isSubPointer(fromPointer, genericPointer, true)) {
          genericPointer = JsonPointer.toGenericPointer(
            toPointer + genericPointer.slice(fromPointer.length), arrayMap
          );
          possibleReferences = true;
        }
      }
    });
  }
  return genericPointer;
}

/**
 * 'getInputType' function
 *
 * //   schema
 * //  { any = null } layoutNode
 * // { string }
 */
function getObjectInputType(schema) {
  if (hasOwn(schema, 'properties') || hasOwn(schema, 'additionalProperties')) {
    return 'section';
  }
  // TODO: Figure out how to handle additionalProperties
  if (hasOwn(schema, '$ref')) { return '$ref'; }
}

function getArrayInputType(schema, layoutNode) {
  const itemsObject = JsonPointer.getFirst([
    [schema, '/items'],
    [schema, '/additionalItems']
  ]) || {};
  return hasOwn(itemsObject, 'enum') && schema.maxItems !== 1 ?
    checkInlineType('checkboxes', schema, layoutNode) : 'array';
}

function hasSelectableInput(schema, layoutNode) {
  return JsonPointer.has(layoutNode, '/options/titleMap') ||
    hasOwn(schema, 'enum') || getTitleMapFromOneOf(schema, null, true);
}

function getNumericInputType(schema, schemaType) {
  return (schemaType === 'integer' || hasOwn(schema, 'multipleOf')) &&
    hasOwn(schema, 'maximum') && hasOwn(schema, 'minimum') ? 'range' : schemaType;
}

function getStringInputType(schema) {
  return {
    'color': 'color',
    'date': 'date',
    'date-time': 'datetime-local',
    'email': 'email',
    'uri': 'url',
  }[schema.format] || 'text';
}

function getTypedInputType(schema, layoutNode, schemaType) {
  if (schemaType === 'boolean') { return 'checkbox'; }
  if (schemaType === 'object') {
    const inputType = getObjectInputType(schema);
    if (inputType) { return inputType; }
  }
  if (schemaType === 'array') { return getArrayInputType(schema, layoutNode); }
  if (schemaType === 'null') { return 'none'; }
  if (hasSelectableInput(schema, layoutNode)) { return 'select'; }
  if (schemaType === 'number' || schemaType === 'integer') {
    return getNumericInputType(schema, schemaType);
  }
  if (schemaType === 'string') { return getStringInputType(schema); }
}

export function getInputType(schema, layoutNode: any = null) {
  // x-schema-form = Angular Schema Form compatibility
  // widget & component = React Jsonschema Form compatibility
  const controlType = JsonPointer.getFirst([
    [schema, '/x-schema-form/type'],
    [schema, '/x-schema-form/widget/component'],
    [schema, '/x-schema-form/widget'],
    [schema, '/widget/component'],
    [schema, '/widget']
  ]);
  if (isString(controlType)) { return checkInlineType(controlType, schema, layoutNode); }
  let schemaType = schema.type;
  if (schemaType) {
    if (isArray(schemaType)) { // If multiple types listed, use most inclusive type
      schemaType = getUnionSchemaType(schema, schemaType);
    }
    const inputType = getTypedInputType(schema, layoutNode, schemaType);
    if (inputType) { return inputType; }
  }
  if (hasOwn(schema, '$ref')) { return '$ref'; }
  if (isArray(schema.oneOf) || isArray(schema.anyOf)) { return 'one-of'; }
  console.error(`getInputType error: Unable to determine input type for ${schemaType}`);
  console.error('schema', schema);
  if (layoutNode) { console.error('layoutNode', layoutNode); }
  return 'none';
}

/**
 * 'checkInlineType' function
 *
 * Checks layout and schema nodes for 'inline: true', and converts
 * 'radios' or 'checkboxes' to 'radios-inline' or 'checkboxes-inline'
 *
 * //  { string } controlType -
 * //   schema -
 * //  { any = null } layoutNode -
 * // { string }
 */
export function checkInlineType(controlType, schema, layoutNode: any = null) {
  if (!isString(controlType) || (
    !controlType.startsWith('checkbox') && !controlType.startsWith('radio')
  )) {
    return controlType;
  }
  if (
    JsonPointer.getFirst([
      [layoutNode, '/inline'],
      [layoutNode, '/options/inline'],
      [schema, '/inline'],
      [schema, '/x-schema-form/inline'],
      [schema, '/x-schema-form/options/inline'],
      [schema, '/x-schema-form/widget/inline'],
      [schema, '/x-schema-form/widget/component/inline'],
      [schema, '/x-schema-form/widget/component/options/inline'],
      [schema, '/widget/inline'],
      [schema, '/widget/component/inline'],
      [schema, '/widget/component/options/inline'],
    ]) === true
  ) {
    return controlType.startsWith('radio') ?
      'radios-inline' : 'checkboxes-inline';
  } else {
    return controlType;
  }
}

/**
 * 'isInputRequired' function
 *
 * Checks a JSON Schema to see if an item is required
 *
 * //   schema - the schema to check
 * //  { string } schemaPointer - the pointer to the item to check
 * // { boolean } - true if the item is required, false if not
 */
export function isInputRequired(schema, schemaPointer) {
  if (!isObject(schema)) {
    console.error('isInputRequired error: Input schema must be an object.');
    return false;
  }
  const listPointerArray = JsonPointer.parse(schemaPointer);
  if (isArray(listPointerArray)) {
    if (!listPointerArray.length) { return schema.required === true; }
    const keyName = listPointerArray.pop();
    const nextToLastKey = listPointerArray.at(-1);
    if (['properties', 'additionalProperties', 'patternProperties', 'items', 'additionalItems']
      .includes(nextToLastKey)
    ) {
      listPointerArray.pop();
    }
    const parentSchema = JsonPointer.get(schema, listPointerArray) || {};
    if (isArray(parentSchema.required)) {
      return parentSchema.required.includes(keyName);
    }
    if (parentSchema.type === 'array') {
      return hasOwn(parentSchema, 'minItems') &&
        isNumber(keyName) &&
        +parentSchema.minItems > +keyName;
    }
  }
  return false;
}

/**
 * 'updateInputOptions' function
 *
 * //   layoutNode
 * //   schema
 * //   jsf
 * // { void }
 */
function collectInputOptions(layoutNode, schema, jsf) {
  const newOptions: any = {};
  const fixUiKeys = key => key.slice(0, 3).toLowerCase() === 'ui:' ? key.slice(3) : key;
  mergeFilteredObject(newOptions, jsf.formOptions.defautWidgetOptions, [], fixUiKeys);

  const optionSources = [
    [JsonPointer.get(schema, '/ui:widget/options'), []],
    [ JsonPointer.get(schema, '/ui:widget'), [] ],
    [ schema, [
      'additionalProperties', 'additionalItems', 'properties', 'items',
      'required', 'type', 'x-schema-form', '$ref'
    ] ],
    [ JsonPointer.get(schema, '/x-schema-form/options'), [] ],
    [ JsonPointer.get(schema, '/x-schema-form'), ['items', 'options'] ],
    [ layoutNode, [
      '_id', '$ref', 'arrayItem', 'arrayItemType', 'dataPointer', 'dataType',
      'items', 'key', 'name', 'options', 'recursiveReference', 'type', 'widget'
    ] ],
    [ layoutNode.options, [] ],
  ];
  optionSources.forEach(([object, excludeKeys]) =>
    mergeFilteredObject(newOptions, object, excludeKeys, fixUiKeys)
  );
  return newOptions;
}

function applySchemaItemOptions(newOptions, schema) {
  if (JsonPointer.has(schema, '/items/titleMap')) {
    newOptions.titleMap = schema.items.titleMap;
    return;
  }
  if (JsonPointer.has(schema, '/items/enum')) {
    newOptions.enum = schema.items.enum;
    if (!hasOwn(newOptions, 'enumNames') && JsonPointer.has(schema, '/items/enumNames')) {
      newOptions.enumNames = schema.items.enumNames;
    }
    return;
  }
  if (!JsonPointer.has(schema, '/items/oneOf')) { return; }
  const titleMap = getTitleMapFromOneOf(schema.items, newOptions.flatList);
  if (titleMap) { newOptions.titleMap = titleMap; }
}

function updateTitleMapOptions(newOptions, schema) {
  if (hasOwn(newOptions, 'titleMap')) { return; }
  const titleMap = getTitleMapFromOneOf(schema, newOptions.flatList);
  if (titleMap) { newOptions.titleMap = titleMap; }
  if (
    !hasOwn(newOptions, 'titleMap') &&
    !hasOwn(newOptions, 'enum') &&
    hasOwn(schema, 'items')
  ) {
    applySchemaItemOptions(newOptions, schema);
  }
}

function updateTypeaheadOptions(newOptions) {
  if (JsonPointer.has(newOptions, '/autocomplete/source')) {
    newOptions.typeahead = newOptions.autocomplete;
  } else if (JsonPointer.has(newOptions, '/tagsinput/source')) {
    newOptions.typeahead = newOptions.tagsinput;
  } else if (JsonPointer.has(newOptions, '/tagsinput/typeahead/source')) {
    newOptions.typeahead = newOptions.tagsinput.typeahead;
  }
}

export function updateInputOptions(layoutNode, schema, jsf) {
  if (!isObject(layoutNode) || !isObject(layoutNode.options)) { return; }
  const newOptions = collectInputOptions(layoutNode, schema, jsf);

  updateTitleMapOptions(newOptions, schema);

  // If schema type is integer, enforce by setting multipleOf = 1
  if (schema.type === 'integer' && !hasValue(newOptions.multipleOf)) {
    newOptions.multipleOf = 1;
  }

  updateTypeaheadOptions(newOptions);
  layoutNode.options = newOptions;
}

/**
 * 'getTitleMapFromOneOf' function
 *
 * //  { schema } schema
 * //  { boolean = null } flatList
 * //  { boolean = false } validateOnly
 * // { validators }
 */
export function getTitleMapFromOneOf(
  schema: any = {}, flatList: boolean = null, validateOnly = false
) {
  const oneOf = schema.oneOf || schema.anyOf || null;
  if (!isArray(oneOf) || !oneOf.every(item => item.title)) {
    return validateOnly ? false : null;
  }
  const titleMapType = getOneOfTitleMapType(oneOf);
  if (validateOnly) { return titleMapType !== null; }
  if (titleMapType === null) { return null; }
  const titleMap = titleMapType === 'enum' ?
    oneOf.map(item => ({ name: item.title, value: item.enum[0] })) :
    oneOf.map(item => ({ name: item.title, value: item.const }));
  return titleMap ? groupOneOfTitleMap(titleMap, flatList) : null;
}

function getOneOfTitleMapType(oneOf) {
  if (oneOf.every(item => isArray(item.enum) && item.enum.length === 1)) {
    return 'enum';
  }
  if (oneOf.every(item => item.const)) {
    return 'const';
  }
  return null;
}

function groupOneOfTitleMap(titleMap, flatList) {
  // if flatList !== false and some items have colons, make grouped map
  if (flatList !== false && titleMap
    .filter(title => (title?.name || '').indexOf(': ')).length > 1
  ) {
    // Split name on first colon to create grouped map (name -> group: name)
    const groupedTitleMap = titleMap.map(title => {
      const [group, name] = title.name.split(/: (.+)/);
      return group && name ? { ...title, group, name } : title;
    });

    // If flatList === true or at least one group has multiple items, use grouped map
    if (flatList === true || groupedTitleMap.some((title, index) => index &&
      hasOwn(title, 'group') && title.group === groupedTitleMap[index - 1].group
    )) {
      return groupedTitleMap;
    }
  }
  return titleMap;
}

/**
 * 'getControlValidators' function
 *
 * //  schema
 * // { validators }
 */
export function getControlValidators(schema, rootSchema = schema, schemaPointer = '', ajv = null) {
  if (!isObject(schema)) { return null; }
  const validators: any = { };
  // A nullable type is an array, for example ['string', 'null'], which matched no
  // case at all and so produced no validators. Each named type contributes its own.
  const schemaTypes: any[] = [];
  if (hasOwn(schema, 'type')) {
    if (isArray(schema.type)) { schemaTypes.push(...schema.type); }
    else { schemaTypes.push(schema.type); }
  }
  for (const schemaType of schemaTypes) {
    switch (schemaType) {
      case 'string':
        forEach(['pattern', 'format', 'minLength', 'maxLength'], (prop) => {
          if (hasOwn(schema, prop)) { validators[prop] = [schema[prop]]; }
        });
      break;
      case 'number': case 'integer':
        forEach(['Minimum', 'Maximum'], (ucLimit) => {
          const eLimit = 'exclusive' + ucLimit;
          const limit = ucLimit.toLowerCase();
          // The exclusive flag used to be passed as a second argument, which
          // JsonValidators.minimum does not take, so it was dropped and the bound
          // was enforced inclusively. Emit the exclusive validator by name instead.
          if (hasOwn(schema, limit)) {
            if (hasOwn(schema, eLimit) && schema[eLimit] === true) {
              validators[eLimit] = [schema[limit]];
            } else {
              validators[limit] = [schema[limit]];
            }
          }
          // Draft 6 onward writes the bound itself into exclusiveMinimum, and with
          // no 'minimum' alongside it there was no validator at all.
          if (isNumber(schema[eLimit], 'strict')) {
            validators[eLimit] = [schema[eLimit]];
          }
        });
        forEach(['multipleOf', 'type'], (prop) => {
          if (hasOwn(schema, prop)) { validators[prop] = [schema[prop]]; }
        });
      break;
      case 'object':
        forEach(['minProperties', 'maxProperties', 'dependencies'], (prop) => {
          if (hasOwn(schema, prop)) { validators[prop] = [schema[prop]]; }
        });
      break;
      case 'array':
        forEach(['minItems', 'maxItems', 'uniqueItems'], (prop) => {
          if (hasOwn(schema, prop)) { validators[prop] = [schema[prop]]; }
        });
        if (hasOwn(schema, 'contains')) {
          validators.contains = [schema.contains, rootSchema, schemaPointer, ajv];
        }
      break;
      }
  }
  if (hasOwn(schema, 'enum')) { validators.enum = [schema.enum]; }
  return validators;
}
/**
 * Draft 6 treats minimum and exclusiveMinimum as independent bounds that both
 * apply, so the strongest lower bound is the larger of the two and the
 * strongest upper bound the smaller. A non-numeric bound, such as a draft 4
 * boolean, is ignored.
 */
export function effectiveMinimum(minimum, exclusiveMinimum) {
  const bounds = [minimum, exclusiveMinimum].filter(bound => typeof bound === 'number');
  return bounds.length ? Math.max(...bounds) : undefined;
}

export function effectiveMaximum(maximum, exclusiveMaximum) {
  const bounds = [maximum, exclusiveMaximum].filter(bound => typeof bound === 'number');
  return bounds.length ? Math.min(...bounds) : undefined;
}

function updateCompiledSchemaReference(subSchema, subSchemaPointer, context) {
  let refPointer = JsonPointer.compile(subSchema['$ref']);
  if (!JsonPointer.isSubPointer(refPointer, subSchemaPointer, true)) {
    refPointer = removeRecursiveReferences(subSchemaPointer, context.recursiveRefMap);
    JsonPointer.set(context.compiledSchema, subSchemaPointer, { $ref: `#${refPointer}` });
  }
  if (!hasOwn(context.schemaRefLibrary, 'refPointer')) {
    context.schemaRefLibrary[refPointer] = !refPointer.length ? context.compiledSchema :
      getSubSchema(
        context.compiledSchema, refPointer, context.schemaRefLibrary, context.recursiveRefMap
      );
  }
  if (!context.schemaRecursiveRefMap.has(subSchemaPointer)) {
    context.schemaRecursiveRefMap.set(subSchemaPointer, refPointer);
  }
  const fromDataRef = JsonPointer.toDataPointer(subSchemaPointer, context.compiledSchema);
  if (!context.dataRecursiveRefMap.has(fromDataRef)) {
    const toDataRef = JsonPointer.toDataPointer(refPointer, context.compiledSchema);
    context.dataRecursiveRefMap.set(fromDataRef, toDataRef);
  }
}

function updateCompiledSchemaArray(subSchema, subSchemaPointer, context) {
  if (subSchema.type !== 'array' ||
    (!hasOwn(subSchema, 'items') && !hasOwn(subSchema, 'additionalItems'))
  ) {
    return;
  }
  const dataPointer = JsonPointer.toDataPointer(subSchemaPointer, context.compiledSchema);
  if (context.arrayMap.has(dataPointer)) { return; }
  const tupleItems = isArray(subSchema.items) ? subSchema.items.length : 0;
  context.arrayMap.set(dataPointer, tupleItems);
}

function updateCompiledSchemaNode(subSchema, subSchemaPointer, context) {
  if (isString(subSchema['$ref'])) {
    updateCompiledSchemaReference(subSchema, subSchemaPointer, context);
  }
  updateCompiledSchemaArray(subSchema, subSchemaPointer, context);
}

/**
 * 'resolveSchemaReferences' function
 *
 * Find all $ref links in schema and save links and referenced schemas in
 * schemaRefLibrary, schemaRecursiveRefMap, and dataRecursiveRefMap
 *
 * //  schema
 * //  schemaRefLibrary
 * // { Map<string, string> } schemaRecursiveRefMap
 * // { Map<string, string> } dataRecursiveRefMap
 * // { Map<string, number> } arrayMap
 * //
 */
export function resolveSchemaReferences(
  schema, schemaRefLibrary, schemaRecursiveRefMap, dataRecursiveRefMap, arrayMap
) {
  if (!isObject(schema)) {
    console.error('resolveSchemaReferences error: schema must be an object.');
    return;
  }
  const refLinks = new Set<string>();
  const refMapSet = new Set<string>();
  const refMap = new Map<string, string>();
  const recursiveRefMap = new Map<string, string>();
  const refLibrary: any = {};

  // Search schema for all $ref links, and build full refLibrary
  JsonPointer.forEachDeep(schema, (subSchema, subSchemaPointer) => {
    if (hasOwn(subSchema, '$ref') && isString(subSchema['$ref'])) {
      const refPointer = JsonPointer.compile(subSchema['$ref']);
      refLinks.add(refPointer);
      refMapSet.add(subSchemaPointer + '~~' + refPointer);
      refMap.set(subSchemaPointer, refPointer);
    }
  });
  refLinks.forEach(ref => refLibrary[ref] = getSubSchema(schema, ref));

  // Follow all ref links and save in refMapSet,
  // to find any multi-link recursive refernces
  let checkRefLinks = true;
  while (checkRefLinks) {
    checkRefLinks = false;
    Array.from(refMap).forEach(([fromRef1, toRef1]) => Array.from(refMap)
      .filter(([fromRef2, toRef2]) =>
        JsonPointer.isSubPointer(toRef1, fromRef2, true) &&
        !JsonPointer.isSubPointer(toRef2, toRef1, true) &&
        !refMapSet.has(fromRef1 + fromRef2.slice(toRef1.length) + '~~' + toRef2)
      )
      .forEach(([fromRef2, toRef2]) => {
        refMapSet.add(fromRef1 + fromRef2.slice(toRef1.length) + '~~' + toRef2);
        checkRefLinks = true;
      })
    );
  }

  // Build full recursiveRefMap
  // First pass - save all internally recursive refs from refMapSet
  Array.from(refMapSet)
    .map(refLink => refLink.split('~~'))
    .filter(([fromRef, toRef]) => JsonPointer.isSubPointer(toRef, fromRef))
    .forEach(([fromRef, toRef]) => recursiveRefMap.set(fromRef, toRef));
  // Second pass - create recursive versions of any other refs that link to recursive refs
  Array.from(refMap)
    .filter(([fromRef1, toRef1]) => Array.from(recursiveRefMap.keys())
      .every(fromRef2 => !JsonPointer.isSubPointer(fromRef1, fromRef2, true))
    )
    .forEach(([fromRef1, toRef1]) => Array.from(recursiveRefMap)
      .filter(([fromRef2, toRef2]) =>
        !recursiveRefMap.has(fromRef1 + fromRef2.slice(toRef1.length)) &&
        JsonPointer.isSubPointer(toRef1, fromRef2, true) &&
        !JsonPointer.isSubPointer(toRef1, fromRef1, true)
      )
      .forEach(([fromRef2, toRef2]) => recursiveRefMap.set(
        fromRef1 + fromRef2.slice(toRef1.length),
        fromRef1 + toRef2.slice(toRef1.length)
      ))
    );

  // Create compiled schema by replacing all non-recursive $ref links with
  // thieir linked schemas and, where possible, combining schemas in allOf arrays.
  let compiledSchema = { ...schema };
  delete compiledSchema.definitions;
  compiledSchema =
    getSubSchema(compiledSchema, '', refLibrary, recursiveRefMap);

  // Make sure all remaining schema $refs are recursive, and build final
  // schemaRefLibrary, schemaRecursiveRefMap, dataRecursiveRefMap, & arrayMap
  const context = {
    compiledSchema, recursiveRefMap, schemaRefLibrary, schemaRecursiveRefMap,
    dataRecursiveRefMap, arrayMap
  };
  JsonPointer.forEachDeep(
    compiledSchema,
    (subSchema, subSchemaPointer) => updateCompiledSchemaNode(subSchema, subSchemaPointer, context),
    true
  );
  return compiledSchema;
}

/**
 * 'getSubSchema' function
 *
 * //   schema
 * //  { Pointer } pointer
 * //  { object } schemaRefLibrary
 * //  { Map<string, string> } schemaRecursiveRefMap
 * //  { string[] = [] } usedPointers
 * //
 */
const NO_SUBSCHEMA_REPLACEMENT = Symbol('no sub-schema replacement');

function replaceSubSchemaReference(subSchema, context) {
  if (!isString(subSchema.$ref)) { return NO_SUBSCHEMA_REPLACEMENT; }
  const refPointer = JsonPointer.compile(subSchema.$ref);
  const canResolveReference = refPointer.length && context.usedPointers.every(ptr =>
    !JsonPointer.isSubPointer(refPointer, ptr, true)
  );
  if (!canResolveReference) { return NO_SUBSCHEMA_REPLACEMENT; }

  const refSchema = getSubSchema(
    context.schema, refPointer, context.schemaRefLibrary,
    context.schemaRecursiveRefMap, context.usedPointers
  );
  if (Object.keys(subSchema).length === 1) { return refSchema; }

  const extraKeys = { ...subSchema };
  delete extraKeys.$ref;
  return mergeSchemas(refSchema, extraKeys);
}

function processSubSchemaNode(subSchema, context) {
  if (!isObject(subSchema)) { return subSchema; }

  const referencedSchema = replaceSubSchemaReference(subSchema, context);
  if (referencedSchema !== NO_SUBSCHEMA_REPLACEMENT) { return referencedSchema; }
  // TODO: Convert schemas with 'type' arrays to 'oneOf'
  if (isArray(subSchema.allOf)) { return combineAllOf(subSchema); }
  if (subSchema.type === 'array' && isArray(subSchema.required)) {
    return fixRequiredArrayProperties(subSchema);
  }
  return subSchema;
}

export function getSubSchema(
  schema, pointer, schemaRefLibrary = null,
  schemaRecursiveRefMap: Map<string, string> = null, usedPointers: string[] = []
) {
  if (!schemaRefLibrary || !schemaRecursiveRefMap) {
    return JsonPointer.getCopy(schema, pointer);
  }
  if (typeof pointer !== 'string') { pointer = JsonPointer.compile(pointer); }
  usedPointers = [ ...usedPointers, pointer ];
  let newSchema: any = null;
  if (pointer === '') {
    newSchema = cloneDeep(schema);
  } else {
    const shortPointer = removeRecursiveReferences(pointer, schemaRecursiveRefMap);
    if (shortPointer !== pointer) { usedPointers = [ ...usedPointers, shortPointer ]; }
    newSchema = JsonPointer.getFirstCopy([
      [schemaRefLibrary, [shortPointer]],
      [schema, pointer],
      [schema, shortPointer]
    ]);
  }
  const context = { schema, schemaRefLibrary, schemaRecursiveRefMap, usedPointers };
  return JsonPointer.forEachDeepCopy(
    newSchema,
    subSchema => processSubSchemaNode(subSchema, context),
    true,
    <string>pointer
  );
}

/**
 * 'combineAllOf' function
 *
 * Attempt to convert an allOf schema object into
 * a non-allOf schema object with equivalent rules.
 *
 * //   schema - allOf schema object
 * //  - converted schema object
 */
export function combineAllOf(schema) {
  if (!isObject(schema) || !isArray(schema.allOf)) { return schema; }
  let mergedSchema = mergeSchemas(...schema.allOf);
  if (Object.keys(schema).length > 1) {
    const extraKeys = { ...schema };
    delete extraKeys.allOf;
    mergedSchema = mergeSchemas(mergedSchema, extraKeys);
  }
  return mergedSchema;
}

/**
 * 'fixRequiredArrayProperties' function
 *
 * Fixes an incorrectly placed required list inside an array schema, by moving
 * it into items.properties or additionalItems.properties, where it belongs.
 *
 * //   schema - allOf schema object
 * //  - converted schema object
 */
export function fixRequiredArrayProperties(schema) {
  if (schema.type === 'array' && isArray(schema.required)) {
    let itemsObject = null;
    if (hasOwn(schema.items, 'properties')) { itemsObject = 'items'; }
    else if (hasOwn(schema.additionalItems, 'properties')) { itemsObject = 'additionalItems'; }
    if (itemsObject && !hasOwn(schema[itemsObject], 'required') && (
      hasOwn(schema[itemsObject], 'additionalProperties') ||
      schema.required.every(key => hasOwn(schema[itemsObject].properties, key))
    )) {
      schema = cloneDeep(schema);
      schema[itemsObject].required = schema.required;
      delete schema.required;
    }
  }
  return schema;
}
