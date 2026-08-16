import {
  buildSchemaFromData,
  buildSchemaFromLayout,
  checkInlineType,
  combineAllOf,
  fixRequiredArrayProperties,
  getControlValidators,
  getFromSchema,
  getInputType,
  getSubSchema,
  getTitleMapFromOneOf,
  isInputRequired,
  removeRecursiveReferences,
  resolveSchemaReferences,
  updateInputOptions,
} from './json-schema.functions';

/**
 * Characterization tests for the JSON Schema function library.
 * These pin the behaviour the functions have today, including several results
 * that are almost certainly bugs (see the comments marked BUG).
 */
describe('JSON Schema functions', () => {

  describe('buildSchemaFromLayout', () => {
    it('returns undefined for a layout array (the function body is commented out)', () => {
      expect(buildSchemaFromLayout([{ key: 'name' }, 'address'])).toBeUndefined();
    });

    it('returns undefined for null and undefined layouts', () => {
      expect(buildSchemaFromLayout(null)).toBeUndefined();
      expect(buildSchemaFromLayout(undefined)).toBeUndefined();
    });
  });

  describe('buildSchemaFromData', () => {
    const draft6 = 'http://json-schema.org/draft-06/schema#';

    it('builds a string schema from a string, adding $schema at the root', () => {
      expect(buildSchemaFromData('hello')).toEqual({ $schema: draft6, type: 'string' });
    });

    it('builds a number schema from a float', () => {
      expect(buildSchemaFromData(4.5)).toEqual({ $schema: draft6, type: 'number' });
    });

    it('reports an integer as type number', () => {
      expect(buildSchemaFromData(7)).toEqual({ $schema: draft6, type: 'number' });
    });

    it('reports a numeric string as type string (getType is called in strict mode)', () => {
      expect(buildSchemaFromData('10')).toEqual({ $schema: draft6, type: 'string' });
    });

    it('builds a boolean schema from a boolean', () => {
      expect(buildSchemaFromData(true)).toEqual({ $schema: draft6, type: 'boolean' });
      expect(buildSchemaFromData(false)).toEqual({ $schema: draft6, type: 'boolean' });
    });

    it('reports null as type string', () => {
      expect(buildSchemaFromData(null)).toEqual({ $schema: draft6, type: 'string' });
    });

    it('reports undefined as type string', () => {
      expect(buildSchemaFromData(undefined)).toEqual({ $schema: draft6, type: 'string' });
    });

    it('omits $schema when isRoot is false', () => {
      expect(buildSchemaFromData('hello', false, false)).toEqual({ type: 'string' });
    });

    it('builds an object schema with empty properties from an empty object', () => {
      expect(buildSchemaFromData({})).toEqual({ $schema: draft6, type: 'object', properties: {} });
    });

    it('recurses into nested objects without repeating $schema', () => {
      expect(buildSchemaFromData({ a: 'x', b: { c: 1 } })).toEqual({
        $schema: draft6,
        type: 'object',
        properties: {
          a: { type: 'string' },
          b: { type: 'object', properties: { c: { type: 'number' } } },
        },
      });
    });

    it('adds a required list holding every key when requireAllFields is true', () => {
      expect(buildSchemaFromData({ a: 'x', b: 2 }, true)).toEqual({
        $schema: draft6,
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'number' } },
        required: ['a', 'b'],
      });
    });

    it('collapses items to a single schema when every array entry has the same type', () => {
      expect(buildSchemaFromData(['a', 'b'])).toEqual({
        $schema: draft6, type: 'array', items: { type: 'string' },
      });
    });

    it('collapses integers and floats together because both map to number', () => {
      expect(buildSchemaFromData([1, 2.5])).toEqual({
        $schema: draft6, type: 'array', items: { type: 'number' },
      });
    });

    it('collapses null together with strings because null maps to string', () => {
      expect(buildSchemaFromData([null, 'a'])).toEqual({
        $schema: draft6, type: 'array', items: { type: 'string' },
      });
    });

    it('keeps an items tuple when the array entries have different types', () => {
      expect(buildSchemaFromData(['a', 1])).toEqual({
        $schema: draft6, type: 'array', items: [{ type: 'string' }, { type: 'number' }],
      });
    });

    it('leaves items as an empty array for an empty array', () => {
      expect(buildSchemaFromData([])).toEqual({ $schema: draft6, type: 'array', items: [] });
    });

    it('adds minItems 1 to an array when requireAllFields is true', () => {
      expect(buildSchemaFromData(['a'], true)).toEqual({
        $schema: draft6, type: 'array', items: { type: 'string' }, minItems: 1,
      });
    });

    it('passes requireAllFields down into nested values', () => {
      expect(buildSchemaFromData({ list: [1, 2] }, true)).toEqual({
        $schema: draft6,
        type: 'object',
        properties: { list: { type: 'array', items: { type: 'number' }, minItems: 1 } },
        required: ['list'],
      });
    });

    it('loses the properties of earlier entries when merging same typed object items', () => {
      // BUG: the item schemas are combined with a shallow spread reduce, so the
      // properties object of the last entry replaces all the earlier ones.
      expect(buildSchemaFromData([{ a: 1 }, { b: 2 }])).toEqual({
        $schema: draft6,
        type: 'array',
        items: { type: 'object', properties: { b: { type: 'number' } } },
      });
    });

    it('treats a Date as an object with no properties', () => {
      expect(buildSchemaFromData(new Date(0))).toEqual({
        $schema: draft6, type: 'object', properties: {},
      });
    });
  });

  describe('getFromSchema', () => {
    const objectSchema: any = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        address: { type: 'object', properties: { city: { type: 'string' } } },
      },
    };

    it('returns the whole schema for an empty pointer', () => {
      expect(getFromSchema(objectSchema, '')).toBe(objectSchema);
    });

    it('walks object properties by data pointer', () => {
      expect(getFromSchema(objectSchema, '/name')).toEqual({ type: 'string' });
    });

    it('walks nested object properties', () => {
      expect(getFromSchema(objectSchema, '/address/city')).toEqual({ type: 'string' });
    });

    it('accepts a pointer written as an array of keys', () => {
      expect(getFromSchema(objectSchema, ['address', 'city'])).toEqual({ type: 'string' });
    });

    it('accepts a pointer with a leading hash', () => {
      expect(getFromSchema(objectSchema, '#/name')).toEqual({ type: 'string' });
    });

    it('returns the schema pointer as an array of keys for returnType schemaPointer', () => {
      expect(getFromSchema(objectSchema, '/name', 'schemaPointer'))
        .toEqual(['properties', 'name']);
    });

    it('returns a nested schema pointer as an array of keys', () => {
      expect(getFromSchema(objectSchema, '/address/city', 'schemaPointer'))
        .toEqual(['properties', 'address', 'properties', 'city']);
    });

    it('returns an empty schema pointer array for an empty data pointer', () => {
      expect(getFromSchema(objectSchema, '', 'schemaPointer')).toEqual([]);
    });

    it('returns an empty object instead of the parent schema for returnType parentSchema', () => {
      // BUG: `length` is read before `dataPointerArray.length--`, so the loop runs
      // one iteration past the shortened pointer with key === undefined, which falls
      // through to the additionalProperties fallback and returns an empty object.
      expect(getFromSchema(objectSchema, '/address/city', 'parentSchema')).toEqual({});
      expect(getFromSchema(objectSchema, '/name', 'parentSchema')).toEqual({});
    });

    it('appends additionalProperties to the pointer for returnType parentSchemaPointer', () => {
      // BUG: same off by one as parentSchema above.
      expect(getFromSchema(objectSchema, '/address/city', 'parentSchemaPointer'))
        .toEqual(['properties', 'address', 'additionalProperties']);
      expect(getFromSchema(objectSchema, '/name', 'parentSchemaPointer'))
        .toEqual(['additionalProperties']);
    });

    it('throws a RangeError for an empty pointer with a parent returnType', () => {
      // BUG: `dataPointerArray.length--` on an empty array sets the length to -1.
      expect(() => getFromSchema(objectSchema, '', 'parentSchema')).toThrow();
    });

    it('returns an empty object rather than the items schema for an array index', () => {
      // BUG: the `else if (subSchema.additionalItems !== false)` fallback is not
      // guarded by `!subSchemaFound`, so the items schema that was just found is
      // immediately overwritten with an empty object.
      expect(getFromSchema({ type: 'array', items: { type: 'string' } }, '/0')).toEqual({});
    });

    it('appends additionalItems to the schema pointer of an array item', () => {
      expect(getFromSchema({ type: 'array', items: { type: 'string' } }, '/0', 'schemaPointer'))
        .toEqual(['items', 'additionalItems']);
    });

    it('treats the "-" key as an array index', () => {
      expect(getFromSchema({ type: 'array', items: { type: 'string' } }, '/-')).toEqual({});
    });

    it('never reaches the tuple branch because isObject is true for arrays', () => {
      // BUG: `isObject(subSchema.items)` matches an items array as well, so the
      // `isArray(subSchema.items)` tuple branch below it is dead code and a tuple
      // index resolves to the same empty additionalItems object.
      const tupleSchema: any = { type: 'array', items: [{ type: 'string' }, { type: 'number' }] };

      expect(getFromSchema(tupleSchema, '/1')).toEqual({});
      expect(getFromSchema(tupleSchema, '/1', 'schemaPointer')).toEqual(['items', 'additionalItems']);
    });

    it('returns an empty object for an out of range tuple index', () => {
      expect(getFromSchema({ type: 'array', items: [{ type: 'string' }] }, '/5')).toEqual({});
    });

    it('returns an empty object for an array with no items at all', () => {
      expect(getFromSchema({ type: 'array' }, '/0')).toEqual({});
    });

    it('uses the additionalItems schema when there is no items keyword', () => {
      expect(getFromSchema({ type: 'array', additionalItems: { type: 'number' } }, '/0'))
        .toEqual({ type: 'number' });
      expect(getFromSchema(
        { type: 'array', additionalItems: { type: 'number' } }, '/0', 'schemaPointer'
      )).toEqual(['additionalItems']);
    });

    it('uses the additionalItems schema when items is not an object', () => {
      expect(getFromSchema(
        { type: 'array', items: 'nope', additionalItems: { type: 'number' } }, '/0'
      )).toEqual({ type: 'number' });
    });

    it('returns undefined when an array key is neither numeric nor "-"', () => {
      expect(getFromSchema({ type: 'array', items: { type: 'string' } }, '/abc')).toBeUndefined();
    });

    it('falls back to additionalProperties when the key is not a declared property', () => {
      expect(getFromSchema({ type: 'object', additionalProperties: { type: 'number' } }, '/any'))
        .toEqual({ type: 'number' });
      expect(getFromSchema(
        { type: 'object', additionalProperties: { type: 'number' } }, '/any', 'schemaPointer'
      )).toEqual(['additionalProperties']);
    });

    it('returns an empty object when the key is missing and additionalProperties is absent', () => {
      expect(getFromSchema({ type: 'object', properties: { a: { type: 'string' } } }, '/b'))
        .toEqual({});
    });

    it('returns undefined when the key is missing and additionalProperties is false', () => {
      expect(getFromSchema(
        { type: 'object', properties: { a: { type: 'string' } }, additionalProperties: false }, '/b'
      )).toBeUndefined();
    });

    it('returns undefined when the schema has no type keyword', () => {
      expect(getFromSchema({ properties: { a: { type: 'string' } } }, '/a')).toBeUndefined();
    });

    it('returns undefined when the pointer walks past a leaf schema', () => {
      expect(getFromSchema(objectSchema, '/name/deeper')).toBeUndefined();
    });

    it('returns null for an invalid JSON Pointer', () => {
      expect(getFromSchema(objectSchema, 'not-a-pointer')).toBeNull();
    });

    it('returns null when the schema is not an object', () => {
      expect(getFromSchema('nope', '/a')).toBeNull();
    });

    it('returns null for a null schema with an empty pointer', () => {
      expect(getFromSchema(null, '')).toBeNull();
    });

    it('throws for a null schema with a non empty pointer', () => {
      // BUG: `typeof null === 'object'`, so the guard above does not catch null
      // and reading `subSchema.type` throws.
      expect(() => getFromSchema(null, '/a')).toThrow();
    });
  });

  describe('removeRecursiveReferences', () => {
    it('returns an empty string for a falsy pointer', () => {
      expect(removeRecursiveReferences('', new Map())).toEqual('');
      expect(removeRecursiveReferences(null, new Map())).toEqual('');
      expect(removeRecursiveReferences(undefined, new Map())).toEqual('');
    });

    it('returns an empty string for an empty pointer array', () => {
      expect(removeRecursiveReferences([], new Map())).toEqual('');
    });

    it('returns the pointer unchanged when the reference map is empty', () => {
      expect(removeRecursiveReferences('/a/b', new Map())).toEqual('/a/b');
    });

    it('compiles an array pointer into a string pointer', () => {
      expect(removeRecursiveReferences(['a', 'b'], new Map())).toEqual('/a/b');
      expect(removeRecursiveReferences(['a'], new Map())).toEqual('/a');
    });

    it('strips a leading hash', () => {
      expect(removeRecursiveReferences('#/a/b', new Map())).toEqual('/a/b');
    });

    it('ignores map entries that are not recursive', () => {
      expect(removeRecursiveReferences('/a/b/c', new Map([['/x', '/y']]))).toEqual('/a/b/c');
    });

    it('shortens a pointer back to its shallowest recursive equivalent', () => {
      expect(removeRecursiveReferences(
        '/stuff/and/more/and/more/and/more/stuff',
        new Map([['/stuff/and/more/and/more', '/stuff/and/more']])
      )).toEqual('/stuff/and/more/stuff');
    });

    it('leaves the pointer alone when the map target carries a trailing slash', () => {
      // BUG: this is the example from the function docstring, which promises
      // '/stuff/and/more/stuff'. The trailing slash on the map target stops
      // isSubPointer from recognising the recursion, so nothing is shortened.
      expect(removeRecursiveReferences(
        '/stuff/and/more/and/more/and/more/and/more/stuff',
        new Map([['/stuff/and/more/and/more', '/stuff/and/more/']])
      )).toEqual('/stuff/and/more/and/more/and/more/and/more/stuff');
    });

    it('replaces a list array index with "-" using the array map', () => {
      expect(removeRecursiveReferences('/list/2/name', new Map(), new Map([['/list', 0]])))
        .toEqual('/list/-/name');
    });

    it('keeps a tuple index that is inside the declared tuple length', () => {
      expect(removeRecursiveReferences('/list/2/name', new Map(), new Map([['/list', 5]])))
        .toEqual('/list/2/name');
    });

    it('throws for a truthy string that is not a JSON Pointer', () => {
      // BUG: JsonPointer.compile returns null for 'abc', toGenericPointer then
      // returns undefined, and reading .indexOf on it throws.
      expect(() => removeRecursiveReferences('abc', new Map())).toThrow();
    });
  });

  describe('getInputType', () => {
    it('maps a plain string to text', () => {
      expect(getInputType({ type: 'string' })).toEqual('text');
    });

    it('maps known string formats to their widgets', () => {
      expect(getInputType({ type: 'string', format: 'color' })).toEqual('color');
      expect(getInputType({ type: 'string', format: 'date' })).toEqual('date');
      expect(getInputType({ type: 'string', format: 'date-time' })).toEqual('datetime-local');
      expect(getInputType({ type: 'string', format: 'email' })).toEqual('email');
      expect(getInputType({ type: 'string', format: 'uri' })).toEqual('url');
    });

    it('falls back to text for an unrecognised string format', () => {
      expect(getInputType({ type: 'string', format: 'password' })).toEqual('text');
    });

    it('maps a string with an enum to select', () => {
      expect(getInputType({ type: 'string', enum: ['a', 'b'] })).toEqual('select');
    });

    it('maps a boolean to checkbox', () => {
      expect(getInputType({ type: 'boolean' })).toEqual('checkbox');
    });

    it('still maps a boolean with an enum to checkbox', () => {
      // The boolean check runs before the enum check, unlike for numbers.
      expect(getInputType({ type: 'boolean', enum: [true, false] })).toEqual('checkbox');
    });

    it('maps integer and number to their own names', () => {
      expect(getInputType({ type: 'integer' })).toEqual('integer');
      expect(getInputType({ type: 'number' })).toEqual('number');
    });

    it('maps an integer with both bounds to range', () => {
      expect(getInputType({ type: 'integer', minimum: 0, maximum: 10 })).toEqual('range');
    });

    it('keeps integer when only one bound is present', () => {
      expect(getInputType({ type: 'integer', maximum: 10 })).toEqual('integer');
    });

    it('keeps number for a bounded number without multipleOf', () => {
      expect(getInputType({ type: 'number', minimum: 0, maximum: 5 })).toEqual('number');
    });

    it('maps a bounded number with multipleOf to range', () => {
      expect(getInputType({ type: 'number', multipleOf: 2, minimum: 0, maximum: 5 }))
        .toEqual('range');
    });

    it('maps a numeric schema with an enum to select', () => {
      expect(getInputType({ type: 'integer', enum: [1, 2] })).toEqual('select');
      expect(getInputType({ type: 'number', enum: [1, 2] })).toEqual('select');
    });

    it('maps type null to none', () => {
      expect(getInputType({ type: 'null' })).toEqual('none');
    });

    it('maps an object with properties or additionalProperties to section', () => {
      expect(getInputType({ type: 'object', properties: { a: {} } })).toEqual('section');
      expect(getInputType({ type: 'object', additionalProperties: true })).toEqual('section');
    });

    it('maps a typed object holding only a $ref to $ref', () => {
      expect(getInputType({ type: 'object', $ref: '#/definitions/a' })).toEqual('$ref');
    });

    it('prefers section over $ref when the object also has properties', () => {
      expect(getInputType({ type: 'object', properties: {}, $ref: '#/a' })).toEqual('section');
    });

    it('maps a bare object to none', () => {
      expect(getInputType({ type: 'object' })).toEqual('none');
    });

    it('maps an array to array', () => {
      expect(getInputType({ type: 'array', items: { type: 'string' } })).toEqual('array');
      expect(getInputType({ type: 'array' })).toEqual('array');
    });

    it('maps an array of enum items to checkboxes', () => {
      expect(getInputType({ type: 'array', items: { enum: ['a', 'b'] } })).toEqual('checkboxes');
    });

    it('reads the enum from additionalItems when items is absent', () => {
      expect(getInputType({ type: 'array', additionalItems: { enum: ['a'] } })).toEqual('checkboxes');
    });

    it('keeps array when maxItems is exactly 1', () => {
      expect(getInputType({ type: 'array', items: { enum: ['a'] }, maxItems: 1 })).toEqual('array');
    });

    it('converts checkboxes to checkboxes-inline when the schema is inline', () => {
      expect(getInputType({ type: 'array', items: { enum: ['a'] }, inline: true }))
        .toEqual('checkboxes-inline');
    });

    it('picks the most inclusive type from a type array', () => {
      expect(getInputType({ type: ['object', 'null'], properties: { a: {} } })).toEqual('section');
      expect(getInputType({ type: ['array', 'null'], items: { type: 'string' } })).toEqual('array');
      expect(getInputType({ type: ['array', 'null'], additionalItems: { type: 'string' } }))
        .toEqual('array');
      expect(getInputType({ type: ['string', 'number'] })).toEqual('text');
      expect(getInputType({ type: ['number', 'boolean'] })).toEqual('number');
      expect(getInputType({ type: ['integer', 'boolean'] })).toEqual('integer');
      expect(getInputType({ type: ['boolean'] })).toEqual('checkbox');
    });

    it('maps an unresolvable type array to none', () => {
      expect(getInputType({ type: ['foo'] })).toEqual('none');
      expect(getInputType({ type: ['object'] })).toEqual('none');
      expect(getInputType({ type: ['array'] })).toEqual('none');
    });

    it('reads the control type from the x-schema-form extensions', () => {
      expect(getInputType({ 'x-schema-form': { type: 'textarea' }, type: 'string' }))
        .toEqual('textarea');
      expect(getInputType({ 'x-schema-form': { widget: { component: 'radios' } }, type: 'string' }))
        .toEqual('radios');
      expect(getInputType({ 'x-schema-form': { widget: 'checkboxes' }, type: 'string' }))
        .toEqual('checkboxes');
    });

    it('reads the control type from the widget keyword', () => {
      expect(getInputType({ widget: { component: 'radios' }, type: 'string' })).toEqual('radios');
      expect(getInputType({ widget: 'date', type: 'string' })).toEqual('date');
    });

    it('inlines a widget control type when the schema is inline', () => {
      expect(getInputType({ widget: 'radios', inline: true, type: 'string' }))
        .toEqual('radios-inline');
    });

    it('inlines a widget control type from the layout node options', () => {
      expect(getInputType({ widget: 'radios', type: 'string' }, { options: { inline: true } }))
        .toEqual('radios-inline');
    });

    it('ignores a widget that is not a string', () => {
      expect(getInputType({ widget: { foo: 1 }, type: 'string' })).toEqual('text');
      expect(getInputType({ widget: '', type: 'string' })).toEqual('text');
    });

    it('maps an untyped schema with a $ref to $ref', () => {
      expect(getInputType({ $ref: '#/definitions/a' })).toEqual('$ref');
    });

    it('maps an untyped schema with oneOf or anyOf to one-of', () => {
      expect(getInputType({ oneOf: [{ type: 'string' }] })).toEqual('one-of');
      expect(getInputType({ anyOf: [{ type: 'string' }] })).toEqual('one-of');
    });

    it('maps an empty schema to none', () => {
      expect(getInputType({})).toEqual('none');
    });

    it('still returns none for an undeterminable type when a layout node is supplied', () => {
      expect(getInputType({ type: 'object' }, { name: 'x' })).toEqual('none');
    });

    it('maps a schema with a layout node titleMap to select', () => {
      expect(getInputType({ type: 'string' }, { options: { titleMap: [{ name: 'a', value: 1 }] } }))
        .toEqual('select');
    });

    it('maps a schema with a usable oneOf titleMap to select', () => {
      expect(getInputType({ type: 'string', oneOf: [{ title: 'A', enum: ['a'] }] }))
        .toEqual('select');
      expect(getInputType({ type: 'string', oneOf: [{ title: 'A', const: 'a' }] }))
        .toEqual('select');
    });

    it('throws for a null or undefined schema', () => {
      // BUG: schema.type is read without any guard once getFirst returns nothing.
      expect(() => getInputType(null)).toThrow();
      expect(() => getInputType(undefined)).toThrow();
    });
  });

  describe('checkInlineType', () => {
    it('returns the control type unchanged when it is not a radio or checkbox', () => {
      expect(checkInlineType('text', { inline: true })).toEqual('text');
      expect(checkInlineType('select', { inline: true })).toEqual('select');
    });

    it('returns a non string control type unchanged', () => {
      expect(checkInlineType(null, { inline: true })).toBeNull();
      expect(checkInlineType(5, {})).toEqual(5);
    });

    it('leaves radios and checkboxes alone when nothing is inline', () => {
      expect(checkInlineType('radios', {})).toEqual('radios');
      expect(checkInlineType('checkboxes', {})).toEqual('checkboxes');
      expect(checkInlineType('radios', null)).toEqual('radios');
      expect(checkInlineType('radios', undefined)).toEqual('radios');
    });

    it('converts radios to radios-inline and checkboxes to checkboxes-inline', () => {
      expect(checkInlineType('radios', { inline: true })).toEqual('radios-inline');
      expect(checkInlineType('checkboxes', { inline: true })).toEqual('checkboxes-inline');
    });

    it('matches any control type starting with "checkbox"', () => {
      expect(checkInlineType('checkbox', { inline: true })).toEqual('checkboxes-inline');
    });

    it('reads inline from the layout node first', () => {
      expect(checkInlineType('radios', {}, { inline: true })).toEqual('radios-inline');
      expect(checkInlineType('radios', {}, { options: { inline: true } })).toEqual('radios-inline');
    });

    it('reads inline from each of the supported schema locations', () => {
      expect(checkInlineType('radios', { 'x-schema-form': { inline: true } }))
        .toEqual('radios-inline');
      expect(checkInlineType('radios', { 'x-schema-form': { options: { inline: true } } }))
        .toEqual('radios-inline');
      expect(checkInlineType('radios', { 'x-schema-form': { widget: { inline: true } } }))
        .toEqual('radios-inline');
      expect(checkInlineType('radios', { widget: { component: { inline: true } } }))
        .toEqual('radios-inline');
      expect(checkInlineType('radios', { widget: { component: { options: { inline: true } } } }))
        .toEqual('radios-inline');
    });

    it('requires inline to be exactly true, not merely truthy', () => {
      expect(checkInlineType('radios', { inline: 'yes' })).toEqual('radios');
    });
  });

  describe('isInputRequired', () => {
    const buildSchema = (): any => ({
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        address: {
          type: 'object',
          required: ['city'],
          properties: { city: { type: 'string' }, zip: { type: 'string' } },
        },
        tags: { type: 'array', minItems: 2, items: { type: 'string' } },
      },
    });

    it('returns true for a key listed in the parent required array', () => {
      expect(isInputRequired(buildSchema(), '/properties/name')).toBe(true);
    });

    it('returns true for a nested key listed in its own parent required array', () => {
      expect(isInputRequired(buildSchema(), '/properties/address/properties/city')).toBe(true);
    });

    it('returns false for a key that is not listed as required', () => {
      expect(isInputRequired(buildSchema(), '/properties/address/properties/zip')).toBe(false);
      expect(isInputRequired(buildSchema(), '/properties/address')).toBe(false);
    });

    it('accepts a pointer written as an array of keys', () => {
      expect(isInputRequired(buildSchema(), ['properties', 'name'])).toBe(true);
    });

    it('empties the caller pointer array while walking it', () => {
      // BUG: JsonPointer.parse returns the same array instance for an array
      // pointer, and isInputRequired pops keys off it in place.
      const pointer = ['properties', 'name'];

      isInputRequired(buildSchema(), pointer);

      expect(pointer).toEqual([]);
    });

    it('checks schema.required === true for an empty pointer', () => {
      expect(isInputRequired({ required: true }, '')).toBe(true);
      expect(isInputRequired(buildSchema(), '')).toBe(false);
    });

    it('uses minItems to decide whether an array item is required', () => {
      expect(isInputRequired(buildSchema(), '/properties/tags/items/0')).toBe(true);
      expect(isInputRequired(buildSchema(), '/properties/tags/items/5')).toBe(false);
    });

    it('returns false for an array with no minItems', () => {
      expect(isInputRequired(
        { type: 'object', properties: { t: { type: 'array', items: {} } } },
        '/properties/t/items/0'
      )).toBe(false);
    });

    it('returns false for a non numeric array item key', () => {
      expect(isInputRequired(
        { type: 'object', properties: { t: { type: 'array', minItems: 2, items: {} } } },
        '/properties/t/items/abc'
      )).toBe(false);
    });

    it('also strips additionalProperties and patternProperties from the pointer', () => {
      expect(isInputRequired(
        { type: 'object', required: ['a'], additionalProperties: { type: 'string' } },
        '/additionalProperties/a'
      )).toBe(true);
      expect(isInputRequired(
        { type: 'object', required: ['a'], patternProperties: { a: {} } },
        '/patternProperties/a'
      )).toBe(true);
    });

    it('returns false when the parent schema cannot be found', () => {
      expect(isInputRequired(buildSchema(), '/properties/nothere/properties/x')).toBe(false);
    });

    it('returns false when the parent has neither a required list nor an array type', () => {
      expect(isInputRequired({ type: 'object', properties: { a: {} } }, '/properties/a')).toBe(false);
    });

    it('returns false when the schema is not an object', () => {
      expect(isInputRequired(null, '/properties/name')).toBe(false);
      expect(isInputRequired(undefined, '/properties/name')).toBe(false);
      expect(isInputRequired('nope', '/properties/name')).toBe(false);
    });

    it('returns false for an invalid JSON Pointer', () => {
      expect(isInputRequired(buildSchema(), 'name')).toBe(false);
    });
  });

  describe('updateInputOptions', () => {
    const jsfWith = (defaults: any = {}): any =>
      ({ formOptions: { defautWidgetOptions: defaults } });

    it('does nothing when the layout node is not an object', () => {
      expect(() => updateInputOptions(null, { type: 'string' }, jsfWith())).not.toThrow();
      expect(() => updateInputOptions('nope', { type: 'string' }, jsfWith())).not.toThrow();
    });

    it('does nothing when the layout node has no options object', () => {
      const layoutNode: any = { type: 'text' };

      updateInputOptions(layoutNode, { type: 'string' }, jsfWith());

      expect(layoutNode).toEqual({ type: 'text' });
    });

    it('copies schema keys into options, skipping the structural ones', () => {
      const layoutNode: any = { options: {} };

      updateInputOptions(
        layoutNode,
        { type: 'string', title: 'T', minLength: 2, properties: {}, required: ['x'], $ref: '#/a' },
        jsfWith()
      );

      expect(layoutNode.options).toEqual({ title: 'T', minLength: 2 });
    });

    it('merges the global default widget options and strips ui: prefixes', () => {
      const layoutNode: any = { options: {} };

      updateInputOptions(layoutNode, { type: 'string' }, jsfWith({ addable: true, 'ui:foo': 'bar' }));

      expect(layoutNode.options).toEqual({ addable: true, foo: 'bar' });
    });

    it('merges the ui:widget options and keeps the renamed widget key as well', () => {
      const layoutNode: any = { options: {} };

      updateInputOptions(
        layoutNode,
        { type: 'string', 'ui:widget': { options: { placeholder: 'p' }, extra: 1 } },
        jsfWith()
      );

      expect(layoutNode.options.placeholder).toEqual('p');
      expect(layoutNode.options.extra).toEqual(1);
      expect(layoutNode.options.widget).toEqual({ options: { placeholder: 'p' }, extra: 1 });
    });

    it('merges the x-schema-form options and skips its items and options keys', () => {
      const layoutNode: any = { options: {} };

      updateInputOptions(
        layoutNode,
        { type: 'string', 'x-schema-form': { options: { notitle: true }, items: [1], other: 2 } },
        jsfWith()
      );

      expect(layoutNode.options).toEqual({ notitle: true, other: 2 });
    });

    it('does not copy the reserved layout node keys into options', () => {
      const layoutNode: any = { _id: 1, dataPointer: '/a', name: 'a', options: { keep: true } };

      updateInputOptions(layoutNode, { type: 'string' }, jsfWith());

      expect(layoutNode.options).toEqual({ keep: true });
    });

    it('forces multipleOf to 1 for an integer schema', () => {
      const layoutNode: any = { options: {} };

      updateInputOptions(layoutNode, { type: 'integer' }, jsfWith());

      expect(layoutNode.options.multipleOf).toEqual(1);
    });

    it('keeps an existing multipleOf on an integer schema', () => {
      const layoutNode: any = { options: { multipleOf: 5 } };

      updateInputOptions(layoutNode, { type: 'integer' }, jsfWith());

      expect(layoutNode.options.multipleOf).toEqual(5);
    });

    it('builds a titleMap from a schema oneOf', () => {
      const layoutNode: any = { options: {} };

      updateInputOptions(
        layoutNode,
        { type: 'string', oneOf: [{ title: 'A', enum: ['a'] }, { title: 'B', enum: ['b'] }] },
        jsfWith()
      );

      expect(layoutNode.options.titleMap)
        .toEqual([{ name: 'A', value: 'a' }, { name: 'B', value: 'b' }]);
    });

    it('keeps a titleMap that is already set on the layout node options', () => {
      const layoutNode: any = { options: { titleMap: [{ name: 'x', value: 1 }] } };

      updateInputOptions(
        layoutNode, { type: 'string', oneOf: [{ title: 'A', enum: ['a'] }] }, jsfWith()
      );

      expect(layoutNode.options.titleMap).toEqual([{ name: 'x', value: 1 }]);
    });

    it('copies a titleMap out of the items schema', () => {
      const layoutNode: any = { options: {} };

      updateInputOptions(
        layoutNode, { type: 'array', items: { titleMap: [{ name: 'a', value: 1 }] } }, jsfWith()
      );

      expect(layoutNode.options.titleMap).toEqual([{ name: 'a', value: 1 }]);
    });

    it('copies enum and enumNames out of the items schema', () => {
      const layoutNode: any = { options: {} };

      updateInputOptions(
        layoutNode, { type: 'array', items: { enum: ['a'], enumNames: ['A'] } }, jsfWith()
      );

      expect(layoutNode.options).toEqual({ enum: ['a'], enumNames: ['A'] });
    });

    it('builds a titleMap from the items oneOf', () => {
      const layoutNode: any = { options: {} };

      updateInputOptions(
        layoutNode,
        { type: 'array', items: { oneOf: [{ title: 'A', enum: ['a'] }, { title: 'B', enum: ['b'] }] } },
        jsfWith()
      );

      expect(layoutNode.options.titleMap)
        .toEqual([{ name: 'A', value: 'a' }, { name: 'B', value: 'b' }]);
    });

    it('copies an autocomplete word list to options.typeahead', () => {
      const layoutNode: any = { options: { autocomplete: { source: ['a'] } } };

      updateInputOptions(layoutNode, { type: 'string' }, jsfWith());

      expect(layoutNode.options.typeahead).toEqual({ source: ['a'] });
    });

    it('copies a tagsinput word list to options.typeahead', () => {
      const layoutNode: any = { options: { tagsinput: { source: ['a'] } } };

      updateInputOptions(layoutNode, { type: 'string' }, jsfWith());

      expect(layoutNode.options.typeahead).toEqual({ source: ['a'] });
    });

    it('copies a nested tagsinput typeahead word list to options.typeahead', () => {
      const layoutNode: any = { options: { tagsinput: { typeahead: { source: ['a'] } } } };

      updateInputOptions(layoutNode, { type: 'string' }, jsfWith());

      expect(layoutNode.options.typeahead).toEqual({ source: ['a'] });
    });

    it('renames ui: prefixed option keys on the layout node options', () => {
      const layoutNode: any = { options: { 'ui:order': ['a'] } };

      updateInputOptions(layoutNode, { type: 'string' }, jsfWith());

      expect(layoutNode.options).toEqual({ order: ['a'] });
    });

    it('throws for a null schema', () => {
      // BUG: getTitleMapFromOneOf reads schema.oneOf, and the default parameter
      // only kicks in for undefined, not for null.
      expect(() => updateInputOptions({ options: {} }, null, jsfWith())).toThrow();
    });
  });

  describe('getTitleMapFromOneOf', () => {
    it('returns null when called with no arguments', () => {
      expect(getTitleMapFromOneOf()).toBeNull();
    });

    it('returns null for a schema without oneOf or anyOf', () => {
      expect(getTitleMapFromOneOf({})).toBeNull();
      expect(getTitleMapFromOneOf({ type: 'string' })).toBeNull();
    });

    it('builds a title map from single value enums', () => {
      expect(getTitleMapFromOneOf(
        { oneOf: [{ title: 'A', enum: ['a'] }, { title: 'B', enum: ['b'] }] }
      )).toEqual([{ name: 'A', value: 'a' }, { name: 'B', value: 'b' }]);
    });

    it('reads anyOf when oneOf is absent', () => {
      expect(getTitleMapFromOneOf(
        { anyOf: [{ title: 'A', enum: ['a'] }, { title: 'B', enum: ['b'] }] }
      )).toEqual([{ name: 'A', value: 'a' }, { name: 'B', value: 'b' }]);
    });

    it('builds a title map from const values', () => {
      expect(getTitleMapFromOneOf(
        { oneOf: [{ title: 'A', const: 'a' }, { title: 'B', const: 'b' }] }
      )).toEqual([{ name: 'A', value: 'a' }, { name: 'B', value: 'b' }]);
    });

    it('returns null when any entry is missing a title', () => {
      expect(getTitleMapFromOneOf(
        { oneOf: [{ enum: ['a'] }, { title: 'B', enum: ['b'] }] }
      )).toBeNull();
    });

    it('returns null when an enum holds more than one value', () => {
      expect(getTitleMapFromOneOf({ oneOf: [{ title: 'A', enum: ['a', 'x'] }] })).toBeNull();
    });

    it('returns null when the entries have neither an enum nor a const', () => {
      expect(getTitleMapFromOneOf({ oneOf: [{ title: 'A', type: 'string' }] })).toBeNull();
    });

    it('returns null when oneOf is not an array', () => {
      expect(getTitleMapFromOneOf({ oneOf: 'nope' })).toBeNull();
    });

    it('returns true or false instead of a map when validateOnly is set', () => {
      expect(getTitleMapFromOneOf({ oneOf: [{ title: 'A', enum: ['a'] }] }, null, true)).toBe(true);
      expect(getTitleMapFromOneOf({ oneOf: [{ title: 'A', const: 'a' }] }, null, true)).toBe(true);
      expect(getTitleMapFromOneOf({ type: 'string' }, null, true)).toBe(false);
      expect(getTitleMapFromOneOf({ oneOf: [{ enum: ['a'] }] }, null, true)).toBe(false);
    });

    it('splits names on the first colon to build a grouped map', () => {
      expect(getTitleMapFromOneOf({ oneOf: [
        { title: 'G: one', enum: ['1'] },
        { title: 'G: two', enum: ['2'] },
        { title: 'H: three', enum: ['3'] },
      ] })).toEqual([
        { name: 'one', value: '1', group: 'G' },
        { name: 'two', value: '2', group: 'G' },
        { name: 'three', value: '3', group: 'H' },
      ]);
    });

    it('leaves the names untouched when flatList is false', () => {
      expect(getTitleMapFromOneOf(
        { oneOf: [{ title: 'G: one', enum: ['1'] }, { title: 'G: two', enum: ['2'] }] }, false
      )).toEqual([{ name: 'G: one', value: '1' }, { name: 'G: two', value: '2' }]);
    });

    it('groups single entry groups when flatList is true', () => {
      expect(getTitleMapFromOneOf(
        { oneOf: [{ title: 'G: one', enum: ['1'] }, { title: 'H: two', enum: ['2'] }] }, true
      )).toEqual([
        { name: 'one', value: '1', group: 'G' },
        { name: 'two', value: '2', group: 'H' },
      ]);
    });

    it('never groups a map with only one entry', () => {
      expect(getTitleMapFromOneOf({ oneOf: [{ title: 'G: one', enum: ['1'] }] }))
        .toEqual([{ name: 'G: one', value: '1' }]);
    });

    it('leaves colon free names alone even though they pass the colon filter', () => {
      expect(getTitleMapFromOneOf(
        { oneOf: [{ title: 'One', enum: ['1'] }, { title: 'Two', enum: ['2'] }] }
      )).toEqual([{ name: 'One', value: '1' }, { name: 'Two', value: '2' }]);
    });

    it('counts colon free names towards the grouping threshold', () => {
      // BUG: the colon filter is `name.indexOf(': ')`, whose -1 result is truthy,
      // so names WITHOUT a colon pass the filter and push the count over 1.
      expect(getTitleMapFromOneOf(
        { oneOf: [{ title: 'A', enum: ['1'] }, { title: 'G: x', enum: ['2'] }] }, true
      )).toEqual([{ name: 'A', value: '1' }, { name: 'x', value: '2', group: 'G' }]);
    });

    it('drops a name whose colon sits at index 0 from the grouping count', () => {
      // BUG: same filter, the other way round: indexOf returns 0 for a leading
      // colon, which is falsy, so this entry is not counted and no grouping runs.
      expect(getTitleMapFromOneOf(
        { oneOf: [{ title: ': a', enum: ['1'] }, { title: 'G: b', enum: ['2'] }] }, true
      )).toEqual([{ name: ': a', value: '1' }, { name: 'G: b', value: '2' }]);
    });

    it('throws for a null schema', () => {
      // BUG: the default parameter only applies to undefined, so null reaches
      // schema.oneOf and throws.
      expect(() => getTitleMapFromOneOf(null)).toThrow();
    });
  });

  describe('getControlValidators', () => {
    it('returns null when the schema is not an object', () => {
      expect(getControlValidators(null)).toBeNull();
      expect(getControlValidators('nope')).toBeNull();
      expect(getControlValidators(undefined)).toBeNull();
    });

    it('returns an empty object for a schema with no type and no enum', () => {
      expect(getControlValidators({})).toEqual({});
      expect(getControlValidators([])).toEqual({});
    });

    it('collects the string validators', () => {
      expect(getControlValidators(
        { type: 'string', pattern: '^a', format: 'email', minLength: 1, maxLength: 5 }
      )).toEqual({ pattern: ['^a'], format: ['email'], minLength: [1], maxLength: [5] });
    });

    it('collects the number validators with an exclusive flag and the type itself', () => {
      expect(getControlValidators({ type: 'number', minimum: 0, maximum: 10, multipleOf: 2 }))
        .toEqual({ minimum: [0, false], maximum: [10, false], multipleOf: [2], type: ['number'] });
    });

    it('marks the limits exclusive when the exclusive keywords are true', () => {
      expect(getControlValidators({
        type: 'number', minimum: 0, exclusiveMinimum: true, maximum: 9, exclusiveMaximum: true,
      })).toEqual({ minimum: [0, true], maximum: [9, true], type: ['number'] });
    });

    it('handles the integer type the same way as number', () => {
      expect(getControlValidators({ type: 'integer', minimum: 1 }))
        .toEqual({ minimum: [1, false], type: ['integer'] });
    });

    it('collects the object validators', () => {
      expect(getControlValidators(
        { type: 'object', minProperties: 1, maxProperties: 3, dependencies: { a: ['b'] } }
      )).toEqual({ minProperties: [1], maxProperties: [3], dependencies: [{ a: ['b'] }] });
    });

    it('collects the array validators', () => {
      expect(getControlValidators({ type: 'array', minItems: 1, maxItems: 3, uniqueItems: true }))
        .toEqual({ minItems: [1], maxItems: [3], uniqueItems: [true] });
    });

    it('returns an empty object for a boolean or unrecognised type', () => {
      expect(getControlValidators({ type: 'boolean' })).toEqual({});
      expect(getControlValidators({ type: 'weird', minLength: 2 })).toEqual({});
    });

    it('adds the enum validator whatever the type is', () => {
      expect(getControlValidators({ enum: ['a', 'b'] })).toEqual({ enum: [['a', 'b']] });
      expect(getControlValidators({ type: 'string', minLength: 2, enum: ['a'] }))
        .toEqual({ minLength: [2], enum: [['a']] });
    });
  });

  describe('resolveSchemaReferences', () => {
    const buildTree = (): any => ({
      type: 'object',
      properties: {
        name: { type: 'string' },
        children: { type: 'array', items: { $ref: '#' } },
      },
    });

    it('returns undefined and touches nothing when the schema is not an object', () => {
      const refLibrary: any = {};
      const schemaRecursiveRefMap = new Map<string, string>();
      const dataRecursiveRefMap = new Map<string, string>();
      const arrayMap = new Map<string, number>();

      expect(resolveSchemaReferences(
        null, refLibrary, schemaRecursiveRefMap, dataRecursiveRefMap, arrayMap
      )).toBeUndefined();
      expect(resolveSchemaReferences(
        'nope', refLibrary, schemaRecursiveRefMap, dataRecursiveRefMap, arrayMap
      )).toBeUndefined();
      expect(Object.keys(refLibrary)).toEqual([]);
      expect(arrayMap.size).toEqual(0);
    });

    it('returns a copy of a schema that has no references', () => {
      const schema: any = { type: 'object', properties: { a: { type: 'string' } } };
      const result: any = resolveSchemaReferences(
        schema, {}, new Map(), new Map(), new Map()
      );

      expect(result).toEqual({ type: 'object', properties: { a: { type: 'string' } } });
      expect(result).not.toBe(schema);
    });

    it('returns an empty object for an empty schema', () => {
      expect(resolveSchemaReferences({}, {}, new Map(), new Map(), new Map())).toEqual({});
    });

    it('inlines non recursive definitions and removes the definitions block', () => {
      const schema: any = {
        type: 'object',
        definitions: { name: { type: 'string', minLength: 2 } },
        properties: {
          first: { $ref: '#/definitions/name' },
          last: { $ref: '#/definitions/name' },
        },
      };
      const refLibrary: any = {};
      const schemaRecursiveRefMap = new Map<string, string>();
      const result: any = resolveSchemaReferences(
        schema, refLibrary, schemaRecursiveRefMap, new Map(), new Map()
      );

      expect(result).toEqual({
        type: 'object',
        properties: {
          first: { type: 'string', minLength: 2 },
          last: { type: 'string', minLength: 2 },
        },
      });
      expect(schema.definitions).toBeDefined();
      expect(Object.keys(refLibrary)).toEqual([]);
      expect(schemaRecursiveRefMap.size).toEqual(0);
    });

    it('records list arrays in the array map with a tuple count of 0', () => {
      const arrayMap = new Map<string, number>();

      resolveSchemaReferences(
        { type: 'object', properties: { list: { type: 'array', items: { type: 'string' } } } },
        {}, new Map(), new Map(), arrayMap
      );

      expect(arrayMap.get('/list')).toEqual(0);
    });

    it('records the number of tuple items for a tuple array', () => {
      const arrayMap = new Map<string, number>();

      resolveSchemaReferences(
        {
          type: 'object',
          properties: { list: { type: 'array', items: [{ type: 'string' }, { type: 'number' }] } },
        },
        {}, new Map(), new Map(), arrayMap
      );

      expect(arrayMap.get('/list')).toEqual(2);
    });

    it('keeps a self recursive $ref and maps it in every output map', () => {
      const refLibrary: any = {};
      const schemaRecursiveRefMap = new Map<string, string>();
      const dataRecursiveRefMap = new Map<string, string>();
      const arrayMap = new Map<string, number>();
      const result: any = resolveSchemaReferences(
        buildTree(), refLibrary, schemaRecursiveRefMap, dataRecursiveRefMap, arrayMap
      );

      expect(result.properties.children.items).toEqual({ $ref: '#' });
      expect(Object.keys(refLibrary)).toEqual(['']);
      expect(refLibrary['']).toBe(result);
      expect(schemaRecursiveRefMap.get('/properties/children/items')).toEqual('');
      expect(dataRecursiveRefMap.get('/children/-')).toEqual('');
      expect(arrayMap.get('/children')).toEqual(0);
    });

    it('rewrites a recursive definition ref to point at its first use', () => {
      const refLibrary: any = {};
      const schemaRecursiveRefMap = new Map<string, string>();
      const dataRecursiveRefMap = new Map<string, string>();
      const result: any = resolveSchemaReferences({
        type: 'object',
        definitions: {
          node: {
            type: 'object',
            properties: { value: { type: 'string' }, next: { $ref: '#/definitions/node' } },
          },
        },
        properties: { root: { $ref: '#/definitions/node' } },
      }, refLibrary, schemaRecursiveRefMap, dataRecursiveRefMap, new Map());

      expect(result.properties.root.properties.next).toEqual({ $ref: '#/properties/root' });
      expect(Object.keys(refLibrary)).toEqual(['/properties/root']);
      expect(schemaRecursiveRefMap.get('/properties/root/properties/next'))
        .toEqual('/properties/root');
      expect(dataRecursiveRefMap.get('/root/next')).toEqual('/root');
    });

    it('follows chained references between two definitions that point at each other', () => {
      const refLibrary: any = {};
      const schemaRecursiveRefMap = new Map<string, string>();
      const dataRecursiveRefMap = new Map<string, string>();
      const result: any = resolveSchemaReferences({
        type: 'object',
        definitions: {
          a: { type: 'object', properties: { b: { $ref: '#/definitions/b' } } },
          b: { type: 'object', properties: { a: { $ref: '#/definitions/a' } } },
        },
        properties: { start: { $ref: '#/definitions/a' } },
      }, refLibrary, schemaRecursiveRefMap, dataRecursiveRefMap, new Map());

      expect(result).toEqual({
        type: 'object',
        properties: {
          start: {
            type: 'object',
            properties: {
              b: { type: 'object', properties: { a: { $ref: '#/properties/start' } } },
            },
          },
        },
      });
      expect(Object.keys(refLibrary)).toEqual(['/properties/start']);
      expect(schemaRecursiveRefMap.get('/properties/start/properties/b/properties/a'))
        .toEqual('/properties/start');
      expect(dataRecursiveRefMap.get('/start/b/a')).toEqual('/start');
    });

    it('combines allOf sub schemas while compiling', () => {
      expect(resolveSchemaReferences(
        { type: 'object', properties: { a: { allOf: [{ type: 'string' }, { minLength: 2 }] } } },
        {}, new Map(), new Map(), new Map()
      )).toEqual({ type: 'object', properties: { a: { type: 'string', minLength: 2 } } });
    });

    it('moves a misplaced array required list into the items schema', () => {
      expect(resolveSchemaReferences({
        type: 'object',
        properties: {
          list: { type: 'array', required: ['a'], items: { properties: { a: { type: 'string' } } } },
        },
      }, {}, new Map(), new Map(), new Map())).toEqual({
        type: 'object',
        properties: {
          list: { type: 'array', items: { properties: { a: { type: 'string' } }, required: ['a'] } },
        },
      });
    });

    it('keeps entries already present in the recursive maps and the array map', () => {
      const schemaRecursiveRefMap = new Map<string, string>([
        ['/properties/children/items', '/preset'],
      ]);
      const arrayMap = new Map<string, number>([['/children', 99]]);

      resolveSchemaReferences(buildTree(), {}, schemaRecursiveRefMap, new Map(), arrayMap);

      expect(schemaRecursiveRefMap.get('/properties/children/items')).toEqual('/preset');
      expect(schemaRecursiveRefMap.size).toEqual(1);
      expect(arrayMap.get('/children')).toEqual(99);
    });

    it('overwrites an existing entry in the schema ref library', () => {
      // BUG: the guard is `hasOwn(schemaRefLibrary, 'refPointer')`, a string
      // literal instead of the refPointer variable, so real keys never match it.
      const refLibrary: any = { '': { sentinel: true } };

      resolveSchemaReferences(buildTree(), refLibrary, new Map(), new Map(), new Map());

      expect(refLibrary[''].sentinel).toBeUndefined();
      expect(refLibrary[''].type).toEqual('object');
    });

    it('skips the library write entirely when a literal refPointer key exists', () => {
      // BUG: the same string literal, seen from the other side.
      const refLibrary: any = { refPointer: 'anything' };

      resolveSchemaReferences(buildTree(), refLibrary, new Map(), new Map(), new Map());

      expect(Object.keys(refLibrary)).toEqual(['refPointer']);
    });
  });

  describe('getSubSchema', () => {
    const buildRefSchema = (): any => ({
      type: 'object',
      definitions: { thing: { type: 'string', minLength: 2 } },
      properties: {
        a: { $ref: '#/definitions/thing' },
        b: { $ref: '#/definitions/thing', title: 'B' },
      },
    });

    it('returns a plain copy when no ref library is supplied', () => {
      expect(getSubSchema(buildRefSchema(), '/properties/a'))
        .toEqual({ $ref: '#/definitions/thing' });
    });

    it('returns a copy of the whole schema for an empty pointer and no library', () => {
      const schema = buildRefSchema();
      const result: any = getSubSchema(schema, '');

      expect(result).toEqual(schema);
      expect(result).not.toBe(schema);
    });

    it('returns undefined for a null schema', () => {
      expect(getSubSchema(null, '')).toBeUndefined();
    });

    it('returns null for a pointer that does not exist', () => {
      expect(getSubSchema(buildRefSchema(), '/nope', {}, new Map())).toBeNull();
    });

    it('resolves $ref links throughout the schema when a library is supplied', () => {
      expect(getSubSchema(buildRefSchema(), '', {}, new Map())).toEqual({
        type: 'object',
        definitions: { thing: { type: 'string', minLength: 2 } },
        properties: {
          a: { type: 'string', minLength: 2 },
          b: { type: 'string', minLength: 2, title: 'B' },
        },
      });
    });

    it('resolves a $ref at the requested pointer', () => {
      expect(getSubSchema(buildRefSchema(), '/properties/a', {}, new Map()))
        .toEqual({ type: 'string', minLength: 2 });
    });

    it('merges the extra keys of a node that has both a $ref and other keys', () => {
      expect(getSubSchema(buildRefSchema(), '/properties/b', {}, new Map()))
        .toEqual({ type: 'string', minLength: 2, title: 'B' });
    });

    it('accepts a pointer written as an array of keys', () => {
      expect(getSubSchema(buildRefSchema(), ['properties', 'a'], {}, new Map()))
        .toEqual({ type: 'string', minLength: 2 });
    });

    it('leaves a self recursive $ref in place', () => {
      const schema: any = {
        type: 'object',
        properties: { children: { type: 'array', items: { $ref: '#' } } },
      };

      expect(getSubSchema(schema, '', {}, new Map([['/properties/children/items', '']])))
        .toEqual(schema);
    });

    it('combines allOf sub schemas', () => {
      expect(getSubSchema({ allOf: [{ type: 'string' }, { minLength: 1 }] }, '', {}, new Map()))
        .toEqual({ type: 'string', minLength: 1 });
    });

    it('leaves a $ref alone when the shortened pointer already covers it', () => {
      const schema: any = {
        type: 'object',
        properties: {
          root: {
            type: 'object',
            properties: { value: { type: 'string' }, next: { $ref: '#/properties/root' } },
          },
        },
      };

      expect(getSubSchema(
        schema,
        '/properties/root/properties/next',
        {},
        new Map([['/properties/root/properties/next', '/properties/root']])
      )).toEqual({ $ref: '#/properties/root' });
    });

    it('prefers the ref library entry for the shortened pointer', () => {
      const schema: any = {
        type: 'object',
        properties: {
          root: {
            type: 'object',
            properties: { value: { type: 'string' }, next: { $ref: '#/properties/root' } },
          },
        },
      };

      expect(getSubSchema(
        schema,
        '/properties/root/properties/next',
        { '/properties/root': { fromLibrary: true } },
        new Map([['/properties/root/properties/next', '/properties/root']])
      )).toEqual({ fromLibrary: true });
    });

    it('fixes a misplaced array required list', () => {
      expect(getSubSchema(
        { type: 'array', required: ['a'], items: { properties: { a: {} } } }, '', {}, new Map()
      )).toEqual({ type: 'array', items: { properties: { a: {} }, required: ['a'] } });
    });
  });

  describe('combineAllOf', () => {
    it('returns the input unchanged when it is not an object', () => {
      expect(combineAllOf(null)).toBeNull();
      expect(combineAllOf('nope')).toEqual('nope');
    });

    it('returns the schema unchanged when there is no allOf array', () => {
      expect(combineAllOf({ type: 'string' })).toEqual({ type: 'string' });
      expect(combineAllOf({ allOf: { type: 'string' } })).toEqual({ allOf: { type: 'string' } });
    });

    it('merges the members of an allOf array', () => {
      expect(combineAllOf({ allOf: [{ type: 'string' }, { minLength: 2 }] }))
        .toEqual({ type: 'string', minLength: 2 });
    });

    it('merges the remaining keys of the schema back in', () => {
      expect(combineAllOf({ title: 'T', allOf: [{ type: 'string' }] }))
        .toEqual({ type: 'string', title: 'T' });
    });

    it('keeps an allOf array when the members cannot be merged', () => {
      expect(combineAllOf({ allOf: [{ type: 'string' }, { type: 'number' }] }))
        .toEqual({ allOf: [{ type: 'string' }, { type: 'number' }] });
    });

    it('returns an empty object for an empty allOf array', () => {
      expect(combineAllOf({ allOf: [] })).toEqual({});
    });
  });

  describe('fixRequiredArrayProperties', () => {
    it('moves the required list into items.properties', () => {
      expect(fixRequiredArrayProperties({
        type: 'array', required: ['a'], items: { type: 'object', properties: { a: {}, b: {} } },
      })).toEqual({
        type: 'array', items: { type: 'object', properties: { a: {}, b: {} }, required: ['a'] },
      });
    });

    it('moves the required list into additionalItems.properties', () => {
      expect(fixRequiredArrayProperties({
        type: 'array', required: ['a'], additionalItems: { type: 'object', properties: { a: {} } },
      })).toEqual({
        type: 'array', additionalItems: { type: 'object', properties: { a: {} }, required: ['a'] },
      });
    });

    it('moves the required list when the items schema allows additional properties', () => {
      expect(fixRequiredArrayProperties({
        type: 'array', required: ['z'], items: { properties: { a: {} }, additionalProperties: true },
      })).toEqual({
        type: 'array',
        items: { properties: { a: {} }, additionalProperties: true, required: ['z'] },
      });
    });

    it('returns a copy and leaves the original schema untouched', () => {
      const schema: any = { type: 'array', required: ['a'], items: { properties: { a: {} } } };
      const result: any = fixRequiredArrayProperties(schema);

      expect(result).not.toBe(schema);
      expect(schema.required).toEqual(['a']);
      expect(result.required).toBeUndefined();
    });

    it('leaves the schema alone when a required key is not a declared item property', () => {
      const schema: any = {
        type: 'array', required: ['z'], items: { type: 'object', properties: { a: {} } },
      };

      expect(fixRequiredArrayProperties(schema)).toBe(schema);
    });

    it('leaves the schema alone when the items schema already has a required list', () => {
      const schema: any = {
        type: 'array', required: ['a'], items: { properties: { a: {} }, required: ['b'] },
      };

      expect(fixRequiredArrayProperties(schema)).toBe(schema);
    });

    it('leaves the schema alone when there is no items or additionalItems object', () => {
      const schema: any = { type: 'array', required: ['a'] };

      expect(fixRequiredArrayProperties(schema)).toBe(schema);
    });

    it('leaves a non array schema and a non array required alone', () => {
      expect(fixRequiredArrayProperties({ type: 'object', required: ['a'] }))
        .toEqual({ type: 'object', required: ['a'] });
      expect(fixRequiredArrayProperties({ type: 'array', required: true }))
        .toEqual({ type: 'array', required: true });
    });

    it('throws for a null schema', () => {
      // BUG: schema.type is read with no guard.
      expect(() => fixRequiredArrayProperties(null)).toThrow();
    });
  });
});
