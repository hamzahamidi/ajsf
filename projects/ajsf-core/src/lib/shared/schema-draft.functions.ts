import { cloneDeep } from './clone-deep.function';

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

/** Used when a schema declares no '$schema' and the caller names no draft. */
export const DEFAULT_DRAFT = 7;

/**
 * 'detectDraft' function
 *
 * Reads the draft number a schema declares in its '$schema' keyword.
 *
 * Recognises the draft 1 to 7 schema URIs only. A hyper-schema URI, a 2019-09
 * or 2020-12 URI, and an absent '$schema' all return null, which is why a
 * schema declaring draft 1 hyper-schema currently falls through to inference.
 *
 * // { any } schema - the schema to read
 * // { number } - the declared draft, or null
 */
export function detectDraft(schema): number {
  if (!schema || typeof schema.$schema !== 'string') { return null; }
  const declared = /http:\/\/json-schema\.org\/draft-0(\d)\/schema#/.exec(schema.$schema);
  return declared ? Number(declared[1]) : null;
}

interface DraftState { newSchema: any; draft: number; changed: boolean; }

const simpleTypes = ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'];

/** Rewrites draft 1 to 4 keywords into their draft 6 spellings. */
/**
 * Keywords draft 4 still uses: the boolean form of 'exclusiveMinimum' and
 * 'exclusiveMaximum', which draft 6 made numeric. Delete this to drop draft 4.
 */
function convertDraft4Keywords(newSchema: any, draft: number, changed: boolean): DraftState {
    // Convert v3-v4 boolean 'exclusiveMinimum' to numeric
    if (typeof newSchema.minimum === 'number' && newSchema.exclusiveMinimum === true) {
      newSchema.exclusiveMinimum = newSchema.minimum;
      delete newSchema.minimum;
      changed = true;
    } else if (typeof newSchema.exclusiveMinimum === 'boolean') {
      delete newSchema.exclusiveMinimum;
      changed = true;
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

  return { newSchema, draft, changed };
}

/** Turns per property 'optional', 'required' and 'requires' into the parent's 'required' array and 'dependencies' object, which is the shape the form builder reads. */
function collectRequiredKeys(newSchema: any, draft: number, changed: boolean): DraftState {
    // Drafts 1 to 3 are no longer supported, so 'optional', 'required: true' and
    // 'requires' on a property carry no meaning. They are still deleted, because a
    // boolean 'required' and a string 'requires' are invalid from draft 4 onward
    // and ajv rejects the whole schema rather than ignoring the keyword.
    if (typeof newSchema.properties === 'object') {
      const properties = { ...newSchema.properties };
      const dropped = Object.keys(properties).filter(key =>
        typeof properties[key] === 'object' && (
          properties[key].required === true ||
          properties[key].optional === true ||
          properties[key].requires
        ));
      if (dropped.length) {
        // Loud, because the alternative is a form that quietly stops enforcing a
        // required field.
        console.warn(
          'JSON Schema draft 1 to 3 is no longer supported, so these properties ' +
          'lost their required, optional or requires keyword: ' + dropped.join(', ') +
          '. Use a draft 4 or later "required" array instead.'
        );
      }
      dropped.forEach(key => {
        properties[key] = { ...properties[key] };
        delete properties[key].required;
        delete properties[key].optional;
        delete properties[key].requires;
        changed = true;
      });
      newSchema.properties = properties;
    }

    // Revove v1-v2 boolean 'optional' key
    if (typeof newSchema.optional === 'boolean') {
      delete newSchema.optional;
      changed = true;
    }

    // Revove v1-v2 'requires' key
    if (newSchema.requires) {
      delete newSchema.requires;
    }

    // Revove v3 boolean 'required' key
    if (typeof newSchema.required === 'boolean') {
      delete newSchema.required;
    }

  return { newSchema, draft, changed };
}

/** Moves 'id' to '$id' and settles the '$schema' keyword. */
function normaliseIdentifiers(newSchema: any, draft: number, changed: boolean): DraftState {
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
      newSchema.$schema = 'http://json-schema.org/draft-07/schema#';
      changed = true;
    } else if (changed && typeof newSchema.$schema === 'string') {
      const addToDescription = 'Converted to draft 7 from ' + newSchema.$schema;
      if (typeof newSchema.description === 'string' && newSchema.description.length) {
        newSchema.description += '\n' + addToDescription;
      } else {
        newSchema.description = addToDescription;
      }
      delete newSchema.$schema;
    }

  return { newSchema, draft, changed };
}

/** Expands the draft 1 to 3 'any' and object type forms into the standard type list, or into an 'anyOf'. */
function normaliseTypes(schema: any, draft: number, changed: boolean): DraftState {
  let newSchema = schema;
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

  return { newSchema, draft, changed };
}

/** Recurses into every sub schema, so each is converted in its own right. */
function convertSubSchemas(newSchema: any, draft: number, changed: boolean): any {
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

export function convertSchemaToDraft6(schema, options: OptionObject = {}) {
  let draft: number = options.draft || DEFAULT_DRAFT;
  const changed: boolean = options.changed || false;

  if (typeof schema !== 'object') { return schema; }
  if (typeof schema.map === 'function') {
    return [...schema.map(subSchema => convertSchemaToDraft6(subSchema, { changed, draft }))];
  }

  const declared = detectDraft(schema);
  if (declared !== null) { draft = declared; }

  let state: DraftState = { newSchema: { ...schema }, draft, changed };
  state = convertDraft4Keywords(state.newSchema, state.draft, state.changed);
  state = collectRequiredKeys(state.newSchema, state.draft, state.changed);
  state = normaliseIdentifiers(state.newSchema, state.draft, state.changed);
  state = normaliseTypes(state.newSchema, state.draft, state.changed);
  return convertSubSchemas(state.newSchema, state.draft, state.changed);
}
