import { AbstractControl } from '@angular/forms';
import { from, Observable } from 'rxjs';

/**
 * Validator utility function library:
 *
 * Validator and error utilities:
 *   _executeValidators, _executeAsyncValidators, _mergeObjects, _mergeErrors
 *
 * Individual value checking:
 *   isDefined, hasValue, isEmpty
 *
 * Individual type checking:
 *   isString, isNumber, isInteger, isBoolean, isFunction, isObject, isArray,
 *   isMap, isSet, isPromise, isObservable
 *
 * Multiple type checking and fixing:
 *   getType, isType, isPrimitive, toJavaScriptType, toSchemaType,
 *   _toPromise, toObservable
 *
 * Utility functions:
 *   inArray, xor
 *
 * Typescript types and interfaces:
 *   SchemaPrimitiveType, SchemaType, JavaScriptPrimitiveType, JavaScriptType,
 *   PrimitiveValue, PlainObject, IValidatorFn, AsyncIValidatorFn
 *
 * Note: 'IValidatorFn' is short for 'invertable validator function',
 *   which is a validator functions that accepts an optional second
 *   argument which, if set to TRUE, causes the validator to perform
 *   the opposite of its original function.
 */

export type SchemaPrimitiveType =
  'string' | 'number' | 'integer' | 'boolean' | 'null';
export type SchemaType =
  'string' | 'number' | 'integer' | 'boolean' | 'null' | 'object' | 'array';
export type JavaScriptPrimitiveType =
  'string' | 'number' | 'boolean' | 'null' | 'undefined';
export type JavaScriptType =
  'string' | 'number' | 'boolean' | 'null' | 'undefined' | 'object' | 'array' |
  'map' | 'set' | 'arguments' | 'date' | 'error' | 'function' | 'json' |
  'math' | 'regexp'; // Note: this list is incomplete
export type PrimitiveValue = string | number | boolean | null | undefined;
export interface PlainObject { [k: string]: any; }

export type IValidatorFn = (c: AbstractControl, i?: boolean) => PlainObject;
export type AsyncIValidatorFn = (c: AbstractControl, i?: boolean) => any;

/**
 * '_executeValidators' utility function
 *
 * Validates a control against an array of validators, and returns
 * an array of the same length containing a combination of error messages
 * (from invalid validators) and null values (from valid validators)
 *
 * //  { AbstractControl } control - control to validate
 * //  { IValidatorFn[] } validators - array of validators
 * //  { boolean } invert - invert?
 * // { PlainObject[] } - array of nulls and error message
 */
export function _executeValidators(control, validators, invert = false) {
  return validators.map(validator => validator(control, invert));
}

/**
 * '_executeAsyncValidators' utility function
 *
 * Validates a control against an array of async validators, and returns
 * an array of observabe results of the same length containing a combination of
 * error messages (from invalid validators) and null values (from valid ones)
 *
 * //  { AbstractControl } control - control to validate
 * //  { AsyncIValidatorFn[] } validators - array of async validators
 * //  { boolean } invert - invert?
 * //  - array of observable nulls and error message
 */
export function _executeAsyncValidators(control, validators, invert = false) {
  return validators.map(validator => validator(control, invert));
}

/**
 * '_mergeObjects' utility function
 *
 * Recursively Merges one or more objects into a single object with combined keys.
 * Automatically detects and ignores null and undefined inputs.
 * Also detects duplicated boolean 'not' keys and XORs their values.
 *
 * //  { PlainObject[] } objects - one or more objects to merge
 * // { PlainObject } - merged object
 */
export function _mergeObjects(...objects) {
  const mergedObject: PlainObject = { };
  for (const currentObject of objects) {
    if (isObject(currentObject)) {
      for (const key of Object.keys(currentObject)) {
        const currentValue = currentObject[key];
        const mergedValue = mergedObject[key];
        mergedObject[key] = !isDefined(mergedValue) ? currentValue :
          key === 'not' && isBoolean(mergedValue, 'strict') &&
            isBoolean(currentValue, 'strict') ? xor(mergedValue, currentValue) :
          getType(mergedValue) === 'object' && getType(currentValue) === 'object' ?
            _mergeObjects(mergedValue, currentValue) :
            currentValue;
      }
    }
  }
  return mergedObject;
}

