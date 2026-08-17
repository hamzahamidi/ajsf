import { convertSchemaToDraft6, detectDraft } from './convert-schema-to-draft6.function';

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
      expect(() => convertSchemaToDraft6({ extends: null })).toThrow();
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
      expect(convertSchemaToDraft6([[{ divisibleBy: 2 }]]))
        .toEqual([[{ multipleOf: 2 }]] as any);
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
      expect(result.$schema).toEqual('http://json-schema.org/draft-06/schema#');
    });

    it('should upgrade a draft 4 $schema when the schema changed', () => {
      const result: any = convertSchemaToDraft6({
        $schema: 'http://json-schema.org/draft-04/schema#',
        type: 'number', minimum: 0, exclusiveMinimum: true,
      });
      expect(result).toEqual({
        $schema: 'http://json-schema.org/draft-06/schema#',
        type: 'number',
        exclusiveMinimum: 0,
      });
    });

    it('should upgrade a draft 1 to 4 $schema even when nothing else changed', () => {
      const result: any = convertSchemaToDraft6({
        $schema: 'http://json-schema.org/draft-04/schema#', type: 'string',
      });
      expect(result.$schema).toEqual('http://json-schema.org/draft-06/schema#');
    });

    it('should move an unrecognised $schema into the description when changed', () => {
      const result: any = convertSchemaToDraft6({
        $schema: 'http://json-schema.org/draft-07/schema#', divisibleBy: 5,
      });
      expect(result).toEqual({
        multipleOf: 5,
        description: 'Converted to draft 6 from http://json-schema.org/draft-07/schema#',
      });
    });

    it('should append to an existing description', () => {
      const result: any = convertSchemaToDraft6({
        $schema: 'urn:custom', description: 'Hello', divisibleBy: 2,
      });
      expect(result.description).toEqual('Hello\nConverted to draft 6 from urn:custom');
      expect(result.$schema).toBeUndefined();
    });

    it('should replace an empty description', () => {
      const result: any = convertSchemaToDraft6({
        $schema: 'urn:custom', description: '', divisibleBy: 2,
      });
      expect(result.description).toEqual('Converted to draft 6 from urn:custom');
    });

    it('should leave an unrecognised $schema alone when nothing changed', () => {
      const result: any = convertSchemaToDraft6({ $schema: 'urn:custom', type: 'string' });
      expect(result).toEqual({ $schema: 'urn:custom', type: 'string' });
    });
  });

  describe('contentEncoding', () => {

    it('should convert contentEncoding to media.binaryEncoding', () => {
      expect(convertSchemaToDraft6({ type: 'string', contentEncoding: 'base64' }))
        .toEqual({ type: 'string', media: { binaryEncoding: 'base64' } } as any);
    });
  });

  describe('extends', () => {

    it('should convert an object extends to allOf', () => {
      expect(convertSchemaToDraft6({ extends: { type: 'string' } }))
        .toEqual({ allOf: [{ type: 'string' }] } as any);
    });

    it('should convert an array extends to allOf', () => {
      expect(convertSchemaToDraft6({ extends: [{ type: 'string' }, { minLength: 2 }] }))
        .toEqual({ allOf: [{ type: 'string' }, { minLength: 2 }] } as any);
    });

    it('should leave a string extends untouched', () => {
      expect(convertSchemaToDraft6({ extends: 'other' }))
        .toEqual({ extends: 'other' } as any);
    });
  });

  describe('disallow', () => {

    it('should convert a string disallow to not', () => {
      expect(convertSchemaToDraft6({ disallow: 'string' }))
        .toEqual({ not: { type: 'string' } } as any);
    });

    it('should convert an array disallow to not.anyOf', () => {
      expect(convertSchemaToDraft6({ disallow: ['string', { type: 'object' }] }))
        .toEqual({ not: { anyOf: [{ type: 'string' }, { type: 'object' }] } } as any);
    });

    it('should drop a disallow that is neither a string nor an array', () => {
      expect(convertSchemaToDraft6({ disallow: 5 })).toEqual({} as any);
    });
  });

  describe('dependencies', () => {

    it('should convert string dependencies to arrays and keep array ones', () => {
      expect(convertSchemaToDraft6({ dependencies: { a: 'b', c: ['d'] } }))
        .toEqual({ dependencies: { a: ['b'], c: ['d'] } } as any);
    });

    it('should convert schema dependencies as sub schemas', () => {
      expect(convertSchemaToDraft6({ dependencies: { a: { type: 'string', required: true } } }))
        .toEqual({ dependencies: { a: { type: 'string' } } } as any);
    });

    it('should keep empty dependencies', () => {
      expect(convertSchemaToDraft6({ dependencies: {} })).toEqual({ dependencies: {} } as any);
    });
  });

  describe('maxDecimal and divisibleBy', () => {

    it('should convert maxDecimal to multipleOf', () => {
      const result: any = convertSchemaToDraft6({ type: 'number', maxDecimal: 2 });
      expect(result.multipleOf).toBeCloseTo(0.01, 10);
    });

    // The source deletes 'divisibleBy' instead of 'maxDecimal', so maxDecimal survives.
    it('should leave maxDecimal in place', () => {
      const result: any = convertSchemaToDraft6({ type: 'number', maxDecimal: 2 });
      expect(result.maxDecimal).toEqual(2);
    });

    it('should convert divisibleBy to multipleOf and remove it', () => {
      expect(convertSchemaToDraft6({ divisibleBy: 5 })).toEqual({ multipleOf: 5 } as any);
    });

    it('should ignore a non numeric divisibleBy', () => {
      expect(convertSchemaToDraft6({ divisibleBy: 'five' }))
        .toEqual({ divisibleBy: 'five' } as any);
    });
  });

  describe('minimum and exclusiveMinimum', () => {

    it('should convert minimumCanEqual false to a numeric exclusiveMinimum', () => {
      const result: any = convertSchemaToDraft6({ minimum: 5, minimumCanEqual: false });
      expect(result.exclusiveMinimum).toEqual(5);
      expect(result.minimum).toBeUndefined();
    });

    // The first branch never deletes minimumCanEqual, so the v1 key survives.
    it('should leave minimumCanEqual false in the output', () => {
      const result: any = convertSchemaToDraft6({ minimum: 5, minimumCanEqual: false });
      expect(result.minimumCanEqual).toEqual(false);
    });

    it('should just remove minimumCanEqual when it is true', () => {
      expect(convertSchemaToDraft6({ minimum: 5, minimumCanEqual: true }))
        .toEqual({ minimum: 5 } as any);
    });

    it('should convert a boolean exclusiveMinimum plus minimum to a number', () => {
      expect(convertSchemaToDraft6({ type: 'number', minimum: 3, exclusiveMinimum: true }))
        .toEqual({ type: 'number', exclusiveMinimum: 3 } as any);
    });

    it('should drop a boolean exclusiveMinimum with no minimum', () => {
      expect(convertSchemaToDraft6({ exclusiveMinimum: true })).toEqual({} as any);
    });

    it('should drop a false exclusiveMinimum and keep the minimum', () => {
      expect(convertSchemaToDraft6({ minimum: 3, exclusiveMinimum: false }))
        .toEqual({ minimum: 3 } as any);
    });

    it('should keep an already numeric exclusiveMinimum', () => {
      expect(convertSchemaToDraft6({ exclusiveMinimum: 3 }))
        .toEqual({ exclusiveMinimum: 3 } as any);
    });
  });

  describe('maximum and exclusiveMaximum', () => {

    it('should convert maximumCanEqual false to a numeric exclusiveMaximum', () => {
      const result: any = convertSchemaToDraft6({ maximum: 10, maximumCanEqual: false });
      expect(result.exclusiveMaximum).toEqual(10);
      expect(result.maximum).toBeUndefined();
      expect(result.maximumCanEqual).toEqual(false);
    });

    it('should just remove maximumCanEqual when it is true', () => {
      expect(convertSchemaToDraft6({ maximum: 10, maximumCanEqual: true }))
        .toEqual({ maximum: 10 } as any);
    });

    it('should convert a boolean exclusiveMaximum plus maximum to a number', () => {
      expect(convertSchemaToDraft6({ maximum: 9, exclusiveMaximum: true }))
        .toEqual({ exclusiveMaximum: 9 } as any);
    });

    it('should drop a boolean exclusiveMaximum with no maximum', () => {
      expect(convertSchemaToDraft6({ exclusiveMaximum: false })).toEqual({} as any);
    });
  });

  describe('properties', () => {

    it('should convert draft 3 boolean required properties into a required array', () => {
      expect(convertSchemaToDraft6({
        type: 'object',
        properties: { first: { type: 'string', required: true }, last: { type: 'string' } },
      })).toEqual({
        type: 'object',
        properties: { first: { type: 'string' }, last: { type: 'string' } },
        required: ['first'],
      } as any);
    });

    it('should merge boolean required properties into an existing required array', () => {
      expect(convertSchemaToDraft6({ required: ['x'], properties: { a: { required: true } } }))
        .toEqual({ required: ['x', 'a'], properties: { a: {} } } as any);
    });

    it('should convert boolean optional properties into a required array', () => {
      expect(convertSchemaToDraft6({ properties: { a: { optional: true }, b: {} } }))
        .toEqual({ properties: { a: {}, b: {} }, required: ['b'] } as any);
    });

    it('should treat every property as required once a v2 key set the draft', () => {
      expect(convertSchemaToDraft6({
        minimumCanEqual: true,
        properties: { a: { type: 'string' } },
      })).toEqual({ properties: { a: { type: 'string' } }, required: ['a'] } as any);
    });

    it('should convert a string requires into a dependencies entry', () => {
      expect(convertSchemaToDraft6({ properties: { a: { requires: 'b' }, b: {} } }))
        .toEqual({ properties: { a: {}, b: {} }, dependencies: { a: ['b'] } } as any);
    });

    it('should keep an array requires as is in dependencies', () => {
      expect(convertSchemaToDraft6({ properties: { a: { requires: ['b', 'c'] }, b: {}, c: {} } }))
        .toEqual({
          properties: { a: {}, b: {}, c: {} },
          dependencies: { a: ['b', 'c'] },
        } as any);
    });

    it('should merge requires into existing dependencies', () => {
      expect(convertSchemaToDraft6({
        dependencies: { z: ['y'] },
        properties: { a: { requires: 'b' } },
      })).toEqual({
        dependencies: { z: ['y'], a: ['b'] },
        properties: { a: {} },
      } as any);
    });

    it('should not add a required array when nothing is required', () => {
      const result: any = convertSchemaToDraft6({ properties: { a: { type: 'string' } } });
      expect(result.required).toBeUndefined();
    });

    it('should keep empty properties', () => {
      expect(convertSchemaToDraft6({ properties: {} })).toEqual({ properties: {} } as any);
    });

    // typeof null is 'object', and spreading null yields an empty object.
    it('should turn null properties into an empty object', () => {
      expect(convertSchemaToDraft6({ properties: null })).toEqual({ properties: {} } as any);
    });

    it('should throw when a single property is null', () => {
      expect(() => convertSchemaToDraft6({ properties: { a: null } })).toThrow();
    });

    it('should convert nested properties recursively', () => {
      expect(convertSchemaToDraft6({
        type: 'object',
        properties: {
          outer: {
            type: 'object',
            properties: { inner: { type: 'string', required: true } },
          },
        },
      })).toEqual({
        type: 'object',
        properties: {
          outer: {
            type: 'object',
            properties: { inner: { type: 'string' } },
            required: ['inner'],
          },
        },
      } as any);
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
        allOf: [{ divisibleBy: 2 }],
        anyOf: [{ divisibleBy: 3 }],
        oneOf: [{ divisibleBy: 4 }],
        not: { divisibleBy: 5 },
      })).toEqual({
        allOf: [{ multipleOf: 2 }],
        anyOf: [{ multipleOf: 3 }],
        oneOf: [{ multipleOf: 4 }],
        not: { multipleOf: 5 },
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
        description: 'Converted to draft 6 from http://example.com/custom#',
      });
    });

    it('should do nothing extra for options.changed without a $schema', () => {
      expect(convertSchemaToDraft6({ title: 'T' }, { changed: true }))
        .toEqual({ title: 'T' } as any);
    });

    it('should mark every property required when options.draft is 1', () => {
      expect(convertSchemaToDraft6({ properties: { a: {}, b: { optional: true } } }, { draft: 1 }))
        .toEqual({ properties: { a: {}, b: {} }, required: ['a'] } as any);
    });

    it('should mark every property required when options.draft is 2', () => {
      expect(convertSchemaToDraft6({ properties: { a: {} } }, { draft: 2 }))
        .toEqual({ properties: { a: {} }, required: ['a'] } as any);
    });

    it('should not touch required when options.draft is 4', () => {
      expect(convertSchemaToDraft6({ properties: { a: {} } }, { draft: 4 }))
        .toEqual({ properties: { a: {} } } as any);
    });
  });

  describe('draft detection from $schema', () => {

    // Drafts 1 and 2 treat every property as required unless it is marked
    // optional, so declaring one of them is enough to build the required array.
    it('applies the draft 2 required rule to a draft 02 schema', () => {
      expect(convertSchemaToDraft6({
        $schema: 'http://json-schema.org/draft-02/schema#',
        properties: { a: {} },
      })).toEqual({
        $schema: 'http://json-schema.org/draft-06/schema#',
        properties: { a: {} },
        required: ['a'],
      } as any);
    });

    it('applies the same rule to a draft 01 schema', () => {
      expect(convertSchemaToDraft6({
        $schema: 'http://json-schema.org/draft-01/schema#',
        properties: { a: {}, b: {} },
      }).required).toEqual(['a', 'b']);
    });

    it('exempts a property marked optional', () => {
      expect(convertSchemaToDraft6({
        $schema: 'http://json-schema.org/draft-02/schema#',
        properties: { a: {}, b: { optional: true } },
      }).required).toEqual(['a']);
    });

    it('leaves drafts 3 and later to declare required themselves', () => {
      for (const draft of ['03', '04']) {
        expect(convertSchemaToDraft6({
          $schema: `http://json-schema.org/draft-${draft}/schema#`,
          properties: { a: {} },
        }).required).toBeUndefined();
      }
    });

    // The draft used to be read as a character, so it was the string '2' rather
    // than the number 2. That never matched, and it also overwrote a correct
    // numeric draft passed in options, so declaring $schema disabled the
    // conversion instead of enabling it.
    it('does not let a declared $schema override an explicit draft option', () => {
      expect(convertSchemaToDraft6({
        $schema: 'http://json-schema.org/draft-02/schema#',
        properties: { a: {}, b: {} },
      }, { draft: 2 }).required).toEqual(['a', 'b']);
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

  describe('full draft 3 schema', () => {

    const draft3Schema: any = {
      $schema: 'http://json-schema.org/draft-03/schema#',
      id: 'http://example.com/person#',
      type: 'object',
      properties: {
        name: { type: 'string', required: true },
        age: { type: 'integer', minimum: 0, exclusiveMinimum: true },
        tags: { type: 'array', items: { type: 'string' }, divisibleBy: 1 },
        nickname: { type: 'any' },
      },
      dependencies: { age: 'name' },
    };

    it('should convert every draft 3 construct at once', () => {
      expect(convertSchemaToDraft6(draft3Schema)).toEqual({
        $schema: 'http://json-schema.org/draft-06/schema#',
        $id: 'http://example.com/person-CONVERTED-TO-DRAFT-06#',
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer', exclusiveMinimum: 0 },
          tags: { type: 'array', items: { type: 'string' }, multipleOf: 1 },
          nickname: {
            type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
          },
        },
        dependencies: { age: ['name'] },
        required: ['name'],
      });
    });

    it('should be idempotent when run twice', () => {
      const once: any = convertSchemaToDraft6(draft3Schema);
      expect(convertSchemaToDraft6(once)).toEqual(once);
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
