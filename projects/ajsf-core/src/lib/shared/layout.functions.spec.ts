import {
  buildLayout,
  buildLayoutFromSchema,
  buildTitleMap,
  getLayoutNode,
  mapLayout,
} from './layout.functions';

/**
 * Characterization tests for the layout function library.
 *
 * These pin the behaviour these functions have today, including several results
 * that are almost certainly wrong (see the comments marked BUG). Nothing here is
 * an aspiration: every expectation was produced by running the real code.
 *
 * The `jsf` argument is a plain object literal carrying only the properties the
 * functions actually read, so no Angular service has to be instantiated.
 */

/** Minimal stand-in for JsonSchemaFormService. */
function makeJsf(overrides: any = {}): any {
  return {
    schema: {},
    layout: [],
    formValues: {},
    dataMap: new Map(),
    arrayMap: new Map(),
    schemaRefLibrary: {},
    layoutRefLibrary: {},
    templateRefLibrary: {},
    schemaRecursiveRefMap: new Map(),
    dataRecursiveRefMap: new Map(),
    formOptions: {
      addSubmit: false,
      // NOTE: 'defautWidgetOptions' really is spelled that way in the source.
      defautWidgetOptions: {},
      setSchemaDefaults: 'auto',
    },
    fieldsRequired: false,
    hasRootReference: false,
    ...overrides,
  };
}

/** Minimal stand-in for WidgetLibraryService. */
const widgetLibrary: any = {
  hasWidget: (type: any) => type !== 'no-such-widget',
  getWidget: (type: any) => 'widget:' + type,
};

/**
 * Removes every '_id' key, at any depth. The id counter is module scoped and
 * therefore global across the whole test bundle, so the values can never be
 * asserted.
 */
function stripIds(node: any): any {
  if (Array.isArray(node)) { return node.map(stripIds); }
  if (node !== null && typeof node === 'object') {
    const copied: any = {};
    Object.keys(node)
      .filter(key => key !== '_id')
      .forEach(key => copied[key] = stripIds(node[key]));
    return copied;
  }
  return node;
}

const objectSchema: any = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' },
  },
};

const arrayOfObjectsSchema: any = {
  type: 'object',
  properties: {
    people: {
      type: 'array',
      items: {
        type: 'object',
        properties: { first: { type: 'string' }, last: { type: 'string' } },
      },
    },
  },
};

describe('buildTitleMap', () => {

  describe('no titleMap and no enum list', () => {
    it('returns the default boolean map', () => {
      expect(buildTitleMap(null, null)).toEqual([
        { name: 'True', value: true },
        { name: 'False', value: false },
      ]);
    });

    it('returns the default boolean map for undefined arguments too', () => {
      expect(buildTitleMap(undefined, undefined)).toEqual([
        { name: 'True', value: true },
        { name: 'False', value: false },
      ]);
    });

    it('prepends a None entry to the default boolean map when not required', () => {
      // Neither default value is null, so hasEmptyValue stays false and the
      // None entry is added.
      expect(buildTitleMap(null, null, false)).toEqual([
        { name: '<em>None</em>', value: null },
        { name: 'True', value: true },
        { name: 'False', value: false },
      ]);
    });
  });

  describe('enum list alone', () => {
    it('uses each enum value as both name and value', () => {
      expect(buildTitleMap(null, ['a', 'b'])).toEqual([
        { name: 'a', value: 'a' },
        { name: 'b', value: 'b' },
      ]);
    });

    it('prepends a None entry when the field is not required', () => {
      expect(buildTitleMap(null, ['a', 'b'], false)).toEqual([
        { name: '<em>None</em>', value: null },
        { name: 'a', value: 'a' },
        { name: 'b', value: 'b' },
      ]);
    });

    it('does not prepend None when the enum list already contains null', () => {
      expect(buildTitleMap(null, [null, 'b'], false)).toEqual([
        { name: null, value: null },
        { name: 'b', value: 'b' },
      ]);
    });

    it('accepts an object as the enum list and walks its values', () => {
      expect(buildTitleMap(null, { x: 'ex', y: 'why' })).toEqual([
        { name: 'ex', value: 'ex' },
        { name: 'why', value: 'why' },
      ]);
    });

    it('returns an empty map for an empty enum list', () => {
      // An empty array is still truthy, so the enum branch is taken and the
      // default boolean map is never reached.
      expect(buildTitleMap(null, [])).toEqual([]);
    });
  });

  describe('array titleMap with an enum list', () => {
    it('keeps only the JSON Form entries whose value is in the enum list', () => {
      expect(buildTitleMap(
        [{ name: 'A', value: 'a' }, { name: 'B', value: 'b' }, { name: 'C', value: 'c' }],
        ['a', 'c']
      )).toEqual([{ name: 'A', value: 'a' }, { name: 'C', value: 'c' }]);
    });

    it('pairs React Jsonschema Form style string names with enum values by index', () => {
      expect(buildTitleMap(['A', 'B', 'C'], ['a', 'b']))
        .toEqual([{ name: 'A', value: 'a' }, { name: 'B', value: 'b' }]);
    });

    it('drops string names past the end of the enum list', () => {
      expect(buildTitleMap(['A', 'B', 'C'], ['a']))
        .toEqual([{ name: 'A', value: 'a' }]);
    });

    it('skips entries that are neither an object nor a string', () => {
      expect(buildTitleMap([5, true], ['a'])).toEqual([]);
    });

    it('keeps an undefined value and does not add a None entry for it', () => {
      expect(buildTitleMap([{ name: 'A' }], [undefined]))
        .toEqual([{ name: 'A', value: undefined }]);
    });
  });

  describe('array titleMap without an enum list', () => {
    it('returns the titleMap unchanged', () => {
      expect(buildTitleMap([{ name: 'A', value: 'a' }], null))
        .toEqual([{ name: 'A', value: 'a' }]);
    });

    it('returns the very same array instance, not a copy', () => {
      // BUG: newTitleMap is assigned the caller's array by reference, so later
      // group processing can mutate the caller's own titleMap.
      const titleMap: any = [{ name: 'A', value: 'a' }];

      expect(buildTitleMap(titleMap, null)).toBe(titleMap);
    });

    it('prepends a None entry when the field is not required', () => {
      expect(buildTitleMap([{ name: 'A', value: 'a' }], null, false)).toEqual([
        { name: '<em>None</em>', value: null },
        { name: 'A', value: 'a' },
      ]);
    });

    it('does not prepend None when an entry already has a null value', () => {
      expect(buildTitleMap(
        [{ name: 'None', value: null }, { name: 'A', value: 'a' }], null, false
      )).toEqual([{ name: 'None', value: null }, { name: 'A', value: 'a' }]);
    });

    it('returns an empty array for an empty array titleMap', () => {
      expect(buildTitleMap([], null)).toEqual([]);
    });
  });

  describe('object titleMap', () => {
    it('maps enum values through the object when an enum list is given', () => {
      expect(buildTitleMap({ a: 'Apple', b: 'Banana' }, ['a', 'b']))
        .toEqual([{ name: 'Apple', value: 'a' }, { name: 'Banana', value: 'b' }]);
    });

    it('skips enum values that are not keys of the object', () => {
      expect(buildTitleMap({ a: 'Apple' }, ['a', 'z']))
        .toEqual([{ name: 'Apple', value: 'a' }]);
    });

    it('walks the object keys when no enum list is given', () => {
      expect(buildTitleMap({ a: 'Apple', b: 'Banana' }, null))
        .toEqual([{ name: 'Apple', value: 'a' }, { name: 'Banana', value: 'b' }]);
    });

    it('returns an empty array for an empty object titleMap', () => {
      expect(buildTitleMap({}, null)).toEqual([]);
    });
  });

  describe('grouped titleMap, flatList true', () => {
    it('flattens a group entry into "group: name"', () => {
      expect(buildTitleMap([
        { group: 'G', name: 'n', value: 1 },
        { name: 'plain', value: 2 },
      ], null)).toEqual([{ name: 'G: n', value: 1 }, { name: 'plain', value: 2 }]);
    });

    it('expands the items of a group entry and prefixes each name', () => {
      expect(buildTitleMap(
        [{ group: 'G', items: [{ name: 'x', value: 1 }, { name: 'y', value: 2 }] }], null
      )).toEqual([{ name: 'G: x', value: 1 }, { name: 'G: y', value: 2 }]);
    });

    it('drops a group entry that has neither items nor a name and value pair', () => {
      expect(buildTitleMap([{ group: 'G' }], null)).toEqual([]);
    });

    it('emits a group entry twice when it has items as well as a name and value', () => {
      // BUG: the two `if` blocks are not exclusive, so an entry carrying both
      // shapes contributes its items and then itself, keeping the stale
      // `items` array on the second copy.
      expect(buildTitleMap(
        [{ group: 'G', items: [{ name: 'x', value: 1 }], name: 'n', value: 2 }], null
      )).toEqual([
        { name: 'G: x', value: 1 },
        { items: [{ name: 'x', value: 1 }], name: 'G: n', value: 2 },
      ]);
    });

    it('prepends a None entry when grouped and not required', () => {
      expect(buildTitleMap([{ group: 'G', name: 'n', value: 1 }], null, false))
        .toEqual([{ name: '<em>None</em>', value: null }, { name: 'G: n', value: 1 }]);
    });

    it('does not prepend None when a grouped entry carries a null value', () => {
      expect(buildTitleMap([{ group: 'G', name: 'n', value: null }], null, false))
        .toEqual([{ name: 'G: n', value: null }]);
    });

    it('mutates the caller titleMap entries in place', () => {
      // BUG: the array branch keeps the caller's own entry objects, and the
      // group reducer rewrites `name` and deletes `group` on them.
      const titleMap: any = [{ group: 'G', name: 'n', value: 1 }];
      buildTitleMap(titleMap, null);

      expect(titleMap).toEqual([{ name: 'G: n', value: 1 }]);
    });
  });

  describe('grouped titleMap, flatList false', () => {
    it('collects entries of one group into a single group object', () => {
      expect(buildTitleMap([
        { group: 'G', name: 'n', value: 1 },
        { group: 'G', name: 'm', value: 2 },
        { name: 'p', value: 3 },
      ], null, true, false)).toEqual([
        { group: 'G', items: [{ name: 'n', value: 1 }, { name: 'm', value: 2 }] },
        { name: 'p', value: 3 },
      ]);
    });

    it('keeps an existing items array on a group entry', () => {
      expect(buildTitleMap(
        [{ group: 'G', items: [{ name: 'x', value: 1 }] }], null, true, false
      )).toEqual([{ group: 'G', items: [{ name: 'x', value: 1 }] }]);
    });

    it('starts a new group object for each distinct group name', () => {
      expect(buildTitleMap([
        { group: 'A', name: 'a', value: 1 },
        { group: 'B', name: 'b', value: 2 },
      ], null, true, false)).toEqual([
        { group: 'A', items: [{ name: 'a', value: 1 }] },
        { group: 'B', items: [{ name: 'b', value: 2 }] },
      ]);
    });

    it('prepends a None entry when grouped, unflattened and not required', () => {
      expect(buildTitleMap([{ group: 'G', name: 'n', value: 1 }], null, false, false))
        .toEqual([
          { name: '<em>None</em>', value: null },
          { group: 'G', items: [{ name: 'n', value: 1 }] },
        ]);
    });

    it('does not prepend None when a grouped item carries a null value', () => {
      expect(buildTitleMap([{ group: 'G', name: 'n', value: null }], null, false, false))
        .toEqual([{ group: 'G', items: [{ name: 'n', value: null }] }]);
    });
  });
});