/**
 * '_mergeErrors' utility function
 *
 * Merges an array of objects.
 * Used for combining the validator errors returned from 'executeValidators'
 *
 * //  { PlainObject[] } arrayOfErrors - array of objects
 * // { PlainObject } - merged object, or null if no usable input objectcs
 */
export function _mergeErrors(arrayOfErrors) {
  const mergedErrors = _mergeObjects(...arrayOfErrors);
  return isEmpty(mergedErrors) ? null : mergedErrors;
}

/**
 * 'isDefined' utility function
 *
 * Checks if a variable contains a value of any type.
 * Returns true even for otherwise 'falsey' values of 0, '', and false.
 *
 * //   value - the value to check
 * // { boolean } - false if undefined or null, otherwise true
 */
export function isDefined(value) {
  return value !== undefined && value !== null;
}

/**
 * 'hasValue' utility function
 *
 * Checks if a variable contains a value.
 * Returs false for null, undefined, or a zero-length strng, '',
 * otherwise returns true.
 * (Stricter than 'isDefined' because it also returns false for '',
 * though it stil returns true for otherwise 'falsey' values 0 and false.)
 *
 * //   value - the value to check
 * // { boolean } - false if undefined, null, or '', otherwise true
 */
export function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

/**
 * 'isEmpty' utility function
 *
 * Similar to !hasValue, but also returns true for empty arrays and objects.
 *
 * //   value - the value to check
 * // { boolean } - false if undefined, null, or '', otherwise true
 */
export function isEmpty(value) {
  if (isArray(value)) { return !value.length; }
  if (isObject(value)) { return !Object.keys(value).length; }
  return value === undefined || value === null || value === '';
}

/**
 * 'isString' utility function
 *
 * Checks if a value is a string.
 *
 * //   value - the value to check
 * // { boolean } - true if string, false if not
 */
export function isString(value) {
  return typeof value === 'string';
}

/**
 * 'isNumber' utility function
 *
 * Checks if a value is a regular number, numeric string, or JavaScript Date.
 *
 * //   value - the value to check
 * //  { any = false } strict - if truthy, also checks JavaScript tyoe
 * // { boolean } - true if number, false if not
 */
export function isNumber(value, strict: any = false) {
  if (strict && typeof value !== 'number') { return false; }
  return !isNaN(value) && value !== value / 0;
}

/**
 * 'isInteger' utility function
 *
 * Checks if a value is an integer.
 *
 * //   value - the value to check
 * //  { any = false } strict - if truthy, also checks JavaScript tyoe
 * // {boolean } - true if number, false if not
 */
export function isInteger(value, strict: any = false) {
  if (strict && typeof value !== 'number') { return false; }
  return !isNaN(value) &&  value !== value / 0 && value % 1 === 0;
}

/**
 * 'isBoolean' utility function
 *
 * Checks if a value is a boolean.
 *
 * //   value - the value to check
 * //  { any = null } option - if 'strict', also checks JavaScript type
 *                              if TRUE or FALSE, checks only for that value
 * // { boolean } - true if boolean, false if not
 */
export function isBoolean(value, option: any = null) {
  if (option === 'strict') { return value === true || value === false; }
  if (option === true) {
    return value === true || value === 1 || value === 'true' || value === '1';
  }
  if (option === false) {
    return value === false || value === 0 || value === 'false' || value === '0';
  }
  return value === true || value === 1 || value === 'true' || value === '1' ||
    value === false || value === 0 || value === 'false' || value === '0';
}

export function isFunction(item: any): boolean {
  return typeof item === 'function';
}

export function isObject(item: any): boolean {
  return item !== null && typeof item === 'object' &&
    Object.prototype.toString.call(item) === '[object Object]';
}

export function isArray(item: any): boolean {
  return Array.isArray(item) ||
    Object.prototype.toString.call(item) === '[object Array]';
}

export function isDate(item: any): boolean {
  return typeof item === 'object' &&
    Object.prototype.toString.call(item) === '[object Date]';
}

export function isMap(item: any): boolean {
  return typeof item === 'object' &&
    Object.prototype.toString.call(item) === '[object Map]';
}

export function isSet(item: any): boolean {
  return typeof item === 'object' &&
    Object.prototype.toString.call(item) === '[object Set]';
}

