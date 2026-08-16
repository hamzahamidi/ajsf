import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { JsonValidators } from './json.validators';

// Helper returning `any` so validators typed against AbstractControl accept it
// and so arbitrary JSON values can be used as control values.
const ctrl = (value: any): any => new FormControl(value);

describe('JsonValidators', () => {

  describe('required', () => {
    it('returns the validator function when called with no arguments', () => {
      const validator = JsonValidators.required();

      expect(typeof validator).toEqual('function');
      expect(validator(ctrl('abc'))).toBeNull();
    });

    it('returns an error object when the control has no value', () => {
      const validator = JsonValidators.required(true);

      expect(validator(ctrl(''))).toEqual({ required: true });
      expect(validator(ctrl(null))).toEqual({ required: true });
      expect(validator(ctrl(undefined))).toEqual({ required: true });
    });

    it('treats 0 and false as present values', () => {
      const validator = JsonValidators.required(true);

      expect(validator(ctrl(0))).toBeNull();
      expect(validator(ctrl(false))).toBeNull();
    });

    it('always passes when inverted', () => {
      const validator = JsonValidators.required(true);

      expect(validator(ctrl(''), true)).toBeNull();
      expect(validator(ctrl('abc'), true)).toBeNull();
    });

    it('returns the no-op validator when called with false', () => {
      const validator = JsonValidators.required(false);

      expect(validator(ctrl(''))).toBeNull();
      expect(validator(ctrl('abc'))).toBeNull();
    });

    it('executes immediately when called with a control', () => {
      expect(JsonValidators.required(ctrl('abc'))).toBeNull();
      expect(JsonValidators.required(ctrl(''))).toEqual({ required: true });
    });
  });

  describe('nullValidator', () => {
    it('always returns null', () => {
      expect(JsonValidators.nullValidator(ctrl('abc'))).toBeNull();
      expect(JsonValidators.nullValidator(ctrl(null))).toBeNull();
    });
  });

  describe('type', () => {
    it('returns the no-op validator when no type is given', () => {
      expect(JsonValidators.type(null)(ctrl(123))).toBeNull();
      expect(JsonValidators.type(undefined)(ctrl(123))).toBeNull();
      expect(JsonValidators.type('' as any)(ctrl(123))).toBeNull();
    });

    it('passes empty values through untested', () => {
      const validator = JsonValidators.type('number');

      expect(validator(ctrl(''))).toBeNull();
      expect(validator(ctrl(null))).toBeNull();
      expect(validator(ctrl([]))).toBeNull();
      expect(validator(ctrl({}))).toBeNull();
    });

    it('accepts a value of the required type', () => {
      expect(JsonValidators.type('string')(ctrl('abc'))).toBeNull();
      expect(JsonValidators.type('number')(ctrl(10.5))).toBeNull();
      expect(JsonValidators.type('boolean')(ctrl(true))).toBeNull();
    });

    it('rejects a value of the wrong type', () => {
      expect(JsonValidators.type('number')(ctrl('abc')))
        .toEqual({ type: { requiredType: 'number', currentValue: 'abc' } });
      expect(JsonValidators.type('boolean')(ctrl('abc')))
        .toEqual({ type: { requiredType: 'boolean', currentValue: 'abc' } });
    });

    it('accepts numeric strings as integers but rejects decimals', () => {
      expect(JsonValidators.type('integer')(ctrl('10'))).toBeNull();
      expect(JsonValidators.type('integer')(ctrl(10.5)))
        .toEqual({ type: { requiredType: 'integer', currentValue: 10.5 } });
    });

    it('accepts a value matching any type in an array of types', () => {
      expect(JsonValidators.type(['string', 'number'])(ctrl('abc'))).toBeNull();
      expect(JsonValidators.type(['integer', 'boolean'])(ctrl(true))).toBeNull();
    });

    it('rejects a value matching no type in an array of types', () => {
      const requiredType: any = ['string', 'number'];
      const currentValue = { a: 1 };

      expect(JsonValidators.type(requiredType)(ctrl(currentValue)))
        .toEqual({ type: { requiredType, currentValue } });
    });

    it('rejects every non-empty value when given an empty array of types', () => {
      expect(JsonValidators.type([])(ctrl('abc')))
        .toEqual({ type: { requiredType: [], currentValue: 'abc' } });
    });

    it('rejects a non-empty value for the null type', () => {
      expect(JsonValidators.type('null')(ctrl('abc')))
        .toEqual({ type: { requiredType: 'null', currentValue: 'abc' } });
    });

    it('rejects a value when the type name is not recognized', () => {
      // isType() logs an error and returns null, which counts as invalid here.
      expect(JsonValidators.type('bogus' as any)(ctrl('abc')))
        .toEqual({ type: { requiredType: 'bogus', currentValue: 'abc' } });
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.type('string')(ctrl('abc'), true))
        .toEqual({ type: { requiredType: 'string', currentValue: 'abc' } });
      expect(JsonValidators.type('number')(ctrl('abc'), true)).toBeNull();
    });
  });

  describe('enum', () => {
    it('returns the no-op validator when the allowed values are not an array', () => {
      expect(JsonValidators.enum(null)(ctrl('abc'))).toBeNull();
      expect(JsonValidators.enum(undefined)(ctrl('abc'))).toBeNull();
      expect(JsonValidators.enum('abc' as any)(ctrl('xyz'))).toBeNull();
      expect(JsonValidators.enum({} as any)(ctrl('xyz'))).toBeNull();
    });

    it('passes empty values through untested', () => {
      const validator = JsonValidators.enum(['a', 'b']);

      expect(validator(ctrl(''))).toBeNull();
      expect(validator(ctrl(null))).toBeNull();
      expect(validator(ctrl([]))).toBeNull();
    });

    it('accepts a value present in the list', () => {
      expect(JsonValidators.enum(['a', 'b'])(ctrl('a'))).toBeNull();
    });

    it('rejects a value absent from the list', () => {
      expect(JsonValidators.enum(['a', 'b'])(ctrl('c')))
        .toEqual({ enum: { allowedValues: ['a', 'b'], currentValue: 'c' } });
    });

    it('matches a numeric string against a number in the list', () => {
      expect(JsonValidators.enum([1, 2, 3])(ctrl('2'))).toBeNull();
    });

    it('matches a boolean string against a boolean in the list', () => {
      expect(JsonValidators.enum([true])(ctrl('true'))).toBeNull();
      expect(JsonValidators.enum([false])(ctrl(false))).toBeNull();
    });

    it('matches an object in the list by deep equality', () => {
      expect(JsonValidators.enum([{ a: 1 }])(ctrl({ a: 1 }))).toBeNull();
    });

    it('requires every member of an array value to be allowed', () => {
      expect(JsonValidators.enum([1, 2, 3])(ctrl([1, 2]))).toBeNull();
      expect(JsonValidators.enum([1, 2, 3])(ctrl([1, 9])))
        .toEqual({ enum: { allowedValues: [1, 2, 3], currentValue: [1, 9] } });
    });

    it('rejects every non-empty value when the list is empty', () => {
      expect(JsonValidators.enum([])(ctrl('a')))
        .toEqual({ enum: { allowedValues: [], currentValue: 'a' } });
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.enum(['a'])(ctrl('a'), true))
        .toEqual({ enum: { allowedValues: ['a'], currentValue: 'a' } });
      expect(JsonValidators.enum(['a'])(ctrl('b'), true)).toBeNull();
    });
  });

  describe('const', () => {
    it('returns the no-op validator when the required value is missing', () => {
      expect(JsonValidators.const(null)(ctrl('abc'))).toBeNull();
      expect(JsonValidators.const(undefined)(ctrl('abc'))).toBeNull();
      expect(JsonValidators.const('')(ctrl('abc'))).toBeNull();
    });

    it('builds a real validator for the falsy values 0 and false', () => {
      expect(JsonValidators.const(0)(ctrl(1)))
        .toEqual({ const: { requiredValue: 0, currentValue: 1 } });
      expect(JsonValidators.const(false)(ctrl(false))).toBeNull();
    });

    it('passes empty values through untested', () => {
      const validator = JsonValidators.const('abc');

      expect(validator(ctrl(''))).toBeNull();
      expect(validator(ctrl(null))).toBeNull();
      expect(validator(ctrl({}))).toBeNull();
    });

    it('accepts the exact value', () => {
      expect(JsonValidators.const('abc')(ctrl('abc'))).toBeNull();
    });

    it('rejects any other value', () => {
      expect(JsonValidators.const('abc')(ctrl('xyz')))
        .toEqual({ const: { requiredValue: 'abc', currentValue: 'xyz' } });
    });

    it('matches numeric and boolean strings against their typed value', () => {
      expect(JsonValidators.const(5)(ctrl('5'))).toBeNull();
      expect(JsonValidators.const(true)(ctrl('true'))).toBeNull();
      expect(JsonValidators.const(false)(ctrl('false'))).toBeNull();
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.const('abc')(ctrl('abc'), true))
        .toEqual({ const: { requiredValue: 'abc', currentValue: 'abc' } });
      expect(JsonValidators.const('abc')(ctrl('xyz'), true)).toBeNull();
    });
  });

  describe('minLength', () => {
    it('returns the no-op validator when no length is given', () => {
      expect(JsonValidators.minLength(null)(ctrl('a'))).toBeNull();
      expect(JsonValidators.minLength(undefined)(ctrl('a'))).toBeNull();
    });

    it('passes empty values through untested', () => {
      const validator = JsonValidators.minLength(3);

      expect(validator(ctrl(''))).toBeNull();
      expect(validator(ctrl(null))).toBeNull();
    });

    it('accepts a string of at least the minimum length', () => {
      expect(JsonValidators.minLength(3)(ctrl('abc'))).toBeNull();
      expect(JsonValidators.minLength(3)(ctrl('abcd'))).toBeNull();
    });

    it('rejects a string shorter than the minimum length', () => {
      expect(JsonValidators.minLength(3)(ctrl('ab')))
        .toEqual({ minLength: { minimumLength: 3, currentLength: 2 } });
    });

    it('treats a non-string value as having length 0', () => {
      expect(JsonValidators.minLength(3)(ctrl(12345)))
        .toEqual({ minLength: { minimumLength: 3, currentLength: 0 } });
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.minLength(3)(ctrl('abc'), true))
        .toEqual({ minLength: { minimumLength: 3, currentLength: 3 } });
      expect(JsonValidators.minLength(3)(ctrl('ab'), true)).toBeNull();
    });
  });

  describe('maxLength', () => {
    it('returns the no-op validator when no length is given', () => {
      expect(JsonValidators.maxLength(null)(ctrl('abc'))).toBeNull();
      expect(JsonValidators.maxLength(undefined)(ctrl('abc'))).toBeNull();
    });

    it('accepts a string of at most the maximum length', () => {
      expect(JsonValidators.maxLength(3)(ctrl('abc'))).toBeNull();
      expect(JsonValidators.maxLength(3)(ctrl('ab'))).toBeNull();
    });

    it('rejects a string longer than the maximum length', () => {
      expect(JsonValidators.maxLength(3)(ctrl('abcd')))
        .toEqual({ maxLength: { maximumLength: 3, currentLength: 4 } });
    });

    it('has no empty guard, so an empty value is measured as length 0', () => {
      expect(JsonValidators.maxLength(3)(ctrl(null))).toBeNull();
      expect(JsonValidators.maxLength(-1)(ctrl(null)))
        .toEqual({ maxLength: { maximumLength: -1, currentLength: 0 } });
    });

    it('treats a non-string value as having length 0', () => {
      expect(JsonValidators.maxLength(2)(ctrl([1, 2, 3, 4, 5]))).toBeNull();
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.maxLength(3)(ctrl('abc'), true))
        .toEqual({ maxLength: { maximumLength: 3, currentLength: 3 } });
      expect(JsonValidators.maxLength(3)(ctrl('abcd'), true)).toBeNull();
    });
  });

  describe('pattern', () => {
    it('returns the no-op validator when no pattern is given', () => {
      expect(JsonValidators.pattern(null)(ctrl('abc'))).toBeNull();
      expect(JsonValidators.pattern('')(ctrl('abc'))).toBeNull();
    });

    it('passes empty values through untested', () => {
      const validator = JsonValidators.pattern('abc');

      expect(validator(ctrl(''))).toBeNull();
      expect(validator(ctrl(null))).toBeNull();
    });

    it('matches partial values by default', () => {
      expect(JsonValidators.pattern('abc')(ctrl('xxabcxx'))).toBeNull();
    });

    it('anchors the pattern when wholeString is true', () => {
      expect(JsonValidators.pattern('abc', true)(ctrl('abc'))).toBeNull();
      expect(JsonValidators.pattern('abc', true)(ctrl('xxabcxx')))
        .toEqual({ pattern: { requiredPattern: '^abc$', currentValue: 'xxabcxx' } });
    });

    it('rejects a value that does not match', () => {
      expect(JsonValidators.pattern('\\d+')(ctrl('abc')))
        .toEqual({ pattern: { requiredPattern: '\\d+', currentValue: 'abc' } });
    });

    it('accepts a RegExp and reports its string form', () => {
      expect(JsonValidators.pattern(/^[a-z]+$/)(ctrl('abc'))).toBeNull();
      expect(JsonValidators.pattern(/^[a-z]+$/)(ctrl('ABC')))
        .toEqual({ pattern: { requiredPattern: '/^[a-z]+$/', currentValue: 'ABC' } });
    });

    it('rejects a non-string value without testing the pattern', () => {
      expect(JsonValidators.pattern('\\d+')(ctrl(123)))
        .toEqual({ pattern: { requiredPattern: '\\d+', currentValue: 123 } });
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.pattern('abc')(ctrl('abc'), true))
        .toEqual({ pattern: { requiredPattern: 'abc', currentValue: 'abc' } });
      expect(JsonValidators.pattern('abc')(ctrl('xyz'), true)).toBeNull();
    });
  });

  describe('format', () => {
    it('returns the no-op validator when no format is given', () => {
      expect(JsonValidators.format(null)(ctrl('abc'))).toBeNull();
      expect(JsonValidators.format(undefined)(ctrl('abc'))).toBeNull();
    });

    it('passes empty values through untested', () => {
      const validator = JsonValidators.format('email');

      expect(validator(ctrl(''))).toBeNull();
      expect(validator(ctrl(null))).toBeNull();
    });

    it('accepts values matching their format regular expression', () => {
      expect(JsonValidators.format('date')(ctrl('2020-01-01'))).toBeNull();
      expect(JsonValidators.format('time')(ctrl('12:30:00'))).toBeNull();
      expect(JsonValidators.format('date-time')(ctrl('2000-03-14T01:59:26.535Z'))).toBeNull();
      expect(JsonValidators.format('email')(ctrl('a@b.com'))).toBeNull();
      expect(JsonValidators.format('hostname')(ctrl('example.com'))).toBeNull();
      expect(JsonValidators.format('ipv4')(ctrl('192.168.0.1'))).toBeNull();
      expect(JsonValidators.format('uuid')(ctrl('123e4567-e89b-12d3-a456-426614174000'))).toBeNull();
      expect(JsonValidators.format('uri')(ctrl('http://example.com/path'))).toBeNull();
      expect(JsonValidators.format('json-pointer')(ctrl('/foo/bar'))).toBeNull();
      expect(JsonValidators.format('relative-json-pointer')(ctrl('1/foo'))).toBeNull();
    });

    it('rejects values not matching their format regular expression', () => {
      expect(JsonValidators.format('date')(ctrl('01/01/2020')))
        .toEqual({ format: { requiredFormat: 'date', currentValue: '01/01/2020' } });
      expect(JsonValidators.format('time')(ctrl('25:99:99'))).not.toBeNull();
      expect(JsonValidators.format('date-time')(ctrl('2000-03-14'))).not.toBeNull();
      expect(JsonValidators.format('email')(ctrl('not-an-email'))).not.toBeNull();
      expect(JsonValidators.format('hostname')(ctrl('not a hostname'))).not.toBeNull();
      expect(JsonValidators.format('ipv4')(ctrl('999.1.1.1'))).not.toBeNull();
      expect(JsonValidators.format('uuid')(ctrl('nope'))).not.toBeNull();
      expect(JsonValidators.format('uri')(ctrl('no spaces here'))).not.toBeNull();
      expect(JsonValidators.format('json-pointer')(ctrl('foo'))).not.toBeNull();
      expect(JsonValidators.format('relative-json-pointer')(ctrl('/foo'))).not.toBeNull();
    });

    it('uses the function based test for the regex format', () => {
      expect(JsonValidators.format('regex')(ctrl('^abc$'))).toBeNull();
      // 'a\Z' hits the /[^\\]\\Z/ guard inside the regex format test.
      expect(JsonValidators.format('regex')(ctrl('a\\Z')))
        .toEqual({ format: { requiredFormat: 'regex', currentValue: 'a\\Z' } });
    });

    it('treats an unrecognized format as valid and logs an error', () => {
      expect(JsonValidators.format('bogus' as any)(ctrl('anything'))).toBeNull();
    });

    it('validates a Date value rather than skipping it', () => {
      expect(JsonValidators.format('date')(ctrl(new Date('2020-01-01')))).toBeNull();
      expect(JsonValidators.format('email')(ctrl(new Date('2020-01-01')))).not.toBeNull();
    });

    it('rejects a non-string primitive value', () => {
      expect(JsonValidators.format('date')(ctrl(123)))
        .toEqual({ format: { requiredFormat: 'date', currentValue: 123 } });
      expect(JsonValidators.format('email')(ctrl(true)))
        .toEqual({ format: { requiredFormat: 'email', currentValue: true } });
    });

    it('is stable for the color format across repeated checks of the same value', () => {
      const validator = JsonValidators.format('color');

      expect(validator(ctrl('#fff'))).toBeNull();
      expect(validator(ctrl('#fff'))).toBeNull();
      expect(validator(ctrl('#fff'))).toBeNull();
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.format('date')(ctrl('2020-01-01'), true))
        .toEqual({ format: { requiredFormat: 'date', currentValue: '2020-01-01' } });
      expect(JsonValidators.format('date')(ctrl('01/01/2020'), true)).toBeNull();
    });
  });

  describe('minimum', () => {
    it('returns the no-op validator when no minimum is given', () => {
      expect(JsonValidators.minimum(null)(ctrl(1))).toBeNull();
      expect(JsonValidators.minimum(undefined)(ctrl(1))).toBeNull();
    });

    it('passes empty values through untested', () => {
      expect(JsonValidators.minimum(5)(ctrl(''))).toBeNull();
      expect(JsonValidators.minimum(5)(ctrl(null))).toBeNull();
    });

    it('accepts a number at or above the minimum', () => {
      expect(JsonValidators.minimum(5)(ctrl(5))).toBeNull();
      expect(JsonValidators.minimum(5)(ctrl(10))).toBeNull();
    });

    it('rejects a number below the minimum', () => {
      expect(JsonValidators.minimum(5)(ctrl(3)))
        .toEqual({ minimum: { minimumValue: 5, currentValue: 3 } });
    });

    it('accepts any non-numeric value', () => {
      expect(JsonValidators.minimum(5)(ctrl('abc'))).toBeNull();
    });

    it('coerces numeric strings before comparing', () => {
      expect(JsonValidators.minimum(5)(ctrl('10'))).toBeNull();
      expect(JsonValidators.minimum(5)(ctrl('3')))
        .toEqual({ minimum: { minimumValue: 5, currentValue: '3' } });
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.minimum(5)(ctrl(10), true))
        .toEqual({ minimum: { minimumValue: 5, currentValue: 10 } });
      expect(JsonValidators.minimum(5)(ctrl(3), true)).toBeNull();
    });
  });

  describe('exclusiveMinimum', () => {
    it('returns the no-op validator when no value is given', () => {
      expect(JsonValidators.exclusiveMinimum(null)(ctrl(1))).toBeNull();
      expect(JsonValidators.exclusiveMinimum(undefined)(ctrl(1))).toBeNull();
    });

    it('passes empty values through untested', () => {
      expect(JsonValidators.exclusiveMinimum(5)(ctrl(''))).toBeNull();
      expect(JsonValidators.exclusiveMinimum(5)(ctrl(null))).toBeNull();
    });

    it('accepts a number strictly above the bound', () => {
      expect(JsonValidators.exclusiveMinimum(5)(ctrl(10))).toBeNull();
    });

    it('rejects a number at or below the bound', () => {
      expect(JsonValidators.exclusiveMinimum(5)(ctrl(5)))
        .toEqual({ exclusiveMinimum: { exclusiveMinimumValue: 5, currentValue: 5 } });
      expect(JsonValidators.exclusiveMinimum(5)(ctrl(3)))
        .toEqual({ exclusiveMinimum: { exclusiveMinimumValue: 5, currentValue: 3 } });
    });

    it('accepts any non-numeric value', () => {
      expect(JsonValidators.exclusiveMinimum(5)(ctrl('abc'))).toBeNull();
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.exclusiveMinimum(5)(ctrl(10), true))
        .toEqual({ exclusiveMinimum: { exclusiveMinimumValue: 5, currentValue: 10 } });
      expect(JsonValidators.exclusiveMinimum(5)(ctrl(3), true)).toBeNull();
    });
  });

  describe('maximum', () => {
    it('returns the no-op validator when no maximum is given', () => {
      expect(JsonValidators.maximum(null)(ctrl(1))).toBeNull();
      expect(JsonValidators.maximum(undefined)(ctrl(1))).toBeNull();
    });

    it('passes empty values through untested', () => {
      expect(JsonValidators.maximum(5)(ctrl(''))).toBeNull();
      expect(JsonValidators.maximum(5)(ctrl(null))).toBeNull();
    });

    it('accepts a number at or below the maximum', () => {
      expect(JsonValidators.maximum(5)(ctrl(5))).toBeNull();
      expect(JsonValidators.maximum(5)(ctrl(3))).toBeNull();
    });

    it('rejects a number above the maximum', () => {
      expect(JsonValidators.maximum(5)(ctrl(10)))
        .toEqual({ maximum: { maximumValue: 5, currentValue: 10 } });
    });

    it('accepts any non-numeric value', () => {
      expect(JsonValidators.maximum(5)(ctrl('abc'))).toBeNull();
    });

    it('coerces numeric strings before comparing', () => {
      expect(JsonValidators.maximum(5)(ctrl('3'))).toBeNull();
      expect(JsonValidators.maximum(5)(ctrl('10')))
        .toEqual({ maximum: { maximumValue: 5, currentValue: '10' } });
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.maximum(5)(ctrl(3), true))
        .toEqual({ maximum: { maximumValue: 5, currentValue: 3 } });
      expect(JsonValidators.maximum(5)(ctrl(10), true)).toBeNull();
    });
  });

  describe('exclusiveMaximum', () => {
    it('returns the no-op validator when no value is given', () => {
      expect(JsonValidators.exclusiveMaximum(null)(ctrl(1))).toBeNull();
      expect(JsonValidators.exclusiveMaximum(undefined)(ctrl(1))).toBeNull();
    });

    it('passes empty values through untested', () => {
      expect(JsonValidators.exclusiveMaximum(5)(ctrl(''))).toBeNull();
      expect(JsonValidators.exclusiveMaximum(5)(ctrl(null))).toBeNull();
    });

    it('accepts a number strictly below the bound', () => {
      expect(JsonValidators.exclusiveMaximum(5)(ctrl(4))).toBeNull();
    });

    it('rejects a number at or above the bound', () => {
      expect(JsonValidators.exclusiveMaximum(5)(ctrl(5)))
        .toEqual({ exclusiveMaximum: { exclusiveMaximumValue: 5, currentValue: 5 } });
      expect(JsonValidators.exclusiveMaximum(5)(ctrl(10)))
        .toEqual({ exclusiveMaximum: { exclusiveMaximumValue: 5, currentValue: 10 } });
    });

    it('accepts any non-numeric value', () => {
      expect(JsonValidators.exclusiveMaximum(5)(ctrl('abc'))).toBeNull();
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.exclusiveMaximum(5)(ctrl(4), true))
        .toEqual({ exclusiveMaximum: { exclusiveMaximumValue: 5, currentValue: 4 } });
      expect(JsonValidators.exclusiveMaximum(5)(ctrl(5), true)).toBeNull();
    });
  });

  describe('multipleOf', () => {
    it('returns the no-op validator when no value is given', () => {
      expect(JsonValidators.multipleOf(null)(ctrl(9))).toBeNull();
      expect(JsonValidators.multipleOf(undefined)(ctrl(9))).toBeNull();
    });

    it('passes empty values through untested', () => {
      expect(JsonValidators.multipleOf(3)(ctrl(''))).toBeNull();
      expect(JsonValidators.multipleOf(3)(ctrl(null))).toBeNull();
    });

    it('accepts an exact multiple', () => {
      expect(JsonValidators.multipleOf(3)(ctrl(9))).toBeNull();
      expect(JsonValidators.multipleOf(2.5)(ctrl(5))).toBeNull();
      expect(JsonValidators.multipleOf(3)(ctrl('9'))).toBeNull();
    });

    it('rejects a value that is not a multiple', () => {
      expect(JsonValidators.multipleOf(3)(ctrl(10)))
        .toEqual({ multipleOf: { multipleOfValue: 3, currentValue: 10 } });
    });

    it('rejects a non-numeric value', () => {
      expect(JsonValidators.multipleOf(3)(ctrl('abc')))
        .toEqual({ multipleOf: { multipleOfValue: 3, currentValue: 'abc' } });
    });

    it('rejects everything when the divisor is 0 (modulo yields NaN)', () => {
      expect(JsonValidators.multipleOf(0)(ctrl(9)))
        .toEqual({ multipleOf: { multipleOfValue: 0, currentValue: 9 } });
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.multipleOf(3)(ctrl(9), true))
        .toEqual({ multipleOf: { multipleOfValue: 3, currentValue: 9 } });
      expect(JsonValidators.multipleOf(3)(ctrl(10), true)).toBeNull();
    });
  });

  describe('minProperties', () => {
    it('returns the no-op validator when no minimum is given', () => {
      expect(JsonValidators.minProperties(null)(ctrl({ a: 1 }))).toBeNull();
      expect(JsonValidators.minProperties(undefined)(ctrl({ a: 1 }))).toBeNull();
    });

    it('treats an empty object as valid regardless of the minimum', () => {
      expect(JsonValidators.minProperties(2)(ctrl({}))).toBeNull();
      expect(JsonValidators.minProperties(2)(ctrl(null))).toBeNull();
    });

    it('accepts an object with at least the minimum number of properties', () => {
      expect(JsonValidators.minProperties(2)(ctrl({ a: 1, b: 2 }))).toBeNull();
    });

    it('rejects an object with too few properties', () => {
      expect(JsonValidators.minProperties(2)(ctrl({ a: 1 })))
        .toEqual({ minProperties: { minimumProperties: 2, currentProperties: 1 } });
    });

    it('counts string indices when given a string value', () => {
      expect(JsonValidators.minProperties(2)(ctrl('abc'))).toBeNull();
      expect(JsonValidators.minProperties(2)(ctrl(5)))
        .toEqual({ minProperties: { minimumProperties: 2, currentProperties: 0 } });
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.minProperties(2)(ctrl({ a: 1, b: 2 }), true))
        .toEqual({ minProperties: { minimumProperties: 2, currentProperties: 2 } });
      expect(JsonValidators.minProperties(2)(ctrl({ a: 1 }), true)).toBeNull();
    });
  });

  describe('maxProperties', () => {
    it('returns the no-op validator when no maximum is given', () => {
      expect(JsonValidators.maxProperties(null)(ctrl({ a: 1 }))).toBeNull();
      expect(JsonValidators.maxProperties(undefined)(ctrl({ a: 1 }))).toBeNull();
    });

    it('accepts an object with at most the maximum number of properties', () => {
      expect(JsonValidators.maxProperties(2)(ctrl({}))).toBeNull();
      expect(JsonValidators.maxProperties(2)(ctrl({ a: 1, b: 2 }))).toBeNull();
    });

    it('rejects an object with too many properties', () => {
      expect(JsonValidators.maxProperties(2)(ctrl({ a: 1, b: 2, c: 3 })))
        .toEqual({ maxProperties: { maximumProperties: 2, currentProperties: 3 } });
    });

    it('passes a null value through untested', () => {
      expect(JsonValidators.maxProperties(2)(ctrl(null))).toBeNull();
    });

    it('counts string indices when given a string value', () => {
      expect(JsonValidators.maxProperties(2)(ctrl('abc')))
        .toEqual({ maxProperties: { maximumProperties: 2, currentProperties: 3 } });
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.maxProperties(2)(ctrl({ a: 1 }), true))
        .toEqual({ maxProperties: { maximumProperties: 2, currentProperties: 1 } });
      expect(JsonValidators.maxProperties(2)(ctrl({ a: 1, b: 2, c: 3 }), true)).toBeNull();
    });
  });

  describe('dependencies', () => {
    it('returns the no-op validator when the dependencies are not a usable object', () => {
      expect(JsonValidators.dependencies(null)(ctrl({ a: 1 }))).toBeNull();
      expect(JsonValidators.dependencies(undefined)(ctrl({ a: 1 }))).toBeNull();
      expect(JsonValidators.dependencies({})(ctrl({ a: 1 }))).toBeNull();
      expect(JsonValidators.dependencies('abc')(ctrl({ a: 1 }))).toBeNull();
      expect(JsonValidators.dependencies([])(ctrl({ a: 1 }))).toBeNull();
    });

    it('passes empty control values through untested', () => {
      const validator = JsonValidators.dependencies({ credit_card: ['billing_address'] });

      expect(validator(ctrl({}))).toBeNull();
      expect(validator(ctrl(null))).toBeNull();
    });

    it('reports a missing property dependency under the requiring field', () => {
      const validator = JsonValidators.dependencies({ credit_card: ['billing_address'] });

      expect(validator(ctrl({ credit_card: '1234' }))).toEqual({
        credit_card: { billing_address: { required: true } }
      });
    });

    it('returns null when the dependency is satisfied', () => {
      const validator = JsonValidators.dependencies({ credit_card: ['billing_address'] });

      expect(validator(ctrl({ credit_card: '1234', billing_address: '1 Main St' })))
        .toBeNull();
    });

    it('returns null when the requiring field is absent', () => {
      const validator = JsonValidators.dependencies({ credit_card: ['billing_address'] });

      expect(validator(ctrl({ other: 'x' }))).toBeNull();
    });

    it('merges required and properties errors under one requiring field', () => {
      const validator = JsonValidators.dependencies({
        credit_card: {
          required: ['billing_address'],
          properties: { holder: { minLength: 5 } }
        }
      });

      expect(validator(ctrl({ credit_card: '1234', holder: 'abc' }))).toEqual({
        credit_card: {
          billing_address: { required: true },
          holder: { minLength: { minimumLength: 5, currentLength: 3 } }
        }
      });
    });

    it('applies a schema dependency keyword to the named property', () => {
      const validator = JsonValidators.dependencies({
        credit_card: { properties: { billing_address: { minLength: 5 } } }
      });

      expect(validator(ctrl({ credit_card: '1234', billing_address: 'abc' }))).toEqual({
        credit_card: { billing_address: { minLength: { minimumLength: 5, currentLength: 3 } } }
      });
      expect(validator(ctrl({ credit_card: '1234', billing_address: '1 Main St' })))
        .toBeNull();
    });

    it('treats a boolean exclusiveMaximum as the draft 4 modifier of maximum', () => {
      const validator = JsonValidators.dependencies({
        credit_card: {
          properties: { amount: { maximum: 10, exclusiveMaximum: true } }
        }
      });

      // The bound is exclusive, so 10 fails and 9 passes. The boolean itself is
      // not validated against, which would compare the value to `true`.
      expect(validator(ctrl({ credit_card: '1234', amount: 10 }))).toEqual({
        credit_card: { amount: { exclusiveMaximum: { exclusiveMaximumValue: 10, currentValue: 10 } } }
      });
      expect(validator(ctrl({ credit_card: '1234', amount: 9 }))).toBeNull();
    });

    it('applies a numeric exclusiveMaximum as its own draft 6 keyword', () => {
      const validator = JsonValidators.dependencies({
        credit_card: { properties: { amount: { exclusiveMaximum: 5 } } }
      });

      expect(validator(ctrl({ credit_card: '1234', amount: 9 }))).toEqual({
        credit_card: { amount: { exclusiveMaximum: { exclusiveMaximumValue: 5, currentValue: 9 } } }
      });
      expect(validator(ctrl({ credit_card: '1234', amount: 1 }))).toBeNull();
    });

    it('does not throw when inverted', () => {
      const validator = JsonValidators.dependencies({ credit_card: ['billing_address'] });

      expect(() => validator(ctrl({ credit_card: '1234' }), true)).not.toThrow();
      expect(validator(ctrl({ credit_card: '1234' }), true)).toBeNull();
    });
  });

  describe('minItems', () => {
    it('returns the no-op validator when no minimum is given', () => {
      expect(JsonValidators.minItems(null)(ctrl([1]))).toBeNull();
      expect(JsonValidators.minItems(undefined)(ctrl([1]))).toBeNull();
    });

    it('treats an empty array as valid regardless of the minimum', () => {
      expect(JsonValidators.minItems(2)(ctrl([]))).toBeNull();
      expect(JsonValidators.minItems(2)(ctrl(null))).toBeNull();
    });

    it('accepts an array with at least the minimum number of items', () => {
      expect(JsonValidators.minItems(2)(ctrl([1, 2]))).toBeNull();
    });

    it('rejects an array with too few items', () => {
      expect(JsonValidators.minItems(2)(ctrl([1])))
        .toEqual({ minItems: { minimumItems: 2, currentItems: 1 } });
    });

    it('treats a non-array value as having 0 items', () => {
      expect(JsonValidators.minItems(2)(ctrl('abc')))
        .toEqual({ minItems: { minimumItems: 2, currentItems: 0 } });
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.minItems(2)(ctrl([1, 2]), true))
        .toEqual({ minItems: { minimumItems: 2, currentItems: 2 } });
      expect(JsonValidators.minItems(2)(ctrl([1]), true)).toBeNull();
    });
  });

  describe('maxItems', () => {
    it('returns the no-op validator when no maximum is given', () => {
      expect(JsonValidators.maxItems(null)(ctrl([1, 2, 3]))).toBeNull();
      expect(JsonValidators.maxItems(undefined)(ctrl([1, 2, 3]))).toBeNull();
    });

    it('accepts an array with at most the maximum number of items', () => {
      expect(JsonValidators.maxItems(2)(ctrl([1, 2]))).toBeNull();
      expect(JsonValidators.maxItems(2)(ctrl([]))).toBeNull();
    });

    it('rejects an array with too many items', () => {
      expect(JsonValidators.maxItems(2)(ctrl([1, 2, 3])))
        .toEqual({ maxItems: { maximumItems: 2, currentItems: 3 } });
    });

    it('has no empty guard, so a non-array value counts as 0 items', () => {
      expect(JsonValidators.maxItems(2)(ctrl(null))).toBeNull();
      expect(JsonValidators.maxItems(-1)(ctrl(null)))
        .toEqual({ maxItems: { maximumItems: -1, currentItems: 0 } });
    });

    it('flips the result when inverted', () => {
      expect(JsonValidators.maxItems(2)(ctrl([1, 2]), true))
        .toEqual({ maxItems: { maximumItems: 2, currentItems: 2 } });
      expect(JsonValidators.maxItems(2)(ctrl([1, 2, 3]), true)).toBeNull();
    });
  });

  describe('uniqueItems', () => {
    it('returns the no-op validator when uniqueness is disabled', () => {
      expect(JsonValidators.uniqueItems(false)(ctrl([1, 1]))).toBeNull();
    });

    it('passes empty values through untested', () => {
      expect(JsonValidators.uniqueItems()(ctrl([]))).toBeNull();
      expect(JsonValidators.uniqueItems()(ctrl(null))).toBeNull();
    });

    it('accepts an array of unique items', () => {
      expect(JsonValidators.uniqueItems()(ctrl([1, 2, 3]))).toBeNull();
      expect(JsonValidators.uniqueItems(true)(ctrl(['a', 'b']))).toBeNull();
    });

    it('rejects an array containing duplicates', () => {
      expect(JsonValidators.uniqueItems()(ctrl([1, 1, 2])))
        .toEqual({ uniqueItems: { duplicateItems: [1] } });
      expect(JsonValidators.uniqueItems()(ctrl(['a', 'a', 'a'])))
        .toEqual({ uniqueItems: { duplicateItems: ['a'] } });
    });

    it('reports each duplicated item once, however many times it repeats', () => {
      expect(JsonValidators.uniqueItems()(ctrl([1, 1, 1, 1])))
        .toEqual({ uniqueItems: { duplicateItems: [1] } });
    });

    it('compares items by value, so equal objects and arrays are duplicates', () => {
      expect(JsonValidators.uniqueItems()(ctrl([{ x: 1 }, { x: 1 }])))
        .toEqual({ uniqueItems: { duplicateItems: [{ x: 1 }] } });
      expect(JsonValidators.uniqueItems()(ctrl([[1], [1]])))
        .toEqual({ uniqueItems: { duplicateItems: [[1]] } });
    });

    it('finds duplicates that are not next to each other', () => {
      expect(JsonValidators.uniqueItems()(ctrl([{ x: 1 }, { y: 2 }, { x: 1 }])))
        .toEqual({ uniqueItems: { duplicateItems: [{ x: 1 }] } });
    });

    it('treats a number and its string form as different items', () => {
      // JSON Schema compares by value and type, so 1 and '1' are not duplicates.
      expect(JsonValidators.uniqueItems()(ctrl([1, '1']))).toBeNull();
    });

    it('passes non-array values through untested', () => {
      const validator = JsonValidators.uniqueItems();

      expect(validator(ctrl('abc'))).toBeNull();
      expect(validator(ctrl({ a: 1 }))).toBeNull();
    });

    it('passes a duplicated array when inverted', () => {
      expect(JsonValidators.uniqueItems()(ctrl([1, 1, 2]), true)).toBeNull();
    });
  });

  describe('contains', () => {
    it('returns the no-op validator when the required item is falsy', () => {
      expect(JsonValidators.contains(false)(ctrl([1, 2]))).toBeNull();
    });

    it('passes empty or non-array values through untested', () => {
      expect(JsonValidators.contains()(ctrl([]))).toBeNull();
      expect(JsonValidators.contains()(ctrl(null))).toBeNull();
      expect(JsonValidators.contains()(ctrl('abc'))).toBeNull();
    });

    it('accepts any non-empty array because the check is unimplemented', () => {
      expect(JsonValidators.contains()(ctrl([1, 2]))).toBeNull();
      expect(JsonValidators.contains(true)(ctrl(['a']))).toBeNull();
    });

    it('reports an error when inverted', () => {
      expect(JsonValidators.contains()(ctrl([1, 2]), true))
        .toEqual({ contains: { requiredItem: true, currentItems: [1, 2] } });
    });
  });

  describe('composeAnyOf', () => {
    it('returns null when there is nothing to compose', () => {
      expect(JsonValidators.composeAnyOf(null)).toBeNull();
      expect(JsonValidators.composeAnyOf(undefined)).toBeNull();
      expect(JsonValidators.composeAnyOf([])).toBeNull();
      expect(JsonValidators.composeAnyOf([null, undefined])).toBeNull();
    });

    it('passes when at least one validator passes', () => {
      const validator = JsonValidators.composeAnyOf([
        JsonValidators.minLength(5),
        JsonValidators.maxLength(2)
      ]);

      expect(validator(ctrl('abcdef'))).toBeNull();
    });

    it('merges every error and adds anyOf when all validators fail', () => {
      const validator = JsonValidators.composeAnyOf([
        JsonValidators.minLength(5),
        JsonValidators.maxLength(2)
      ]);

      expect(validator(ctrl('abc'))).toEqual({
        minLength: { minimumLength: 5, currentLength: 3 },
        maxLength: { maximumLength: 2, currentLength: 3 },
        anyOf: true
      });
    });

    it('ignores undefined entries rather than counting them as passing validators', () => {
      const validator = JsonValidators.composeAnyOf([JsonValidators.minLength(5), null]);

      expect(validator(ctrl('abc'))).toEqual({
        minLength: { minimumLength: 5, currentLength: 3 },
        anyOf: true
      });
    });

    it('reports anyOf false when inverted', () => {
      const validator = JsonValidators.composeAnyOf([
        JsonValidators.minLength(5),
        JsonValidators.maxLength(2)
      ]);

      expect(validator(ctrl('abc'), true)).toEqual({ anyOf: false });
    });
  });

  describe('composeOneOf', () => {
    it('returns null when there is nothing to compose', () => {
      expect(JsonValidators.composeOneOf(null)).toBeNull();
      expect(JsonValidators.composeOneOf(undefined)).toBeNull();
      expect(JsonValidators.composeOneOf([])).toBeNull();
      expect(JsonValidators.composeOneOf([null])).toBeNull();
    });

    it('passes when exactly one validator is valid', () => {
      const validator = JsonValidators.composeOneOf([
        JsonValidators.minLength(5),
        JsonValidators.maxLength(2)
      ]);

      expect(validator(ctrl('abcdef'))).toBeNull();
    });

    it('merges every error and adds oneOf when none are valid', () => {
      const validator = JsonValidators.composeOneOf([
        JsonValidators.minLength(5),
        JsonValidators.maxLength(2)
      ]);

      expect(validator(ctrl('abc'))).toEqual({
        minLength: { minimumLength: 5, currentLength: 3 },
        maxLength: { maximumLength: 2, currentLength: 3 },
        oneOf: true
      });
    });

    it('ignores undefined entries rather than counting them as valid', () => {
      const validator = JsonValidators.composeOneOf([JsonValidators.minLength(5), null]);

      expect(validator(ctrl('abc'))).toEqual({
        minLength: { minimumLength: 5, currentLength: 3 },
        oneOf: true
      });
    });

    it('reports oneOf when more than one validator is valid', () => {
      const validator = JsonValidators.composeOneOf([
        JsonValidators.minLength(1),
        JsonValidators.maxLength(10)
      ]);

      expect(validator(ctrl('abc'))).toEqual({ oneOf: true });
    });

    it('does not throw when inverted', () => {
      const validator = JsonValidators.composeOneOf([
        JsonValidators.minLength(5),
        JsonValidators.maxLength(2)
      ]);

      expect(() => validator(ctrl('abc'), true)).not.toThrow();
      expect(validator(ctrl('abcdef'), true)).toBeDefined();
    });
  });

  describe('composeAllOf', () => {
    it('returns null when there is nothing to compose', () => {
      expect(JsonValidators.composeAllOf(null)).toBeNull();
      expect(JsonValidators.composeAllOf(undefined)).toBeNull();
      expect(JsonValidators.composeAllOf([])).toBeNull();
      expect(JsonValidators.composeAllOf([null])).toBeNull();
    });

    it('passes when every validator is valid', () => {
      const validator = JsonValidators.composeAllOf([
        JsonValidators.minLength(1),
        JsonValidators.maxLength(10)
      ]);

      expect(validator(ctrl('abc'))).toBeNull();
    });

    it('merges the errors and adds allOf when one validator fails', () => {
      const validator = JsonValidators.composeAllOf([
        JsonValidators.minLength(5),
        JsonValidators.maxLength(10)
      ]);

      expect(validator(ctrl('abc'))).toEqual({
        minLength: { minimumLength: 5, currentLength: 3 },
        allOf: true
      });
    });

    it('returns null when inverted and the inverted validators produce errors', () => {
      const validator = JsonValidators.composeAllOf([JsonValidators.minLength(1)]);

      expect(validator(ctrl('abc'), true)).toBeNull();
    });
  });

  describe('composeNot', () => {
    it('returns null when there is no validator to invert', () => {
      expect(JsonValidators.composeNot(null)).toBeNull();
      expect(JsonValidators.composeNot(undefined)).toBeNull();
    });

    it('passes empty values through untested', () => {
      const validator = JsonValidators.composeNot(JsonValidators.minLength(5));

      expect(validator(ctrl(''))).toBeNull();
      expect(validator(ctrl(null))).toBeNull();
    });

    it('passes when the wrapped validator would fail', () => {
      const validator = JsonValidators.composeNot(JsonValidators.minLength(5));

      expect(validator(ctrl('abc'))).toBeNull();
    });

    it('reports the wrapped error plus not when the wrapped validator would pass', () => {
      const validator = JsonValidators.composeNot(JsonValidators.minLength(5));

      expect(validator(ctrl('abcdef'))).toEqual({
        minLength: { minimumLength: 5, currentLength: 6 },
        not: true
      });
    });

    it('does not throw when inverted', () => {
      const validator = JsonValidators.composeNot(JsonValidators.minLength(5));

      expect(() => validator(ctrl('abcdef'), true)).not.toThrow();
    });
  });

  describe('compose', () => {
    it('returns null when there is nothing to compose', () => {
      expect(JsonValidators.compose(null)).toBeNull();
      expect(JsonValidators.compose(undefined)).toBeNull();
      expect(JsonValidators.compose([])).toBeNull();
      expect(JsonValidators.compose([null, undefined])).toBeNull();
    });

    it('returns null when every validator is valid', () => {
      expect(JsonValidators.compose([JsonValidators.minLength(1)])(ctrl('abc'))).toBeNull();
    });

    it('merges the errors of every failing validator', () => {
      const validator = JsonValidators.compose([
        JsonValidators.minLength(5),
        JsonValidators.maxLength(2)
      ]);

      expect(validator(ctrl('abc'))).toEqual({
        minLength: { minimumLength: 5, currentLength: 3 },
        maxLength: { maximumLength: 2, currentLength: 3 }
      });
    });

    it('does not throw when inverted', () => {
      const validator = JsonValidators.compose([JsonValidators.minLength(5)]);

      expect(() => validator(ctrl('abc'), true)).not.toThrow();
    });
  });

  describe('composeAsync', () => {
    it('returns null when there is nothing to compose', () => {
      expect(JsonValidators.composeAsync(null)).toBeNull();
      expect(JsonValidators.composeAsync(undefined)).toBeNull();
      expect(JsonValidators.composeAsync([])).toBeNull();
      expect(JsonValidators.composeAsync([null])).toBeNull();
    });

    it('builds a combined async validator that returns an observable of the merged errors', () => {
      const asyncValidator: any = () => of(null);
      const validator = JsonValidators.composeAsync([asyncValidator]);

      expect(typeof validator).toEqual('function');
      const result: any = validator(ctrl('abc'));
      expect(result instanceof Observable).toBe(true);

      let emitted: any = 'not emitted';
      result.subscribe(value => emitted = value);
      expect(emitted).toBeNull();
    });
  });

  describe('min', () => {
    it('returns the no-op validator when no minimum is given', () => {
      expect(JsonValidators.min(null)(ctrl(1))).toBeNull();
      expect(JsonValidators.min(undefined)(ctrl(1))).toBeNull();
    });

    it('passes empty values through untested', () => {
      expect(JsonValidators.min(5)(ctrl(''))).toBeNull();
      expect(JsonValidators.min(5)(ctrl(null))).toBeNull();
    });

    it('accepts a value at or above the minimum', () => {
      expect(JsonValidators.min(5)(ctrl(5))).toBeNull();
      expect(JsonValidators.min(5)(ctrl(10))).toBeNull();
    });

    it('rejects a value below the minimum', () => {
      expect(JsonValidators.min(5)(ctrl(3))).toEqual({ min: { min: 5, actual: 3 } });
    });

    it('accepts a value that does not parse as a number', () => {
      expect(JsonValidators.min(5)(ctrl('abc'))).toBeNull();
    });
  });

  describe('max', () => {
    it('returns the no-op validator when no maximum is given', () => {
      expect(JsonValidators.max(null)(ctrl(1))).toBeNull();
      expect(JsonValidators.max(undefined)(ctrl(1))).toBeNull();
    });

    it('passes empty values through untested', () => {
      expect(JsonValidators.max(5)(ctrl(''))).toBeNull();
      expect(JsonValidators.max(5)(ctrl(null))).toBeNull();
    });

    it('accepts a value at or below the maximum', () => {
      expect(JsonValidators.max(5)(ctrl(5))).toBeNull();
      expect(JsonValidators.max(5)(ctrl(3))).toBeNull();
    });

    it('rejects a value above the maximum', () => {
      expect(JsonValidators.max(5)(ctrl(10))).toEqual({ max: { max: 5, actual: 10 } });
    });

    it('accepts a value that does not parse as a number', () => {
      expect(JsonValidators.max(5)(ctrl('abc'))).toBeNull();
    });

    it('parses the leading number of a mixed string', () => {
      expect(JsonValidators.max(5)(ctrl('7abc'))).toEqual({ max: { max: 5, actual: '7abc' } });
    });
  });

  describe('requiredTrue', () => {
    it('accepts a control whose value is exactly true', () => {
      expect(JsonValidators.requiredTrue(ctrl(true))).toBeNull();
    });

    it('rejects any other control value', () => {
      expect(JsonValidators.requiredTrue(ctrl(false))).toEqual({ required: true });
      expect(JsonValidators.requiredTrue(ctrl('true'))).toEqual({ required: true });
      expect(JsonValidators.requiredTrue(ctrl(null))).toEqual({ required: true });
    });

    it('returns no error when given no control', () => {
      expect(JsonValidators.requiredTrue(null)).toBeNull();
      expect(JsonValidators.requiredTrue(undefined)).toBeNull();
    });
  });

  describe('email', () => {
    it('accepts a well formed address', () => {
      expect(JsonValidators.email(ctrl('a@b.com'))).toBeNull();
    });

    it('rejects a malformed address', () => {
      expect(JsonValidators.email(ctrl('not-an-email'))).toEqual({ email: true });
      expect(JsonValidators.email(ctrl(''))).toEqual({ email: true });
      expect(JsonValidators.email(ctrl(null))).toEqual({ email: true });
    });

    it('returns no error when given no control', () => {
      expect(JsonValidators.email(null)).toBeNull();
      expect(JsonValidators.email(undefined)).toBeNull();
    });
  });
});