describe('mapLayout', () => {

  it('returns an empty array for an empty layout', () => {
    expect(mapLayout([], (item: any) => item)).toEqual([]);
  });

  it('returns an empty array for a null layout', () => {
    expect(mapLayout(null, (item: any) => item)).toEqual([]);
  });

  it('returns an empty array for an undefined layout', () => {
    expect(mapLayout(undefined, (item: any) => item)).toEqual([]);
  });

  it('runs the iteratee over every element', () => {
    expect(mapLayout(['a', 'b', 'c'], (item: any) => item.toUpperCase()))
      .toEqual(['A', 'B', 'C']);
  });

  it('copies object nodes rather than passing the originals through', () => {
    const layout: any = [{ key: 'a' }];

    expect(mapLayout(layout, (item: any) => item)[0]).not.toBe(layout[0]);
  });

  it('passes the running index and the layout pointer to the iteratee', () => {
    expect(mapLayout(['a', 'b'], (item: any, index: any, pointer: any) => pointer))
      .toEqual(['/0', '/1']);
  });

  it('passes the root layout as the fourth argument', () => {
    const layout: any = ['a'];
    let seenRoot: any = null;
    mapLayout(layout, (item: any, i: any, p: any, root: any) => {
      seenRoot = root;
      return item;
    });

    expect(seenRoot).toBe(layout);
  });

  it('honours an explicit layoutPointer prefix', () => {
    expect(mapLayout(['a'], (item: any, i: any, pointer: any) => pointer, '/base'))
      .toEqual(['/base/0']);
  });

  it('drops null results and shifts the indexes of later items', () => {
    expect(mapLayout(
      ['a', 'b', 'c'],
      (item: any, index: any) => item === 'b' ? null : item + index
    )).toEqual(['a0', 'c1']);
  });

  it('drops undefined results as well', () => {
    expect(mapLayout(['a', 'b'], (item: any) => item === 'a' ? undefined : item))
      .toEqual(['b']);
  });

  it('keeps a zero result because zero is defined', () => {
    expect(mapLayout(['a'], () => 0)).toEqual([0]);
  });

  it('keeps a false result because false is defined', () => {
    expect(mapLayout(['a'], () => false)).toEqual([false]);
  });

  it('splices an array result inline and pads the following indexes', () => {
    expect(mapLayout(['a', 'b'], (item: any) => item === 'a' ? ['x', 'y'] : item))
      .toEqual(['x', 'y', 'b']);
  });

  it('recurses into an items array before calling the iteratee on the parent', () => {
    expect(mapLayout(
      [{ items: ['inner'] }],
      (item: any) => typeof item === 'string' ? item.toUpperCase() : item
    )).toEqual([{ items: ['INNER'] }]);
  });

  it('wraps a single items object into an array', () => {
    expect(mapLayout([{ items: { key: 'z' } }], (item: any) => item))
      .toEqual([{ items: [{ key: 'z' }] }]);
  });

  it('builds nested layout pointers through items', () => {
    expect(mapLayout(
      [{ items: [{ items: ['deep'] }] }],
      (item: any, i: any, pointer: any) => typeof item === 'string' ? pointer : item
    )).toEqual([{ items: [{ items: ['/0/items/0/items/0'] }] }]);
  });

  it('leaves a node without items untouched', () => {
    expect(mapLayout([{ key: 'a' }], (item: any) => item)).toEqual([{ key: 'a' }]);
  });

  it('copies tabs into items but leaves the stale tabs key on the result', () => {
    // BUG: copy(item) runs before `item.items = item.tabs; delete item.tabs`,
    // so the shallow copy that becomes the result still carries `tabs`.
    expect(mapLayout([{ tabs: [{ key: 'a' }] }], (item: any) => item))
      .toEqual([{ tabs: [{ key: 'a' }], items: [{ key: 'a' }] }]);
  });

  it('rewrites tabs to items on the caller layout in place', () => {
    // BUG: mapLayout is documented as creating a new layout, but it mutates
    // the input node when converting tabs.
    const layout: any = [{ tabs: [{ key: 'a' }] }];
    mapLayout(layout, (item: any) => item);

    expect(layout).toEqual([{ items: [{ key: 'a' }] }]);
  });

  it('produces NaN pointers when the layout is a plain object', () => {
    // BUG: realIndex is `+index + indexPad`, and the keys of a plain object
    // are not numeric, so every pointer becomes '/NaN'.
    expect(mapLayout(
      { x: 'a', y: 'b' },
      (item: any, i: any, pointer: any) => item + pointer
    )).toEqual(['a/NaN', 'b/NaN']);
  });
});

