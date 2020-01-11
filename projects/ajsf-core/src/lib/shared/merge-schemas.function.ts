import isEqual from 'lodash-es/isEqual';

import {
  isArray, isEmpty, isNumber, isObject, isString
} from './validator.functions';
import { hasOwn, uniqueItems, commonItems } from './utility.functions';
import { JsonPointer, Pointer } from './jsonpointer.functions';

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
  for (const schema of schemas) {
    for (const key of Object.keys(schema)) {
      const combinedValue = combinedSchema[key];
      const schemaValue = schema[key];
      if (!hasOwn(combinedSchema, key) || isEqual(combinedValue, schemaValue)) {
        combinedSchema[key] = schemaValue;
      } else {
        switch (key) {
          case 'allOf':
            // Combine all items from both arrays
            if (isArray(combinedValue) && isArray(schemaValue)) {
              combinedSchema.allOf = mergeSchemas(...combinedValue, ...schemaValue);
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case 'additionalItems': case 'additionalProperties':
          case 'contains': case 'propertyNames':
            // Merge schema objects
            if (isObject(combinedValue) && isObject(schemaValue)) {
              combinedSchema[key] = mergeSchemas(combinedValue, schemaValue);
            // additionalProperties == false in any schema overrides all other values
            } else if (
              key === 'additionalProperties' &&
              (combinedValue === false || schemaValue === false)
            ) {
              combinedSchema.combinedSchema = false;
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case 'anyOf': case 'oneOf': case 'enum':
            // Keep only items that appear in both arrays
            if (isArray(combinedValue) && isArray(schemaValue)) {
              combinedSchema[key] = combinedValue.filter(item1 =>
                schemaValue.findIndex(item2 => isEqual(item1, item2)) > -1
              );
              if (!combinedSchema[key].length) { return { allOf: [ ...schemas ] }; }
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case 'definitions':
            // Combine keys from both objects
            if (isObject(combinedValue) && isObject(schemaValue)) {
              const combinedObject = { ...combinedValue };
              for (const subKey of Object.keys(schemaValue)) {
                if (!hasOwn(combinedObject, subKey) ||
                  isEqual(combinedObject[subKey], schemaValue[subKey])
                ) {
                  combinedObject[subKey] = schemaValue[subKey];
                // Don't combine matching keys with different values
                } else {
                  return { allOf: [ ...schemas ] };
                }
              }
              combinedSchema.definitions = combinedObject;
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case 'dependencies':
            // Combine all keys from both objects
            // and merge schemas on matching keys,
            // converting from arrays to objects if necessary
            if (isObject(combinedValue) && isObject(schemaValue)) {
              const combinedObject = { ...combinedValue };
              for (const subKey of Object.keys(schemaValue)) {
                if (!hasOwn(combinedObject, subKey) ||
                  isEqual(combinedObject[subKey], schemaValue[subKey])
                ) {
                  combinedObject[subKey] = schemaValue[subKey];
                // If both keys are arrays, include all items from both arrays,
                // excluding duplicates
                } else if (
                  isArray(schemaValue[subKey]) && isArray(combinedObject[subKey])
                ) {
                  combinedObject[subKey] =
                    uniqueItems(...combinedObject[subKey], ...schemaValue[subKey]);
                // If either key is an object, merge the schemas
                } else if (
                  (isArray(schemaValue[subKey]) || isObject(schemaValue[subKey])) &&
                  (isArray(combinedObject[subKey]) || isObject(combinedObject[subKey]))
                ) {
                  // If either key is an array, convert it to an object first
                  const required = isArray(combinedSchema.required) ?
                    combinedSchema.required : [];
                  const combinedDependency = isArray(combinedObject[subKey]) ?
                    { required: uniqueItems(...required, combinedObject[subKey]) } :
                    combinedObject[subKey];
                  const schemaDependency = isArray(schemaValue[subKey]) ?
                    { required: uniqueItems(...required, schemaValue[subKey]) } :
                    schemaValue[subKey];
                  combinedObject[subKey] =
                    mergeSchemas(combinedDependency, schemaDependency);
                } else {
                  return { allOf: [ ...schemas ] };
                }
              }
              combinedSchema.dependencies = combinedObject;
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case 'items':
            // If arrays, keep only items that appear in both arrays
            if (isArray(combinedValue) && isArray(schemaValue)) {
              combinedSchema.items = combinedValue.filter(item1 =>
                schemaValue.findIndex(item2 => isEqual(item1, item2)) > -1
              );
              if (!combinedSchema.items.length) { return { allOf: [ ...schemas ] }; }
            // If both keys are objects, merge them
            } else if (isObject(combinedValue) && isObject(schemaValue)) {
              combinedSchema.items = mergeSchemas(combinedValue, schemaValue);
            // If object + array, combine object with each array item
            } else if (isArray(combinedValue) && isObject(schemaValue)) {
              combinedSchema.items =
                combinedValue.map(item => mergeSchemas(item, schemaValue));
            } else if (isObject(combinedValue) && isArray(schemaValue)) {
              combinedSchema.items =
                schemaValue.map(item => mergeSchemas(item, combinedValue));
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case 'multipleOf':
            // TODO: Adjust to correctly handle decimal values
            // If numbers, set to least common multiple
            if (isNumber(combinedValue) && isNumber(schemaValue)) {
              const gcd = (x, y) => !y ? x : gcd(y, x % y);
              const lcm = (x, y) => (x * y) / gcd(x, y);
              combinedSchema.multipleOf = lcm(combinedValue, schemaValue);
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case 'maximum': case 'exclusiveMaximum': case 'maxLength':
          case 'maxItems': case 'maxProperties':
            // If numbers, set to lowest value
            if (isNumber(combinedValue) && isNumber(schemaValue)) {
              combinedSchema[key] = Math.min(combinedValue, schemaValue);
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case 'minimum': case 'exclusiveMinimum': case 'minLength':
          case 'minItems': case 'minProperties':
            // If numbers, set to highest value
            if (isNumber(combinedValue) && isNumber(schemaValue)) {
              combinedSchema[key] = Math.max(combinedValue, schemaValue);
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case 'not':
            // Combine not values into anyOf array
            if (isObject(combinedValue) && isObject(schemaValue)) {
              const notAnyOf = [combinedValue, schemaValue]
                .reduce((notAnyOfArray, notSchema) =>
                  isArray(notSchema.anyOf) &&
                  Object.keys(notSchema).length === 1 ?
                    [ ...notAnyOfArray, ...notSchema.anyOf ] :
                    [ ...notAnyOfArray, notSchema ]
                , []);
              // TODO: Remove duplicate items from array
              combinedSchema.not = { anyOf: notAnyOf };
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case 'patternProperties':
            // Combine all keys from both objects
            // and merge schemas on matching keys
            if (isObject(combinedValue) && isObject(schemaValue)) {
              const combinedObject = { ...combinedValue };
              for (const subKey of Object.keys(schemaValue)) {
                if (!hasOwn(combinedObject, subKey) ||
                  isEqual(combinedObject[subKey], schemaValue[subKey])
                ) {
                  combinedObject[subKey] = schemaValue[subKey];
                // If both keys are objects, merge them
                } else if (
                  isObject(schemaValue[subKey]) && isObject(combinedObject[subKey])
                ) {
                  combinedObject[subKey] =
                    mergeSchemas(combinedObject[subKey], schemaValue[subKey]);
                } else {
                  return { allOf: [ ...schemas ] };
                }
              }
              combinedSchema.patternProperties = combinedObject;
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case 'properties':
            // Combine all keys from both objects
            // unless additionalProperties === false
            // and merge schemas on matching keys
            if (isObject(combinedValue) && isObject(schemaValue)) {
              const combinedObject = { ...combinedValue };
              // If new schema has additionalProperties,
              // merge or remove non-matching property keys in combined schema
              if (hasOwn(schemaValue, 'additionalProperties')) {
                Object.keys(combinedValue)
                  .filter(combinedKey => !Object.keys(schemaValue).includes(combinedKey))
                  .forEach(nonMatchingKey => {
                    if (schemaValue.additionalProperties === false) {
                      delete combinedObject[nonMatchingKey];
                    } else if (isObject(schemaValue.additionalProperties)) {
                      combinedObject[nonMatchingKey] = mergeSchemas(
                        combinedObject[nonMatchingKey],
                        schemaValue.additionalProperties
                      );
                    }
                  });
              }
              for (const subKey of Object.keys(schemaValue)) {
                if (isEqual(combinedObject[subKey], schemaValue[subKey]) || (
                  !hasOwn(combinedObject, subKey) &&
                  !hasOwn(combinedObject, 'additionalProperties')
                )) {
                  combinedObject[subKey] = schemaValue[subKey];
                // If combined schema has additionalProperties,
                // merge or ignore non-matching property keys in new schema
                } else if (
                  !hasOwn(combinedObject, subKey) &&
                  hasOwn(combinedObject, 'additionalProperties')
                ) {
                  // If combinedObject.additionalProperties === false,
                  // do nothing (don't set key)
                  // If additionalProperties is object, merge with new key
                  if (isObject(combinedObject.additionalProperties)) {
                    combinedObject[subKey] = mergeSchemas(
                      combinedObject.additionalProperties, schemaValue[subKey]
                    );
                  }
                // If both keys are objects, merge them
                } else if (
                  isObject(schemaValue[subKey]) &&
                  isObject(combinedObject[subKey])
                ) {
                  combinedObject[subKey] =
                    mergeSchemas(combinedObject[subKey], schemaValue[subKey]);
                } else {
                  return { allOf: [ ...schemas ] };
                }
              }
              combinedSchema.properties = combinedObject;
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case 'required':
            // If arrays, include all items from both arrays, excluding duplicates
            if (isArray(combinedValue) && isArray(schemaValue)) {
              combinedSchema.required = uniqueItems(...combinedValue, ...schemaValue);
            // If booleans, aet true if either true
            } else if (
              typeof schemaValue === 'boolean' &&
              typeof combinedValue === 'boolean'
            ) {
              combinedSchema.required = !!combinedValue || !!schemaValue;
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case '$schema': case '$id': case 'id':
            // Don't combine these keys
          break;
          case 'title': case 'description': case '$comment':
            // Return the last value, overwriting any previous one
            // These properties are not used for validation, so conflicts don't matter
            combinedSchema[key] = schemaValue;
          break;
          case 'type':
            if (
              (isArray(schemaValue) || isString(schemaValue)) &&
              (isArray(combinedValue) || isString(combinedValue))
            ) {
              const combinedTypes = commonItems(combinedValue, schemaValue);
              if (!combinedTypes.length) { return { allOf: [ ...schemas ] }; }
              combinedSchema.type = combinedTypes.length > 1 ? combinedTypes : combinedTypes[0];
            } else {
              return { allOf: [ ...schemas ] };
            }
          break;
          case 'uniqueItems':
            // Set true if either true
            combinedSchema.uniqueItems = !!combinedValue || !!schemaValue;
          break;
          default:
            return { allOf: [ ...schemas ] };
        }
      }
    }
  }
  return combinedSchema;
}
