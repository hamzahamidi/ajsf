import { deepEqual } from './deep-equal.function';
import { commonItems, hasOwn, uniqueItems } from './utility.functions';
import { isArray, isNumber, isObject, isString } from './validator.functions';

type SchemaRecord = Record<string, any>;
type MergeSchemas = (...schemas: any[]) => any;

interface MergeSchemaContext {
  key: string;
  schema: SchemaRecord;
  combinedSchema: SchemaRecord;
  priorAdditional: any[];
  mergeSchemas: MergeSchemas;
}

type MergeHandler = (
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
) => boolean;

function assign(context: MergeSchemaContext, value: any): void {
  context.combinedSchema[context.key] = value;
}

function mergeAllOf(combinedValue: any, schemaValue: any, context: MergeSchemaContext): boolean {
  if (!isArray(combinedValue) || !isArray(schemaValue)) return false;
  assign(context, [...combinedValue, ...schemaValue]);
  return true;
}

function mergeSchemaObjects(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  if (!isObject(combinedValue) || !isObject(schemaValue)) return false;
  assign(context, context.mergeSchemas(combinedValue, schemaValue));
  return true;
}

function mergeAdditionalProperties(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  if (isObject(combinedValue) && isObject(schemaValue)) {
    assign(context, context.mergeSchemas(combinedValue, schemaValue));
    return true;
  }
  if (combinedValue !== false && schemaValue !== false) return false;
  assign(context, false);
  return true;
}

function mergeArrayIntersection(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  if (!isArray(combinedValue) || !isArray(schemaValue)) return false;
  const intersection = combinedValue.filter(item =>
    schemaValue.some(candidate => deepEqual(item, candidate))
  );
  if (!intersection.length) return false;
  assign(context, intersection);
  return true;
}

function mergeDefinitions(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  if (!isObject(combinedValue) || !isObject(schemaValue)) return false;
  const combinedObject = { ...combinedValue };
  for (const key of Object.keys(schemaValue)) {
    if (hasOwn(combinedObject, key) && !deepEqual(combinedObject[key], schemaValue[key])) {
      return false;
    }
    combinedObject[key] = schemaValue[key];
  }
  assign(context, combinedObject);
  return true;
}

function mergeDependencyValue(
  combinedObject: SchemaRecord,
  key: string,
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): { merged: boolean; value: any } {
  if (!hasOwn(combinedObject, key) ||
    deepEqual(combinedValue, schemaValue)
  ) {
    return { merged: true, value: schemaValue };
  }
  if (isArray(schemaValue) && isArray(combinedValue)) {
    return { merged: true, value: uniqueItems(...combinedValue, ...schemaValue) };
  }
  if (
    (isArray(schemaValue) || isObject(schemaValue)) &&
    (isArray(combinedValue) || isObject(combinedValue))
  ) {
    const required = isArray(context.combinedSchema.required) ?
      context.combinedSchema.required : [];
    const combinedDependency = isArray(combinedValue) ?
      { required: uniqueItems(...required, ...combinedValue) } : combinedValue;
    const schemaDependency = isArray(schemaValue) ?
      { required: uniqueItems(...required, ...schemaValue) } : schemaValue;
    return {
      merged: true,
      value: context.mergeSchemas(combinedDependency, schemaDependency),
    };
  }
  return { merged: false, value: undefined };
}

function mergeDependencies(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  if (!isObject(combinedValue) || !isObject(schemaValue)) return false;
  const combinedObject = { ...combinedValue };
  for (const key of Object.keys(schemaValue)) {
    const result = mergeDependencyValue(
      combinedObject, key, combinedObject[key], schemaValue[key], context
    );
    if (!result.merged) return false;
    combinedObject[key] = result.value;
  }
  assign(context, combinedObject);
  return true;
}

function mergeTupleItems(
  combinedValue: any[],
  schemaValue: any[],
  context: MergeSchemaContext
): any[] {
  const tupleLength = Math.max(combinedValue.length, schemaValue.length);
  const merged = [];
  for (let slot = 0; slot < tupleLength; slot++) {
    const inCombined = slot < combinedValue.length;
    const inSchema = slot < schemaValue.length;
    if (inCombined && inSchema) {
      merged.push(context.mergeSchemas(combinedValue[slot], schemaValue[slot]));
      continue;
    }
    const own = inCombined ? combinedValue[slot] : schemaValue[slot];
    const otherAdditional = inCombined ?
      context.schema.additionalItems : context.combinedSchema.additionalItems;
    merged.push(isObject(otherAdditional) ?
      context.mergeSchemas(own, otherAdditional) : own);
  }
  return merged;
}