export function isSymbol(item: any): boolean {
  return typeof item === 'symbol';
}

/**
 * 'getType' function
 *
 * Detects the JSON Schema Type of a value.
 * By default, detects numbers and integers even if formatted as strings.
 * (So all integers are also numbers, and any number may also be a string.)
 * However, it only detects true boolean values (to detect boolean values
 * in non-boolean formats, use isBoolean() instead).
 *
 * If passed a second optional parameter of 'strict', it will only detect
 * numbers and integers if they are formatted as JavaScript numbers.
 *
 * Examples:
 * getType('10.5') = 'number'
 * getType(10.5) = 'number'
 * getType('10') = 'integer'
 * getType(10) = 'integer'
 * getType('true') = 'string'
 * getType(true) = 'boolean'
 * getType(null) = 'null'
 * getType({ }) = 'object'
 * getType([]) = 'array'
 *
 * getType('10.5', 'strict') = 'string'
 * getType(10.5, 'strict') = 'number'
 * getType('10', 'strict') = 'string'
 * getType(10, 'strict') = 'integer'
 * getType('true', 'strict') = 'string'
 * getType(true, 'strict') = 'boolean'
 *
 * //   value - value to check
 * //  { any = false } strict - if truthy, also checks JavaScript tyoe
 * // { SchemaType }
 */
export function getType(value, strict: any = false) {
  if (!isDefined(value)) { return 'null'; }
  if (isArray(value)) { return 'array'; }
  if (isObject(value)) { return 'object'; }
  if (isBoolean(value, 'strict')) { return 'boolean'; }
  if (isInteger(value, strict)) { return 'integer'; }
  if (isNumber(value, strict)) { return 'number'; }
  if (isString(value) || (!strict && isDate(value))) { return 'string'; }
  return null;
}

/**
 * 'isType' function
 *
 * Checks wether an input (probably string) value contains data of
 * a specified JSON Schema type
 *
 * //  { PrimitiveValue } value - value to check
 * //  { SchemaPrimitiveType } type - type to check
 * // { boolean }
 */
export function isType(value, type) {
  switch (type) {
    case 'string':
      return isString(value) || isDate(value);
    case 'number':
      return isNumber(value);
    case 'integer':
      return isInteger(value);
    case 'boolean':
      return isBoolean(value);
    case 'null':
      return !hasValue(value);
    default:
      console.error(`isType error: "${type}" is not a recognized type.`);
      return null;
  }
}

/**
 * 'isPrimitive' function
 *
 * Checks wether an input value is a JavaScript primitive type:
 * string, number, boolean, or null.
 *
 * //   value - value to check
 * // { boolean }
 */
export function isPrimitive(value) {
  return (isString(value) || isNumber(value) ||
    isBoolean(value, 'strict') || value === null);
}

/**
 * 'toJavaScriptType' function
 *
 * Converts an input (probably string) value to a JavaScript primitive type -
 * 'string', 'number', 'boolean', or 'null' - before storing in a JSON object.
 *
 * Does not coerce values (other than null), and only converts the types
 * of values that would otherwise be valid.
 *
 * If the optional third parameter 'strictIntegers' is TRUE, and the
 * JSON Schema type 'integer' is specified, it also verifies the input value
 * is an integer and, if it is, returns it as a JaveScript number.
 * If 'strictIntegers' is FALSE (or not set) the type 'integer' is treated
 * exactly the same as 'number', and allows decimals.
 *
 * Valid Examples:
 * toJavaScriptType('10',   'number' ) = 10   // '10'   is a number
 * toJavaScriptType('10',   'integer') = 10   // '10'   is also an integer
 * toJavaScriptType( 10,    'integer') = 10   //  10    is still an integer
 * toJavaScriptType( 10,    'string' ) = '10' //  10    can be made into a string
 * toJavaScriptType('10.5', 'number' ) = 10.5 // '10.5' is a number
 *
 * Invalid Examples:
 * toJavaScriptType('10.5', 'integer') = null // '10.5' is not an integer
 * toJavaScriptType( 10.5,  'integer') = null //  10.5  is still not an integer
 *
 * //  { PrimitiveValue } value - value to convert
 * //  { SchemaPrimitiveType | SchemaPrimitiveType[] } types - types to convert to
 * //  { boolean = false } strictIntegers - if FALSE, treat integers as numbers
 * // { PrimitiveValue }
 */
