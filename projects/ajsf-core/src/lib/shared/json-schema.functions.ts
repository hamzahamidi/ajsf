import cloneDeep from 'lodash-es/cloneDeep';
import { forEach, hasOwn, mergeFilteredObject } from './utility.functions';
import {
  getType,
  hasValue,
  inArray,
  isArray,
  isNumber,
  isObject,
  isString
  } from './validator.functions';
import { JsonPointer } from './jsonpointer.functions';
import { mergeSchemas } from './merge-schemas.function';


/**
 * JSON Schema function library:
 *
 * buildSchemaFromLayout:   TODO: Write this function
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

/**
 * 'buildSchemaFromLayout' function
 *
 * TODO: Build a JSON Schema from a JSON Form layout
 *
 * //   layout - The JSON Form layout
 * //  - The new JSON Schema
 */
export function buildSchemaFromLayout(layout) {
  return;
  // let newSchema: any = { };
  // const walkLayout = (layoutItems: any[], callback: Function): any[] => {
  //   let returnArray: any[] = [];
  //   for (let layoutItem of layoutItems) {
  //     const returnItem: any = callback(layoutItem);
  //     if (returnItem) { returnArray = returnArray.concat(callback(layoutItem)); }
  //     if (layoutItem.items) {
  //       returnArray = returnArray.concat(walkLayout(layoutItem.items, callback));
  //     }
  //   }
  //   return returnArray;
  // };
  // walkLayout(layout, layoutItem => {
  //   let itemKey: string;
  //   if (typeof layoutItem === 'string') {
  //     itemKey = layoutItem;
  //   } else if (layoutItem.key) {
  //     itemKey = layoutItem.key;
  //   }
  //   if (!itemKey) { return; }
  //   //
  // });
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
  if (isRoot) { newSchema.$schema = 'http://json-schema.org/draft-06/schema#'; }
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
export function getFromSchema(schema, dataPointer, returnType = 'schema') {
  const dataPointerArray: any[] = JsonPointer.parse(dataPointer);
  if (dataPointerArray === null) {
    console.error(`getFromSchema error: Invalid JSON Pointer: ${dataPointer}`);
    return null;
  }
  let subSchema = schema;
  const schemaPointer = [];
  const length = dataPointerArray.length;
  if (returnType.slice(0, 6) === 'parent') { dataPointerArray.length--; }
  for (let i = 0; i < length; ++i) {
    const parentSchema = subSchema;
    const key = dataPointerArray[i];
    let subSchemaFound = false;
    if (typeof subSchema !== 'object') {
      console.error(`getFromSchema error: Unable to find "${key}" key in schema.`);
      console.error(schema);
      console.error(dataPointer);
      return null;
    }
    if (subSchema.type === 'array' && (!isNaN(key) || key === '-')) {
      if (hasOwn(subSchema, 'items')) {
        if (isObject(subSchema.items)) {
          subSchemaFound = true;
          subSchema = subSchema.items;
          schemaPointer.push('items');
        } else if (isArray(subSchema.items)) {
          if (!isNaN(key) && subSchema.items.length >= +key) {
            subSchemaFound = true;
            subSchema = subSchema.items[+key];
            schemaPointer.push('items', key);
          }
        }
      }
      if (!subSchemaFound && isObject(subSchema.additionalItems)) {
        subSchemaFound = true;
        subSchema = subSchema.additionalItems;
        schemaPointer.push('additionalItems');
      } else if (subSchema.additionalItems !== false) {
        subSchemaFound = true;
        subSchema = { };
        schemaPointer.push('additionalItems');
      }
    } else if (subSchema.type === 'object') {
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
        subSchema = { };
        schemaPointer.push('additionalProperties');
      }
    }
    if (!subSchemaFound) {
      console.error(`getFromSchema error: Unable to find "${key}" item in schema.`);
      console.error(schema);
      console.error(dataPointer);
      return;
    }
  }
  return returnType.slice(-7) === 'Pointer' ? schemaPointer : subSchema;
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
  if (genericPointer.indexOf('/') === -1) { return genericPointer; }
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
      schemaType =
        inArray('object', schemaType) && hasOwn(schema, 'properties') ? 'object' :
        inArray('array', schemaType) && hasOwn(schema, 'items') ? 'array' :
        inArray('array', schemaType) && hasOwn(schema, 'additionalItems') ? 'array' :
        inArray('string', schemaType) ? 'string' :
        inArray('number', schemaType) ? 'number' :
        inArray('integer', schemaType) ? 'integer' :
        inArray('boolean', schemaType) ? 'boolean' : 'unknown';
    }
    if (schemaType === 'boolean') { return 'checkbox'; }
    if (schemaType === 'object') {
      if (hasOwn(schema, 'properties') || hasOwn(schema, 'additionalProperties')) {
        return 'section';
      }
      // TODO: Figure out how to handle additionalProperties
      if (hasOwn(schema, '$ref')) { return '$ref'; }
    }
    if (schemaType === 'array') {
      const itemsObject = JsonPointer.getFirst([
        [schema, '/items'],
        [schema, '/additionalItems']
      ]) || {};
      return hasOwn(itemsObject, 'enum') && schema.maxItems !== 1 ?
        checkInlineType('checkboxes', schema, layoutNode) : 'array';
    }
    if (schemaType === 'null') { return 'none'; }
    if (JsonPointer.has(layoutNode, '/options/titleMap') ||
      hasOwn(schema, 'enum') || getTitleMapFromOneOf(schema, null, true)
    ) { return 'select'; }
    if (schemaType === 'number' || schemaType === 'integer') {
      return (schemaType === 'integer' || hasOwn(schema, 'multipleOf')) &&
        hasOwn(schema, 'maximum') && hasOwn(schema, 'minimum') ? 'range' : schemaType;
    }
    if (schemaType === 'string') {
      return {
        'color': 'color',
        'date': 'date',
        'date-time': 'datetime-local',
        'email': 'email',
        'uri': 'url',
      }[schema.format] || 'text';
    }
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
    controlType.slice(0, 8) !== 'checkbox' && controlType.slice(0, 5) !== 'radio'
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
    return controlType.slice(0, 5) === 'radio' ?
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
    const nextToLastKey = listPointerArray[listPointerArray.length - 1];
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
export function updateInputOptions(layoutNode, schema, jsf) {
  if (!isObject(layoutNode) || !isObject(layoutNode.options)) { return; }

  // Set all option values in layoutNode.options
  const newOptions: any = { };
  const fixUiKeys = key => key.slice(0, 3).toLowerCase() === 'ui:' ? key.slice(3) : key;
  mergeFilteredObject(newOptions, jsf.formOptions.defautWidgetOptions, [], fixUiKeys);
  [ [ JsonPointer.get(schema, '/ui:widget/options'), [] ],
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
  ].forEach(([ object, excludeKeys ]) =>
    mergeFilteredObject(newOptions, object, excludeKeys, fixUiKeys)
  );
  if (!hasOwn(newOptions, 'titleMap')) {
    let newTitleMap: any = null;
    newTitleMap = getTitleMapFromOneOf(schema, newOptions.flatList);
    if (newTitleMap) { newOptions.titleMap = newTitleMap; }
    if (!hasOwn(newOptions, 'titleMap') && !hasOwn(newOptions, 'enum') && hasOwn(schema, 'items')) {
      if (JsonPointer.has(schema, '/items/titleMap')) {
        newOptions.titleMap = schema.items.titleMap;
      } else if (JsonPointer.has(schema, '/items/enum')) {
        newOptions.enum = schema.items.enum;
        if (!hasOwn(newOptions, 'enumNames') && JsonPointer.has(schema, '/items/enumNames')) {
          newOptions.enumNames = schema.items.enumNames;
        }
      } else if (JsonPointer.has(schema, '/items/oneOf')) {
        newTitleMap = getTitleMapFromOneOf(schema.items, newOptions.flatList);
        if (newTitleMap) { newOptions.titleMap = newTitleMap; }
      }
    }
  }

  // If schema type is integer, enforce by setting multipleOf = 1
  if (schema.type === 'integer' && !hasValue(newOptions.multipleOf)) {
    newOptions.multipleOf = 1;
  }

  // Copy any typeahead word lists to options.typeahead.source
  if (JsonPointer.has(newOptions, '/autocomplete/source')) {
    newOptions.typeahead = newOptions.autocomplete;
  } else if (JsonPointer.has(newOptions, '/tagsinput/source')) {
    newOptions.typeahead = newOptions.tagsinput;
  } else if (JsonPointer.has(newOptions, '/tagsinput/typeahead/source')) {
    newOptions.typeahead = newOptions.tagsinput.typeahead;
  }

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
  let titleMap = null;
  const oneOf = schema.oneOf || schema.anyOf || null;
  if (isArray(oneOf) && oneOf.every(item => item.title)) {
    if (oneOf.every(item => isArray(item.enum) && item.enum.length === 1)) {
      if (validateOnly) { return true; }
      titleMap = oneOf.map(item => ({ name: item.title, value: item.enum[0] }));
    } else if (oneOf.every(item => item.const)) {
      if (validateOnly) { return true; }
      titleMap = oneOf.map(item => ({ name: item.title, value: item.const }));
    }

    // if flatList !== false and some items have colons, make grouped map
    if (flatList !== false && (titleMap || [])
      .filter(title => ((title || {}).name || '').indexOf(': ')).length > 1
    ) {

      // Split name on first colon to create grouped map (name -> group: name)
      const newTitleMap = titleMap.map(title => {
        const [group, name] = title.name.split(/: (.+)/);
        return group && name ? { ...title, group, name } : title;
      });

      // If flatList === true or at least one group has multiple items, use grouped map
      if (flatList === true || newTitleMap.some((title, index) => index &&
        hasOwn(title, 'group') && title.group === newTitleMap[index - 1].group
      )) {
        titleMap = newTitleMap;
      }
    }
  }
  return validateOnly ? false : titleMap;
}