describe('getLayoutNode', () => {

  describe('recursive reference with a widget library', () => {
    it('returns an Add button node naming the reference', () => {
      expect(stripIds(getLayoutNode(
        { $ref: '/a', dataPointer: '/x', recursiveReference: true },
        makeJsf(),
        widgetLibrary
      ))).toEqual({
        $ref: '/a',
        dataPointer: '/x',
        recursiveReference: true,
        widget: 'widget:$ref',
        options: { removable: false, title: 'Add /a' },
      });
    });

    it('keeps any options already present on the reference node', () => {
      const result: any = getLayoutNode(
        { $ref: '/a', recursiveReference: true, options: { fieldStyle: 'boxed' } },
        makeJsf(),
        widgetLibrary
      );

      expect(result.options)
        .toEqual({ fieldStyle: 'boxed', removable: false, title: 'Add /a' });
    });

    it('returns an Add button even when the reference is not in the library', () => {
      // This branch returns before layoutRefLibrary is ever consulted.
      const result: any = getLayoutNode(
        { $ref: '/never-registered', recursiveReference: true },
        makeJsf(),
        widgetLibrary
      );

      expect(stripIds(result)).toEqual({
        $ref: '/never-registered',
        recursiveReference: true,
        widget: 'widget:$ref',
        options: { removable: false, title: 'Add /never-registered' },
      });
    });
  });

  describe('copy from layoutRefLibrary', () => {
    it('deep copies the stored node and gives every subnode a fresh id', () => {
      const jsf: any = makeJsf({
        layoutRefLibrary: {
          '/a': {
            _id: null,
            dataPointer: '/inner',
            options: {},
            type: 'text',
            items: [{ _id: null, dataPointer: '/inner/deep', options: {} }],
          },
        },
      });
      const result: any = getLayoutNode({ $ref: '/a', dataPointer: '/pre' }, jsf, widgetLibrary);

      expect(stripIds(result)).toEqual({
        dataPointer: '/inner',
        options: {},
        type: 'text',
        items: [{ dataPointer: '/inner/deep', options: {} }],
      });
      expect(result._id).not.toBeNull();
      expect(typeof result._id).toBe('string');
      expect(result.items[0]._id).not.toBeNull();
      expect(result).not.toBe(jsf.layoutRefLibrary['/a']);
    });

    it('leaves the stored library node untouched', () => {
      const jsf: any = makeJsf({
        layoutRefLibrary: { '/a': { _id: null, dataPointer: '/inner', options: {} } },
      });
      getLayoutNode({ $ref: '/a', dataPointer: '/pre', recursiveReference: true }, jsf, null);

      expect(jsf.layoutRefLibrary['/a'].dataPointer).toEqual('/inner');
      expect(jsf.layoutRefLibrary['/a']._id).toBeNull();
    });

    it('prefixes every dataPointer when copying a recursive reference', () => {
      const jsf: any = makeJsf({
        layoutRefLibrary: { '/a': { _id: null, dataPointer: '/inner', options: {} } },
      });

      expect(stripIds(getLayoutNode(
        { $ref: '/a', dataPointer: '/pre', recursiveReference: true }, jsf, null
      ))).toEqual({ dataPointer: '/pre/inner', options: {} });
    });

    it('returns undefined for a reference that is not in the library', () => {
      expect(getLayoutNode({ $ref: '/missing' }, makeJsf(), widgetLibrary)).toBeUndefined();
    });
  });

  describe('rebuild from schema when a node value is supplied', () => {
    it('throws when the reference is not in the library', () => {
      // BUG: line 907 reads jsf.layoutRefLibrary[refNode.$ref] with no guard,
      // then dereferences `.arrayItem` on the undefined result.
      expect(() => getLayoutNode(
        { $ref: '/missing' }, makeJsf(), widgetLibrary, 'a value'
      )).toThrow();
    });

    it('rebuilds the referenced node from the schema', () => {
      const jsf: any = makeJsf({
        schema: arrayOfObjectsSchema,
        arrayMap: new Map([['/people', 0]]),
      });
      buildLayoutFromSchema(jsf, widgetLibrary, null, '/properties/people', '/people');
      const result: any = getLayoutNode(
        { $ref: '/people/-', dataPointer: '/people/-' },
        jsf,
        widgetLibrary,
        { first: 'Bob' }
      );

      expect(result.type).toEqual('section');
      expect(result.dataPointer).toEqual('/people/-');
      expect(result.arrayItem).toBe(true);
      expect(result.arrayItemType).toEqual('list');
      expect(result.items.map((item: any) => item.dataPointer))
        .toEqual(['/people/-/first', '/people/-/last']);
    });
  });
});

