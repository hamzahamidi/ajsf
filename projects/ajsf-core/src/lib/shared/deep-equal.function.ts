import { isDate } from './validator.functions';

// typeof is 'object' for Date, RegExp, Map, Set and arrays too, none of which an
// own-key walk compares correctly: they have no own enumerable keys, so any two
// of them would read as equal.
function isPlainObject(value: any): boolean {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * 'deepEqual' function
 *
 * Structural equality for JSON Schema values and form data: primitives by
 * SameValueZero, Dates by timestamp, arrays by index, plain objects by own
 * enumerable keys in any order. Any other object compares by reference.
 * Input must be acyclic.
 *
 * // {any} value1 - first value
 * // {any} value2 - second value
 * // {boolean} - true if structurally equal
 */
export function deepEqual(value1: any, value2: any): boolean {
  if (value1 === value2) { return true; }
  if (value1 !== value1 && value2 !== value2) { return true; }
  if (isDate(value1) || isDate(value2)) {
    return isDate(value1) && isDate(value2) &&
      value1.getTime() === value2.getTime();
  }
  const isArray1 = Array.isArray(value1);
  if (isArray1 !== Array.isArray(value2)) { return false; }
  if (isArray1) {
    if (value1.length !== value2.length) { return false; }
    for (let i = 0; i < value1.length; i++) {
      if (!deepEqual(value1[i], value2[i])) { return false; }
    }
    return true;
  }
  if (!isPlainObject(value1) || !isPlainObject(value2)) { return false; }
  const keys1 = Object.keys(value1);
  if (keys1.length !== Object.keys(value2).length) { return false; }
  return keys1.every(key =>
    Object.prototype.hasOwnProperty.call(value2, key) &&
    deepEqual(value1[key], value2[key])
  );
}