function mergeItems(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  if (isArray(combinedValue) && isArray(schemaValue)) {
    assign(context, mergeTupleItems(combinedValue, schemaValue, context));
    return true;
  }
  if (isArray(combinedValue) && isObject(schemaValue)) {
    assign(context, combinedValue.map(item => context.mergeSchemas(item, schemaValue)));
    return true;
  }
  if (isObject(combinedValue) && isArray(schemaValue)) {
    assign(context, schemaValue.map(item => context.mergeSchemas(item, combinedValue)));
    return true;
  }
  return mergeSchemaObjects(combinedValue, schemaValue, context);
}

function mergeMultipleOf(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  if (!isNumber(combinedValue) || !isNumber(schemaValue)) return false;
  const multipleOf = leastCommonMultipleOfDecimals(combinedValue, schemaValue);
  if (multipleOf === null) return false;
  assign(context, multipleOf);
  return true;
}

function decimalPlaces(value: number): number {
  const [mantissa, exponentText] = value.toString().toLowerCase().split('e');
  const exponent = exponentText ? Number(exponentText) : 0;
  return Math.max(0, (mantissa.split('.')[1]?.length || 0) - exponent);
}

function greatestCommonDivisor(left: number, right: number): number {
  while (right) {
    [left, right] = [right, left % right];
  }
  return left;
}

function leastCommonMultipleOfDecimals(left: number, right: number): number|null {
  const numericLeft = Number(left);
  const numericRight = Number(right);
  if (
    !Number.isFinite(numericLeft) ||
    !Number.isFinite(numericRight) ||
    numericLeft <= 0 ||
    numericRight <= 0
  ) {
    return null;
  }
  const scale = 10 ** Math.max(decimalPlaces(numericLeft), decimalPlaces(numericRight));
  if (!Number.isSafeInteger(scale)) return null;
  const scaledLeft = Math.round(numericLeft * scale);
  const scaledRight = Math.round(numericRight * scale);
  if (!Number.isSafeInteger(scaledLeft) || !Number.isSafeInteger(scaledRight)) return null;
  const commonMultiple = (scaledLeft / greatestCommonDivisor(scaledLeft, scaledRight)) *
    scaledRight;
  if (!Number.isSafeInteger(commonMultiple)) return null;
  const result = commonMultiple / scale;
  return Number.isFinite(result) && result > 0 ? result : null;
}

function mergeNumericBoundary(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext,
  merge: (left: number, right: number) => number
): boolean {
  if (!isNumber(combinedValue) || !isNumber(schemaValue)) return false;
  assign(context, merge(combinedValue, schemaValue));
  return true;
}

function mergeNot(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  if (!isObject(combinedValue) || !isObject(schemaValue)) return false;
  const notAnyOf = [combinedValue, schemaValue].reduce((result, notSchema) =>
    isArray(notSchema.anyOf) && Object.keys(notSchema).length === 1 ?
      [...result, ...notSchema.anyOf] : [...result, notSchema], []
  );
  const uniqueNotAnyOf = notAnyOf.filter((notSchema, index) =>
    notAnyOf.findIndex(candidate => deepEqual(candidate, notSchema)) === index
  );
  assign(context, { anyOf: uniqueNotAnyOf });
  return true;
}

function mergePatternPropertyEntries(
  combinedObject: SchemaRecord,
  schemaValue: SchemaRecord,
  context: MergeSchemaContext
): boolean {
  for (const key of Object.keys(schemaValue)) {
    if (!hasOwn(combinedObject, key) || deepEqual(combinedObject[key], schemaValue[key])) {
      combinedObject[key] = schemaValue[key];
      continue;
    }
    if (!isObject(schemaValue[key]) || !isObject(combinedObject[key])) return false;
    combinedObject[key] = context.mergeSchemas(combinedObject[key], schemaValue[key]);
  }
  return true;
}

function mergePatternProperties(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  if (!isObject(combinedValue) || !isObject(schemaValue)) return false;
  const combinedObject = { ...combinedValue };
  if (!mergePatternPropertyEntries(combinedObject, schemaValue, context)) return false;
  context.combinedSchema.patternProperties = combinedObject;
  return true;
}

function mergeExistingProperties(
  combinedObject: SchemaRecord,
  schemaValue: SchemaRecord,
  newAdditional: any,
  context: MergeSchemaContext
): void {
  if (newAdditional === undefined) return;
  for (const key of Object.keys(combinedObject)) {
    if (hasOwn(schemaValue, key)) continue;
    if (newAdditional === false) {
      delete combinedObject[key];
    } else if (isObject(newAdditional)) {
      combinedObject[key] = context.mergeSchemas(combinedObject[key], newAdditional);
    }
  }
}