describe('buildLayoutFromSchema', () => {

  describe('defensive branches', () => {
    it('returns null for an empty schema', () => {
      expect(buildLayoutFromSchema(makeJsf(), widgetLibrary)).toBeNull();
    });

    it('returns null when the schema pointer resolves to nothing', () => {
      expect(buildLayoutFromSchema(
        makeJsf({ schema: objectSchema }), widgetLibrary, null, '/properties/nope', '/nope'
      )).toBeNull();
    });

    it('builds a node from an x-schema-form block with no type and no $ref', () => {
      expect(stripIds(buildLayoutFromSchema(
        makeJsf({ schema: { 'x-schema-form': { type: 'help' } } }), widgetLibrary
      ))).toEqual({
        arrayItem: false,
        dataPointer: '',
        dataType: null,
        name: '',
        options: { type: 'help', required: false },
        required: false,
        type: 'help',
        widget: 'widget:help',
      });
    });
  });

  describe('scalar properties', () => {
    it('builds a text node for a string property', () => {
      expect(stripIds(buildLayoutFromSchema(
        makeJsf({ schema: { type: 'object', properties: { name: { type: 'string', title: 'Full Name' } } } }),
        widgetLibrary, null, '/properties/name', '/name'
      ))).toEqual({
        arrayItem: false,
        dataPointer: '/name',
        dataType: 'string',
        name: 'name',
        options: { title: 'Full Name', required: false },
        required: false,
        type: 'text',
        widget: 'widget:text',
      });
    });

    it('derives a title from the property name when the schema has none', () => {
      const result: any = buildLayoutFromSchema(
        makeJsf({ schema: { type: 'object', properties: { first_name: { type: 'string' } } } }),
        widgetLibrary, null, '/properties/first_name', '/first_name'
      );

      expect(result.options.title).toEqual('First Name');
    });

    it('uses a checkbox for a boolean and a select for an enum', () => {
      const result: any = buildLayoutFromSchema(makeJsf({
        schema: {
          type: 'object',
          properties: { ok: { type: 'boolean' }, pick: { type: 'string', enum: ['x', 'y'] } },
        },
      }), widgetLibrary);

      expect(result.map((item: any) => [item.name, item.type]))
        .toEqual([['ok', 'checkbox'], ['pick', 'select']]);
      expect(result[1].options.enum).toEqual(['x', 'y']);
    });

    it('sets a null _id when building for the reference library', () => {
      const result: any = buildLayoutFromSchema(
        makeJsf({ schema: objectSchema }), widgetLibrary,
        null, '/properties/name', '/name', false, null, null, true
      );

      expect(result._id).toBeNull();
    });

    it('records arrayItem, arrayItemType and removable for an array item node', () => {
      expect(stripIds(buildLayoutFromSchema(
        makeJsf({ schema: { type: 'object', properties: { n: { type: 'string' } } } }),
        widgetLibrary, null, '/properties/n', '/n', true, 'tuple', false
      ))).toEqual({
        arrayItem: true,
        arrayItemType: 'tuple',
        dataPointer: '/n',
        dataType: 'string',
        name: 'n',
        options: { required: false, removable: false, title: 'N' },
        required: false,
        type: 'text',
        widget: 'widget:text',
      });
    });
  });

  describe('object schemas', () => {
    it('returns a bare array of item nodes for the root data pointer', () => {
      const jsf: any = makeJsf({ schema: objectSchema });
      const result: any = buildLayoutFromSchema(jsf, widgetLibrary);

      expect(Array.isArray(result)).toBe(true);
      expect(result.map((item: any) => item.name)).toEqual(['name', 'age']);
    });

    it('nests the item nodes under items when the data pointer is not the root', () => {
      const jsf: any = makeJsf({
        schema: { type: 'object', properties: { group: objectSchema } },
      });
      const result: any = buildLayoutFromSchema(
        jsf, widgetLibrary, null, '/properties/group', '/group'
      );

      expect(result.type).toEqual('section');
      expect(result.items.map((item: any) => item.dataPointer))
        .toEqual(['/group/name', '/group/age']);
    });

    it('marks required properties and flips jsf.fieldsRequired', () => {
      const jsf: any = makeJsf({
        schema: { type: 'object', required: ['a'], properties: { a: { type: 'string' }, b: { type: 'string' } } },
      });
      const result: any = buildLayoutFromSchema(jsf, widgetLibrary);

      expect(result[0].options.required).toBe(true);
      expect(result[1].options.required).toBe(false);
      expect(jsf.fieldsRequired).toBe(true);
    });

    it('registers a dataMap entry for every node it builds', () => {
      const jsf: any = makeJsf({ schema: objectSchema });
      buildLayoutFromSchema(jsf, widgetLibrary);

      expect(Array.from(jsf.dataMap.keys())).toEqual(['', '/name', '/age']);
      expect(jsf.dataMap.get('/name').get('inputType')).toEqual('text');
      expect(jsf.dataMap.get('/name').get('widget')).toEqual('widget:text');
      expect(jsf.dataMap.get('/name').get('schemaPointer')).toEqual('/properties/name');
      expect(jsf.dataMap.get('').get('required')).toEqual(undefined);
    });

    it('stores the schema required list in the parent dataMap entry', () => {
      const jsf: any = makeJsf({
        schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
      });
      buildLayoutFromSchema(jsf, widgetLibrary);

      expect(jsf.dataMap.get('').get('required')).toEqual(['name']);
    });

    it('orders the properties by ui:order', () => {
      const jsf: any = makeJsf({
        schema: {
          type: 'object',
          'ui:order': ['b', 'a'],
          properties: { a: { type: 'string' }, b: { type: 'string' } },
        },
      });

      expect(buildLayoutFromSchema(jsf, widgetLibrary).map((item: any) => item.name))
        .toEqual(['b', 'a']);
    });

    it('expands a * placeholder in ui:order into the unnamed properties', () => {
      const jsf: any = makeJsf({
        schema: {
          type: 'object',
          'ui:order': ['b', '*'],
          properties: { a: { type: 'string' }, b: { type: 'string' }, c: { type: 'string' } },
        },
      });

      expect(buildLayoutFromSchema(jsf, widgetLibrary).map((item: any) => item.name))
        .toEqual(['b', 'a', 'c']);
    });

    it('builds an unknown ui:order key from additionalProperties', () => {
      const jsf: any = makeJsf({
        schema: {
          type: 'object',
          'ui:order': ['a', 'extra'],
          properties: { a: { type: 'string' } },
          additionalProperties: { type: 'number' },
        },
      });

      expect(buildLayoutFromSchema(jsf, widgetLibrary)
        .map((item: any) => [item.name, item.dataPointer, item.type]))
        .toEqual([['a', '/a', 'text'], ['extra', '/extra', 'number']]);
    });

    it('skips a ui:order key that matches neither properties nor additionalProperties', () => {
      const jsf: any = makeJsf({
        schema: { type: 'object', 'ui:order': ['a', 'ghost'], properties: { a: { type: 'string' } } },
      });

      expect(buildLayoutFromSchema(jsf, widgetLibrary).map((item: any) => item.name))
        .toEqual(['a']);
    });

    it('returns a node with no items for an object schema with no properties', () => {
      const jsf: any = makeJsf({
        schema: { type: 'object', properties: { blank: { type: 'object' } } },
      });
      const result: any = buildLayoutFromSchema(
        jsf, widgetLibrary, null, '/properties/blank', '/blank'
      );

      expect(result.dataType).toEqual('object');
      expect(result.items).toBeUndefined();
    });
  });

  describe('array schemas', () => {
    const listSchema: any = {
      type: 'object',
      properties: { tags: { type: 'array', title: 'Tags', items: { type: 'string' } } },
    };

    it('builds one list item plus an Add button', () => {
      const jsf: any = makeJsf({ schema: listSchema });
      const result: any = buildLayoutFromSchema(
        jsf, widgetLibrary, null, '/properties/tags', '/tags'
      );

      expect(result.type).toEqual('array');
      expect(result.options)
        .toEqual({ title: 'Tags', required: false, maxItems: 1000, minItems: 0, listItems: 1, tupleItems: 0 });
      expect(result.items.map((item: any) => item.type)).toEqual(['text', '$ref']);
      expect(stripIds(result.items[1])).toEqual({
        arrayItem: true,
        arrayItemType: 'list',
        dataPointer: '/tags/-',
        options: {
          listItems: 1,
          maxItems: 1000,
          minItems: 0,
          removable: false,
          title: 'Add to Tags',
          tupleItems: 0,
        },
        recursiveReference: false,
        type: '$ref',
        widget: 'widget:$ref',
        $ref: '/tags/-',
      });
    });

    it('registers the item template in layoutRefLibrary and the array in arrayMap', () => {
      const jsf: any = makeJsf({ schema: listSchema });
      buildLayoutFromSchema(jsf, widgetLibrary, null, '/properties/tags', '/tags');

      expect(Object.keys(jsf.layoutRefLibrary)).toEqual(['/tags/-']);
      expect(jsf.layoutRefLibrary['/tags/-'].type).toEqual('text');
      expect(Array.from(jsf.arrayMap)).toEqual([['/tags', 0]]);
      expect(jsf.dataMap.get('/tags').get('maxItems')).toEqual(1000);
      expect(jsf.dataMap.get('/tags').get('tupleItems')).toEqual(0);
    });

    it('builds one node per tuple entry when items is an array', () => {
      const jsf: any = makeJsf({
        schema: {
          type: 'object',
          properties: { pair: { type: 'array', items: [{ type: 'string' }, { type: 'number' }] } },
        },
      });
      const result: any = buildLayoutFromSchema(
        jsf, widgetLibrary, null, '/properties/pair', '/pair'
      );

      expect(result.options.tupleItems).toEqual(2);
      expect(result.items.map((item: any) => [item.type, item.arrayItemType, item.dataPointer]))
        .toEqual([['text', 'tuple', '/pair/0'], ['number', 'tuple', '/pair/1']]);
      expect(Object.keys(jsf.layoutRefLibrary)).toEqual(['/pair/0', '/pair/1']);
    });

    it('clamps tupleItems to maxItems and zeroes listItems', () => {
      const jsf: any = makeJsf({
        schema: {
          type: 'object',
          properties: { pair: { type: 'array', maxItems: 1, items: [{ type: 'string' }, { type: 'number' }] } },
        },
      });
      const result: any = buildLayoutFromSchema(
        jsf, widgetLibrary, null, '/properties/pair', '/pair'
      );

      expect(result.options.maxItems).toEqual(1);
      expect(result.options.tupleItems).toEqual(1);
      expect(result.options.listItems).toEqual(0);
      expect(result.items.map((item: any) => item.type)).toEqual(['text']);
    });

    it('raises listItems to satisfy minItems and pre-builds that many items', () => {
      const jsf: any = makeJsf({
        schema: {
          type: 'object',
          properties: { p: { type: 'array', minItems: 3, items: { type: 'string' } } },
        },
      });
      const result: any = buildLayoutFromSchema(
        jsf, widgetLibrary, null, '/properties/p', '/p'
      );

      expect(result.options.minItems).toEqual(3);
      expect(result.options.listItems).toEqual(3);
      expect(result.items.map((item: any) => item.type))
        .toEqual(['text', 'text', 'text', '$ref']);
    });

    it('sets minItems to 1 for a required array', () => {
      const jsf: any = makeJsf({
        schema: {
          type: 'object',
          required: ['p'],
          properties: { p: { type: 'array', items: { type: 'string' } } },
        },
      });
      const result: any = buildLayoutFromSchema(
        jsf, widgetLibrary, null, '/properties/p', '/p'
      );

      expect(result.options.minItems).toEqual(1);
      expect(result.options.required).toBe(true);
    });

    it('adds one item node per entry in the supplied node value', () => {
      const jsf: any = makeJsf({
        schema: { type: 'object', properties: { p: { type: 'array', items: { type: 'string' } } } },
      });
      const result: any = buildLayoutFromSchema(
        jsf, widgetLibrary, ['x', 'y', 'z'], '/properties/p', '/p'
      );

      expect(result.items.map((item: any) => item.type))
        .toEqual(['text', 'text', 'text', '$ref']);
    });

    it('takes the array length from the schema default when setSchemaDefaults is true', () => {
      const schema: any = {
        type: 'object',
        properties: { p: { type: 'array', items: { type: 'string' }, default: ['a', 'b'] } },
      };
      const withDefaults: any = makeJsf({
        schema,
        formOptions: { addSubmit: false, defautWidgetOptions: {}, setSchemaDefaults: true },
      });
      const withoutDefaults: any = makeJsf({
        schema,
        formOptions: { addSubmit: false, defautWidgetOptions: {}, setSchemaDefaults: false },
      });

      expect(buildLayoutFromSchema(withDefaults, widgetLibrary, null, '/properties/p', '/p')
        .items.map((item: any) => item.type)).toEqual(['text', 'text', '$ref']);
      expect(buildLayoutFromSchema(withoutDefaults, widgetLibrary, null, '/properties/p', '/p')
        .items.map((item: any) => item.type)).toEqual(['text', '$ref']);
    });

    it('omits the Add button when addable is false', () => {
      const jsf: any = makeJsf({
        schema: {
          type: 'object',
          properties: {
            p: { type: 'array', items: { type: 'string' }, 'x-schema-form': { addable: false } },
          },
        },
      });
      const result: any = buildLayoutFromSchema(
        jsf, widgetLibrary, null, '/properties/p', '/p'
      );

      expect(result.options.addable).toBe(false);
      expect(result.items.map((item: any) => item.type)).toEqual(['text']);
    });

    it('builds an empty items array for an array schema with no items', () => {
      const jsf: any = makeJsf({
        schema: { type: 'object', properties: { p: { type: 'array', maxItems: 3 } } },
      });
      const result: any = buildLayoutFromSchema(
        jsf, widgetLibrary, null, '/properties/p', '/p'
      );

      expect(result.items).toEqual([]);
      expect(result.options.maxItems).toEqual(3);
    });

    it('does not throw when the data pointer is listed in dataRecursiveRefMap', () => {
      const jsf: any = makeJsf({
        schema: arrayOfObjectsSchema,
        arrayMap: new Map([['/people', 0]]),
        dataRecursiveRefMap: new Map([['/people/-/kids', '/people']]),
      });

      expect(() => buildLayoutFromSchema(
        jsf, widgetLibrary, null, '/properties/people', '/people'
      )).not.toThrow();
    });
  });

  describe('$ref schemas', () => {
    const refSchema: any = {
      type: 'object',
      title: 'Root',
      properties: { a: { type: 'string' }, b: { $ref: '#/properties/a' } },
    };

    it('builds an Add button node and stores the target in layoutRefLibrary', () => {
      const jsf: any = makeJsf({ schema: refSchema });
      const result: any = buildLayoutFromSchema(
        jsf, widgetLibrary, null, '/properties/b', '/b'
      );

      expect(stripIds(result)).toEqual({
        arrayItem: false,
        dataPointer: '/b',
        dataType: '$ref',
        name: 'b',
        options: { required: false, title: 'Add B', removable: false },
        required: false,
        recursiveReference: true,
        type: '$ref',
        widget: 'widget:$ref',
        $ref: '/a',
      });
      expect(Object.keys(jsf.layoutRefLibrary)).toEqual(['/a']);
      expect(jsf.layoutRefLibrary['/a'].recursiveReference).toBe(true);
    });

    it('produces "Add to undefined" when the node name is numeric', () => {
      // BUG: the fallback reads pointerArray[length - 2], which is out of range
      // for a one segment pointer, so fixTitle() is handed undefined.
      const result: any = buildLayoutFromSchema(
        makeJsf({ schema: refSchema }), widgetLibrary, null, '/properties/b', '/0'
      );

      expect(result.options.title).toEqual('Add to undefined');
    });

    it('throws on a schema whose $ref points at itself', () => {
      // BUG: layoutRefLibrary[dataRef] is set to null as a recursion guard, but
      // hasOwn() then reports the key as present, and line 816 dereferences null.
      const jsf: any = makeJsf({
        schema: { type: 'object', properties: { child: { $ref: '#/properties/child' } } },
      });

      expect(() => buildLayoutFromSchema(
        jsf, widgetLibrary, null, '/properties/child', '/child'
      )).toThrow();
    });
  });
});

