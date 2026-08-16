import {
  addClasses,
  cleanValueOfQuotes,
  commonItems,
  copy,
  ExpressionType,
  fixTitle,
  forEach,
  forEachCopy,
  getExpressionType,
  getKeyAndValueByExpressionType,
  hasOwn,
  isEqual,
  isNotEqual,
  isNotExpression,
  mergeFilteredObject,
  toTitleCase,
  uniqueItems,
} from './utility.functions';

describe('Utility functions', () => {

  describe('addClasses', () => {

    it('merges two space delimited strings and removes duplicates', () => {
      expect(addClasses('a b', 'b c')).toEqual('a b c');
    });

    it('appends a new class to an existing string', () => {
      expect(addClasses('a', 'b')).toEqual('a b');
    });

    it('returns oldClasses unchanged when newClasses is null', () => {
      expect(addClasses('a', null)).toEqual('a');
    });

    it('returns oldClasses unchanged when newClasses is undefined', () => {
      expect(addClasses('a', undefined)).toEqual('a');
    });

    it('returns oldClasses unchanged when newClasses is a number', () => {
      expect(addClasses('a', 5 as any)).toEqual('a');
    });

    it('returns null when both inputs are null', () => {
      expect(addClasses(null, null)).toBeNull();
    });

    it('treats a null oldClasses as an empty string, which leaves a leading space', () => {
      // '' splits to [''], so the empty member survives into the joined result.
      expect(addClasses(null, 'a b')).toEqual(' a b');
    });

    it('treats a numeric oldClasses as an empty string', () => {
      expect(addClasses(5 as any, 'a')).toEqual(' a');
    });

    it('keeps the leading empty member when oldClasses is an empty string', () => {
      expect(addClasses('', 'a')).toEqual(' a');
    });

    it('keeps a trailing space when newClasses is an empty string', () => {
      // '' splits to [''], which becomes an extra empty member at the end.
      expect(addClasses('a', '')).toEqual('a ');
    });

    it('returns an array when oldClasses is an array', () => {
      expect(addClasses(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
    });

    it('returns an array when oldClasses is an empty array', () => {
      expect(addClasses([], 'a')).toEqual(['a']);
    });

    it('accepts an array as newClasses', () => {
      expect(addClasses('a', ['b', 'c'])).toEqual('a b c');
    });

    it('leaves the string untouched when newClasses is an empty array', () => {
      expect(addClasses('a b', [])).toEqual('a b');
    });

    it('accepts a Set as newClasses', () => {
      expect(addClasses('a', new Set(['b']))).toEqual('a b');
    });

    it('returns a Set when oldClasses is a Set', () => {
      const result: any = addClasses(new Set(['a']), new Set(['b']));

      expect(result instanceof Set).toBe(true);
      expect(Array.from(result)).toEqual(['a', 'b']);
    });

    it('mutates and returns the original Set when oldClasses is a Set', () => {
      const oldSet = new Set(['a']);
      const result: any = addClasses(oldSet, 'b');

      expect(result).toBe(oldSet);
      expect(Array.from(oldSet)).toEqual(['a', 'b']);
    });

    it('does not duplicate classes already present in an array', () => {
      expect(addClasses(['a'], ['b', 'a'])).toEqual(['a', 'b']);
    });
  });

  describe('copy', () => {

    it('returns null unchanged', () => {
      expect(copy(null)).toBeNull();
    });

    it('returns undefined unchanged', () => {
      expect(copy(undefined)).toBeUndefined();
    });

    it('returns primitives unchanged', () => {
      expect(copy('abc')).toEqual('abc');
      expect(copy(0)).toEqual(0);
      expect(copy(false)).toEqual(false);
    });

    it('returns a function unchanged', () => {
      const fn = () => 1;

      expect(copy(fn)).toBe(fn);
    });

    it('copies a plain object into a new reference', () => {
      const original = { a: 1, b: 2 };
      const result = copy(original);

      expect(result).toEqual({ a: 1, b: 2 });
      expect(result).not.toBe(original);
    });

    it('copies an empty object', () => {
      expect(copy({})).toEqual({});
    });

    it('copies an array into a new reference', () => {
      const original = [1, 2];
      const result = copy(original);

      expect(result).toEqual([1, 2]);
      expect(result).not.toBe(original);
      expect(Array.isArray(result)).toBe(true);
    });

    it('copies an empty array', () => {
      expect(copy([])).toEqual([]);
    });

    it('copies a Map into a new Map', () => {
      const original = new Map([['a', 1]]);
      const result = copy(original);

      expect(result instanceof Map).toBe(true);
      expect(result).not.toBe(original);
      expect(result.get('a')).toEqual(1);
      expect(result.size).toEqual(1);
    });

    it('copies a Set into a new Set', () => {
      const original = new Set(['a']);
      const result = copy(original);

      expect(result instanceof Set).toBe(true);
      expect(result).not.toBe(original);
      expect(result.has('a')).toBe(true);
    });

    it('is shallow, so nested objects stay shared', () => {
      const original = { nested: { a: 1 } };
      const result = copy(original);

      expect(result.nested).toBe(original.nested);
    });

    it('turns a Date into an empty plain object', () => {
      // A Date has no own enumerable properties, so the object spread yields {}.
      const result = copy(new Date());

      expect(result instanceof Date).toBe(false);
      expect(Object.keys(result).length).toEqual(0);
    });

    it('behaves the same when the errors flag is set', () => {
      // The error branch is unreachable: every non-null typeof 'object' satisfies isObject.
      expect(copy({ a: 1 }, true)).toEqual({ a: 1 });
    });
  });

  describe('forEach', () => {

    it('does nothing for null', () => {
      const visited: any[] = [];
      forEach(null, v => visited.push(v));

      expect(visited).toEqual([]);
    });

    it('does nothing for undefined', () => {
      const visited: any[] = [];
      forEach(undefined, v => visited.push(v));

      expect(visited).toEqual([]);
    });

    it('does nothing for an empty object', () => {
      const visited: any[] = [];
      forEach({}, v => visited.push(v));

      expect(visited).toEqual([]);
    });

    it('does nothing for an empty array', () => {
      const visited: any[] = [];
      forEach([], v => visited.push(v));

      expect(visited).toEqual([]);
    });

    it('does nothing for an empty string', () => {
      const visited: any[] = [];
      forEach('', v => visited.push(v));

      expect(visited).toEqual([]);
    });

    it('does nothing for a non empty string', () => {
      const visited: any[] = [];
      forEach('abc', v => visited.push(v));

      expect(visited).toEqual([]);
    });

    it('does nothing for a number', () => {
      const visited: any[] = [];
      forEach(42, v => visited.push(v));

      expect(visited).toEqual([]);
    });

    it('calls the iterator once per own key of an object', () => {
      const visited: any[] = [];
      forEach({ a: 1, b: 2 }, (v, k) => visited.push([k, v]));

      expect(visited).toEqual([['a', 1], ['b', 2]]);
    });

    it('calls the iterator with string keys for arrays', () => {
      const visited: any[] = [];
      forEach([10, 20], (v, k) => visited.push([k, v]));

      expect(visited).toEqual([['0', 10], ['1', 20]]);
    });

    it('passes the containing object and the root object to the iterator', () => {
      const root = { a: 1 };
      const containers: any[] = [];
      const roots: any[] = [];
      forEach(root, (v, k, c, rc) => { containers.push(c); roots.push(rc); });

      expect(containers).toEqual([root]);
      expect(roots).toEqual([root]);
    });

    it('does not recurse by default', () => {
      const visited: any[] = [];
      forEach({ a: { b: 1 } }, (v, k) => visited.push(k));

      expect(visited).toEqual(['a']);
    });

    it('visits parents before children with top-down', () => {
      const visited: any[] = [];
      forEach({ a: { b: 1 } }, (v, k) => visited.push(k), 'top-down');

      expect(visited).toEqual(['a', 'b']);
    });

    it('visits children before parents with bottom-up', () => {
      const visited: any[] = [];
      forEach({ a: { b: 1 } }, (v, k) => visited.push(k), 'bottom-up');

      expect(visited).toEqual(['b', 'a']);
    });

    it('recurses into nested arrays with top-down', () => {
      const visited: any[] = [];
      forEach({ a: [1, 2] }, (v, k) => visited.push(k), 'top-down');

      expect(visited).toEqual(['a', '0', '1']);
    });

    it('keeps the original root object while recursing', () => {
      const root = { a: { b: 1 } };
      const roots: any[] = [];
      forEach(root, (v, k, c, rc) => roots.push(rc), 'top-down');

      expect(roots.length).toEqual(2);
      expect(roots.every(r => r === root)).toBe(true);
    });

    it('does not recurse when recurse is boolean true', () => {
      // Only the strings 'top-down' and 'bottom-up' trigger recursion.
      const visited: any[] = [];
      forEach({ a: { b: 1 } }, (v, k) => visited.push(k), true);

      expect(visited).toEqual(['a']);
    });

    it('does not throw when the iterator is not a function', () => {
      expect(() => forEach({ a: 1 }, null as any)).not.toThrow();
    });

    it('logs both errors when errors is true and input is neither object nor function', () => {
      const spy = spyOn(console, 'error');
      forEach('abc', null as any, false, undefined, true);

      expect(spy).toHaveBeenCalledTimes(4);
    });

    it('logs only the iterator error when the object is valid', () => {
      const spy = spyOn(console, 'error');
      forEach({ a: 1 }, null as any, false, undefined, true);

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('logs only the object error when the iterator is valid', () => {
      const spy = spyOn(console, 'error');
      forEach('abc', v => v, false, undefined, true);

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('forEachCopy', () => {

    it('returns undefined for null', () => {
      expect(forEachCopy(null, v => v)).toBeUndefined();
    });

    it('returns undefined for undefined', () => {
      expect(forEachCopy(undefined, v => v)).toBeUndefined();
    });

    it('returns undefined for an empty string', () => {
      expect(forEachCopy('', v => v)).toBeUndefined();
    });

    it('returns undefined for a non empty string', () => {
      expect(forEachCopy('abc', v => v)).toBeUndefined();
    });

    it('returns undefined for a number', () => {
      expect(forEachCopy(42, v => v)).toBeUndefined();
    });

    it('returns undefined for a function', () => {
      expect(forEachCopy(() => 1, v => v)).toBeUndefined();
    });

    it('maps every value of an object', () => {
      expect(forEachCopy({ a: 1, b: 2 }, v => v * 2)).toEqual({ a: 2, b: 4 });
    });

    it('maps every value of an array and keeps it an array', () => {
      const result = forEachCopy([1, 2], v => v * 2);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([2, 4]);
    });

    it('returns an empty object for an empty object', () => {
      expect(forEachCopy({}, v => v)).toEqual({});
    });

    it('returns an empty array for an empty array', () => {
      const result = forEachCopy([], v => v);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('passes the value, the key, and the source object to the iterator', () => {
      const source = { a: 1 };
      const calls: any[] = [];
      forEachCopy(source, (v, k, o) => { calls.push([v, k, o]); return v; });

      expect(calls).toEqual([[1, 'a', source]]);
    });

    it('returns a new object rather than the source', () => {
      const source = { a: 1 };

      expect(forEachCopy(source, v => v)).not.toBe(source);
    });

    it('throws when the iterator is not a function and the object has keys', () => {
      // The guard checks typeof object, not typeof fn, so a bad iterator is not caught.
      expect(() => forEachCopy({ a: 1 }, null as any)).toThrow();
    });

    it('does not throw for a bad iterator when the object has no keys', () => {
      expect(forEachCopy({}, null as any)).toEqual({});
    });

    it('logs both errors when errors is true and input is neither object nor function', () => {
      const spy = spyOn(console, 'error');
      forEachCopy('abc', null as any, true);

      expect(spy).toHaveBeenCalledTimes(4);
    });

    it('logs only the object error when the iterator is valid', () => {
      const spy = spyOn(console, 'error');
      forEachCopy('abc', v => v, true);

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('hasOwn', () => {

    it('returns false for a null object', () => {
      expect(hasOwn(null, 'a')).toBe(false);
    });

    it('returns false for an undefined object', () => {
      expect(hasOwn(undefined, 'a')).toBe(false);
    });

    it('returns false for falsy scalars', () => {
      expect(hasOwn(0, 'a')).toBe(false);
      expect(hasOwn('', 'a')).toBe(false);
      expect(hasOwn(false, 'a')).toBe(false);
    });

    it('returns false when the property is undefined', () => {
      expect(hasOwn({ a: 1 }, undefined)).toBe(false);
    });

    it('returns false when the property is null', () => {
      expect(hasOwn({ a: 1 }, null)).toBe(false);
    });

    it('returns false for a string object, even for a real property', () => {
      expect(hasOwn('abc', 'length')).toBe(false);
    });

    it('returns false for a function object', () => {
      expect(hasOwn(() => 1, 'name')).toBe(false);
    });

    it('finds an own property of an object', () => {
      expect(hasOwn({ a: 1 }, 'a')).toBe(true);
    });

    it('finds an own property whose value is undefined', () => {
      expect(hasOwn({ a: undefined }, 'a')).toBe(true);
    });

    it('does not find a missing property', () => {
      expect(hasOwn({ a: 1 }, 'b')).toBe(false);
    });

    it('does not find an inherited property', () => {
      expect(hasOwn({}, 'toString')).toBe(false);
    });

    it('finds an array index given as a string', () => {
      expect(hasOwn([1, 2], '0')).toBe(true);
      expect(hasOwn([1, 2], '5')).toBe(false);
    });

    it('finds the own length property of an array', () => {
      expect(hasOwn([1, 2], 'length')).toBe(true);
    });

    it('returns the element itself, not a boolean, for a numeric array index', () => {
      // The array branch returns object[property] rather than a presence check.
      const result: any = hasOwn([1, 2], 0 as any);

      expect(result).toEqual(1);
    });

    it('returns a falsy element for an existing index holding 0', () => {
      const result: any = hasOwn([0, 1], 0 as any);

      expect(result).toEqual(0);
    });

    it('coerces a numeric property to a string for non array objects', () => {
      expect(hasOwn({ 0: 'x' }, 0 as any)).toBe(true);
      expect(hasOwn({ a: 1 }, 5 as any)).toBe(false);
    });

    it('uses Map.has for Maps', () => {
      expect(hasOwn(new Map([['a', 1]]), 'a')).toBe(true);
      expect(hasOwn(new Map([['a', 1]]), 'b')).toBe(false);
      expect(hasOwn(new Map(), 'a')).toBe(false);
    });

    it('uses Set.has for Sets', () => {
      expect(hasOwn(new Set(['a']), 'a')).toBe(true);
      expect(hasOwn(new Set(['a']), 'b')).toBe(false);
    });

    it('accepts a symbol property', () => {
      const sym = Symbol('s');
      const target: any = {};
      target[sym] = 1;

      expect(hasOwn(target, sym as any)).toBe(true);
    });

    it('returns false for a Date property that is not own', () => {
      expect(hasOwn(new Date(), 'getTime')).toBe(false);
    });
  });

  describe('getExpressionType', () => {

    it('detects an equals expression', () => {
      expect(getExpressionType('a==b')).toEqual(ExpressionType.EQUALS);
    });

    it('detects a not equals expression', () => {
      expect(getExpressionType('a!=b')).toEqual(ExpressionType.NOT_EQUALS);
    });

    it('returns NOT_AN_EXPRESSION for a single equals sign', () => {
      expect(getExpressionType('a=b')).toEqual(ExpressionType.NOT_AN_EXPRESSION);
    });

    it('returns NOT_AN_EXPRESSION for an empty string', () => {
      expect(getExpressionType('')).toEqual(ExpressionType.NOT_AN_EXPRESSION);
    });

    it('reports strict inequality as EQUALS because it contains ==', () => {
      expect(getExpressionType('a!==b')).toEqual(ExpressionType.EQUALS);
    });

    it('throws for null', () => {
      expect(() => getExpressionType(null)).toThrow();
    });

    it('throws for undefined', () => {
      expect(() => getExpressionType(undefined)).toThrow();
    });

    it('throws for a number, because indexOf is called before toString', () => {
      expect(() => getExpressionType(5 as any)).toThrow();
    });
  });

  describe('isEqual', () => {

    it('is true only for EQUALS', () => {
      expect(isEqual(ExpressionType.EQUALS)).toBe(true);
      expect(isEqual(ExpressionType.NOT_EQUALS)).toBe(false);
      expect(isEqual(ExpressionType.NOT_AN_EXPRESSION)).toBe(false);
    });

    it('is false for null and undefined', () => {
      expect(isEqual(null)).toBe(false);
      expect(isEqual(undefined)).toBe(false);
    });
  });

  describe('isNotEqual', () => {

    it('is true only for NOT_EQUALS', () => {
      expect(isNotEqual(ExpressionType.NOT_EQUALS)).toBe(true);
      expect(isNotEqual(ExpressionType.EQUALS)).toBe(false);
      expect(isNotEqual(ExpressionType.NOT_AN_EXPRESSION)).toBe(false);
    });

    it('is false for null', () => {
      expect(isNotEqual(null)).toBe(false);
    });
  });

  describe('isNotExpression', () => {

    it('is true only for NOT_AN_EXPRESSION', () => {
      expect(isNotExpression(ExpressionType.NOT_AN_EXPRESSION)).toBe(true);
      expect(isNotExpression(ExpressionType.EQUALS)).toBe(false);
      expect(isNotExpression(ExpressionType.NOT_EQUALS)).toBe(false);
    });

    it('is false for null', () => {
      expect(isNotExpression(null)).toBe(false);
    });
  });

  describe('getKeyAndValueByExpressionType', () => {

    it('splits on == for an equals expression', () => {
      expect(getKeyAndValueByExpressionType(ExpressionType.EQUALS, 'name==\'abc\''))
        .toEqual(['name', '\'abc\'']);
    });

    it('splits on != for a not equals expression', () => {
      expect(getKeyAndValueByExpressionType(ExpressionType.NOT_EQUALS, 'name!=\'abc\''))
        .toEqual(['name', '\'abc\'']);
    });

    it('returns null for a non expression', () => {
      expect(getKeyAndValueByExpressionType(ExpressionType.NOT_AN_EXPRESSION, 'name')).toBeNull();
    });

    it('returns null for an unknown expression type', () => {
      expect(getKeyAndValueByExpressionType(undefined, 'name==abc')).toBeNull();
    });

    it('keeps at most two parts when the separator repeats', () => {
      expect(getKeyAndValueByExpressionType(ExpressionType.EQUALS, 'a==b==c')).toEqual(['a', 'b']);
    });

    it('returns a single part when the separator is absent', () => {
      expect(getKeyAndValueByExpressionType(ExpressionType.EQUALS, 'name')).toEqual(['name']);
    });

    it('throws for a null key', () => {
      expect(() => getKeyAndValueByExpressionType(ExpressionType.EQUALS, null)).toThrow();
    });
  });

  describe('cleanValueOfQuotes', () => {

    it('strips wrapping single quotes', () => {
      expect(cleanValueOfQuotes('\'abc\'')).toEqual('abc');
    });

    it('leaves an unquoted value alone', () => {
      expect(cleanValueOfQuotes('abc')).toEqual('abc');
    });

    it('leaves an empty string alone', () => {
      expect(cleanValueOfQuotes('')).toEqual('');
    });

    it('leaves a value with only a leading quote alone', () => {
      expect(cleanValueOfQuotes('\'abc')).toEqual('\'abc');
    });

    it('leaves a value with only a trailing quote alone', () => {
      expect(cleanValueOfQuotes('abc\'')).toEqual('abc\'');
    });

    it('reduces a lone quote to an empty string', () => {
      // charAt(0) and charAt(length - 1) are the same character here.
      expect(cleanValueOfQuotes('\'')).toEqual('');
    });

    it('removes only the first two quotes, not the trailing one', () => {
      expect(cleanValueOfQuotes('\'a\'b\'')).toEqual('ab\'');
    });

    it('throws for null', () => {
      expect(() => cleanValueOfQuotes(null)).toThrow();
    });
  });

  describe('mergeFilteredObject', () => {

    it('returns the target untouched when the source is not an object', () => {
      const target: any = { a: 1 };

      expect(mergeFilteredObject(target, null)).toBe(target);
      expect(mergeFilteredObject(target, undefined)).toBe(target);
      expect(mergeFilteredObject(target, 'abc' as any)).toBe(target);
    });

    it('returns undefined when both inputs are undefined', () => {
      expect(mergeFilteredObject(undefined, undefined)).toBeUndefined();
    });

    it('creates a new target when the target is not an object', () => {
      expect(mergeFilteredObject(null, { a: 1 })).toEqual({ a: 1 });
      expect(mergeFilteredObject('abc' as any, { a: 1 })).toEqual({ a: 1 });
    });

    it('mutates and returns the target object', () => {
      const target: any = { a: 1 };
      const result = mergeFilteredObject(target, { b: 2 });

      expect(result).toBe(target);
      expect(target).toEqual({ a: 1, b: 2 });
    });

    it('overwrites existing keys', () => {
      expect(mergeFilteredObject({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
    });

    it('skips excluded keys', () => {
      expect(mergeFilteredObject({}, { a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ b: 2 });
    });

    it('skips undefined and null source values but keeps other falsy ones', () => {
      const source: any = { a: undefined, b: null, c: 0, d: '', e: false };

      expect(mergeFilteredObject({}, source)).toEqual({ c: 0, d: '', e: false });
    });

    it('handles an empty source object', () => {
      expect(mergeFilteredObject({ a: 1 }, {})).toEqual({ a: 1 });
    });

    it('handles an empty exclude list', () => {
      expect(mergeFilteredObject({}, { a: 1 }, [])).toEqual({ a: 1 });
    });

    it('applies the key function', () => {
      expect(mergeFilteredObject({}, { a: 1 }, [], key => key.toUpperCase())).toEqual({ A: 1 });
    });

    it('applies the value function', () => {
      expect(mergeFilteredObject({}, { a: 1 }, [], key => key, val => val * 2)).toEqual({ a: 2 });
    });

    it('treats an array source as an object of index keys', () => {
      expect(mergeFilteredObject({}, ['x', 'y'] as any)).toEqual({ 0: 'x', 1: 'y' });
    });

    it('accepts an array target and keeps it an array', () => {
      const target: any = [];
      const result: any = mergeFilteredObject(target, { 0: 'x' });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toEqual(1);
      expect(result[0]).toEqual('x');
    });
  });

  describe('uniqueItems', () => {

    it('returns an empty array for no arguments', () => {
      expect(uniqueItems()).toEqual([]);
    });

    it('removes duplicates and keeps first-seen order', () => {
      expect(uniqueItems('a', 'b', 'a', 'c', 'b')).toEqual(['a', 'b', 'c']);
    });

    it('returns a single item unchanged', () => {
      expect(uniqueItems('a')).toEqual(['a']);
    });

    it('collapses repeated nulls', () => {
      expect(uniqueItems(null, null)).toEqual([null]);
    });

    it('collapses repeated undefineds', () => {
      expect(uniqueItems(undefined, undefined).length).toEqual(1);
    });

    it('collapses repeated NaN, because includes uses SameValueZero', () => {
      expect(uniqueItems(NaN, NaN).length).toEqual(1);
    });

    it('does not conflate a number with its string form', () => {
      const result: any = uniqueItems(1, '1');

      expect(result).toEqual([1, '1']);
    });

    it('keeps distinct object references apart', () => {
      expect(uniqueItems([], []).length).toEqual(2);
    });

    it('collapses the same object reference', () => {
      const shared: any = { a: 1 };

      expect(uniqueItems(shared, shared).length).toEqual(1);
    });
  });

  describe('commonItems', () => {

    it('returns null when called with no arguments', () => {
      expect(commonItems()).toBeNull();
    });

    it('returns the intersection of two arrays', () => {
      expect(commonItems(['a', 'b'], ['b', 'c'])).toEqual(['b']);
    });

    it('returns the intersection of three arrays', () => {
      expect(commonItems(['a', 'b'], ['a', 'b'], ['b'])).toEqual(['b']);
    });

    it('wraps a string argument into a single item array', () => {
      expect(commonItems('a', ['a', 'b'])).toEqual(['a']);
      expect(commonItems(['a', 'b'], 'a')).toEqual(['a']);
    });

    it('returns an empty array when there is no overlap', () => {
      expect(commonItems(['a'], ['b'])).toEqual([]);
    });

    it('returns an empty array as soon as an empty input is seen', () => {
      expect(commonItems([], ['a'])).toEqual([]);
      expect(commonItems(['a'], [])).toEqual([]);
    });

    it('copies a single array input rather than returning it', () => {
      const input = ['a'];
      const result = commonItems(input);

      expect(result).toEqual(['a']);
      expect(result).not.toBe(input);
    });

    it('returns an empty array for a single empty array input', () => {
      expect(commonItems([])).toEqual([]);
    });

    it('throws for a null argument', () => {
      expect(() => commonItems(null)).toThrow();
    });

    it('throws for an undefined argument', () => {
      expect(() => commonItems(undefined)).toThrow();
    });
  });

  describe('fixTitle', () => {

    it('returns null unchanged', () => {
      expect(fixTitle(null)).toBeNull();
    });

    it('returns undefined unchanged', () => {
      expect(fixTitle(undefined)).toBeUndefined();
    });

    it('returns an empty string unchanged', () => {
      expect(fixTitle('')).toEqual('');
    });

    it('splits camelCase into words and title cases them', () => {
      expect(fixTitle('firstName')).toEqual('First Name');
    });

    it('splits a longer camelCase name', () => {
      expect(fixTitle('someVeryLongName')).toEqual('Some Very Long Name');
    });

    it('replaces underscores with spaces', () => {
      expect(fixTitle('user_name')).toEqual('User Name');
      expect(fixTitle('a_b')).toEqual('A B');
    });

    it('title cases a plain lowercase word', () => {
      expect(fixTitle('title')).toEqual('Title');
    });

    it('lowercases the tail of an all caps name', () => {
      expect(fixTitle('ABC')).toEqual('Abc');
    });
  });

  describe('toTitleCase', () => {

    it('returns non string inputs unchanged', () => {
      expect(toTitleCase(null)).toBeNull();
      expect(toTitleCase(undefined)).toBeUndefined();
      expect(toTitleCase(5 as any)).toEqual(5 as any);
    });

    it('returns an object input unchanged', () => {
      const input: any = { a: 1 };

      expect(toTitleCase(input) as any).toBe(input);
    });

    it('returns an empty string unchanged', () => {
      expect(toTitleCase('')).toEqual('');
    });

    it('title cases a lowercase sentence', () => {
      expect(toTitleCase('hello world')).toEqual('Hello World');
    });

    it('title cases an uppercase sentence', () => {
      expect(toTitleCase('HELLO WORLD')).toEqual('Hello World');
    });

    it('trims surrounding whitespace', () => {
      expect(toTitleCase('  hello  ')).toEqual('Hello');
    });

    it('leaves digits alone', () => {
      expect(toTitleCase('chapter 2')).toEqual('Chapter 2');
    });

    it('capitalises a small word when it is the first word', () => {
      expect(toTitleCase('the quick brown fox')).toEqual('The Quick Brown Fox');
    });

    it('leaves a small word lowercase in the middle of a title', () => {
      expect(toTitleCase('a tale of two cities')).toEqual('A Tale of Two Cities');
    });

    it('capitalises a small word when it is the last word', () => {
      expect(toTitleCase('sign in')).toEqual('Sign In');
    });

    it('capitalises a small word that follows a colon', () => {
      expect(toTitleCase('note: the end')).toEqual('Note: The End');
    });

    it('capitalises a small word preceded by a non space character', () => {
      expect(toTitleCase('\'the end\'')).toEqual('\'The End\'');
    });

    it('capitalises a small word directly followed by a hyphen', () => {
      expect(toTitleCase('the in-house team')).toEqual('The In-House Team');
    });

    it('preserves words that already contain internal capitals', () => {
      expect(toTitleCase('iPhone and iPad')).toEqual('iPhone and iPad');
    });

    it('lowercases a dotted abbreviation in an all lowercase input', () => {
      expect(toTitleCase('e.g. this')).toEqual('e.g. This');
    });

    it('leaves a dotted abbreviation alone in a mixed case input', () => {
      expect(toTitleCase('Hello e.g. World')).toEqual('Hello e.g. World');
    });

    it('accepts extra force words as a pipe delimited string', () => {
      expect(toTitleCase('the ajsf library', 'AJSF')).toEqual('The AJSF Library');
    });

    it('accepts extra force words as an array', () => {
      expect(toTitleCase('read the api docs', ['API'])).toEqual('Read the API Docs');
    });

    it('ignores force words of an unsupported type', () => {
      expect(toTitleCase('hello world', 123 as any)).toEqual('Hello World');
    });

    it('ignores an empty force words array', () => {
      expect(toTitleCase('hello world', [])).toEqual('Hello World');
    });
  });
});
