import { cloneDeep } from './clone-deep.function';

describe('cloneDeep', () => {
  it('returns primitives, null and undefined unchanged', () => {
    expect(cloneDeep(3)).toBe(3);
    expect(cloneDeep('a')).toBe('a');
    expect(cloneDeep(true)).toBe(true);
    expect(cloneDeep(null)).toBeNull();
    expect(cloneDeep(undefined)).toBeUndefined();
  });

  // The reason structuredClone cannot be used: every form clones the validation
  // messages, whose 'format' and 'multipleOf' entries are functions.
  it('carries functions over by reference', () => {
    const format = (error: any) => `bad ${error}`;
    const copy = cloneDeep({ messages: { format, plain: 'x' } });
    expect(copy.messages.format).toBe(format);
    expect(copy.messages.format('t')).toBe('bad t');
  });

  it('carries class references over unchanged', () => {
    class WidgetComponent { }
    const copy = cloneDeep({ widget: WidgetComponent });
    expect(copy.widget).toBe(WidgetComponent);
  });

  it('copies a Date into a new instance with the same time', () => {
    const date = new Date('2020-03-04T05:06:07Z');
    const copy = cloneDeep(date);
    expect(copy).not.toBe(date);
    expect(copy.getTime()).toBe(date.getTime());
  });

  it('copies a RegExp, keeping source, flags and lastIndex', () => {
    const pattern = /ab+/gi;
    pattern.lastIndex = 2;
    const copy = cloneDeep(pattern);
    expect(copy).not.toBe(pattern);
    expect(copy.source).toBe('ab+');
    expect(copy.flags).toBe('gi');
    expect(copy.lastIndex).toBe(2);
    // A RegExp built by Object.create has no internal slots and throws here,
    // which is the failure mode this branch exists to prevent.
    copy.lastIndex = 0;
    expect(copy.test('xabbb')).toBe(true);
  });

  it('copies Maps and Sets, cloning their contents', () => {
    const inner = { a: 1 };
    const map = cloneDeep(new Map<string, any>([['k', inner]]));
    expect(map.get('k')).toEqual(inner);
    expect(map.get('k')).not.toBe(inner);
    const set = cloneDeep(new Set<any>([inner]));
    expect(Array.from(set)[0]).not.toBe(inner);
  });

  it('deep copies nested objects and arrays without sharing references', () => {
    const source = { a: [{ b: 1 }], c: { d: [2, 3] } };
    const copy = cloneDeep(source);
    expect(copy).toEqual(source);
    expect(copy.a).not.toBe(source.a);
    expect(copy.a[0]).not.toBe(source.a[0]);
    expect(copy.c.d).not.toBe(source.c.d);
    copy.a[0].b = 99;
    expect(source.a[0].b).toBe(1);
  });

  // Array.prototype.forEach skips holes and drops trailing ones, which would
  // change the length.
  it('preserves array length across sparse holes', () => {
    const sparse = [1, , 3];
    sparse.length = 5;
    const copy = cloneDeep(sparse);
    expect(copy.length).toBe(5);
    expect(1 in copy).toBe(false);
    expect(copy[2]).toBe(3);
  });

  it('terminates on a cycle and keeps the shared reference', () => {
    const source: any = { name: 'root' };
    source.self = source;
    const copy = cloneDeep(source);
    expect(copy.self).toBe(copy);
    expect(copy.name).toBe('root');
  });

  it('keeps a shared reference shared within one clone', () => {
    const shared = { n: 1 };
    const copy = cloneDeep({ first: shared, second: shared });
    expect(copy.first).toBe(copy.second);
    expect(copy.first).not.toBe(shared);
  });

  it('keeps the prototype of a class instance', () => {
    class Point { constructor(public x = 1) { } }
    const copy = cloneDeep(new Point(5));
    expect(copy instanceof Point).toBe(true);
    expect(copy.x).toBe(5);
  });
});