describe('buildLayout', () => {

  describe('layout element shapes', () => {
    it('turns a plain string key into a data pointer', () => {
      expect(stripIds(buildLayout(
        makeJsf({ schema: objectSchema, layout: ['name'] }), widgetLibrary
      ))).toEqual([{
        arrayItem: false,
        dataPointer: '/name',
        dataType: 'string',
        name: 'name',
        options: { title: 'Name' },
        type: 'text',
        widget: 'widget:text',
      }]);
    });

    it('accepts a JSON pointer as the layout element', () => {
      const result: any = buildLayout(
        makeJsf({ schema: objectSchema, layout: ['/name'] }), widgetLibrary
      );

      expect(result[0].dataPointer).toEqual('/name');
      expect(result[0].type).toEqual('text');
    });

    it('accepts an object with a key property', () => {
      const result: any = buildLayout(
        makeJsf({ schema: objectSchema, layout: [{ key: 'age' }] }), widgetLibrary
      );

      expect(result[0].dataPointer).toEqual('/age');
      expect(result[0].type).toEqual('integer');
      expect(result[0].options.multipleOf).toEqual(1);
    });

    it('accepts an object that already carries a dataPointer', () => {
      const result: any = buildLayout(
        makeJsf({ schema: objectSchema, layout: [{ dataPointer: '/name' }] }), widgetLibrary
      );

      expect(result[0].dataPointer).toEqual('/name');
      expect(result[0].name).toEqual('name');
    });

    it('skips an element that is neither an object nor a string', () => {
      const result: any = buildLayout(
        makeJsf({ schema: objectSchema, layout: [42, 'name'] }), widgetLibrary
      );

      expect(result.length).toEqual(1);
      expect(result[0].dataPointer).toEqual('/name');
    });

    it('returns an empty layout for an empty input layout', () => {
      expect(buildLayout(makeJsf({ schema: objectSchema, layout: [] }), widgetLibrary))
        .toEqual([]);
    });
  });

  describe('option normalisation', () => {
    it('moves unrecognised keys into options', () => {
      const result: any = buildLayout(makeJsf({
        schema: objectSchema,
        layout: [{ key: 'name', placeholder: 'hi', notify: true }],
      }), widgetLibrary);

      expect(result[0].options.placeholder).toEqual('hi');
      expect(result[0].options.notify).toBe(true);
      expect(result[0].placeholder).toBeUndefined();
    });

    it('renames legend to title', () => {
      const result: any = buildLayout(makeJsf({
        schema: objectSchema,
        layout: [{ key: 'name', legend: 'Legend Title' }],
      }), widgetLibrary);

      expect(result[0].options.title).toEqual('Legend Title');
      expect(result[0].options.legend).toBeUndefined();
    });

    it('renames errorMessages to validationMessages', () => {
      const result: any = buildLayout(makeJsf({
        schema: objectSchema,
        layout: [{ key: 'name', errorMessages: { required: 'req' } }],
      }), widgetLibrary);

      expect(result[0].options.validationMessages).toEqual({ required: 'req' });
      expect(result[0].options.errorMessages).toBeUndefined();
    });

    it('copies a string validationMessage straight across', () => {
      const result: any = buildLayout(makeJsf({
        schema: objectSchema,
        layout: [{ key: 'name', validationMessage: 'oops' }],
      }), widgetLibrary);

      expect(result[0].options.validationMessages).toEqual('oops');
    });

    it('translates TV4 numeric validationMessage codes into keyword names', () => {
      const result: any = buildLayout(makeJsf({
        schema: objectSchema,
        layout: [{
          key: 'name',
          validationMessage: {
            0: 'c0', 1: 'c1', 100: 'c100', 101: 'c101', 102: 'c102', 103: 'c103',
            104: 'c104', 200: 'c200', 201: 'c201', 202: 'c202', 300: 'c300',
            301: 'c301', 302: 'c302', 304: 'c304', 400: 'c400', 401: 'c401',
            402: 'c402', 500: 'c500', 999: 'unknown',
          },
        }],
      }), widgetLibrary);

      expect(result[0].options.validationMessages).toEqual({
        type: 'c0', enum: 'c1', multipleOf: 'c100', minimum: 'c101',
        exclusiveMinimum: 'c102', maximum: 'c103', exclusiveMaximum: 'c104',
        minLength: 'c200', maxLength: 'c201', pattern: 'c202',
        minProperties: 'c300', maxProperties: 'c301', required: 'c302',
        dependencies: 'c304', minItems: 'c400', maxItems: 'c401',
        uniqueItems: 'c402', format: 'c500', 999: 'unknown',
      });
      expect(result[0].options.validationMessage).toBeUndefined();
    });

    it('keeps an existing validationMessages object over errorMessages', () => {
      const result: any = buildLayout(makeJsf({
        schema: objectSchema,
        layout: [{ key: 'name', validationMessages: { a: 'keep' }, errorMessages: { b: 'drop' } }],
      }), widgetLibrary);

      expect(result[0].options.validationMessages).toEqual({ a: 'keep' });
      expect(result[0].options.errorMessages).toEqual({ b: 'drop' });
    });

    it('compiles a string copyValueTo into an array of pointers', () => {
      const result: any = buildLayout(makeJsf({
        schema: objectSchema,
        layout: [{ key: 'name', copyValueTo: 'age' }],
      }), widgetLibrary);

      expect(result[0].options.copyValueTo).toEqual(['/age']);
    });

    it('compiles every entry of an array copyValueTo', () => {
      const result: any = buildLayout(makeJsf({
        schema: objectSchema,
        layout: [{ key: 'name', copyValueTo: ['age', 'name'] }],
      }), widgetLibrary);

      expect(result[0].options.copyValueTo).toEqual(['/age', '/name']);
    });
  });

  describe('widget and type resolution', () => {
    it('promotes a string widget to the node type', () => {
      const result: any = buildLayout(makeJsf({
        schema: objectSchema,
        layout: [{ key: 'name', widget: 'textarea' }],
      }), widgetLibrary);

      expect(result[0].type).toEqual('textarea');
      expect(result[0].widget).toEqual('widget:textarea');
    });

    it('replaces a type the widget library does not know', () => {
      const result: any = buildLayout(makeJsf({
        schema: objectSchema,
        layout: [{ key: 'name', type: 'no-such-widget' }],
      }), widgetLibrary);

      expect(result[0].type).toEqual('text');
      expect(result[0].widget).toEqual('widget:text');
    });

    it('keeps a known type from the layout', () => {
      const result: any = buildLayout(makeJsf({
        schema: objectSchema,
        layout: [{ key: 'name', type: 'password' }],
      }), widgetLibrary);

      expect(result[0].type).toEqual('password');
    });

    it('leaves the node without a type when the key is missing from the schema', () => {
      // BUG: when the schema lookup fails, `type` is never assigned, so the
      // node ends up with widget 'widget:undefined'.
      const result: any = buildLayout(makeJsf({
        schema: { type: 'object', properties: { a: { type: 'string' } }, additionalProperties: false },
        layout: ['zzz'],
      }), widgetLibrary);

      expect(result[0].type).toBeUndefined();
      expect(result[0].widget).toEqual('widget:undefined');
      expect(result[0].options.title).toEqual('Zzz');
    });
  });

  describe('the submit button', () => {
    it('appends a submit button when formOptions.addSubmit is truthy', () => {
      const jsf: any = makeJsf({
        schema: objectSchema,
        layout: ['name'],
        formOptions: { addSubmit: 'auto', defautWidgetOptions: {}, setSchemaDefaults: 'auto' },
      });
      const result: any = buildLayout(jsf, widgetLibrary);

      expect(result.map((item: any) => item.type)).toEqual(['text', 'submit']);
      expect(stripIds(result[1]))
        .toEqual({ options: { title: 'Submit' }, type: 'submit', widget: 'widget:submit' });
    });

    it('appends no submit button when formOptions.addSubmit is falsy', () => {
      const result: any = buildLayout(
        makeJsf({ schema: objectSchema, layout: ['name'] }), widgetLibrary
      );

      expect(result.map((item: any) => item.type)).toEqual(['text']);
    });

    it('does not duplicate a submit button already present in the layout', () => {
      const jsf: any = makeJsf({
        schema: objectSchema,
        layout: ['name', { type: 'submit' }],
        formOptions: { addSubmit: 'auto', defautWidgetOptions: {}, setSchemaDefaults: 'auto' },
      });

      expect(buildLayout(jsf, widgetLibrary).map((item: any) => item.type))
        .toEqual(['text', 'submit']);
    });
  });

  describe('the * wildcard', () => {
    it('replaces * with one node per schema property, inline', () => {
      const jsf: any = makeJsf({ schema: objectSchema, layout: ['*'] });
      const result: any = buildLayout(jsf, widgetLibrary);

      expect(result.map((item: any) => item.dataPointer)).toEqual(['/name', '/age']);
    });

    it('keeps the surrounding layout items around an expanded *', () => {
      const jsf: any = makeJsf({
        schema: objectSchema,
        layout: [{ type: 'help', helpvalue: 'x' }, '*'],
      });
      const result: any = buildLayout(jsf, widgetLibrary);

      expect(result.map((item: any) => item.type)).toEqual(['help', 'text', 'integer']);
    });
  });

  describe('container nodes', () => {
    it('builds a fieldset from a node with a type and items', () => {
      const jsf: any = makeJsf({
        schema: objectSchema,
        layout: [{ type: 'fieldset', items: ['name', 'age'] }],
      });
      const result: any = buildLayout(jsf, widgetLibrary);

      expect(result.length).toEqual(1);
      expect(result[0].type).toEqual('fieldset');
      expect(result[0].widget).toEqual('widget:fieldset');
      expect(result[0].arrayItem).toBe(false);
      expect(result[0].items.map((item: any) => item.dataPointer)).toEqual(['/name', '/age']);
    });

    it('defaults an untyped container inside tabs to a tab', () => {
      const jsf: any = makeJsf({
        schema: objectSchema,
        layout: [{ type: 'tabs', items: [{ items: ['name'] }] }],
      });
      const result: any = buildLayout(jsf, widgetLibrary);

      expect(result[0].items[0].type).toEqual('tab');
    });

    it('defaults an untyped container outside tabs to an array', () => {
      const jsf: any = makeJsf({
        schema: objectSchema,
        layout: [{ type: 'fieldset', items: [{ items: ['name'] }] }],
      });
      const result: any = buildLayout(jsf, widgetLibrary);

      expect(result[0].items[0].type).toEqual('array');
    });

    it('leaves the stale tabs key inside options when a layout uses tabs', () => {
      // BUG: mapLayout copies `tabs` to `items` on the source node only after
      // taking its shallow copy, so buildLayout sees both and files `tabs`
      // under options as an unrecognised key.
      const jsf: any = makeJsf({
        schema: objectSchema,
        layout: [{ type: 'tabs', tabs: [{ type: 'tab', items: ['name'] }] }],
      });
      const result: any = buildLayout(jsf, widgetLibrary);

      expect(result[0].type).toEqual('tabs');
      expect(result[0].options.tabs).toEqual([{ type: 'tab', items: ['name'] }]);
      expect(result[0].items.map((item: any) => item.type)).toEqual(['tab']);
      expect(result[0].items[0].items.map((item: any) => item.dataPointer)).toEqual(['/name']);
    });
  });

  describe('array nodes', () => {
    it('finds the array data pointer from its child nodes and groups them', () => {
      const jsf: any = makeJsf({
        schema: arrayOfObjectsSchema,
        arrayMap: new Map([['/people', 0]]),
        layout: [{ type: 'array', items: [{ key: 'people[].first' }, { key: 'people[].last' }] }],
      });
      const result: any = buildLayout(jsf, widgetLibrary);

      expect(result[0].dataPointer).toEqual('/people');
      expect(result[0].name).toEqual('people');
      expect(result[0].dataType).toEqual('array');
      expect(result[0].items.map((item: any) => item.type)).toEqual(['section', '$ref']);
      expect(result[0].items[0].dataPointer).toEqual('/people/-');
      expect(result[0].items[0].arrayItem).toBe(true);
      expect(result[0].items[0].arrayItemType).toEqual('list');
      expect(result[0].items[0].items.map((item: any) => item.dataPointer))
        .toEqual(['/people/-/first', '/people/-/last']);
      expect(Object.keys(jsf.layoutRefLibrary)).toEqual(['/people/-']);
    });

    it('names the Add button after the array title', () => {
      const jsf: any = makeJsf({
        schema: arrayOfObjectsSchema,
        arrayMap: new Map([['/people', 0]]),
        layout: [{ key: 'people', type: 'array', items: [{ key: 'people[].first' }] }],
      });
      const result: any = buildLayout(jsf, widgetLibrary);
      const addButton: any = result[0].items[result[0].items.length - 1];

      expect(addButton.type).toEqual('$ref');
      expect(addButton.$ref).toEqual('/people/-');
      expect(addButton.options.title).toEqual('Add People');
      expect(addButton.options.removable).toBe(false);
      expect(addButton.recursiveReference).toBe(false);
    });

    it('marks a single array item as removable and typed list', () => {
      const jsf: any = makeJsf({
        schema: { type: 'object', properties: { tags: { type: 'array', items: { type: 'string' } } } },
        arrayMap: new Map([['/tags', 0]]),
        layout: [{ key: 'tags', type: 'array', items: [{ key: 'tags[]' }] }],
      });
      const result: any = buildLayout(jsf, widgetLibrary);

      expect(result[0].items[0].arrayItem).toBe(true);
      expect(result[0].items[0].arrayItemType).toEqual('list');
      expect(result[0].items[0].options.removable).toBe(true);
      expect(result[0].items[0].dataPointer).toEqual('/tags/-');
    });

    it('never applies style.add to the Add button', () => {
      // BUG: `style` is not on the preserved key list, so it is moved into
      // options before the style.add lookup runs, making that branch dead code.
      const jsf: any = makeJsf({
        schema: arrayOfObjectsSchema,
        arrayMap: new Map([['/people', 0]]),
        layout: [{
          key: 'people', type: 'array', style: { add: 'btn-add' },
          items: [{ key: 'people[].first' }],
        }],
      });
      const result: any = buildLayout(jsf, widgetLibrary);
      const addButton: any = result[0].items[result[0].items.length - 1];

      expect(result[0].style).toBeUndefined();
      expect(result[0].options.style).toEqual({ add: 'btn-add' });
      expect(addButton.options.fieldStyle).toBeUndefined();
    });
  });

  describe('root reference', () => {
    it('stores the whole layout under the empty key of layoutRefLibrary', () => {
      const jsf: any = makeJsf({
        schema: objectSchema,
        layout: ['name'],
        hasRootReference: true,
        formOptions: {
          addSubmit: 'auto',
          defautWidgetOptions: { htmlClass: 'row' },
          setSchemaDefaults: 'auto',
        },
      });
      const result: any = buildLayout(jsf, widgetLibrary);
      const rootRef: any = jsf.layoutRefLibrary[''];

      expect(result.map((item: any) => item.type)).toEqual(['text', 'submit']);
      expect(rootRef._id).toBeNull();
      expect(rootRef.type).toEqual('section');
      expect(rootRef.widget).toEqual('widget:section');
      expect(rootRef.dataPointer).toEqual('');
      expect(rootRef.dataType).toEqual('object');
      expect(rootRef.name).toEqual('');
      expect(rootRef.recursiveReference).toBe(true);
      expect(rootRef.required).toBe(false);
      expect(rootRef.options).toEqual({ htmlClass: 'row' });
      // The submit button is popped off the stored copy.
      expect(rootRef.items.map((item: any) => item.type)).toEqual(['text']);
    });

    it('throws for a root reference over an empty layout', () => {
      // BUG: fullLayout[fullLayout.length - 1] is undefined for an empty
      // layout, and `.type` is read from it without a guard.
      const jsf: any = makeJsf({ schema: objectSchema, layout: [], hasRootReference: true });

      expect(() => buildLayout(jsf, widgetLibrary)).toThrow();
    });
  });

  describe('data map side effects', () => {
    it('records the input type, widget and disabled flag per data pointer', () => {
      const jsf: any = makeJsf({
        schema: objectSchema,
        layout: [{ key: 'name', disabled: true }],
      });
      buildLayout(jsf, widgetLibrary);
      const nodeDataMap: any = jsf.dataMap.get('/name');

      expect(nodeDataMap.get('inputType')).toEqual('text');
      expect(nodeDataMap.get('widget')).toEqual('widget:text');
      expect(nodeDataMap.get('disabled')).toBe(true);
      expect(nodeDataMap.get('schemaPointer')).toEqual('/properties/name');
    });

    it('reuses a schemaPointer that is already in the data map', () => {
      const jsf: any = makeJsf({ schema: objectSchema, layout: ['name'] });
      jsf.dataMap.set('/name', new Map([['schemaPointer', '/properties/age']]));
      const result: any = buildLayout(jsf, widgetLibrary);

      expect(result[0].type).toEqual('integer');
      expect(jsf.dataMap.get('/name').get('schemaPointer')).toEqual('/properties/age');
    });

    it('sets jsf.fieldsRequired for a required layout key', () => {
      const jsf: any = makeJsf({
        schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
        layout: ['name'],
      });
      const result: any = buildLayout(jsf, widgetLibrary);

      expect(result[0].options.required).toBe(true);
      expect(jsf.fieldsRequired).toBe(true);
      expect(jsf.dataMap.get('/name').get('required')).toBeUndefined();
    });
  });
});

