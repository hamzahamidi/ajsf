import { deepEqual } from './deep-equal.function';

describe('deepEqual', () => {
  it('compares primitives', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(1, '1')).toBe(false);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(undefined, undefined)).toBe(true);
  });

  it('compares by SameValueZero, so NaN equals NaN and 0 equals -0', () => {
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual(0, -0)).toBe(true);
  });

  // A Date has no own enumerable keys, so a plain key walk would call any two
  // Dates equal, and would let a Date satisfy an enum containing {}.
  it('compares Dates by timestamp and never to a plain object', () => {
    expect(deepEqual(new Date(5), new Date(5))).toBe(true);
    expect(deepEqual(new Date(5), new Date(6))).toBe(false);
    expect(deepEqual(new Date(5), {})).toBe(false);
    expect(deepEqual({}, new Date(5))).toBe(false);
  });

  it('compares arrays by index and length', () => {
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual([1], [1, undefined])).toBe(false);
  });

  it('never equates an array with a numeric-key object', () => {
    expect(deepEqual([1, 2], { 0: 1, 1: 2 } as any)).toBe(false);
  });

  it('ignores key order', () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  // Without the hasOwnProperty check both sides have one key and both lookups
  // are undefined, so these would compare equal.
  it('distinguishes a present undefined value from a missing key', () => {
    expect(deepEqual({ a: undefined }, { b: undefined })).toBe(false);
    expect(deepEqual({ a: undefined }, {})).toBe(false);
  });

  it('compares nested plain objects', () => {
    expect(deepEqual({ a: { b: [1, { c: 2 }] } }, { a: { b: [1, { c: 2 }] } })).toBe(true);
    expect(deepEqual({ a: { b: [1, { c: 2 }] } }, { a: { b: [1, { c: 3 }] } })).toBe(false);
  });

  it('compares unsupported exotics by reference rather than calling them equal', () => {
    expect(deepEqual(/a/, /a/)).toBe(false);
    expect(deepEqual(new Map([['a', 1]]), new Map([['a', 1]]))).toBe(false);
    const shared = /a/;
    expect(deepEqual(shared, shared)).toBe(true);
  });

  it('does not equate a sparse hole with a value', () => {
    expect(deepEqual([, 1], [2, 1])).toBe(false);
  });
});
