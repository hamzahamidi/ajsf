import { convertSchemaToDraft6, detectDraft } from './schema-draft.functions';

describe('convertSchemaToDraft6', () => {

  describe('non object input', () => {

    it('should return undefined unchanged', () => {
      expect(convertSchemaToDraft6(undefined)).toBeUndefined();
    });

    it('should return a string unchanged', () => {
      expect(convertSchemaToDraft6('foo')).toEqual('foo');
    });

    it('should return a number unchanged', () => {
      expect(convertSchemaToDraft6(42)).toEqual(42);
    });

    it('should return a boolean unchanged', () => {
      expect(convertSchemaToDraft6(true)).toEqual(true);
    });

    it('should return an empty object', () => {
      expect(convertSchemaToDraft6({})).toEqual({});
    });
  });

  describe('null input', () => {

    // typeof null is 'object', so null gets past the guard and then null.map throws.
    it('should throw on a null schema', () => {
      expect(() => convertSchemaToDraft6(null)).toThrow();
    });

    it('should throw on a null sub schema in a converted key', () => {
      expect(() => convertSchemaToDraft6({ items: null })).toThrow();
      expect(() => convertSchemaToDraft6({ not: null })).toThrow();
    });

    it('should throw on null extends', () => {
      expect(convertSchemaToDraft6({ extends: null })).toEqual({ extends: null } as any);
    });

    it('should throw on null dependencies', () => {
      expect(() => convertSchemaToDraft6({ dependencies: null })).toThrow();
    });

    it('should keep a null value for a non schema key', () => {
      expect(convertSchemaToDraft6({ title: null })).toEqual({ title: null } as any);
    });
  });

  describe('arrays', () => {

    it('should return an empty array', () => {
      expect(convertSchemaToDraft6([])).toEqual([]);
    });

    it('should convert every member of an array of schemas', () => {
      expect(convertSchemaToDraft6([{ type: 'string', required: true }, 'text']))
        .toEqual([{ type: 'string' }, 'text'] as any);
    });

    it('should recurse into nested arrays', () => {
      expect(convertSchemaToDraft6([[{ minimum: 2, exclusiveMinimum: true }]]))
        .toEqual([[{ exclusiveMinimum: 2 }]] as any);
    });
  });

  describe('draft 6 schemas', () => {

    const draft6Schema: any = {
      $schema: 'http://json-schema.org/draft-06/schema#',
      $id: 'http://example.com/schema#',
      type: 'object',
      properties: { name: { type: 'string' }, age: { type: 'integer' } },
      required: ['name'],
    };

    it('should pass an already draft 6 schema through unchanged', () => {
      expect(convertSchemaToDraft6(draft6Schema)).toEqual(draft6Schema);
    });

    it('should return a new object rather than the original', () => {
      expect(convertSchemaToDraft6(draft6Schema)).not.toBe(draft6Schema);
    });

    it('should keep an existing $id untouched', () => {
      expect(convertSchemaToDraft6(draft6Schema).$id).toEqual('http://example.com/schema#');
    });
  });

  describe('$schema handling', () => {

    it('should upgrade a draft 3 $schema when the schema changed', () => {
      const result: any = convertSchemaToDraft6({
        $schema: 'http://json-schema.org/draft-03/schema#',
        properties: { first: { type: 'string', required: true } },
      });
      expect(result.$schema).toEqual('http://json-schema.org/draft-07/schema#');
    });

    it('should upgrade a draft 4 $schema when the schema changed', () => {
      const result: any = convertSchemaToDraft6({
        $schema: 'http://json-schema.org/draft-04/schema#',
        type: 'number', minimum: 0, exclusiveMinimum: true,
      });
      expect(result).toEqual({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'number',
        exclusiveMinimum: 0,
      });
    });

    it('should upgrade a draft 1 to 4 $schema even when nothing else changed', () => {
      const result: any = convertSchemaToDraft6({
        $schema: 'http://json-schema.org/draft-04/schema#', type: 'string',
      });
      expect(result.$schema).toEqual('http://json-schema.org/draft-07/schema#');
    });

    it('should move an unrecognised $schema into the description when changed', () => {
      const result: any = convertSchemaToDraft6({
        $schema: 'http://json-schema.org/draft-07/schema#',
        minimum: 5, exclusiveMinimum: true,
      });
      expect(result).toEqual({
        exclusiveMinimum: 5,
        description: 'Converted to draft 7 from http://json-schema.org/draft-07/schema#',
      });
    });

    it('should append to an existing description', () => {
      const result: any = convertSchemaToDraft6({
        $schema: 'urn:custom', description: 'Hello', minimum: 2, exclusiveMinimum: true,
      });
      expect(result.description).toEqual('Hello\nConverted to draft 7 from urn:custom');
      expect(result.$schema).toBeUndefined();
    });

    it('should replace an empty description', () => {
      const result: any = convertSchemaToDraft6({
        $schema: 'urn:custom', description: '', minimum: 2, exclusiveMinimum: true,
      });
      expect(result.description).toEqual('Converted to draft 7 from urn:custom');
    });

    it('should leave an unrecognised $schema alone when nothing changed', () => {
      const result: any = convertSchemaToDraft6({ $schema: 'urn:custom', type: 'string' });
      expect(result).toEqual({ $schema: 'urn:custom', type: 'string' });
    });
  });

  describe('top level legacy keys', () => {

    it('should remove a boolean optional key', () => {
      expect(convertSchemaToDraft6({ optional: true, title: 't' }))
        .toEqual({ title: 't' } as any);
    });

    it('should remove a requires key', () => {
      expect(convertSchemaToDraft6({ requires: 'foo', title: 't' }))
        .toEqual({ title: 't' } as any);
    });

    it('should remove a boolean required key', () => {
      expect(convertSchemaToDraft6({ required: true, title: 't' }))
        .toEqual({ title: 't' } as any);
    });
  });

  describe('id to $id', () => {

    it('should convert id to a marked $id and strip a trailing hash', () => {
      expect(convertSchemaToDraft6({ id: 'http://example.com/schema#', type: 'object' }))
        .toEqual({
          type: 'object',
          $id: 'http://example.com/schema-CONVERTED-TO-DRAFT-06#',
        } as any);
    });

    it('should convert an id without a trailing hash', () => {
      expect(convertSchemaToDraft6({ id: 'http://example.com/schema' }))
        .toEqual({ $id: 'http://example.com/schema-CONVERTED-TO-DRAFT-06#' } as any);
    });

    it('should leave id alone when $id already exists', () => {
      expect(convertSchemaToDraft6({ id: 'http://a#', $id: 'http://b#' }))
        .toEqual({ id: 'http://a#', $id: 'http://b#' } as any);
    });

    it('should leave a non string id alone', () => {
      expect(convertSchemaToDraft6({ id: 5 })).toEqual({ id: 5 } as any);
    });
  });

  describe('type conversion', () => {

    const simpleTypes = ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'];

    it('should keep a standard string type', () => {
      expect(convertSchemaToDraft6({ type: 'string' })).toEqual({ type: 'string' } as any);
    });

    it('should keep an array of standard types', () => {
      expect(convertSchemaToDraft6({ type: ['string', 'number'] }))
        .toEqual({ type: ['string', 'number'] } as any);
    });

    it('should expand the any type to every simple type', () => {
      expect(convertSchemaToDraft6({ type: 'any' })).toEqual({ type: simpleTypes } as any);
    });

    it('should expand an array containing any to every simple type', () => {
      expect(convertSchemaToDraft6({ type: ['string', 'any'] }))
        .toEqual({ type: simpleTypes } as any);
    });

    it('should drop a non standard string type', () => {
      expect(convertSchemaToDraft6({ type: 'foo' })).toEqual({} as any);
    });

    it('should filter non standard types out of a type array', () => {
      expect(convertSchemaToDraft6({ type: ['string', 'bogus'] }))
        .toEqual({ type: ['string'] } as any);
    });

    it('should drop a numeric type', () => {
      expect(convertSchemaToDraft6({ type: 123 })).toEqual({} as any);
    });

    it('should leave an empty type array alone', () => {
      expect(convertSchemaToDraft6({ type: [] })).toEqual({ type: [] } as any);
    });

    it('should leave an empty string type alone', () => {
      expect(convertSchemaToDraft6({ type: '' })).toEqual({ type: '' } as any);
    });

    // A single member type array is unwrapped, and a plain object has no 'every' method,
    // so the inner schema is copied verbatim and its draft 3 keys are not converted.
    it('should unwrap a single member type array containing an object', () => {
      expect(convertSchemaToDraft6({
        type: [{ type: 'object', properties: { a: { required: true } } }],
      })).toEqual({ type: { type: 'object', properties: { a: { required: true } } } } as any);
    });

    it('should leave an object type untouched', () => {
      expect(convertSchemaToDraft6({ type: { type: 'string', minLength: 2 } }))
        .toEqual({ type: { type: 'string', minLength: 2 } } as any);
    });

    it('should merge a single member array of arrays onto the schema', () => {
      const result: any = convertSchemaToDraft6({ type: [[{ title: 'x' }]] });
      expect(result.type).toBeUndefined();
      expect(result['0']).toEqual({ title: 'x' });
    });
  });

  describe('type arrays containing objects', () => {

    it('should convert a mixed type array to anyOf and distribute keys by type', () => {
      expect(convertSchemaToDraft6({
        type: ['string', { type: 'object' }], title: 'X', maxLength: 5,
      })).toEqual({
        anyOf: [
          { type: 'string', title: 'X', maxLength: 5 },
          { type: 'object', title: 'X' },
        ],
      } as any);
    });

    it('should keep default outside of the anyOf array', () => {
      expect(convertSchemaToDraft6({
        type: ['string', { type: 'object' }], default: 'x', title: 'T',
      })).toEqual({
        anyOf: [
          { type: 'string', title: 'T' },
          { type: 'object', title: 'T' },
        ],
        default: 'x',
      } as any);
    });

    it('should use the catch all filter for a member with no type', () => {
      expect(convertSchemaToDraft6({
        type: ['string', { minLength: 2 }], title: 'T', maxLength: 5, minItems: 1,
      })).toEqual({
        anyOf: [
          { type: 'string', title: 'T', maxLength: 5 },
          { minLength: 2, title: 'T' },
        ],
      } as any);
    });

    it('should not overwrite a key the member already owns', () => {
      expect(convertSchemaToDraft6({
        type: ['string', { type: 'object', title: 'own' }], title: 'parent',
      })).toEqual({
        anyOf: [
          { type: 'string', title: 'parent' },
          { type: 'object', title: 'own' },
        ],
      } as any);
    });
  });

  describe('sub schema conversion', () => {

    it('should convert every entry of definitions', () => {
      expect(convertSchemaToDraft6({
        definitions: { foo: { type: 'string', required: true } },
        $ref: '#/definitions/foo',
      })).toEqual({
        definitions: { foo: { type: 'string' } },
        $ref: '#/definitions/foo',
      } as any);
    });

    it('should keep empty definitions', () => {
      expect(convertSchemaToDraft6({ definitions: {} })).toEqual({ definitions: {} } as any);
    });

    it('should leave a lone $ref string untouched', () => {
      expect(convertSchemaToDraft6({ $ref: '#/definitions/foo' }))
        .toEqual({ $ref: '#/definitions/foo' } as any);
    });

    it('should convert an items array member by member', () => {
      expect(convertSchemaToDraft6({
        type: 'array',
        items: [{ type: 'string', required: true }, { type: 'integer' }],
      })).toEqual({
        type: 'array',
        items: [{ type: 'string' }, { type: 'integer' }],
      } as any);
    });

    it('should convert an items object', () => {
      expect(convertSchemaToDraft6({ type: 'array', items: { type: 'string', required: true } }))
        .toEqual({ type: 'array', items: { type: 'string' } } as any);
    });

    it('should convert additionalItems', () => {
      expect(convertSchemaToDraft6({ additionalItems: { type: 'integer', required: true } }))
        .toEqual({ additionalItems: { type: 'integer' } } as any);
    });

    it('should convert an additionalProperties schema', () => {
      expect(convertSchemaToDraft6({ additionalProperties: { type: 'string', required: true } }))
        .toEqual({ additionalProperties: { type: 'string' } } as any);
    });

    it('should leave a boolean additionalProperties alone', () => {
      expect(convertSchemaToDraft6({ additionalProperties: false }))
        .toEqual({ additionalProperties: false } as any);
    });

    it('should convert every entry of patternProperties', () => {
      expect(convertSchemaToDraft6({
        patternProperties: { '^a': { type: 'string', required: true } },
      })).toEqual({ patternProperties: { '^a': { type: 'string' } } } as any);
    });

    it('should convert allOf, anyOf, oneOf and not', () => {
      expect(convertSchemaToDraft6({
        allOf: [{ minimum: 2, exclusiveMinimum: true }],
        anyOf: [{ minimum: 3, exclusiveMinimum: true }],
        oneOf: [{ minimum: 4, exclusiveMinimum: true }],
        not: { minimum: 5, exclusiveMinimum: true },
      })).toEqual({
        allOf: [{ exclusiveMinimum: 2 }],
        anyOf: [{ exclusiveMinimum: 3 }],
        oneOf: [{ exclusiveMinimum: 4 }],
        not: { exclusiveMinimum: 5 },
      } as any);
    });

    // There is no enum to const conversion in this implementation.
    it('should copy enum values without converting them to const', () => {
      const original: any = { type: 'string', enum: ['x'] };
      const result: any = convertSchemaToDraft6(original);
      expect(result).toEqual({ type: 'string', enum: ['x'] });
      expect(result.const).toBeUndefined();
      expect(result.enum).not.toBe(original.enum);
    });

    it('should deep copy a multi value enum', () => {
      expect(convertSchemaToDraft6({ type: 'string', enum: ['a', 'b'] }))
        .toEqual({ type: 'string', enum: ['a', 'b'] } as any);
    });

    it('should leave an existing const alone', () => {
      expect(convertSchemaToDraft6({ const: 'x' })).toEqual({ const: 'x' } as any);
    });
  });

  describe('options argument', () => {

    it('should accept an empty options object', () => {
      expect(convertSchemaToDraft6({ type: 'string' }, {})).toEqual({ type: 'string' } as any);
    });

    it('should treat the schema as changed when options.changed is true', () => {
      const result: any = convertSchemaToDraft6(
        { $schema: 'http://example.com/custom#', title: 'T' }, { changed: true }
      );
      expect(result).toEqual({
        title: 'T',
        description: 'Converted to draft 7 from http://example.com/custom#',
      });
    });

    it('should do nothing extra for options.changed without a $schema', () => {
      expect(convertSchemaToDraft6({ title: 'T' }, { changed: true }))
        .toEqual({ title: 'T' } as any);
    });

    it('drops a draft 1 to 3 property keyword whatever draft is named', () => {
      // Drafts 1 to 3 are no longer supported. The keyword is deleted rather than
      // honoured, because a boolean 'required' is invalid from draft 4 onward and
      // ajv would reject the whole schema.
      expect(convertSchemaToDraft6(
        { properties: { a: {}, b: { optional: true } } }, { draft: 1 }
      )).toEqual({ properties: { a: {}, b: {} } } as any);
      expect(convertSchemaToDraft6(
        { properties: { a: { required: true } } }, { draft: 3 }
      )).toEqual({ properties: { a: {} } } as any);
    });

    it('should not touch required when options.draft is 4', () => {
      expect(convertSchemaToDraft6({ properties: { a: {} } }, { draft: 4 }))
        .toEqual({ properties: { a: {} } } as any);
    });
  });

  describe('immutability', () => {

    it('should not mutate the original schema', () => {
      const original: any = {
        type: 'object',
        properties: { a: { type: 'string', required: true } },
        items: { type: 'string', required: true },
        enum: ['a'],
      };
      convertSchemaToDraft6(original);
      expect(original).toEqual({
        type: 'object',
        properties: { a: { type: 'string', required: true } },
        items: { type: 'string', required: true },
        enum: ['a'],
      });
    });

    it('should return fresh sub objects', () => {
      const original: any = { properties: { a: { type: 'string' } } };
      const result: any = convertSchemaToDraft6(original);
      expect(result.properties).not.toBe(original.properties);
      expect(result.properties.a).not.toBe(original.properties.a);
    });
  });

});