describe('buildTitleMap, recurring group names', () => {
  // buildTitleMap mutates the objects it is given: the flattening branch does
  // `delete title.group`. A fresh fixture per test, or a shared one leaks.
  const grouped = () => [
    { group: 'A', name: 'a1', value: 1 },
    { group: 'B', name: 'b1', value: 2 },
    { group: 'A', name: 'a2', value: 3 },
  ];

  it('combines a group name that recurs non-adjacently', () => {
    const result: any = buildTitleMap(grouped(), null, true, false);
    expect(result.map((g: any) => g.group)).toEqual(['A', 'B']);
    expect(result[0].items.map((i: any) => i.value)).toEqual([1, 3]);
    expect(result[1].items.map((i: any) => i.value)).toEqual([2]);
  });

  it('still combines adjacent repeats', () => {
    const result: any = buildTitleMap([
      { group: 'A', name: 'a1', value: 1 },
      { group: 'A', name: 'a2', value: 2 },
    ], null, true, false);
    expect(result.length).toBe(1);
    expect(result[0].items.map((i: any) => i.value)).toEqual([1, 2]);
  });

  it('leaves ungrouped entries alongside groups', () => {
    const result: any = buildTitleMap([
      { group: 'A', name: 'a1', value: 1 },
      { name: 'plain', value: 2 },
      { group: 'A', name: 'a2', value: 3 },
    ], null, true, false);
    expect(result.length).toBe(2);
    expect(result[0].items.map((i: any) => i.value)).toEqual([1, 3]);
    expect(result[1]).toEqual({ name: 'plain', value: 2 });
  });

  it('is unchanged when flattening', () => {
    const result: any = buildTitleMap(grouped(), null, true, true);
    expect(result.map((i: any) => i.name)).toEqual(['A: a1', 'B: b1', 'A: a2']);
  });
});