export function toJavaScriptType(value, types, strictIntegers = true)  {
  if (!isDefined(value)) { return null; }
  if (isString(types)) { types = [types]; }
  if (strictIntegers && inArray('integer', types)) {
    if (isInteger(value, 'strict')) { return value; }
    if (isInteger(value)) { return parseInt(value, 10); }
  }
  if (inArray('number', types) || (!strictIntegers && inArray('integer', types))) {
    if (isNumber(value, 'strict')) { return value; }
    if (isNumber(value)) { return parseFloat(value); }
  }
  if (inArray('string', types)) {
    if (isString(value)) { return value; }
    // If value is a date, and types includes 'string',
    // convert the date to a string
    if (isDate(value)) { return value.toISOString().slice(0, 10); }
    if (isNumber(value)) { return value.toString(); }
  }
  // If value is a date, and types includes 'integer' or 'number',
  // but not 'string', convert the date to a number
  if (isDate(value) && (inArray('integer', types) || inArray('number', types))) {
    return value.getTime();
  }
  if (inArray('boolean', types)) {
    if (isBoolean(value, true)) { return true; }
    if (isBoolean(value, false)) { return false; }
  }
  return null;
}

/**
 * 'toSchemaType' function
 *
 * Converts an input (probably string) value to the "best" JavaScript
 * equivalent available from an allowed list of JSON Schema types, which may
 * contain 'string', 'number', 'integer', 'boolean', and/or 'null'.
 * If necssary, it does progressively agressive type coersion.
 * It will not return null unless null is in the list of allowed types.
 *
 * Number conversion examples:
 * toSchemaType('10', ['number','integer','string']) = 10 // integer
 * toSchemaType('10', ['number','string']) = 10 // number
 * toSchemaType('10', ['string']) = '10' // string
 * toSchemaType('10.5', ['number','integer','string']) = 10.5 // number
 * toSchemaType('10.5', ['integer','string']) = '10.5' // string
 * toSchemaType('10.5', ['integer']) = 10 // integer
 * toSchemaType(10.5, ['null','boolean','string']) = '10.5' // string
 * toSchemaType(10.5, ['null','boolean']) = true // boolean
 *
 * String conversion examples:
 * toSchemaType('1.5x', ['boolean','number','integer','string']) = '1.5x' // string
 * toSchemaType('1.5x', ['boolean','number','integer']) = '1.5' // number
 * toSchemaType('1.5x', ['boolean','integer']) = '1' // integer
 * toSchemaType('1.5x', ['boolean']) = true // boolean
 * toSchemaType('xyz', ['number','integer','boolean','null']) = true // boolean
 * toSchemaType('xyz', ['number','integer','null']) = null // null
 * toSchemaType('xyz', ['number','integer']) = 0 // number
 *
 * Boolean conversion examples:
 * toSchemaType('1', ['integer','number','string','boolean']) = 1 // integer
 * toSchemaType('1', ['number','string','boolean']) = 1 // number
 * toSchemaType('1', ['string','boolean']) = '1' // string
 * toSchemaType('1', ['boolean']) = true // boolean
 * toSchemaType('true', ['number','string','boolean']) = 'true' // string
 * toSchemaType('true', ['boolean']) = true // boolean
 * toSchemaType('true', ['number']) = 0 // number
 * toSchemaType(true, ['number','string','boolean']) = true // boolean
 * toSchemaType(true, ['number','string']) = 'true' // string
 * toSchemaType(true, ['number']) = 1 // number
 *
 * //  { PrimitiveValue } value - value to convert
 * //  { SchemaPrimitiveType | SchemaPrimitiveType[] } types - allowed types to convert to
 * // { PrimitiveValue }
 */
