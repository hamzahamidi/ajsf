import { Observable, of } from "rxjs";
import {
  _executeAsyncValidators,
  _executeValidators,
  _mergeErrors,
  _mergeObjects,
  _toPromise,
  getType,
  hasValue,
  inArray,
  isArray,
  isBoolean,
  isDate,
  isDefined,
  isEmpty,
  isFunction,
  isInteger,
  isMap,
  isNumber,
  isObject,
  isObservable,
  isPrimitive,
  isPromise,
  isSet,
  isString,
  isSymbol,
  isType,
  toIsoString,
  toJavaScriptType,
  toObservable,
  toSchemaType,
  xor,
} from "./validator.functions";

describe("Validator functions", () => {
  describe("toIsoString", () => {
    it("should work with timezone", () => {
      expect(toIsoString(new Date("05 October 2011 14:48 UTC"))).toEqual(
        "2011-10-05"
      );
    });
  });
  describe("toJavaScriptType", () => {
    it("Converts an input (probably string) value to a JavaScript primitive type 'string', 'number', 'boolean', or 'null' - before storing in a JSON object.", () => {
      expect(toJavaScriptType("10", "number")).toEqual(10);
      expect(toJavaScriptType("10", "integer")).toEqual(10);
      expect(toJavaScriptType(10, "integer")).toEqual(10);
      expect(toJavaScriptType(10, "string")).toEqual("10");
      expect(toJavaScriptType("10.5", "integer")).toEqual(null);
      expect(toJavaScriptType(10.5, "integer")).toEqual(null);
    });
  });
  describe("toSchemaType", () => {
    it("Number conversion examples", () => {
      expect(toSchemaType(10, ["number", "integer", "string"])).toEqual(10);
      expect(toSchemaType(10, ["number", "string"])).toEqual(10);
      expect(toSchemaType(10, ["string"])).toEqual("10");
      expect(toSchemaType(10.5, ["number", "integer", "string"])).toEqual(10.5);
      expect(toSchemaType(10.5, ["integer", "string"])).toEqual("10.5");
      expect(toSchemaType(10.5, ["integer"])).toEqual(10);
    });
    it("Boolean conversion examples", () => {
      expect(
        toSchemaType("1", ["integer", "number", "string", "boolean"])
      ).toEqual("1");
      expect(toSchemaType("1", ["string", "boolean"])).toEqual("1");
      expect(toSchemaType("1", ["boolean"])).toEqual("1");
      expect(toSchemaType("true", ["number", "string", "boolean"])).toEqual(
        "true"
      );
      expect(toSchemaType("true", ["boolean"])).toEqual("true");
      expect(toSchemaType("true", ["number"])).toEqual(0);
    });
    it("string conversion examples", () => {
      expect(
        toSchemaType("1.58", ["boolean", "number", "integer", "string"])
      ).toEqual("1.58");
      expect(toSchemaType("1.5", ["boolean", "number", "integer"])).toEqual(
        "1.5"
      );
    });
  });

  describe("_executeValidators", () => {
    it("returns one result per validator", () => {
      const control: any = { value: 5 };
      const validators: any = [() => null, (c) => ({ min: c.value })];

      expect(_executeValidators(control, validators)).toEqual([
        null,
        { min: 5 },
      ]);
    });

    it("forwards the invert flag to every validator", () => {
      const control: any = { value: 5 };
      const validators: any = [(c, invert) => ({ inverted: invert })];

      expect(_executeValidators(control, validators, true)).toEqual([
        { inverted: true },
      ]);
    });

    it("defaults the invert flag to false", () => {
      const control: any = { value: 5 };
      const validators: any = [(c, invert) => ({ inverted: invert })];

      expect(_executeValidators(control, validators)).toEqual([
        { inverted: false },
      ]);
    });

    it("returns an empty array when there are no validators", () => {
      expect(_executeValidators({} as any, [] as any)).toEqual([]);
    });
  });

  describe("_executeAsyncValidators", () => {
    it("returns one result per async validator", () => {
      const control: any = { value: 1 };
      const validators: any = [() => "first", () => "second"];

      expect(_executeAsyncValidators(control, validators)).toEqual([
        "first",
        "second",
      ]);
    });

    it("forwards the invert flag to every async validator", () => {
      const control: any = { value: 1 };
      const validators: any = [(c, invert) => invert];

      expect(_executeAsyncValidators(control, validators, true)).toEqual([true]);
    });

    it("returns an empty array when there are no async validators", () => {
      expect(_executeAsyncValidators({} as any, [] as any)).toEqual([]);
    });
  });

  describe("_mergeObjects", () => {
    it("returns an empty object when called with no arguments", () => {
      expect(_mergeObjects()).toEqual({});
    });

    it("ignores null, undefined and non object inputs", () => {
      expect(_mergeObjects({ a: 1 }, null, undefined, "str", 5, { b: 2 })).toEqual(
        { a: 1, b: 2 }
      );
    });

    it("lets a later value overwrite an earlier one", () => {
      expect(_mergeObjects({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
    });

    it("overwrites a previously merged null value", () => {
      expect(_mergeObjects({ a: null }, { a: 2 })).toEqual({ a: 2 });
    });

    it("xors duplicated strict boolean 'not' keys", () => {
      expect(_mergeObjects({ not: true }, { not: true })).toEqual({
        not: false,
      });
      expect(_mergeObjects({ not: true }, { not: false })).toEqual({
        not: true,
      });
      expect(_mergeObjects({ not: false }, { not: false })).toEqual({
        not: false,
      });
    });

    it("does not xor a 'not' key holding non strict booleans", () => {
      expect(_mergeObjects({ not: 1 }, { not: 1 })).toEqual({ not: 1 });
    });

    it("recursively merges nested objects", () => {
      expect(_mergeObjects({ a: { x: 1 } }, { a: { y: 2 } })).toEqual({
        a: { x: 1, y: 2 },
      });
    });

    it("treats an array input as an object of indexed keys", () => {
      expect(_mergeObjects([1, 2], { a: 1 })).toEqual({ 0: 1, 1: 2, a: 1 });
    });
  });

  describe("_mergeErrors", () => {
    it("returns null for an empty array", () => {
      expect(_mergeErrors([])).toBeNull();
    });

    it("returns null when every entry is null", () => {
      expect(_mergeErrors([null, null])).toBeNull();
    });

    it("returns the merged errors when at least one entry has keys", () => {
      expect(_mergeErrors([null, { required: true }])).toEqual({
        required: true,
      });
      expect(_mergeErrors([{ a: 1 }, { b: 2 }])).toEqual({ a: 1, b: 2 });
    });
  });

  describe("isDefined", () => {
    it("returns false for null and undefined", () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });

    it("returns true for falsey but defined values", () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined("")).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined(NaN)).toBe(true);
    });

    it("returns true for objects and arrays", () => {
      expect(isDefined({})).toBe(true);
      expect(isDefined([])).toBe(true);
    });
  });

  describe("hasValue", () => {
    it("returns false for null, undefined and the empty string", () => {
      expect(hasValue(null)).toBe(false);
      expect(hasValue(undefined)).toBe(false);
      expect(hasValue("")).toBe(false);
    });

    it("returns true for other falsey values", () => {
      expect(hasValue(0)).toBe(true);
      expect(hasValue(false)).toBe(true);
    });

    it("returns true for regular values", () => {
      expect(hasValue("abc")).toBe(true);
      expect(hasValue([])).toBe(true);
      expect(hasValue({})).toBe(true);
    });
  });

  describe("isEmpty", () => {
    it("returns true for an empty array and false otherwise", () => {
      expect(isEmpty([])).toBe(true);
      expect(isEmpty([0])).toBe(false);
    });

    it("returns true for an object with no own keys", () => {
      expect(isEmpty({})).toBe(true);
      expect(isEmpty({ a: undefined })).toBe(false);
    });

    it("returns true for null, undefined and the empty string", () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty("")).toBe(true);
    });

    it("returns false for other falsey values", () => {
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });

    it("treats a Date as a value, never as empty", () => {
      expect(isEmpty(new Date())).toBe(false);
    });

    it("measures a Map or Set by size rather than by own keys", () => {
      expect(isEmpty(new Map())).toBe(true);
      expect(isEmpty(new Map([[1, 2]]))).toBe(false);
      expect(isEmpty(new Set())).toBe(true);
      expect(isEmpty(new Set([1]))).toBe(false);
    });
  });

  describe("isString", () => {
    it("returns true only for primitive strings", () => {
      expect(isString("abc")).toBe(true);
      expect(isString("")).toBe(true);
      expect(isString(10)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString([])).toBe(false);
      expect(isString(new Date())).toBe(false);
    });
  });

  describe("isNumber", () => {
    it("accepts numbers and numeric strings", () => {
      expect(isNumber(10)).toBe(true);
      expect(isNumber(10.5)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber("10")).toBe(true);
      expect(isNumber("10.5")).toBe(true);
    });

    it("rejects non numeric values", () => {
      expect(isNumber("abc")).toBe(false);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber({})).toBe(false);
    });

    it("rejects infinity", () => {
      expect(isNumber(Infinity)).toBe(false);
      expect(isNumber(-Infinity)).toBe(false);
    });

    // Global isNaN coerces these to 0 or 1, so they read as numbers
    it("accepts null, empty string, booleans and arrays", () => {
      expect(isNumber(null)).toBe(true);
      expect(isNumber("")).toBe(true);
      expect(isNumber(true)).toBe(true);
      expect(isNumber([])).toBe(true);
      expect(isNumber(new Date())).toBe(true);
    });

    it("requires a JavaScript number when strict", () => {
      expect(isNumber(10, "strict")).toBe(true);
      expect(isNumber("10", "strict")).toBe(false);
      expect(isNumber(null, "strict")).toBe(false);
      expect(isNumber(10, true)).toBe(true);
    });
  });

  describe("isInteger", () => {
    it("accepts integers and integer strings", () => {
      expect(isInteger(10)).toBe(true);
      expect(isInteger("10")).toBe(true);
      expect(isInteger(0)).toBe(true);
      expect(isInteger(-3)).toBe(true);
    });

    it("rejects decimals", () => {
      expect(isInteger(10.5)).toBe(false);
      expect(isInteger("10.5")).toBe(false);
    });

    it("rejects non numeric values and infinity", () => {
      expect(isInteger("abc")).toBe(false);
      expect(isInteger(NaN)).toBe(false);
      expect(isInteger(undefined)).toBe(false);
      expect(isInteger(Infinity)).toBe(false);
      expect(isInteger({})).toBe(false);
    });

    // Same coercion quirk as isNumber: these all yield a remainder of 0
    it("accepts null, empty string, booleans and arrays", () => {
      expect(isInteger(null)).toBe(true);
      expect(isInteger("")).toBe(true);
      expect(isInteger(true)).toBe(true);
      expect(isInteger([])).toBe(true);
    });

    it("requires a JavaScript number when strict", () => {
      expect(isInteger(10, "strict")).toBe(true);
      expect(isInteger("10", "strict")).toBe(false);
      expect(isInteger(10.5, "strict")).toBe(false);
    });
  });

  describe("isBoolean", () => {
    it("accepts all boolean-ish values by default", () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(1)).toBe(true);
      expect(isBoolean(0)).toBe(true);
      expect(isBoolean("true")).toBe(true);
      expect(isBoolean("false")).toBe(true);
      expect(isBoolean("1")).toBe(true);
      expect(isBoolean("0")).toBe(true);
    });

    it("rejects other values by default", () => {
      expect(isBoolean("yes")).toBe(false);
      expect(isBoolean(2)).toBe(false);
      expect(isBoolean(null)).toBe(false);
      expect(isBoolean(undefined)).toBe(false);
      expect(isBoolean("")).toBe(false);
    });

    it("accepts only real booleans when strict", () => {
      expect(isBoolean(true, "strict")).toBe(true);
      expect(isBoolean(false, "strict")).toBe(true);
      expect(isBoolean(1, "strict")).toBe(false);
      expect(isBoolean("true", "strict")).toBe(false);
    });

    it("checks only truthy forms when the option is true", () => {
      expect(isBoolean(true, true)).toBe(true);
      expect(isBoolean(1, true)).toBe(true);
      expect(isBoolean("true", true)).toBe(true);
      expect(isBoolean("1", true)).toBe(true);
      expect(isBoolean(false, true)).toBe(false);
      expect(isBoolean("0", true)).toBe(false);
    });

    it("checks only falsey forms when the option is false", () => {
      expect(isBoolean(false, false)).toBe(true);
      expect(isBoolean(0, false)).toBe(true);
      expect(isBoolean("false", false)).toBe(true);
      expect(isBoolean("0", false)).toBe(true);
      expect(isBoolean(true, false)).toBe(false);
      expect(isBoolean("1", false)).toBe(false);
    });
  });

  describe("isFunction", () => {
    it("returns true for functions", () => {
      expect(isFunction(() => null)).toBe(true);
      expect(isFunction(function named() { return null; })).toBe(true);
      expect(isFunction(Math.max)).toBe(true);
    });

    it("returns false for everything else", () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction(null)).toBe(false);
      expect(isFunction(undefined)).toBe(false);
      expect(isFunction("fn")).toBe(false);
    });
  });

  describe("isObject", () => {
    it("returns true for any non null object, including arrays and dates", () => {
      expect(isObject({})).toBe(true);
      expect(isObject([])).toBe(true);
      expect(isObject(new Date())).toBe(true);
      expect(isObject(new Map())).toBe(true);
    });

    it("returns false for null, primitives and functions", () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject("abc")).toBe(false);
      expect(isObject(5)).toBe(false);
      expect(isObject(() => null)).toBe(false);
    });
  });

  describe("isArray", () => {
    it("returns true only for arrays", () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2])).toBe(true);
      expect(isArray({})).toBe(false);
      expect(isArray("abc")).toBe(false);
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
    });
  });

  describe("isDate", () => {
    it("returns true for Date objects, including invalid ones", () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date("not a date"))).toBe(true);
    });

    it("returns false for anything else", () => {
      expect(isDate("2018-01-01")).toBe(false);
      expect(isDate(0)).toBe(false);
      expect(isDate(null)).toBe(false);
      expect(isDate(undefined)).toBe(false);
      expect(isDate({})).toBe(false);
    });
  });

  describe("isMap", () => {
    it("returns true only for Map instances", () => {
      expect(isMap(new Map())).toBe(true);
      expect(isMap(new WeakMap())).toBe(false);
      expect(isMap(new Set())).toBe(false);
      expect(isMap({})).toBe(false);
      expect(isMap(null)).toBe(false);
      expect(isMap(undefined)).toBe(false);
    });
  });

  describe("isSet", () => {
    it("returns true only for Set instances", () => {
      expect(isSet(new Set())).toBe(true);
      expect(isSet(new WeakSet())).toBe(false);
      expect(isSet(new Map())).toBe(false);
      expect(isSet([])).toBe(false);
      expect(isSet(null)).toBe(false);
      expect(isSet(undefined)).toBe(false);
    });
  });

  describe("isSymbol", () => {
    it("returns true only for symbols", () => {
      expect(isSymbol(Symbol("x"))).toBe(true);
      expect(isSymbol("x")).toBe(false);
      expect(isSymbol(null)).toBe(false);
      expect(isSymbol(undefined)).toBe(false);
    });
  });

  describe("getType", () => {
    it("returns 'null' for null and undefined", () => {
      expect(getType(null)).toEqual("null");
      expect(getType(undefined)).toEqual("null");
    });

    it("returns 'array' for arrays", () => {
      expect(getType([])).toEqual("array");
      expect(getType([1, 2])).toEqual("array");
    });

    // Dates and Maps are objects, so the isObject check claims them first
    it("returns 'object' for plain objects, dates and maps", () => {
      expect(getType({})).toEqual("object");
      expect(getType(new Date())).toEqual("object");
      expect(getType(new Map())).toEqual("object");
    });

    it("returns 'boolean' only for real booleans", () => {
      expect(getType(true)).toEqual("boolean");
      expect(getType(false)).toEqual("boolean");
      expect(getType("true")).toEqual("string");
      expect(getType(1)).toEqual("integer");
    });

    it("returns 'integer' for integers and integer strings", () => {
      expect(getType(10)).toEqual("integer");
      expect(getType("10")).toEqual("integer");
    });

    it("returns 'number' for decimals and decimal strings", () => {
      expect(getType(10.5)).toEqual("number");
      expect(getType("10.5")).toEqual("number");
    });

    it("returns 'string' for non numeric strings", () => {
      expect(getType("abc")).toEqual("string");
    });

    // The empty string coerces to 0, so isInteger claims it before isString
    it("returns 'integer' for the empty string", () => {
      expect(getType("")).toEqual("integer");
    });

    it("only detects JavaScript numbers when strict", () => {
      expect(getType("10", "strict")).toEqual("string");
      expect(getType("10.5", "strict")).toEqual("string");
      expect(getType("", "strict")).toEqual("string");
      expect(getType("true", "strict")).toEqual("string");
      expect(getType(10, "strict")).toEqual("integer");
      expect(getType(10.5, "strict")).toEqual("number");
      expect(getType(true, "strict")).toEqual("boolean");
    });

    it("returns null for values that match no type", () => {
      expect(getType(NaN)).toBeNull();
      expect(getType(() => null)).toBeNull();
    });
  });

  describe("isType", () => {
    it("checks the 'string' type, which also accepts dates", () => {
      expect(isType("abc", "string")).toBe(true);
      expect(isType(new Date(), "string")).toBe(true);
      expect(isType(10, "string")).toBe(false);
    });

    it("checks the 'number' type", () => {
      expect(isType("10", "number")).toBe(true);
      expect(isType(10.5, "number")).toBe(true);
      expect(isType("abc", "number")).toBe(false);
    });

    it("checks the 'integer' type", () => {
      expect(isType("10", "integer")).toBe(true);
      expect(isType("10.5", "integer")).toBe(false);
    });

    it("checks the 'boolean' type loosely", () => {
      expect(isType("true", "boolean")).toBe(true);
      expect(isType(1, "boolean")).toBe(true);
      expect(isType("yes", "boolean")).toBe(false);
    });

    it("checks the 'null' type, which also accepts the empty string", () => {
      expect(isType(null, "null")).toBe(true);
      expect(isType(undefined, "null")).toBe(true);
      expect(isType("", "null")).toBe(true);
      expect(isType(0, "null")).toBe(false);
    });

    it("logs an error and returns null for an unrecognized type", () => {
      spyOn(console, "error");

      expect(isType("abc", "bogus")).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("isPrimitive", () => {
    it("returns true for strings, numbers, booleans and null", () => {
      expect(isPrimitive("abc")).toBe(true);
      expect(isPrimitive(10)).toBe(true);
      expect(isPrimitive(true)).toBe(true);
      expect(isPrimitive(false)).toBe(true);
      expect(isPrimitive(null)).toBe(true);
    });

    it("returns false for undefined, objects and functions", () => {
      expect(isPrimitive(undefined)).toBe(false);
      expect(isPrimitive({})).toBe(false);
      expect(isPrimitive(() => null)).toBe(false);
    });

    // An array coerces to 0, so isNumber accepts it
    it("returns true for an array", () => {
      expect(isPrimitive([])).toBe(true);
    });
  });

  describe("toIsoString padding", () => {
    it("pads single digit months and days", () => {
      expect(toIsoString(new Date(2018, 0, 5))).toEqual("2018-01-05");
    });

    it("leaves two digit months and days alone", () => {
      expect(toIsoString(new Date(2018, 10, 15))).toEqual("2018-11-15");
    });
  });

  describe("toJavaScriptType edge cases", () => {
    it("returns null for null and undefined values", () => {
      expect(toJavaScriptType(null, "string")).toBeNull();
      expect(toJavaScriptType(undefined, "number")).toBeNull();
    });

    it("returns null when no type matches", () => {
      expect(toJavaScriptType("abc", "number")).toBeNull();
      expect(toJavaScriptType("abc", "boolean")).toBeNull();
      expect(toJavaScriptType("10", [])).toBeNull();
    });

    it("treats integers as numbers when strictIntegers is false", () => {
      expect(toJavaScriptType("10.5", "integer", false)).toEqual(10.5);
      expect(toJavaScriptType(10.5, "integer", false)).toEqual(10.5);
    });

    it("accepts an array of types", () => {
      expect(toJavaScriptType("10", ["string", "number"])).toEqual(10);
      expect(toJavaScriptType("abc", ["string", "number"])).toEqual("abc");
    });

    it("converts boolean-ish values when 'boolean' is allowed", () => {
      expect(toJavaScriptType(true, "boolean")).toBe(true);
      expect(toJavaScriptType("1", "boolean")).toBe(true);
      expect(toJavaScriptType("false", "boolean")).toBe(false);
      expect(toJavaScriptType(0, "boolean")).toBe(false);
    });

    it("stringifies numbers and booleans when 'string' is allowed", () => {
      expect(toJavaScriptType(true, "string")).toEqual("true");
      expect(toJavaScriptType(10.5, "string")).toEqual("10.5");
    });

    it("converts a date to an ISO day string when 'string' is allowed", () => {
      expect(toJavaScriptType(new Date(2011, 9, 5), "string")).toEqual(
        "2011-10-05"
      );
    });

    // parseInt / parseFloat run on the date's display string, which is not numeric
    it("returns NaN for a date when only a numeric type is allowed", () => {
      expect(toJavaScriptType(new Date(2011, 9, 5), "number")).toBeNaN();
      expect(toJavaScriptType(new Date(2011, 9, 5), "integer")).toBeNaN();
    });

    it("returns the timestamp of an invalid date when only a numeric type is allowed", () => {
      expect(toJavaScriptType(new Date("not a date"), "number")).toBeNaN();
    });

    it("returns NaN for the empty string with a numeric type", () => {
      expect(toJavaScriptType("", "integer")).toBeNaN();
      expect(toJavaScriptType("", "number")).toBeNaN();
    });
  });

  describe("toSchemaType edge cases", () => {
    it("wraps a single type in an array", () => {
      expect(toSchemaType("abc", "string")).toEqual("abc");
    });

    it("returns null for valueless input when 'null' is allowed", () => {
      expect(toSchemaType(null, ["null"])).toBeNull();
      expect(toSchemaType(undefined, ["null"])).toBeNull();
      expect(toSchemaType("", ["null", "string"])).toBeNull();
    });

    // When 'boolean' is allowed, any non boolean value is returned untouched
    it("returns the input unchanged when 'boolean' is allowed and the value is not a boolean", () => {
      expect(toSchemaType(10.5, ["null", "boolean"])).toEqual(10.5);
      expect(toSchemaType(10.5, ["null", "boolean", "string"])).toEqual(10.5);
      expect(
        toSchemaType("xyz", ["number", "integer", "boolean", "null"])
      ).toEqual("xyz");
    });

    it("converts real booleans when only 'boolean' is allowed", () => {
      expect(toSchemaType(true, ["boolean"])).toBe(true);
      expect(toSchemaType(false, ["boolean"])).toBe(false);
    });

    it("stringifies a boolean when 'string' is allowed", () => {
      expect(toSchemaType(true, ["string"])).toEqual("true");
    });

    // parseFloat("true") is NaN, and the unary plus keeps it NaN
    it("returns NaN for a boolean when a numeric type is allowed", () => {
      expect(toSchemaType(true, ["number"])).toBeNaN();
      expect(toSchemaType(false, ["number"])).toBeNaN();
      expect(toSchemaType(true, ["number", "string"])).toBeNaN();
    });

    it("converts null to an empty string or to zero", () => {
      expect(toSchemaType(null, ["string"])).toEqual("");
      expect(toSchemaType(null, ["number"])).toEqual(0);
    });

    it("converts undefined to zero for numeric types but leaves it alone for strings", () => {
      expect(toSchemaType(undefined, ["number"])).toEqual(0);
      expect(toSchemaType(undefined, ["string"])).toBeUndefined();
    });

    it("returns NaN for the empty string with an integer type", () => {
      expect(toSchemaType("", ["integer"])).toBeNaN();
    });

    it("keeps the empty string when 'string' is allowed", () => {
      expect(toSchemaType("", ["string"])).toEqual("");
    });

    it("parses the leading number out of a mixed string", () => {
      expect(toSchemaType("1.5x", ["number"])).toEqual(1.5);
      expect(toSchemaType("1.5x", ["integer"])).toEqual(1);
    });

    it("falls back to zero for unconvertable values when null is not allowed", () => {
      expect(toSchemaType("xyz", ["number", "integer"])).toEqual(0);
      expect(toSchemaType("xyz", ["integer"])).toEqual(0);
      expect(toSchemaType({}, ["number"])).toEqual(0);
    });

    it("returns undefined when nothing can be converted", () => {
      expect(toSchemaType("xyz", ["number", "integer", "null"])).toBeUndefined();
      expect(toSchemaType({}, ["string"])).toBeUndefined();
      expect(toSchemaType("abc", [])).toBeUndefined();
    });
  });

  describe("isPromise", () => {
    it("returns true for anything thenable", () => {
      expect(isPromise(Promise.resolve(1))).toBe(true);
      expect(isPromise({ then: () => null })).toBe(true);
    });

    it("returns false for everything else", () => {
      expect(isPromise({})).toBe(false);
      expect(isPromise(null)).toBe(false);
      expect(isPromise(undefined)).toBe(false);
      expect(isPromise(0)).toBe(false);
      expect(isPromise("abc")).toBe(false);
    });
  });

  describe("isObservable", () => {
    it("returns true for anything subscribable", () => {
      expect(isObservable(of(1))).toBe(true);
      expect(isObservable({ subscribe: () => null })).toBe(true);
    });

    it("returns false for everything else", () => {
      expect(isObservable({})).toBe(false);
      expect(isObservable(null)).toBe(false);
      expect(isObservable(undefined)).toBe(false);
      expect(isObservable(Promise.resolve(1))).toBe(false);
    });
  });

  describe("_toPromise", () => {
    it("returns a promise unchanged", () => {
      const promise = Promise.resolve(1);

      expect(_toPromise(promise)).toBe(promise);
    });

    it("converts an observable to a promise", () => {
      expect(_toPromise(of(1)) instanceof Promise).toBe(true);
    });

    it("throws for anything that is neither a promise nor an observable", () => {
      expect(() => _toPromise({})).toThrow();
    });
  });

  describe("toObservable", () => {
    it("returns an observable unchanged", () => {
      const observable = of(1);

      expect(toObservable(observable)).toBe(observable);
    });

    it("converts a promise to an observable", () => {
      expect(toObservable(Promise.resolve(1)) instanceof Observable).toBe(true);
    });

    it("logs an error and returns an empty observable for other input", () => {
      spyOn(console, "error");

      expect(toObservable({}) instanceof Observable).toBe(true);
      expect(console.error).toHaveBeenCalled();
    });

    it("does not throw for null input", () => {
      spyOn(console, "error");

      expect(() => toObservable(null)).not.toThrow();
    });
  });

  describe("inArray", () => {
    it("finds a single item", () => {
      expect(inArray("a", ["a", "b"])).toBe(true);
      expect(inArray("c", ["a", "b"])).toBe(false);
      expect(inArray(false, [false])).toBe(true);
      expect(inArray(0, [0])).toBe(true);
    });

    it("returns false when the item is null or undefined", () => {
      expect(inArray(null, ["a", null])).toBe(false);
      expect(inArray(undefined, ["a"])).toBe(false);
    });

    it("returns false when the list is not an array", () => {
      expect(inArray("a", "abc")).toBe(false);
      expect(inArray("a", null)).toBe(false);
      expect(inArray("a", undefined)).toBe(false);
    });

    it("returns false for an empty list", () => {
      expect(inArray("a", [])).toBe(false);
    });

    it("matches any item of a list of items by default", () => {
      expect(inArray(["a", "z"], ["a", "b"])).toBe(true);
      expect(inArray(["y", "z"], ["a", "b"])).toBe(false);
    });

    it("requires every item of a list of items when allIn is true", () => {
      expect(inArray(["a", "z"], ["a", "b"], true)).toBe(false);
      expect(inArray(["a", "b"], ["a", "b", "c"], true)).toBe(true);
    });

    it("handles an empty list of items to find", () => {
      expect(inArray([], ["a"])).toBe(false);
      expect(inArray([], ["a"], true)).toBe(true);
    });
  });

  describe("xor", () => {
    it("returns true when exactly one value is truthy", () => {
      expect(xor(true, false)).toBe(true);
      expect(xor(false, true)).toBe(true);
      expect(xor(1, 0)).toBe(true);
      expect(xor("a", "")).toBe(true);
    });

    it("returns false when both values are truthy or both falsey", () => {
      expect(xor(true, true)).toBe(false);
      expect(xor(false, false)).toBe(false);
      expect(xor({}, [])).toBe(false);
      expect(xor(0, "")).toBe(false);
      expect(xor(null, undefined)).toBe(false);
    });
  });
});
