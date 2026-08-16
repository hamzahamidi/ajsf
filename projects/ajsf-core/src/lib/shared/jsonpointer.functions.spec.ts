import { JsonPointer } from './jsonpointer.functions';

/**
 * Characterization tests for the JsonPointer static utility class.
 *
 * Every expectation below pins the behaviour of the code as it is today,
 * including the places where it disagrees with its own documentation.
 * evaluateExpression is covered separately in jspointer.functions.json.spec.ts.
 *
 * Several functions mutate their inputs (set, remove, insert, and any function
 * given a pointer array), so every fixture is built inside the test that uses it.
 */
describe('JsonPointer', () => {

  // Many branches log to console.error on purpose. Silencing keeps the run readable.
  beforeEach(() => {
    spyOn(console, 'error');
  });

  describe('parse', () => {
    it('should split a string pointer into an array of keys', () => {
      expect(JsonPointer.parse('/a/b')).toEqual(['a', 'b']);
    });

    it('should strip a leading hash', () => {
      expect(JsonPointer.parse('#/a/b')).toEqual(['a', 'b']);
    });

    it('should return an empty array for the empty pointer', () => {
      expect(JsonPointer.parse('')).toEqual([]);
    });

    it('should return an empty array for the root hash pointer', () => {
      expect(JsonPointer.parse('#')).toEqual([]);
    });

    it('should return an empty array for a lone slash', () => {
      expect(JsonPointer.parse('/')).toEqual([]);
    });

    it('should keep a trailing empty key', () => {
      expect(JsonPointer.parse('/a/b/')).toEqual(['a', 'b', '']);
    });

    it('should return an array pointer unchanged', () => {
      const pointer = ['a', 'b'];
      expect(JsonPointer.parse(pointer)).toBe(pointer);
    });

    it('should return an empty array unchanged', () => {
      expect(JsonPointer.parse([])).toEqual([]);
    });

    it('should unescape ~1 and ~0 sequences', () => {
      expect(JsonPointer.parse('/a~1b/c~0d')).toEqual(['a/b', 'c~d']);
    });

    it('should return null for a string that is not a pointer', () => {
      expect(JsonPointer.parse('foo')).toBeNull();
    });

    it('should return null for an invalid escape sequence', () => {
      expect(JsonPointer.parse('/a~2b')).toBeNull();
    });

    it('should return null for null', () => {
      expect(JsonPointer.parse(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(JsonPointer.parse(undefined)).toBeNull();
    });

    it('should return null for a number', () => {
      expect(JsonPointer.parse(5)).toBeNull();
    });

    it('should return null for an array containing non strings', () => {
      expect(JsonPointer.parse([1, 2])).toBeNull();
    });

    it('should still return null when errors are enabled', () => {
      expect(JsonPointer.parse('foo', true)).toBeNull();
    });
  });

  describe('compile', () => {
    it('should join an array of keys into a pointer', () => {
      expect(JsonPointer.compile(['a', 'b'])).toEqual('/a/b');
    });

    it('should return an empty string for an empty array', () => {
      expect(JsonPointer.compile([])).toEqual('');
    });

    it('should return an empty string for the root hash pointer', () => {
      expect(JsonPointer.compile('#')).toEqual('');
    });

    it('should replace empty keys with the default value', () => {
      expect(JsonPointer.compile(['a', '', 'b'], 'X')).toEqual('/a/X/b');
    });

    it('should escape slashes in keys', () => {
      expect(JsonPointer.compile(['a/b'])).toEqual('/a~1b');
    });

    it('should escape tildes in keys', () => {
      expect(JsonPointer.compile(['a~b'])).toEqual('/a~0b');
    });

    it('should return a string pointer unchanged', () => {
      expect(JsonPointer.compile('/a/b')).toEqual('/a/b');
    });

    it('should strip a leading hash from a string pointer', () => {
      expect(JsonPointer.compile('#/a/b')).toEqual('/a/b');
    });

    it('should return an empty string for an empty string pointer', () => {
      expect(JsonPointer.compile('')).toEqual('');
    });

    it('should return null for an invalid string pointer', () => {
      expect(JsonPointer.compile('foo')).toBeNull();
    });

    it('should return null for null', () => {
      expect(JsonPointer.compile(null)).toBeNull();
    });

    it('should return null for an array containing non strings', () => {
      expect(JsonPointer.compile([1, 2])).toBeNull();
    });

    it('should compile normally when errors are enabled', () => {
      expect(JsonPointer.compile(['a', 'b'], 'X', true)).toEqual('/a/b');
    });
  });

  describe('toKey', () => {
    it('should return the last key of a string pointer', () => {
      expect(JsonPointer.toKey('/a/b')).toEqual('b');
    });

    it('should return the last key of an array pointer', () => {
      expect(JsonPointer.toKey(['a', 'b'])).toEqual('b');
    });

    it('should unescape the returned key', () => {
      expect(JsonPointer.toKey('/a~1b')).toEqual('a/b');
    });

    it('should return an empty string for the empty pointer', () => {
      expect(JsonPointer.toKey('')).toEqual('');
    });

    it('should return an empty string for the root hash pointer', () => {
      expect(JsonPointer.toKey('#')).toEqual('');
    });

    it('should return an empty string for an empty array pointer', () => {
      expect(JsonPointer.toKey([])).toEqual('');
    });

    it('should return an empty string when the pointer ends with a slash', () => {
      expect(JsonPointer.toKey('/a/b/')).toEqual('');
    });

    it('should return null for an invalid pointer', () => {
      expect(JsonPointer.toKey('foo')).toBeNull();
    });
  });

  describe('escape', () => {
    it('should escape slashes as ~1', () => {
      expect(JsonPointer.escape('a/b')).toEqual('a~1b');
    });

    it('should escape tildes as ~0', () => {
      expect(JsonPointer.escape('a~b')).toEqual('a~0b');
    });

    it('should escape tildes before slashes', () => {
      expect(JsonPointer.escape('a~/b')).toEqual('a~0~1b');
    });

    it('should stringify non string keys', () => {
      expect(JsonPointer.escape(5)).toEqual('5');
    });

    it('should return an empty string unchanged', () => {
      expect(JsonPointer.escape('')).toEqual('');
    });

    it('should throw on null', () => {
      expect(() => JsonPointer.escape(null)).toThrow();
    });

    it('should throw on undefined', () => {
      expect(() => JsonPointer.escape(undefined)).toThrow();
    });
  });

  describe('unescape', () => {
    it('should unescape ~1 as a slash', () => {
      expect(JsonPointer.unescape('a~1b')).toEqual('a/b');
    });

    it('should unescape ~0 as a tilde', () => {
      expect(JsonPointer.unescape('a~0b')).toEqual('a~b');
    });

    it('should unescape ~1 before ~0 so that ~01 becomes ~1', () => {
      expect(JsonPointer.unescape('a~01b')).toEqual('a~1b');
    });

    it('should stringify non string keys', () => {
      expect(JsonPointer.unescape(5)).toEqual('5');
    });

    it('should throw on null', () => {
      expect(() => JsonPointer.unescape(null)).toThrow();
    });

    it('should round trip an escaped key', () => {
      expect(JsonPointer.unescape(JsonPointer.escape('a~/b'))).toEqual('a~/b');
    });
  });

  describe('isJsonPointer', () => {
    it('should accept an empty array', () => {
      expect(JsonPointer.isJsonPointer([])).toBe(true);
    });

    it('should accept an array of strings', () => {
      expect(JsonPointer.isJsonPointer(['a', 'b'])).toBe(true);
    });

    it('should reject an array containing a number', () => {
      expect(JsonPointer.isJsonPointer([1])).toBe(false);
    });

    it('should accept an empty string', () => {
      expect(JsonPointer.isJsonPointer('')).toBe(true);
    });

    it('should accept a lone hash', () => {
      expect(JsonPointer.isJsonPointer('#')).toBe(true);
    });

    it('should accept a lone slash', () => {
      expect(JsonPointer.isJsonPointer('/')).toBe(true);
    });

    it('should accept a string starting with a slash', () => {
      expect(JsonPointer.isJsonPointer('/foo')).toBe(true);
    });

    it('should accept a string starting with a hash slash', () => {
      expect(JsonPointer.isJsonPointer('#/foo')).toBe(true);
    });

    it('should accept a valid escape sequence', () => {
      expect(JsonPointer.isJsonPointer('/foo~0bar')).toBe(true);
    });

    it('should reject a string with no leading slash', () => {
      expect(JsonPointer.isJsonPointer('foo')).toBe(false);
    });

    it('should reject an invalid escape sequence', () => {
      expect(JsonPointer.isJsonPointer('/foo~2')).toBe(false);
    });

    it('should reject a trailing tilde', () => {
      expect(JsonPointer.isJsonPointer('/foo~')).toBe(false);
    });

    it('should reject null', () => {
      expect(JsonPointer.isJsonPointer(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(JsonPointer.isJsonPointer(undefined)).toBe(false);
    });

    it('should reject a number', () => {
      expect(JsonPointer.isJsonPointer(42)).toBe(false);
    });

    it('should reject a plain object', () => {
      expect(JsonPointer.isJsonPointer({})).toBe(false);
    });
  });

  describe('get', () => {
    it('should read a top level value', () => {
      expect(JsonPointer.get({ a: 1 }, '/a')).toEqual(1);
    });

    it('should read a nested value', () => {
      expect(JsonPointer.get({ a: { b: 2 } }, '/a/b')).toEqual(2);
    });

    it('should read an array item by index', () => {
      expect(JsonPointer.get([1, 2, 3], '/1')).toEqual(2);
    });

    it('should read the last array item with the dash key', () => {
      expect(JsonPointer.get([1, 2, 3], '/-')).toEqual(3);
    });

    it('should return undefined for the dash key when the last item is falsy', () => {
      // hasOwn returns the item itself for numeric keys on arrays, so a falsy
      // last item makes the lookup fail.
      expect(JsonPointer.get([1, 2, 0], '/-')).toBeUndefined();
    });

    it('should return undefined for the dash key on an empty array', () => {
      expect(JsonPointer.get([], '/-')).toBeUndefined();
    });

    it('should return the whole object for the empty pointer', () => {
      const object = { a: 1 };
      expect(JsonPointer.get(object, '')).toBe(object);
    });

    it('should return undefined for a missing key', () => {
      expect(JsonPointer.get({ a: 1 }, '/b')).toBeUndefined();
    });

    it('should return a stored null value', () => {
      expect(JsonPointer.get({ a: { b: null } }, '/a/b')).toBeNull();
    });

    it('should return undefined when the object is null', () => {
      expect(JsonPointer.get(null, '/a')).toBeUndefined();
    });

    it('should return false when the object is null and getBoolean is set', () => {
      expect(JsonPointer.get(null, '/a', 0, null, true)).toBe(false);
    });

    it('should return undefined when the object is undefined', () => {
      expect(JsonPointer.get(undefined, '/a')).toBeUndefined();
    });

    it('should return undefined when the object is not an object', () => {
      expect(JsonPointer.get('str', '/a', 0, null, false, true)).toBeUndefined();
    });

    it('should return undefined for an invalid pointer', () => {
      expect(JsonPointer.get({}, 'bad', 0, null, false, true)).toBeUndefined();
    });

    it('should log and return undefined when a key is missing and errors are enabled', () => {
      expect(JsonPointer.get({ y: 1 }, '/x', 0, null, false, true)).toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });

    it('should read from a Map', () => {
      expect(JsonPointer.get(new Map([['a', 1]]), '/a')).toEqual(1);
    });

    it('should read from a nested Map', () => {
      const map = new Map([['a', new Map([['b', 7]])]]);
      expect(JsonPointer.get(map, '/a/b')).toEqual(7);
    });

    it('should return undefined for a key missing from a Map', () => {
      expect(JsonPointer.get(new Map([['a', 1]]), '/missing')).toBeUndefined();
    });

    it('should return true for a found value when getBoolean is set', () => {
      expect(JsonPointer.get({ a: 1 }, '/a', 0, null, true)).toBe(true);
    });

    it('should return false for a missing value when getBoolean is set', () => {
      expect(JsonPointer.get({ a: 1 }, '/b', 0, null, true)).toBe(false);
    });

    it('should skip the leading keys named by startSlice', () => {
      expect(JsonPointer.get({ b: { c: 3 } }, '/a/b/c', 1)).toEqual(3);
    });

    it('should drop the trailing keys named by a negative endSlice', () => {
      expect(JsonPointer.get({ a: { b: { c: 3 } } }, '/a/b/c', 0, -1)).toEqual({ c: 3 });
    });

    it('should return the object when startSlice is past the end of the pointer', () => {
      const object = { a: { b: { c: 3 } } };
      expect(JsonPointer.get(object, '/a/b/c', 5)).toBe(object);
    });

    it('should return the object when endSlice is before the start of the pointer', () => {
      const object = { a: { b: { c: 3 } } };
      expect(JsonPointer.get(object, '/a/b/c', 0, -5)).toBe(object);
    });

    it('should clamp a startSlice below the negative pointer length to zero', () => {
      expect(JsonPointer.get({ a: { b: { c: 3 } } }, '/a/b/c', -5)).toEqual(3);
    });

    it('should return the object when the slice is empty', () => {
      const object = { a: { b: 1 } };
      expect(JsonPointer.get(object, '/a/b', 0, 0)).toBe(object);
    });

    it('should resolve an equals expression key', () => {
      expect(JsonPointer.get({ name: 'abc' }, '/name==abc')).toEqual('abc');
    });

    it('should resolve a quoted equals expression key', () => {
      expect(JsonPointer.get({ name: 'abc' }, '/name==\'abc\'')).toEqual('abc');
    });

    it('should return undefined when an equals expression does not match', () => {
      expect(JsonPointer.get({ name: 'abc' }, '/name==zzz')).toBeUndefined();
    });

    it('should return the object when a not equals expression names a missing property', () => {
      const object = { name: 'abc' };
      expect(JsonPointer.get(object, '/other!=x')).toBe(object);
    });
  });

  describe('getCopy', () => {
    it('should return a value that is not the original reference', () => {
      const object = { a: { b: 1 } };
      const result = JsonPointer.getCopy(object, '/a');
      expect(result).toEqual({ b: 1 });
      expect(result).not.toBe(object.a);
    });

    it('should return undefined when the object is null', () => {
      expect(JsonPointer.getCopy(null, '/a')).toBeUndefined();
    });

    it('should return undefined for a missing key', () => {
      expect(JsonPointer.getCopy({ a: 1 }, '/b')).toBeUndefined();
    });

    it('should return true for a found value when getBoolean is set', () => {
      expect(JsonPointer.getCopy({ a: 1 }, '/a', 0, null, true)).toBe(true);
    });

    it('should copy a primitive value as is', () => {
      expect(JsonPointer.getCopy({ a: 'x' }, '/a')).toEqual('x');
    });
  });

  describe('getFirst', () => {
    it('should return the first value found', () => {
      expect(JsonPointer.getFirst([[{ a: 1 }, '/a'], [{ b: 2 }, '/b']])).toEqual(1);
    });

    it('should skip falsy values and keep looking', () => {
      expect(JsonPointer.getFirst([[{ a: 0 }, '/a'], [{ b: 2 }, '/b']])).toEqual(2);
    });

    it('should return the default value when nothing is found', () => {
      expect(JsonPointer.getFirst([[{ a: 0 }, '/a']], 'default')).toEqual('default');
    });

    it('should return null by default when nothing is found', () => {
      expect(JsonPointer.getFirst([[{}, '/a']])).toBeNull();
    });

    it('should skip empty items', () => {
      expect(JsonPointer.getFirst([[]])).toBeNull();
    });

    it('should return undefined for null input', () => {
      expect(JsonPointer.getFirst(null)).toBeUndefined();
    });

    it('should return undefined for an empty array', () => {
      expect(JsonPointer.getFirst([])).toBeUndefined();
    });

    it('should return undefined for an empty object', () => {
      expect(JsonPointer.getFirst({})).toBeUndefined();
    });

    it('should return undefined when an item is not an array', () => {
      expect(JsonPointer.getFirst(['notanarray'])).toBeUndefined();
    });

    it('should return undefined when an item has fewer than two entries', () => {
      expect(JsonPointer.getFirst([[{ a: 1 }]])).toBeUndefined();
    });

    it('should read the first value from a Map', () => {
      const items = new Map<any, any>([[{ a: 1 }, '/a']]);
      expect(JsonPointer.getFirst(items)).toEqual(1);
    });

    it('should return undefined for an empty Map, as it does for an empty array', () => {
      expect(JsonPointer.getFirst(new Map<any, any>(), 'dv')).toBeUndefined();
      expect(JsonPointer.getFirst([], 'dv')).toBeUndefined();
    });

    it('should return the default value for input that is neither array nor map', () => {
      expect(JsonPointer.getFirst('string', 'dv')).toEqual('dv');
    });

    it('should return a copy when getCopy is set', () => {
      const object = { a: { b: 1 } };
      const result = JsonPointer.getFirst([[object, '/a']], null, true);
      expect(result).toEqual({ b: 1 });
      expect(result).not.toBe(object.a);
    });
  });

  describe('getFirstCopy', () => {
    it('should always return a copy of the first value found', () => {
      const object = { a: { b: 1 } };
      const result = JsonPointer.getFirstCopy([[object, '/a']]);
      expect(result).toEqual({ b: 1 });
      expect(result).not.toBe(object.a);
    });

    it('should return the default value when nothing is found', () => {
      expect(JsonPointer.getFirstCopy([[{ a: 0 }, '/a']], 'dv')).toEqual('dv');
    });
  });

  describe('set', () => {
    it('should set a top level value and return the same object', () => {
      const object: any = {};
      const result = JsonPointer.set(object, '/a', 1);
      expect(result).toBe(object);
      expect(object).toEqual({ a: 1 });
    });

    it('should create missing sub objects', () => {
      expect(JsonPointer.set({}, '/a/b', 1)).toEqual({ a: { b: 1 } });
    });

    it('should create a missing array when the next key is numeric', () => {
      expect(JsonPointer.set({}, '/a/0', 'x')).toEqual({ a: ['x'] });
    });

    it('should create a missing array when the next key is a dash', () => {
      expect(JsonPointer.set({}, '/a/-', 5)).toEqual({ a: [5] });
    });

    it('should overwrite an existing array item', () => {
      expect(JsonPointer.set([1, 2, 3], '/1', 4)).toEqual([1, 4, 3]);
    });

    it('should insert into an array when insert is set', () => {
      expect(JsonPointer.set([1, 2, 3], '/1', 4, true)).toEqual([1, 4, 2, 3]);
    });

    it('should append to an array with the dash key', () => {
      expect(JsonPointer.set([1, 2, 3], '/-', 4)).toEqual([1, 2, 3, 4]);
    });

    it('should append a new container when the dash key is not the last key', () => {
      expect(JsonPointer.set({ a: [1] }, '/a/-/b', 2)).toEqual({ a: [1, { b: 2 }] });
    });

    it('should set an entry on a Map', () => {
      const map = new Map<any, any>();
      JsonPointer.set(map, '/a', 1);
      expect(map.get('a')).toEqual(1);
    });

    it('should set an entry on a nested Map', () => {
      const map = new Map<any, any>([['a', new Map<any, any>()]]);
      JsonPointer.set(map, '/a/b', 1);
      expect(JsonPointer.get(map, '/a/b')).toEqual(1);
    });

    it('should attach a missing intermediate Map container as a property instead of an entry', () => {
      const map: any = new Map<any, any>();
      JsonPointer.set(map, '/a/b', 1);
      expect(map.size).toEqual(0);
      expect(map.a).toEqual({ b: 1 });
    });

    it('should return the object unchanged for an invalid pointer', () => {
      const object = {};
      expect(JsonPointer.set(object, 'bad', 1)).toBe(object);
      expect(object).toEqual({});
    });

    it('should return the object unchanged for the empty pointer', () => {
      const object = {};
      expect(JsonPointer.set(object, '', 1)).toEqual({});
    });

    it('should throw when the object is null', () => {
      expect(() => JsonPointer.set(null, '/a', 1)).toThrow();
    });
  });

  describe('setCopy', () => {
    it('should set a value on a copy and leave the original alone', () => {
      const object = { a: 1 };
      const result = JsonPointer.setCopy(object, '/b', 2);
      expect(result).toEqual({ a: 1, b: 2 });
      expect(object).toEqual({ a: 1 });
      expect(result).not.toBe(object);
    });

    it('should copy the sub objects along the pointer path', () => {
      const object = { a: { b: 1 } };
      const result = JsonPointer.setCopy(object, '/a/b', 2);
      expect(result).toEqual({ a: { b: 2 } });
      expect(object).toEqual({ a: { b: 1 } });
    });

    it('should insert into an array copy when insert is set', () => {
      const array = [1, 2, 3];
      expect(JsonPointer.setCopy(array, '/1', 4, true)).toEqual([1, 4, 2, 3]);
      expect(array).toEqual([1, 2, 3]);
    });

    it('should append to an array copy with the dash key', () => {
      expect(JsonPointer.setCopy([1], '/-', 2)).toEqual([1, 2]);
    });

    it('should copy nested Maps', () => {
      const map = new Map<any, any>([['a', new Map<any, any>([['b', 1]])]]);
      const result = JsonPointer.setCopy(map, '/a/b', 2);
      expect(result.get('a').get('b')).toEqual(2);
      expect(map.get('a').get('b')).toEqual(1);
    });

    it('should set a key literally named undefined for the empty pointer', () => {
      expect(JsonPointer.setCopy({}, '', 1)).toEqual({ 'undefined': 1 });
    });

    it('should return the object unchanged for an invalid pointer', () => {
      const object = {};
      expect(JsonPointer.setCopy(object, 'bad', 1)).toBe(object);
    });

    it('should throw when the object is null', () => {
      expect(() => JsonPointer.setCopy(null, '/a', 1)).toThrow();
    });
  });

  describe('insert', () => {
    it('should insert a new array item rather than overwrite', () => {
      expect(JsonPointer.insert([1, 2, 3], '/1', 4)).toEqual([1, 4, 2, 3]);
    });

    it('should behave like set for object keys', () => {
      expect(JsonPointer.insert({}, '/a', 1)).toEqual({ a: 1 });
    });
  });

  describe('insertCopy', () => {
    it('should insert into a copy and leave the original alone', () => {
      const array = [1, 2, 3];
      expect(JsonPointer.insertCopy(array, '/1', 4)).toEqual([1, 4, 2, 3]);
      expect(array).toEqual([1, 2, 3]);
    });
  });

  describe('remove', () => {
    it('should delete a top level key', () => {
      expect(JsonPointer.remove({ a: 1, b: 2 }, '/a')).toEqual({ b: 2 });
    });

    it('should delete a nested key', () => {
      expect(JsonPointer.remove({ a: { b: 1, c: 2 } }, '/a/b')).toEqual({ a: { c: 2 } });
    });

    it('should splice an array item out by index', () => {
      expect(JsonPointer.remove([1, 2, 3], '/1')).toEqual([1, 3]);
    });

    it('should remove the last array item with the dash key', () => {
      expect(JsonPointer.remove([1, 2, 3], '/-')).toEqual([1, 2]);
    });

    it('should leave the array alone for an out of range index', () => {
      expect(JsonPointer.remove([1, 2], '/5')).toEqual([1, 2]);
    });

    it('should do nothing for a key that is not there', () => {
      expect(JsonPointer.remove({ a: 1 }, '/missing')).toEqual({ a: 1 });
    });

    it('should do nothing when the parent resolves to a primitive', () => {
      expect(JsonPointer.remove({ a: { b: 1 } }, '/a/b/c')).toEqual({ a: { b: 1 } });
    });

    it('should return the object unchanged for an invalid pointer', () => {
      const object = {};
      expect(JsonPointer.remove(object, 'bad')).toBe(object);
    });

    it('should return the object unchanged for the empty pointer', () => {
      expect(JsonPointer.remove({ a: 1 }, '')).toEqual({ a: 1 });
    });

    it('should return null when the object is null', () => {
      expect(JsonPointer.remove(null, '/a')).toBeNull();
    });

    it('should empty a pointer array passed in by the caller', () => {
      const pointer = ['a'];
      JsonPointer.remove({ a: 1 }, pointer);
      expect(pointer).toEqual([]);
    });
  });

  describe('has', () => {
    it('should return true for an existing key', () => {
      expect(JsonPointer.has({ a: 1 }, '/a')).toBe(true);
    });

    it('should return false for a missing key', () => {
      expect(JsonPointer.has({ a: 1 }, '/b')).toBe(false);
    });

    it('should return true for an existing array index', () => {
      expect(JsonPointer.has([1, 2], '/1')).toBe(true);
    });

    it('should return true for a key holding null', () => {
      expect(JsonPointer.has({ a: { b: null } }, '/a/b')).toBe(true);
    });

    it('should return false when the object is null', () => {
      expect(JsonPointer.has(null, '/a')).toBe(false);
    });

    it('should return false for an invalid pointer', () => {
      expect(JsonPointer.has({ a: 1 }, 'bad')).toBe(false);
    });

    it('should return the object itself, not true, for the empty pointer', () => {
      const object = { a: 1 };
      expect(JsonPointer.has(object, '')).toBe(object);
    });
  });

  describe('dict', () => {
    it('should map pointers to primitive values', () => {
      expect(JsonPointer.dict({ a: 1, b: { c: 2 } })).toEqual({ '/a': 1, '/b/c': 2 });
    });

    it('should index array items', () => {
      expect(JsonPointer.dict([1, 2])).toEqual({ '/0': 1, '/1': 2 });
    });

    it('should escape keys in the generated pointers', () => {
      expect(JsonPointer.dict({ 'a/b': 1 })).toEqual({ '/a~1b': 1 });
    });

    it('should drop null values because typeof null is object', () => {
      expect(JsonPointer.dict({ a: null })).toEqual({});
    });

    it('should return an empty dictionary for null', () => {
      expect(JsonPointer.dict(null)).toEqual({});
    });

    it('should return an empty dictionary for an empty object', () => {
      expect(JsonPointer.dict({})).toEqual({});
    });

    it('should return an empty dictionary for a Map', () => {
      expect(JsonPointer.dict(new Map([['a', 1]]))).toEqual({});
    });

    it('should store a primitive root under the empty pointer', () => {
      expect(JsonPointer.dict('str')).toEqual({ '': 'str' });
    });
  });

  describe('forEachDeep', () => {
    it('should visit the container before its contents by default', () => {
      const seen: any[] = [];
      JsonPointer.forEachDeep({ a: { b: 1 } }, (v, p) => seen.push(p));
      expect(seen).toEqual(['', '/a', '/a/b']);
    });

    it('should visit the contents before the container when bottomUp is set', () => {
      const seen: any[] = [];
      JsonPointer.forEachDeep({ a: { b: 1 } }, (v, p) => seen.push(p), true);
      expect(seen).toEqual(['/a/b', '/a', '']);
    });

    it('should index array items', () => {
      const seen: any[] = [];
      JsonPointer.forEachDeep([10, 20], (v, p) => seen.push(p));
      expect(seen).toEqual(['', '/0', '/1']);
    });

    it('should escape keys in the generated pointers', () => {
      const seen: any[] = [];
      JsonPointer.forEachDeep({ 'a~b': { 'c/d': 1 } }, (v, p) => seen.push(p));
      expect(seen).toEqual(['', '/a~0b', '/a~0b/c~1d']);
    });

    it('should start from the supplied pointer and root object', () => {
      const seen: any[] = [];
      const root = { root: true };
      JsonPointer.forEachDeep({ b: 1 }, (v, p) => seen.push(p), false, '/a', root);
      expect(seen).toEqual(['/a', '/a/b']);
    });

    it('should pass the root object to every call', () => {
      const root = { a: 1 };
      const roots: any[] = [];
      JsonPointer.forEachDeep(root, (v, p, o) => roots.push(o));
      expect(roots).toEqual([root, root]);
    });

    it('should call the iteratee once on a primitive', () => {
      const seen: any[] = [];
      JsonPointer.forEachDeep(5, (v, p) => seen.push([v, p]));
      expect(seen).toEqual([[5, '']]);
    });

    it('should return undefined when the iteratee is not a function', () => {
      const result: any = JsonPointer.forEachDeep({ a: 1 }, 'nope' as any);
      expect(result).toBeUndefined();
    });

    it('should not throw with the default iteratee', () => {
      expect(() => JsonPointer.forEachDeep({ a: 1 })).not.toThrow();
    });
  });

  describe('forEachDeepCopy', () => {
    it('should deeply copy an object by default', () => {
      const object = { a: { b: 1 } };
      const result = JsonPointer.forEachDeepCopy(object);
      expect(result).toEqual({ a: { b: 1 } });
      expect(result).not.toBe(object);
      expect(result.a).not.toBe(object.a);
    });

    it('should deeply copy an array', () => {
      expect(JsonPointer.forEachDeepCopy([1, [2]])).toEqual([1, [2]]);
    });

    it('should apply the iteratee to primitives', () => {
      expect(JsonPointer.forEachDeepCopy(5, v => typeof v === 'number' ? v * 2 : v)).toEqual(10);
    });

    it('should apply the iteratee to nested values', () => {
      const result = JsonPointer.forEachDeepCopy(
        { a: 1 }, v => typeof v === 'number' ? v * 2 : v
      );
      expect(result).toEqual({ a: 2 });
    });

    it('should apply the iteratee bottom up when requested', () => {
      const result = JsonPointer.forEachDeepCopy(
        { a: 1 }, v => typeof v === 'number' ? v * 2 : v, true
      );
      expect(result).toEqual({ a: 2 });
    });

    it('should pass the pointer of each value to the iteratee', () => {
      const seen: any[] = [];
      JsonPointer.forEachDeepCopy({ a: { b: 1 } }, (v, p) => { seen.push(p); return v; });
      expect(seen).toEqual(['', '/a', '/a/b']);
    });

    it('should return null for null', () => {
      expect(JsonPointer.forEachDeepCopy(null)).toBeNull();
    });

    it('should return undefined for undefined', () => {
      expect(JsonPointer.forEachDeepCopy(undefined)).toBeUndefined();
    });

    it('should return an empty object for a Date because spreading loses it', () => {
      expect(JsonPointer.forEachDeepCopy(new Date(0))).toEqual({});
    });

    it('should return an empty object for a Map because spreading loses the entries', () => {
      expect(JsonPointer.forEachDeepCopy(new Map([['a', 1]]))).toEqual({});
    });

    it('should return null when the iteratee is not a function', () => {
      expect(JsonPointer.forEachDeepCopy({ a: 1 }, 'nope' as any)).toBeNull();
    });
  });

  describe('isSubPointer', () => {
    it('should return true for a strict prefix', () => {
      expect(JsonPointer.isSubPointer('/a', '/a/b')).toBe(true);
    });

    it('should return false for equal pointers by default', () => {
      expect(JsonPointer.isSubPointer('/a', '/a')).toBe(false);
    });

    it('should return true for equal pointers when trueIfMatching is set', () => {
      expect(JsonPointer.isSubPointer('/a', '/a', true)).toBe(true);
    });

    it('should not treat a shared key prefix as a sub pointer', () => {
      expect(JsonPointer.isSubPointer('/a', '/ab')).toBe(false);
    });

    it('should return false when the longer pointer comes first', () => {
      expect(JsonPointer.isSubPointer('/a/b', '/a')).toBe(false);
    });

    it('should accept array pointers', () => {
      expect(JsonPointer.isSubPointer(['a'], ['a', 'b'])).toBe(true);
    });

    it('should treat the empty pointer as a sub pointer of anything', () => {
      expect(JsonPointer.isSubPointer('', '/a')).toBe(true);
    });

    it('should normalize a leading hash before comparing', () => {
      expect(JsonPointer.isSubPointer('#/a', '/a/b')).toBe(true);
    });

    it('should return undefined when the short pointer is invalid', () => {
      expect(JsonPointer.isSubPointer('bad', '/a')).toBeUndefined();
    });

    it('should return undefined when the long pointer is invalid', () => {
      expect(JsonPointer.isSubPointer('/a', 'bad', false, true)).toBeUndefined();
    });

    it('should return undefined when both pointers are invalid', () => {
      expect(JsonPointer.isSubPointer('bad', 'alsobad', false, true)).toBeUndefined();
    });
  });

  describe('toIndexedPointer', () => {
    it('should replace each dash with the matching index', () => {
      expect(JsonPointer.toIndexedPointer('/foo/-/bar/-/baz', [4, 2]))
        .toEqual('/foo/4/bar/2/baz');
    });

    it('should leave the pointer alone when the index array is empty', () => {
      expect(JsonPointer.toIndexedPointer('/foo/-', [])).toEqual('/foo/-');
    });

    it('should ignore extra indexes', () => {
      expect(JsonPointer.toIndexedPointer('/foo/-', [1, 2, 3])).toEqual('/foo/1');
    });

    it('should leave a pointer without dashes alone', () => {
      expect(JsonPointer.toIndexedPointer('/foo/1', [7])).toEqual('/foo/1');
    });

    it('should accept an array pointer', () => {
      expect(JsonPointer.toIndexedPointer(['foo', '-'], [1])).toEqual('/foo/1');
    });

    it('should use the array map to decide which dashes to replace', () => {
      const arrayMap = new Map<string, number>([['/foo', 0], ['/foo/-/bar', 3]]);
      expect(JsonPointer.toIndexedPointer('/foo/-/bar/-/baz', [4, 2], arrayMap))
        .toEqual('/foo/4/bar/2/baz');
    });

    it('should keep dashes that are not listed in the array map', () => {
      const arrayMap = new Map<string, number>([['/foo/-/bar', 3]]);
      expect(JsonPointer.toIndexedPointer('/foo/-/bar/-/baz', [4, 2], arrayMap))
        .toEqual('/foo/-/bar/4/baz');
    });

    it('should return undefined for an invalid pointer', () => {
      expect(JsonPointer.toIndexedPointer('bad', [1])).toBeUndefined();
    });

    it('should return undefined when the index array is not an array', () => {
      expect(JsonPointer.toIndexedPointer('/foo/-', 'notanarray')).toBeUndefined();
    });
  });

  describe('toGenericPointer', () => {
    it('should leave the pointer alone with an empty array map', () => {
      expect(JsonPointer.toGenericPointer('/foo/1')).toEqual('/foo/1');
    });

    it('should replace a list index with a dash', () => {
      const arrayMap = new Map<string, number>([['/foo', 0]]);
      expect(JsonPointer.toGenericPointer('/foo/2', arrayMap)).toEqual('/foo/-');
    });

    it('should keep a tuple index below the tuple length', () => {
      // The docstring claims '/foo/-/bar/2/baz/-' here, but once index 2 is kept
      // the sub pointer for baz no longer matches the array map entry.
      const arrayMap = new Map<string, number>([
        ['/foo', 0], ['/foo/-/bar', 3], ['/foo/-/bar/-/baz', 0]
      ]);
      expect(JsonPointer.toGenericPointer('/foo/1/bar/2/baz/3', arrayMap))
        .toEqual('/foo/-/bar/2/baz/3');
    });

    it('should replace every index once they are all past the tuple length', () => {
      const arrayMap = new Map<string, number>([
        ['/foo', 0], ['/foo/-/bar', 3], ['/foo/-/bar/-/baz', 0]
      ]);
      expect(JsonPointer.toGenericPointer('/foo/1/bar/4/baz/3', arrayMap))
        .toEqual('/foo/-/bar/-/baz/-');
    });

    it('should return an empty string for the empty pointer', () => {
      expect(JsonPointer.toGenericPointer('')).toEqual('');
    });

    it('should return undefined for an invalid pointer', () => {
      expect(JsonPointer.toGenericPointer('bad')).toBeUndefined();
    });

    it('should return undefined when the array map is not a Map', () => {
      expect(JsonPointer.toGenericPointer('/a', 'notamap' as any)).toBeUndefined();
    });

    it('should rewrite a pointer array passed in by the caller', () => {
      const pointer = ['foo', '1'];
      const arrayMap = new Map<string, number>([['/foo', 0]]);
      JsonPointer.toGenericPointer(pointer, arrayMap);
      expect(pointer).toEqual(['foo', '-']);
    });
  });

  describe('toControlPointer', () => {
    it('should insert a controls key for each level', () => {
      expect(JsonPointer.toControlPointer('/a', { controls: { a: {} } }))
        .toEqual('/controls/a');
    });

    it('should walk nested control groups', () => {
      const formGroup = { controls: { a: { controls: { b: {} } } } };
      expect(JsonPointer.toControlPointer('/a/b', formGroup))
        .toEqual('/controls/a/controls/b');
    });

    it('should resolve the dash key to the last control of an array', () => {
      expect(JsonPointer.toControlPointer('/-', { controls: [{}, {}] }))
        .toEqual('/controls/1');
    });

    it('should find a control by numeric index', () => {
      expect(JsonPointer.toControlPointer('/0', { controls: [{ x: 1 }] }))
        .toEqual('/controls/0');
    });

    it('should invent the path for a missing control by default', () => {
      expect(JsonPointer.toControlPointer('/x', { controls: {} }))
        .toEqual('/controls/x');
    });

    it('should invent nested paths for missing controls', () => {
      expect(JsonPointer.toControlPointer('/a/b', { controls: {} }))
        .toEqual('/controls/a/controls/b');
    });

    it('should keep the dash key when the control group is not an array', () => {
      expect(JsonPointer.toControlPointer('/-', { controls: {} }))
        .toEqual('/controls/-');
    });

    it('should skip the controls key when the group has none', () => {
      expect(JsonPointer.toControlPointer('/a', {})).toEqual('/a');
    });

    it('should return undefined for a missing control when controlMustExist is set', () => {
      expect(JsonPointer.toControlPointer('/x', { controls: {} }, true)).toBeUndefined();
    });

    it('should return an empty string for the empty pointer', () => {
      expect(JsonPointer.toControlPointer('', {})).toEqual('');
    });

    it('should return undefined for an invalid pointer', () => {
      expect(JsonPointer.toControlPointer('bad', {})).toBeUndefined();
    });
  });

  describe('toSchemaPointer', () => {
    it('should point at a property sub schema', () => {
      const schema = { type: 'object', properties: { a: { type: 'string' } } };
      expect(JsonPointer.toSchemaPointer('/a', schema)).toEqual('/properties/a');
    });

    it('should walk nested properties', () => {
      const schema = { properties: { a: { properties: { b: {} } } } };
      expect(JsonPointer.toSchemaPointer('/a/b', schema))
        .toEqual('/properties/a/properties/b');
    });

    it('should escape the key in the generated pointer', () => {
      const schema = { properties: { 'a/b': {} } };
      expect(JsonPointer.toSchemaPointer('/a~1b', schema)).toEqual('/properties/a~1b');
    });

    it('should fall back to additionalProperties', () => {
      const schema = { type: 'object', additionalProperties: { type: 'string' } };
      expect(JsonPointer.toSchemaPointer('/x', schema)).toEqual('/additionalProperties');
    });

    it('should point at the items sub schema of a list array', () => {
      const schema = { type: 'array', items: { type: 'string' } };
      expect(JsonPointer.toSchemaPointer('/0', schema)).toEqual('/items');
    });

    it('should accept the dash key for an array', () => {
      expect(JsonPointer.toSchemaPointer('/-', { type: 'array', items: {} }))
        .toEqual('/items');
    });

    it('should point at a tuple item', () => {
      const schema = { type: 'array', items: [{}, {}] };
      expect(JsonPointer.toSchemaPointer('/1', schema)).toEqual('/items/1');
    });

    it('should fall back to additionalItems past the end of a tuple', () => {
      const schema = { type: 'array', items: [{}], additionalItems: { type: 'string' } };
      expect(JsonPointer.toSchemaPointer('/5', schema)).toEqual('/additionalItems');
    });

    it('should use additionalItems when there is no items keyword', () => {
      const schema = { type: 'array', additionalItems: { type: 'string' } };
      expect(JsonPointer.toSchemaPointer('/-', schema)).toEqual('/additionalItems');
    });

    it('should walk into an array of objects', () => {
      const schema = { type: 'array', items: { type: 'object', properties: { x: {} } } };
      expect(JsonPointer.toSchemaPointer('/0/x', schema)).toEqual('/items/properties/x');
    });

    it('should return an empty string for the empty pointer', () => {
      expect(JsonPointer.toSchemaPointer('', { type: 'object' })).toEqual('');
    });

    it('should return null past the end of a tuple with no additionalItems', () => {
      expect(JsonPointer.toSchemaPointer('/5', { type: 'array', items: [{}] })).toBeNull();
    });

    it('should return null for a key that is not in properties', () => {
      expect(JsonPointer.toSchemaPointer('/z', { properties: { a: {} } })).toBeNull();
    });

    it('should return null when the schema cannot contain the pointer', () => {
      expect(JsonPointer.toSchemaPointer('/a', { type: 'string' })).toBeNull();
    });

    it('should return null for an empty schema', () => {
      expect(JsonPointer.toSchemaPointer('/a', {})).toBeNull();
    });

    it('should return null for an invalid pointer', () => {
      expect(JsonPointer.toSchemaPointer('bad', {})).toBeNull();
    });

    it('should return null when the schema is not an object', () => {
      expect(JsonPointer.toSchemaPointer('/a', 'str')).toBeNull();
    });

    it('should return an empty string for the empty pointer even with a null schema', () => {
      expect(JsonPointer.toSchemaPointer('', null)).toEqual('');
    });

    it('should throw for a null schema because typeof null is object', () => {
      expect(() => JsonPointer.toSchemaPointer('/a', null)).toThrow();
    });

    it('should empty a pointer array passed in by the caller', () => {
      const pointer = ['a'];
      JsonPointer.toSchemaPointer(pointer, { properties: { a: {} } });
      expect(pointer).toEqual([]);
    });
  });

  describe('toDataPointer', () => {
    it('should turn a properties pointer into a data pointer', () => {
      const schema = { properties: { a: { type: 'string' } } };
      expect(JsonPointer.toDataPointer('/properties/a', schema)).toEqual('/a');
    });

    it('should walk nested properties', () => {
      const schema = { properties: { a: { properties: { b: {} } } } };
      expect(JsonPointer.toDataPointer('/properties/a/properties/b', schema)).toEqual('/a/b');
    });

    it('should turn a list items pointer into a dash', () => {
      expect(JsonPointer.toDataPointer('/items', { items: { type: 'string' } })).toEqual('/-');
    });

    it('should walk through list items into properties', () => {
      const schema = { items: { properties: { a: {} } } };
      expect(JsonPointer.toDataPointer('/items/properties/a', schema)).toEqual('/-/a');
    });

    it('should keep the index of a tuple item', () => {
      expect(JsonPointer.toDataPointer('/items/1', { items: [{}, {}] })).toEqual('/1');
    });

    it('should turn additionalItems into a dash', () => {
      const schema = { additionalItems: { type: 'string' } };
      expect(JsonPointer.toDataPointer('/additionalItems', schema)).toEqual('/-');
    });

    it('should see through allOf', () => {
      const schema = { allOf: [{ properties: { a: {} } }] };
      expect(JsonPointer.toDataPointer('/allOf/0/properties/a', schema)).toEqual('/a');
    });

    it('should see through anyOf', () => {
      const schema = { anyOf: [{}, { properties: { b: {} } }] };
      expect(JsonPointer.toDataPointer('/anyOf/1/properties/b', schema)).toEqual('/b');
    });

    it('should see through not', () => {
      const schema = { not: { properties: { a: {} } } };
      expect(JsonPointer.toDataPointer('/not/properties/a', schema)).toEqual('/a');
    });

    it('should return an empty string, not null, for an ambiguous definitions location', () => {
      expect(JsonPointer.toDataPointer('/definitions/x', { definitions: { x: {} } })).toEqual('');
    });

    it('should return an empty string for an ambiguous location with errors enabled', () => {
      const schema = { patternProperties: { '^a': {} } };
      expect(JsonPointer.toDataPointer('/patternProperties/^a', schema, true)).toEqual('');
    });

    it('should return an empty string for a keyword with no data equivalent', () => {
      expect(JsonPointer.toDataPointer('/type', { type: 'object' })).toEqual('');
    });

    it('should return an empty string for the empty pointer', () => {
      expect(JsonPointer.toDataPointer('', { type: 'object' })).toEqual('');
    });

    it('should return null when the pointer is not in the schema', () => {
      expect(JsonPointer.toDataPointer('/nope', {})).toBeNull();
    });

    it('should return null when the sub schema is null', () => {
      expect(JsonPointer.toDataPointer('/properties/a', { properties: { a: null } })).toBeNull();
    });

    it('should return null for an invalid pointer', () => {
      expect(JsonPointer.toDataPointer('bad', {}, true)).toBeNull();
    });

    it('should return null when the schema is not an object', () => {
      expect(JsonPointer.toDataPointer('/a', 'str', true)).toBeNull();
    });
  });

  describe('parseObjectPath', () => {
    it('should return an array path unchanged', () => {
      const path = ['a', 'b'];
      expect(JsonPointer.parseObjectPath(path)).toBe(path);
    });

    it('should parse a JSON pointer', () => {
      expect(JsonPointer.parseObjectPath('/a/b')).toEqual(['a', 'b']);
    });

    it('should split dot notation', () => {
      expect(JsonPointer.parseObjectPath('a.b.c')).toEqual(['a', 'b', 'c']);
    });

    it('should return a single key path', () => {
      expect(JsonPointer.parseObjectPath('a')).toEqual(['a']);
    });

    it('should split bracket notation', () => {
      expect(JsonPointer.parseObjectPath('a[0].b')).toEqual(['a', '0', 'b']);
    });

    it('should handle mixed dot and bracket notation', () => {
      expect(JsonPointer.parseObjectPath('a.b[1].c')).toEqual(['a', 'b', '1', 'c']);
    });

    it('should handle consecutive brackets', () => {
      expect(JsonPointer.parseObjectPath('a[0][1]')).toEqual(['a', '0', '1']);
    });

    it('should handle a leading bracket', () => {
      expect(JsonPointer.parseObjectPath('[0]')).toEqual(['0']);
    });

    it('should keep dots inside single quoted brackets', () => {
      expect(JsonPointer.parseObjectPath('a[\'b.c\']')).toEqual(['a', 'b.c']);
    });

    it('should handle double quoted brackets', () => {
      expect(JsonPointer.parseObjectPath('a["b"]')).toEqual(['a', 'b']);
    });

    it('should look past an escaped closing quote', () => {
      // The backslash itself is kept in the parsed key.
      expect(JsonPointer.parseObjectPath('a[\'b\\\']c\']')).toEqual(['a', 'b\\\']c']);
    });

    it('should tolerate an unterminated bracket', () => {
      expect(JsonPointer.parseObjectPath('a[0')).toEqual(['a', '0']);
    });

    it('should tolerate an unterminated quoted bracket', () => {
      expect(JsonPointer.parseObjectPath('a[\'b')).toEqual(['a', 'b']);
    });

    it('should ignore a trailing dot', () => {
      expect(JsonPointer.parseObjectPath('a.b.')).toEqual(['a', 'b']);
    });

    it('should return an empty array for an empty string', () => {
      expect(JsonPointer.parseObjectPath('')).toEqual([]);
    });

    it('should return undefined for a number', () => {
      expect(JsonPointer.parseObjectPath(5)).toBeUndefined();
    });

    it('should return undefined for null', () => {
      expect(JsonPointer.parseObjectPath(null)).toBeUndefined();
    });
  });
});