function mergeDeclaredProperty(
  combinedObject: SchemaRecord,
  schemaValue: SchemaRecord,
  key: string,
  context: MergeSchemaContext,
  priorForbids: boolean,
  priorConstraint: any
): boolean {
  const isNewKey = !hasOwn(combinedObject, key);
  if (deepEqual(combinedObject[key], schemaValue[key]) ||
    (isNewKey && !context.priorAdditional.length)
  ) {
    combinedObject[key] = schemaValue[key];
    return true;
  }
  if (!isNewKey) {
    if (!isObject(schemaValue[key]) || !isObject(combinedObject[key])) return false;
    combinedObject[key] = context.mergeSchemas(combinedObject[key], schemaValue[key]);
    return true;
  }
  if (priorConstraint) {
    combinedObject[key] = context.mergeSchemas(priorConstraint, schemaValue[key]);
  } else if (!priorForbids) {
    combinedObject[key] = schemaValue[key];
  }
  return true;
}

function mergeProperties(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  if (!isObject(combinedValue) || !isObject(schemaValue)) return false;
  const combinedObject = { ...combinedValue };
  const newAdditional = hasOwn(context.schema, 'additionalProperties') ?
    context.schema.additionalProperties : undefined;
  mergeExistingProperties(combinedObject, schemaValue, newAdditional, context);
  const priorForbids = context.priorAdditional.includes(false);
  const priorConstraint = context.priorAdditional.find(isObject);
  for (const key of Object.keys(schemaValue)) {
    if (!mergeDeclaredProperty(
      combinedObject, schemaValue, key, context, priorForbids, priorConstraint
    )) return false;
  }
  context.combinedSchema.properties = combinedObject;
  return true;
}

function mergeRequired(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  if (isArray(combinedValue) && isArray(schemaValue)) {
    assign(context, uniqueItems(...combinedValue, ...schemaValue));
    return true;
  }
  if (typeof combinedValue !== 'boolean' || typeof schemaValue !== 'boolean') return false;
  assign(context, !!combinedValue || !!schemaValue);
  return true;
}

function ignoreKeyword(): boolean {
  return true;
}

function overwriteKeyword(
  _combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  assign(context, schemaValue);
  return true;
}

function mergeType(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  if (
    !(isArray(schemaValue) || isString(schemaValue)) ||
    !(isArray(combinedValue) || isString(combinedValue))
  ) return false;
  const combinedTypes = commonItems(combinedValue, schemaValue);
  if (!combinedTypes.length) return false;
  assign(context, combinedTypes.length > 1 ? combinedTypes : combinedTypes[0]);
  return true;
}

function mergeUniqueItems(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  assign(context, !!combinedValue || !!schemaValue);
  return true;
}

function mergeMaximum(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  return mergeNumericBoundary(combinedValue, schemaValue, context, Math.min);
}

function mergeMinimum(
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  return mergeNumericBoundary(combinedValue, schemaValue, context, Math.max);
}

const mergeHandlers: Record<string, MergeHandler> = {
  allOf: mergeAllOf,
  additionalItems: mergeSchemaObjects,
  additionalProperties: mergeAdditionalProperties,
  contains: mergeSchemaObjects,
  propertyNames: mergeSchemaObjects,
  anyOf: mergeArrayIntersection,
  oneOf: mergeArrayIntersection,
  enum: mergeArrayIntersection,
  definitions: mergeDefinitions,
  dependencies: mergeDependencies,
  items: mergeItems,
  multipleOf: mergeMultipleOf,
  maximum: mergeMaximum,
  exclusiveMaximum: mergeMaximum,
  maxLength: mergeMaximum,
  maxItems: mergeMaximum,
  maxProperties: mergeMaximum,
  minimum: mergeMinimum,
  exclusiveMinimum: mergeMinimum,
  minLength: mergeMinimum,
  minItems: mergeMinimum,
  minProperties: mergeMinimum,
  not: mergeNot,
  patternProperties: mergePatternProperties,
  properties: mergeProperties,
  required: mergeRequired,
  '$schema': ignoreKeyword,
  '$id': ignoreKeyword,
  id: ignoreKeyword,
  title: overwriteKeyword,
  description: overwriteKeyword,
  '$comment': overwriteKeyword,
  type: mergeType,
  uniqueItems: mergeUniqueItems,
};

export function mergeSchemaKeyword(
  key: string,
  combinedValue: any,
  schemaValue: any,
  context: MergeSchemaContext
): boolean {
  context.key = key;
  const handler = hasOwn(mergeHandlers, key) ? mergeHandlers[key] : undefined;
  return handler ? handler(combinedValue, schemaValue, context) : false;
}
