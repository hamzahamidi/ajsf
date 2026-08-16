import { isDate, isMap, isSet } from './validator.functions';

function isRegExp(item: any): boolean {
  return !!item && Object.prototype.toString.call(item) === '[object RegExp]';
}

function clone(value: any, seen: WeakMap<any, any>): any {
  if (value === null || typeof value !== 'object') { return value; }
  if (seen.has(value)) { return seen.get(value); }
  if (isDate(value)) { return new Date(value.getTime()); }
  if (isRegExp(value)) {
    const pattern = new RegExp(value.source, value.flags);
    pattern.lastIndex = value.lastIndex;
    return pattern;
  }
  let copy: any;
  if (Array.isArray(value)) {
    copy = new Array(value.length);
    seen.set(value, copy);
    for (let i = 0; i < value.length; i++) {
      if (i in value) { copy[i] = clone(value[i], seen); }
    }
  } else if (isMap(value)) {
    copy = new Map();
    seen.set(value, copy);
    value.forEach((item: any, key: any) => copy.set(key, clone(item, seen)));
  } else if (isSet(value)) {
    copy = new Set();
    seen.set(value, copy);
    value.forEach((item: any) => copy.add(clone(item, seen)));
  } else {
    copy = Object.create(Object.getPrototypeOf(value));
    seen.set(value, copy);
    Object.keys(value).forEach(key => copy[key] = clone(value[key], seen));
  }
  return copy;
}

/**
 * 'cloneDeep' function
 *
 * Recursively copies plain objects, arrays, Dates, RegExps, Maps and Sets.
 * Functions and class references are carried over unchanged, which is why
 * structuredClone cannot be used here: layout nodes hold Angular component
 * classes and the validation messages hold formatter functions.
 *
 * // {any} value - the value to copy
 * // {any} - the copy
 */
export function cloneDeep<T>(value: T): T {
  return clone(value, new WeakMap());
}