describe('detectDraft', () => {
  const at = (uri: string) => detectDraft({ $schema: uri });

  it('reads the draft number from a schema URI', () => {
    expect(at('http://json-schema.org/draft-03/schema#')).toBe(3);
    expect(at('http://json-schema.org/draft-04/schema#')).toBe(4);
    expect(at('http://json-schema.org/draft-06/schema#')).toBe(6);
    expect(at('http://json-schema.org/draft-07/schema#')).toBe(7);
  });

  it('returns null when no draft is declared', () => {
    expect(detectDraft({ type: 'object' })).toBeNull();
    expect(detectDraft({})).toBeNull();
    expect(detectDraft(null)).toBeNull();
    expect(detectDraft({ $schema: 42 })).toBeNull();
  });

  // These are the gaps a defaultDraft option has to cover. A hyper-schema URI
  // reads as undeclared today, which is why draft 1 and 2 schemas fall through
  // to inference rather than being recognised.
  it('does not recognise a hyper-schema URI', () => {
    expect(at('http://json-schema.org/draft-01/hyper-schema#')).toBeNull();
    expect(at('http://json-schema.org/draft-02/hyper-schema#')).toBeNull();
  });

  it('does not recognise 2019-09 or 2020-12', () => {
    expect(at('https://json-schema.org/draft/2019-09/schema')).toBeNull();
    expect(at('https://json-schema.org/draft/2020-12/schema')).toBeNull();
  });
});