/**
 * 'getControlValidators' function
 *
 * //  schema
 * // { validators }
 */
export function getControlValidators(schema) {
  if (!isObject(schema)) { return null; }
  const validators: any = { };
  if (hasOwn(schema, 'type')) {
    switch (schema.type) {
      case 'string':
        forEach(['pattern', 'format', 'minLength', 'maxLength'], (prop) => {
          if (hasOwn(schema, prop)) { validators[prop] = [schema[prop]]; }
        });
      break;
      case 'number': case 'integer':
        forEach(['Minimum', 'Maximum'], (ucLimit) => {
          const eLimit = 'exclusive' + ucLimit;
          const limit = ucLimit.toLowerCase();
          if (hasOwn(schema, limit)) {
            const exclusive = hasOwn(schema, eLimit) && schema[eLimit] === true;
            validators[limit] = [schema[limit], exclusive];
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
      break;
    }
  }
  if (hasOwn(schema, 'enum')) { validators.enum = [schema.enum]; }
  return validators;
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
  JsonPointer.forEachDeep(compiledSchema, (subSchema, subSchemaPointer) => {
    if (isString(subSchema['$ref'])) {
      let refPointer = JsonPointer.compile(subSchema['$ref']);
      if (!JsonPointer.isSubPointer(refPointer, subSchemaPointer, true)) {
        refPointer = removeRecursiveReferences(subSchemaPointer, recursiveRefMap);
        JsonPointer.set(compiledSchema, subSchemaPointer, { $ref: `#${refPointer}` });
      }
      if (!hasOwn(schemaRefLibrary, 'refPointer')) {
        schemaRefLibrary[refPointer] = !refPointer.length ? compiledSchema :
          getSubSchema(compiledSchema, refPointer, schemaRefLibrary, recursiveRefMap);
      }
      if (!schemaRecursiveRefMap.has(subSchemaPointer)) {
        schemaRecursiveRefMap.set(subSchemaPointer, refPointer);
      }
      const fromDataRef = JsonPointer.toDataPointer(subSchemaPointer, compiledSchema);
      if (!dataRecursiveRefMap.has(fromDataRef)) {
        const toDataRef = JsonPointer.toDataPointer(refPointer, compiledSchema);
        dataRecursiveRefMap.set(fromDataRef, toDataRef);
      }
    }
    if (subSchema.type === 'array' &&
      (hasOwn(subSchema, 'items') || hasOwn(subSchema, 'additionalItems'))
    ) {
      const dataPointer = JsonPointer.toDataPointer(subSchemaPointer, compiledSchema);
      if (!arrayMap.has(dataPointer)) {
        const tupleItems = isArray(subSchema.items) ? subSchema.items.length : 0;
        arrayMap.set(dataPointer, tupleItems);
      }
    }
  }, true);
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
  return JsonPointer.forEachDeepCopy(newSchema, (subSchema, subPointer) => {
    if (isObject(subSchema)) {

      // Replace non-recursive $ref links with referenced schemas
      if (isString(subSchema.$ref)) {
        const refPointer = JsonPointer.compile(subSchema.$ref);
        if (refPointer.length && usedPointers.every(ptr =>
          !JsonPointer.isSubPointer(refPointer, ptr, true)
        )) {
          const refSchema = getSubSchema(
            schema, refPointer, schemaRefLibrary, schemaRecursiveRefMap, usedPointers
          );
          if (Object.keys(subSchema).length === 1) {
            return refSchema;
          } else {
            const extraKeys = { ...subSchema };
            delete extraKeys.$ref;
            return mergeSchemas(refSchema, extraKeys);
          }
        }
      }

      // TODO: Convert schemas with 'type' arrays to 'oneOf'

      // Combine allOf subSchemas
      if (isArray(subSchema.allOf)) { return combineAllOf(subSchema); }

      // Fix incorrectly placed array object required lists
      if (subSchema.type === 'array' && isArray(subSchema.required)) {
        return fixRequiredArrayProperties(subSchema);
      }
    }
    return subSchema;
  }, true, <string>pointer);
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
    const itemsObject = hasOwn(schema.items, 'properties') ? 'items' :
      hasOwn(schema.additionalItems, 'properties') ? 'additionalItems' : null;
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
