import cloneDeep from 'lodash-es/cloneDeep';

/**
 * 'convertSchemaToDraft6' function
 *
 * Converts a JSON Schema from draft 1 through 4 format to draft 6 format
 *
 * Inspired by on geraintluff's JSON Schema 3 to 4 compatibility function:
 *   https://github.com/geraintluff/json-schema-compatibility
 * Also uses suggestions from AJV's JSON Schema 4 to 6 migration guide:
 *   https://github.com/epoberezkin/ajv/releases/tag/5.0.0
 * And additional details from the official JSON Schema documentation:
 *   http://json-schema.org
 *
 * //  { object } originalSchema - JSON schema (draft 1, 2, 3, 4, or 6)
 * //  { OptionObject = {} } options - options: parent schema changed?, schema draft number?
 * // { object } - JSON schema (draft 6)
 */
export interface OptionObject { changed?: boolean; draft?: number; }
export function convertSchemaToDraft6(schema, options: OptionObject = {}) {
  let draft: number = options.draft || null;
  let changed: boolean = options.changed || false;

  if (typeof schema !== 'object') { return schema; }
  if (typeof schema.map === 'function') {
    return [...schema.map(subSchema => convertSchemaToDraft6(subSchema, { changed, draft }))];
  }
  let newSchema = { ...schema };
  const simpleTypes = ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'];

  if (typeof newSchema.$schema === 'string' &&
    /http\:\/\/json\-schema\.org\/draft\-0\d\/schema\#/.test(newSchema.$schema)
  ) {
    draft = newSchema.$schema[30];
  }

  // Convert v1-v2 'contentEncoding' to 'media.binaryEncoding'
  // Note: This is only used in JSON hyper-schema (not regular JSON schema)
  if (newSchema.contentEncoding) {
    newSchema.media = { binaryEncoding: newSchema.contentEncoding };
    delete newSchema.contentEncoding;
    changed = true;
  }

  // Convert v1-v3 'extends' to 'allOf'
  if (typeof newSchema.extends === 'object') {
    newSchema.allOf = typeof newSchema.extends.map === 'function' ?
      newSchema.extends.map(subSchema => convertSchemaToDraft6(subSchema, { changed, draft })) :
      [convertSchemaToDraft6(newSchema.extends, { changed, draft })];
    delete newSchema.extends;
    changed = true;
  }

  // Convert v1-v3 'disallow' to 'not'
  if (newSchema.disallow) {
    if (typeof newSchema.disallow === 'string') {
      newSchema.not = { type: newSchema.disallow };
    } else if (typeof newSchema.disallow.map === 'function') {
      newSchema.not = {
        anyOf: newSchema.disallow
          .map(type => typeof type === 'object' ? type : { type })
      };
    }
    delete newSchema.disallow;
    changed = true;
  }

  // Convert v3 string 'dependencies' properties to arrays
  if (typeof newSchema.dependencies === 'object' &&
    Object.keys(newSchema.dependencies)
      .some(key => typeof newSchema.dependencies[key] === 'string')
  ) {
    newSchema.dependencies = { ...newSchema.dependencies };
    Object.keys(newSchema.dependencies)
      .filter(key => typeof newSchema.dependencies[key] === 'string')
      .forEach(key => newSchema.dependencies[key] = [newSchema.dependencies[key]]);
    changed = true;
  }

  // Convert v1 'maxDecimal' to 'multipleOf'
  if (typeof newSchema.maxDecimal === 'number') {
    newSchema.multipleOf = 1 / Math.pow(10, newSchema.maxDecimal);
    delete newSchema.divisibleBy;
    changed = true;
    if (!draft || draft === 2) { draft = 1; }
  }

  // Convert v2-v3 'divisibleBy' to 'multipleOf'
  if (typeof newSchema.divisibleBy === 'number') {
    newSchema.multipleOf = newSchema.divisibleBy;
    delete newSchema.divisibleBy;
    changed = true;
  }

  // Convert v1-v2 boolean 'minimumCanEqual' to 'exclusiveMinimum'
  if (typeof newSchema.minimum === 'number' && newSchema.minimumCanEqual === false) {
    newSchema.exclusiveMinimum = newSchema.minimum;
    delete newSchema.minimum;
    changed = true;
    if (!draft) { draft = 2; }
  } else if (typeof newSchema.minimumCanEqual === 'boolean') {
    delete newSchema.minimumCanEqual;
    changed = true;
    if (!draft) { draft = 2; }
  }

  // Convert v3-v4 boolean 'exclusiveMinimum' to numeric
  if (typeof newSchema.minimum === 'number' && newSchema.exclusiveMinimum === true) {
    newSchema.exclusiveMinimum = newSchema.minimum;
    delete newSchema.minimum;
    changed = true;
  } else if (typeof newSchema.exclusiveMinimum === 'boolean') {
    delete newSchema.exclusiveMinimum;
    changed = true;
  }

  // Convert v1-v2 boolean 'maximumCanEqual' to 'exclusiveMaximum'
  if (typeof newSchema.maximum === 'number' && newSchema.maximumCanEqual === false) {
    newSchema.exclusiveMaximum = newSchema.maximum;
    delete newSchema.maximum;
    changed = true;
    if (!draft) { draft = 2; }
  } else if (typeof newSchema.maximumCanEqual === 'boolean') {
    delete newSchema.maximumCanEqual;
    changed = true;
    if (!draft) { draft = 2; }
  }

  // Convert v3-v4 boolean 'exclusiveMaximum' to numeric
  if (typeof newSchema.maximum === 'number' && newSchema.exclusiveMaximum === true) {
    newSchema.exclusiveMaximum = newSchema.maximum;
    delete newSchema.maximum;
    changed = true;
  } else if (typeof newSchema.exclusiveMaximum === 'boolean') {
    delete newSchema.exclusiveMaximum;
    changed = true;
  }

  // Search object 'properties' for 'optional', 'required', and 'requires' items,
  // and convert them into object 'required' arrays and 'dependencies' objects
  if (typeof newSchema.properties === 'object') {
    const properties = { ...newSchema.properties };
    const requiredKeys = Array.isArray(newSchema.required) ?
      new Set(newSchema.required) : new Set();

    // Convert v1-v2 boolean 'optional' properties to 'required' array
    if (draft === 1 || draft === 2 ||
      Object.keys(properties).some(key => properties[key].optional === true)
    ) {
      Object.keys(properties)
        .filter(key => properties[key].optional !== true)
        .forEach(key => requiredKeys.add(key));
      changed = true;
      if (!draft) { draft = 2; }
    }

    // Convert v3 boolean 'required' properties to 'required' array
    if (Object.keys(properties).some(key => properties[key].required === true)) {
      Object.keys(properties)
        .filter(key => properties[key].required === true)
        .forEach(key => requiredKeys.add(key));
      changed = true;
    }

    if (requiredKeys.size) { newSchema.required = Array.from(requiredKeys); }

    // Convert v1-v2 array or string 'requires' properties to 'dependencies' object
    if (Object.keys(properties).some(key => properties[key].requires)) {
      const dependencies = typeof newSchema.dependencies === 'object' ?
        { ...newSchema.dependencies } : {};
      Object.keys(properties)
        .filter(key => properties[key].requires)
        .forEach(key => dependencies[key] =
          typeof properties[key].requires === 'string' ?
            [properties[key].requires] : properties[key].requires
        );
      newSchema.dependencies = dependencies;
      changed = true;
      if (!draft) { draft = 2; }
    }

    newSchema.properties = properties;
  }

  // Revove v1-v2 boolean 'optional' key
  if (typeof newSchema.optional === 'boolean') {
    delete newSchema.optional;
    changed = true;
    if (!draft) { draft = 2; }
  }

  // Revove v1-v2 'requires' key
  if (newSchema.requires) {
    delete newSchema.requires;
  }

  // Revove v3 boolean 'required' key
  if (typeof newSchema.required === 'boolean') {
    delete newSchema.required;
  }

  // Convert id to $id
  if (typeof newSchema.id === 'string' && !newSchema.$id) {
    if (newSchema.id.slice(-1) === '#') {
      newSchema.id = newSchema.id.slice(0, -1);
    }
    newSchema.$id = newSchema.id + '-CONVERTED-TO-DRAFT-06#';
    delete newSchema.id;
    changed = true;
  }

  // Check if v1-v3 'any' or object types will be converted
  if (newSchema.type && (typeof newSchema.type.every === 'function' ?
    !newSchema.type.every(type => simpleTypes.includes(type)) :
    !simpleTypes.includes(newSchema.type)
  )) {
    changed = true;
  }

  // If schema changed, update or remove $schema identifier
  if (typeof newSchema.$schema === 'string' &&
    /http\:\/\/json\-schema\.org\/draft\-0[1-4]\/schema\#/.test(newSchema.$schema)
  ) {
    newSchema.$schema = 'http://json-schema.org/draft-06/schema#';
    changed = true;
  } else if (changed && typeof newSchema.$schema === 'string') {
    const addToDescription = 'Converted to draft 6 from ' + newSchema.$schema;
    if (typeof newSchema.description === 'string' && newSchema.description.length) {
      newSchema.description += '\n' + addToDescription;
    } else {
      newSchema.description = addToDescription;
    }
    delete newSchema.$schema;
  }

  // Convert v1-v3 'any' and object types
  if (newSchema.type && (typeof newSchema.type.every === 'function' ?
    !newSchema.type.every(type => simpleTypes.includes(type)) :
    !simpleTypes.includes(newSchema.type)
  )) {
    if (newSchema.type.length === 1) { newSchema.type = newSchema.type[0]; }
    if (typeof newSchema.type === 'string') {
      // Convert string 'any' type to array of all standard types
      if (newSchema.type === 'any') {
        newSchema.type = simpleTypes;
        // Delete non-standard string type
      } else {
        delete newSchema.type;
      }
    } else if (typeof newSchema.type === 'object') {
      if (typeof newSchema.type.every === 'function') {
        // If array of strings, only allow standard types
        if (newSchema.type.every(type => typeof type === 'string')) {
          newSchema.type = newSchema.type.some(type => type === 'any') ?
            newSchema.type = simpleTypes :
            newSchema.type.filter(type => simpleTypes.includes(type));
          // If type is an array with objects, convert the current schema to an 'anyOf' array
        } else if (newSchema.type.length > 1) {
          const arrayKeys = ['additionalItems', 'items', 'maxItems', 'minItems', 'uniqueItems', 'contains'];
          const numberKeys = ['multipleOf', 'maximum', 'exclusiveMaximum', 'minimum', 'exclusiveMinimum'];
          const objectKeys = ['maxProperties', 'minProperties', 'required', 'additionalProperties',
            'properties', 'patternProperties', 'dependencies', 'propertyNames'];
          const stringKeys = ['maxLength', 'minLength', 'pattern', 'format'];
          const filterKeys = {
            'array': [...numberKeys, ...objectKeys, ...stringKeys],
            'integer': [...arrayKeys, ...objectKeys, ...stringKeys],
            'number': [...arrayKeys, ...objectKeys, ...stringKeys],
            'object': [...arrayKeys, ...numberKeys, ...stringKeys],
            'string': [...arrayKeys, ...numberKeys, ...objectKeys],
            'all': [...arrayKeys, ...numberKeys, ...objectKeys, ...stringKeys],
          };
          const anyOf = [];
          for (const type of newSchema.type) {
            const newType = typeof type === 'string' ? { type } : { ...type };
            Object.keys(newSchema)
              .filter(key => !newType.hasOwnProperty(key) &&
                ![...(filterKeys[newType.type] || filterKeys.all), 'type', 'default']
                  .includes(key)
              )
              .forEach(key => newType[key] = newSchema[key]);
            anyOf.push(newType);
          }
          newSchema = newSchema.hasOwnProperty('default') ?
            { anyOf, default: newSchema.default } : { anyOf };
          // If type is an object, merge it with the current schema
        } else {
          const typeSchema = newSchema.type;
          delete newSchema.type;
          Object.assign(newSchema, typeSchema);
        }
      }
    } else {
      delete newSchema.type;
    }
  }

  // Convert sub schemas
  Object.keys(newSchema)
    .filter(key => typeof newSchema[key] === 'object')
    .forEach(key => {
      if (
        ['definitions', 'dependencies', 'properties', 'patternProperties']
          .includes(key) && typeof newSchema[key].map !== 'function'
      ) {
        const newKey = {};
        Object.keys(newSchema[key]).forEach(subKey => newKey[subKey] =
          convertSchemaToDraft6(newSchema[key][subKey], { changed, draft })
        );
        newSchema[key] = newKey;
      } else if (
        ['items', 'additionalItems', 'additionalProperties',
          'allOf', 'anyOf', 'oneOf', 'not'].includes(key)
      ) {
        newSchema[key] = convertSchemaToDraft6(newSchema[key], { changed, draft });
      } else {
        newSchema[key] = cloneDeep(newSchema[key]);
      }
    });

  return newSchema;
}