describe('buildLayout, array layout node with no items', () => {
  // The branch below reads items[0] on every line, so an empty list threw and
  // took the entire form with it rather than losing one field.
  it('does not throw when an array layout node ends up with no items', () => {
    const jsf = makeJsf({
      schema: {
        type: 'object',
        properties: { things: { type: 'array', items: { type: 'string' } } },
      },
      layout: [{ key: 'things', type: 'array', items: [] }],
    });

    expect(() => buildLayout(jsf, widgetLibrary)).not.toThrow();
  });

  it('still builds an array layout node that has items', () => {
    const jsf = makeJsf({
      schema: {
        type: 'object',
        properties: { things: { type: 'array', items: { type: 'string' } } },
      },
      layout: [{ key: 'things', type: 'array', items: ['things/-'] }],
    });

    const result: any = buildLayout(jsf, widgetLibrary);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('buildLayout, array named by key with no items in the layout', () => {
  const arraySchema = {
    type: 'object',
    properties: {
      things: { type: 'array', items: { type: 'string', title: 'Thing' } },
    },
  };

  // The array block was gated on the LAYOUT node carrying 'items', so a layout
  // entry of { key: 'things' } produced no item nodes and no Add button at all.
  it('builds item nodes from the schema', () => {
    const result: any = buildLayout(
      makeJsf({ schema: arraySchema, layout: [{ key: 'things', type: 'array' }] }),
      widgetLibrary
    );

    expect(result.length).toBe(1);
    expect(Array.isArray(result[0].items)).toBe(true);
    expect(result[0].items.length).toBeGreaterThan(0);
  });

  it('adds the Add button', () => {
    const result: any = buildLayout(
      makeJsf({ schema: arraySchema, layout: [{ key: 'things', type: 'array' }] }),
      widgetLibrary
    );

    const types = result[0].items.map((item: any) => item.type);
    expect(types).toContain('$ref');
  });

  it('leaves a layout that supplies its own items alone', () => {
    const result: any = buildLayout(
      makeJsf({
        schema: arraySchema,
        layout: [{ key: 'things', type: 'array', items: ['things/-'] }],
      }),
      widgetLibrary
    );

    expect(result[0].items.length).toBeGreaterThan(0);
  });
});

describe('buildLayout, tuple slots versus list items', () => {
  // The framework components read arrayItemType === 'list' to decide whether to
  // render the remove control, so a fixed tuple position used to get one.
  const tupleSchema = {
    type: 'object',
    properties: {
      pair: {
        type: 'array',
        items: [{ type: 'string', title: 'First' }, { type: 'string', title: 'Second' }],
        additionalItems: { type: 'string', title: 'Extra' },
      },
    },
  };

  const build = () => buildLayout(
    makeJsf({
      schema: tupleSchema,
      layout: [{ key: 'pair', type: 'array', items: ['/pair/0', '/pair/1'] }],
    }),
    widgetLibrary
  );

  it('types a fixed slot as a tuple item, not a list item', () => {
    const items: any[] = (build() as any)[0].items;
    const slots = items.filter(item => item.arrayItem && item.type !== '$ref');
    expect(slots.length).toBeGreaterThan(0);
    slots.forEach(slot => expect(slot.arrayItemType).toBe('tuple'));
  });

  it('does not mark a fixed slot removable', () => {
    const items: any[] = (build() as any)[0].items;
    const slots = items.filter(item => item.arrayItem && item.type !== '$ref');
    slots.forEach(slot => expect(slot.removable).toBe(false));
  });

  it('types a slot past the tuple as a removable list item', () => {
    const result: any = buildLayout(
      makeJsf({
        schema: tupleSchema,
        // A third slot on a two item tuple sits in the additionalItems range.
        layout: [{ key: 'pair', type: 'array', items: ['/pair/0', '/pair/1', '/pair/2'] }],
      }),
      widgetLibrary
    );
    const slots: any[] = result[0].items
      .filter((item: any) => item.arrayItem && item.type !== '$ref');
    const past = slots.filter((slot: any) => slot.arrayItemType === 'list');
    expect(past.length).toBe(1);
    expect(past[0].removable).toBe(true);
  });

  it('leaves a slot alone when the array is not removable', () => {
    const result: any = buildLayout(
      makeJsf({
        schema: tupleSchema,
        layout: [{
          key: 'pair', type: 'array', removable: false,
          items: ['/pair/0', '/pair/1', '/pair/2'],
        }],
      }),
      widgetLibrary
    );
    const slots: any[] = result[0].items
      .filter((item: any) => item.arrayItem && item.type !== '$ref');
    slots.forEach((slot: any) => expect(slot.removable).toBe(false));
  });
});