export function toSchemaType(value, types) {
  if (!isArray(<SchemaPrimitiveType>types)) {
    types = <SchemaPrimitiveType[]>[types];
  }
  if ((<SchemaPrimitiveType[]>types).includes('null') && !hasValue(value)) {
    return null;
  }
  if ((<SchemaPrimitiveType[]>types).includes('boolean') && !isBoolean(value, 'strict')) {
    return value;
  }
  if ((<SchemaPrimitiveType[]>types).includes('integer')) {
    const testValue = toJavaScriptType(value, 'integer');
    if (testValue !== null) { return +testValue; }
  }
  if ((<SchemaPrimitiveType[]>types).includes('number')) {
    const testValue = toJavaScriptType(value, 'number');
    if (testValue !== null) { return +testValue; }
  }
  if (
    (isString(value) || isNumber(value, 'strict')) &&
    (<SchemaPrimitiveType[]>types).includes('string')
  ) { // Convert number to string
    return toJavaScriptType(value, 'string');
  }
  if ((<SchemaPrimitiveType[]>types).includes('boolean') && isBoolean(value)) {
    return toJavaScriptType(value, 'boolean');
  }
  if ((<SchemaPrimitiveType[]>types).includes('string')) { // Convert null & boolean to string
    if (value === null) { return ''; }
    const testValue = toJavaScriptType(value, 'string');
    if (testValue !== null) { return testValue; }
  }
  if ((
    (<SchemaPrimitiveType[]>types).includes('number') ||
    (<SchemaPrimitiveType[]>types).includes('integer'))
  ) {
    if (value === true) { return 1; } // Convert boolean & null to number
    if (value === false || value === null || value === '') { return 0; }
  }
  if ((<SchemaPrimitiveType[]>types).includes('number')) { // Convert mixed string to number
    const testValue = parseFloat(<string>value);
    if (!!testValue) { return testValue; }
  }
  if ((<SchemaPrimitiveType[]>types).includes('integer')) { // Convert string or number to integer
    const testValue = parseInt(<string>value, 10);
    if (!!testValue) { return testValue; }
  }
  if ((<SchemaPrimitiveType[]>types).includes('boolean')) { // Convert anything to boolean
    return !!value;
  }
  if ((
      (<SchemaPrimitiveType[]>types).includes('number') ||
      (<SchemaPrimitiveType[]>types).includes('integer')
    ) && !(<SchemaPrimitiveType[]>types).includes('null')
  ) {
    return 0; // If null not allowed, return 0 for non-convertable values
  }
}

/**
 * 'isPromise' function
 *
 * //   object
 * // { boolean }
 */
export function isPromise(object): object is Promise<any> {
  return !!object && typeof object.then === 'function';
}

/**
 * 'isObservable' function
 *
 * //   object
 * // { boolean }
 */
export function isObservable(object): object is Observable<any> {
  return !!object && typeof object.subscribe === 'function';
}

/**
 * '_toPromise' function
 *
 * //  { object } object
 * // { Promise<any> }
 */
export function _toPromise(object): Promise<any> {
  return isPromise(object) ? object : object.toPromise();
}

/**
 * 'toObservable' function
 *
 * //  { object } object
 * // { Observable<any> }
 */
export function toObservable(object): Observable<any> {
  const observable = isPromise(object) ? from(object) : object;
  if (isObservable(observable)) { return observable; }
  console.error('toObservable error: Expected validator to return Promise or Observable.');
  return new Observable();
}

/**
 * 'inArray' function
 *
 * Searches an array for an item, or one of a list of items, and returns true
 * as soon as a match is found, or false if no match.
 *
 * If the optional third parameter allIn is set to TRUE, and the item to find
 * is an array, then the function returns true only if all elements from item
 * are found in the array list, and false if any element is not found. If the
 * item to find is not an array, setting allIn to TRUE has no effect.
 *
 * //  { any|any[] } item - the item to search for
 * //   array - the array to search
 * //  { boolean = false } allIn - if TRUE, all items must be in array
 * // { boolean } - true if item(s) in array, false otherwise
 */
export function inArray(item, array, allIn = false) {
  if (!isDefined(item) || !isArray(array)) { return false; }
  return isArray(item) ?
    item[allIn ? 'every' : 'some'](subItem => array.includes(subItem)) :
    array.includes(item);
}

/**
 * 'xor' utility function - exclusive or
 *
 * Returns true if exactly one of two values is truthy.
 *
 * //   value1 - first value to check
 * //   value2 - second value to check
 * // { boolean } - true if exactly one input value is truthy, false if not
 */
export function xor(value1, value2) {
  return (!!value1 && !value2) || (!value1 && !!value2);
}
