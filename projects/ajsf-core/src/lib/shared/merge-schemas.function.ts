import { deepEqual } from './deep-equal.function';
import { isEmpty, isObject } from './validator.functions';
import { hasOwn } from './utility.functions';
import { mergeSchemaKeyword } from './merge-schemas.handlers';

/**
 * 'mergeSchemas' function
 *
 * Merges multiple JSON schemas into a single schema with combined rules.
 *
 * If able to logically merge properties from all schemas,
 * returns a single schema object containing all merged properties.
 *
 * Example: ({ a: b, max: 1 }, { c: d, max: 2 }) => { a: b, c: d, max: 1 }
 *
 * If unable to logically merge, returns an allOf schema object containing
 * an array of the original schemas;
 *
 * Example: ({ a: b }, { a: d }) => { allOf: [ { a: b }, { a: d } ] }
 *
 * //   schemas - one or more input schemas
 * //  - merged schema
 */
export function mergeSchemas(...schemas) {
  schemas = schemas.filter(schema => !isEmpty(schema));
  if (schemas.some(schema => !isObject(schema))) { return null; }

  const combinedSchema: any = {};
  for (let schemaIndex = 0; schemaIndex < schemas.length; schemaIndex++) {
    const schema = schemas[schemaIndex];
    const priorAdditional = schemas.slice(0, schemaIndex)
      .filter(prior => hasOwn(prior, 'additionalProperties'))
      .map(prior => prior.additionalProperties);
    const context = {
      key: '',
      schema,
      combinedSchema,
      priorAdditional,
      mergeSchemas,
    };

    for (const key of Object.keys(schema)) {
      const combinedValue = combinedSchema[key];
      const schemaValue = schema[key];
      if (!hasOwn(combinedSchema, key) || deepEqual(combinedValue, schemaValue)) {
        combinedSchema[key] = schemaValue;
        continue;
      }
      if (!mergeSchemaKeyword(key, combinedValue, schemaValue, context)) {
        return { allOf: [...schemas] };
      }
    }
  }
  return combinedSchema;
}
