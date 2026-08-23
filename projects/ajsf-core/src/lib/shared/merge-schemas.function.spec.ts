import { mergeSchemas } from './merge-schemas.function';

/**
 * Characterization tests for mergeSchemas.
 * These pin the behaviour the function has today, including a few results that
 * are almost certainly bugs (see the comments marked BUG).
 */
describe('mergeSchemas', () => {

  describe('argument handling and filtering', () => {
    it('returns an empty object when called with no arguments', () => {
      expect(mergeSchemas()).toEqual({});
    });

    it('drops null, undefined, empty string, empty array and empty object arguments', () => {
      expect(mergeSchemas(null, undefined, '', [], {})).toEqual({});
    });

    it('returns the remaining schema when the other arguments are all empty', () => {
      expect(mergeSchemas(null, { type: 'string' }, {}, undefined)).toEqual({ type: 'string' });
    });

    it('returns a new object rather than the input schema itself', () => {
      const schema: any = { type: 'string', minLength: 2 };
      const result: any = mergeSchemas(schema);

      expect(result).toEqual({ type: 'string', minLength: 2 });
      expect(result).not.toBe(schema);
    });

    it('returns null when any surviving argument is a string', () => {
      expect(mergeSchemas({ type: 'string' }, 'not a schema')).toBeNull();
    });

    it('returns null when any surviving argument is a number', () => {
      expect(mergeSchemas(5)).toBeNull();
    });

    it('returns null when any surviving argument is a boolean', () => {
      expect(mergeSchemas({ type: 'string' }, true)).toBeNull();
      expect(mergeSchemas({ type: 'string' }, false)).toBeNull();
    });

    it('treats a non-empty array as an object and copies its indexes as keys', () => {
      // isObject() is true for arrays, so the array is not rejected and
      // Object.keys() yields the numeric indexes as string keys.
      expect(mergeSchemas([1, 2])).toEqual({ 0: 1, 1: 2 });
    });

    it('merges two disjoint schemas into one', () => {
      expect(mergeSchemas({ type: 'string' }, { minLength: 2 }))
        .toEqual({ type: 'string', minLength: 2 });
    });

    it('keeps identical values on the same key without falling into the merge rules', () => {
      expect(mergeSchemas({ format: 'date' }, { format: 'date' }))
        .toEqual({ format: 'date' });
    });

    it('merges more than two schemas', () => {
      expect(mergeSchemas({ a: 1 }, { b: 2 }, { c: 3 }))
        .toEqual({ a: 1, b: 2, c: 3 });
    });

    it('returns allOf of the filtered schemas only, with the empty ones removed', () => {
      expect(mergeSchemas({ type: 'string' }, {}, null, '', { type: 'number' }))
        .toEqual({ allOf: [{ type: 'string' }, { type: 'number' }] });
    });

    it('includes every filtered schema in allOf when the conflict is in a later schema', () => {
      expect(mergeSchemas({ type: 'string' }, { minLength: 1 }, { type: 'number' }))
        .toEqual({ allOf: [{ type: 'string' }, { minLength: 1 }, { type: 'number' }] });
    });

    it('falls back to allOf for an unrecognised keyword with conflicting values', () => {
      expect(mergeSchemas({ format: 'date' }, { format: 'email' }))
        .toEqual({ allOf: [{ format: 'date' }, { format: 'email' }] });
    });
  });

  describe('allOf', () => {
    it('concatenates both allOf arrays, keeping allOf an array', () => {
      expect(mergeSchemas({ allOf: [{ minimum: 1 }] }, { allOf: [{ maximum: 9 }] }))
        .toEqual({ allOf: [{ minimum: 1 }, { maximum: 9 }] });
    });

    it('keeps mutually exclusive members side by side rather than merging them', () => {
      // Each member of allOf must validate on its own, so contradictory members
      // stay separate and the data simply fails both.
      expect(mergeSchemas({ allOf: [{ type: 'string' }] }, { allOf: [{ type: 'number' }] }))
        .toEqual({ allOf: [{ type: 'string' }, { type: 'number' }] });
    });

    it('returns allOf of the whole schemas when one allOf value is not an array', () => {
      expect(mergeSchemas({ allOf: [{ minimum: 1 }] }, { allOf: { maximum: 9 } }))
        .toEqual({ allOf: [{ allOf: [{ minimum: 1 }] }, { allOf: { maximum: 9 } }] });
    });
  });

  describe('additionalItems, additionalProperties, contains and propertyNames', () => {
    it('merges two schema objects on additionalProperties', () => {
      expect(mergeSchemas(
        { additionalProperties: { type: 'string' } },
        { additionalProperties: { minLength: 2 } }
      )).toEqual({ additionalProperties: { type: 'string', minLength: 2 } });
    });

    it('drops an empty schema object during the recursive merge', () => {
      expect(mergeSchemas(
        { additionalProperties: {} },
        { additionalProperties: { type: 'string' } }
      )).toEqual({ additionalProperties: { type: 'string' } });
    });

    it('merges contains and propertyNames the same way', () => {
      expect(mergeSchemas(
        { contains: { type: 'string' }, propertyNames: { minLength: 1 } },
        { contains: { minLength: 3 }, propertyNames: { maxLength: 8 } }
      )).toEqual({
        contains: { type: 'string', minLength: 3 },
        propertyNames: { minLength: 1, maxLength: 8 },
      });
    });

    it('lets a false additionalProperties in the new schema override', () => {
      expect(mergeSchemas(
        { additionalProperties: { type: 'string' } },
        { additionalProperties: false }
      )).toEqual({ additionalProperties: false });
    });

    it('lets a false additionalProperties in the combined schema override', () => {
      expect(mergeSchemas(
        { additionalProperties: false },
        { additionalProperties: { type: 'string' } }
      )).toEqual({ additionalProperties: false });
    });

    it('returns allOf when additionalItems values conflict and are not objects', () => {
      expect(mergeSchemas({ additionalItems: true }, { additionalItems: false }))
        .toEqual({ allOf: [{ additionalItems: true }, { additionalItems: false }] });
    });
  });

  describe('anyOf, oneOf and enum', () => {
    it('keeps only the enum values present in both arrays', () => {
      expect(mergeSchemas({ enum: [1, 2, 3] }, { enum: [2, 3, 4] }))
        .toEqual({ enum: [2, 3] });
    });

    it('compares oneOf entries deeply', () => {
      expect(mergeSchemas(
        { oneOf: [{ type: 'string' }, { type: 'number' }] },
        { oneOf: [{ type: 'number' }] }
      )).toEqual({ oneOf: [{ type: 'number' }] });
    });

    it('returns allOf when the intersection is empty', () => {
      expect(mergeSchemas({ enum: [1] }, { enum: [2] }))
        .toEqual({ allOf: [{ enum: [1] }, { enum: [2] }] });
    });

    it('returns allOf when an anyOf value is not an array', () => {
      expect(mergeSchemas({ anyOf: [{ type: 'string' }] }, { anyOf: 'nope' }))
        .toEqual({ allOf: [{ anyOf: [{ type: 'string' }] }, { anyOf: 'nope' }] });
    });
  });

  describe('definitions', () => {
    it('combines the keys of both definitions objects', () => {
      expect(mergeSchemas(
        { definitions: { a: { type: 'string' } } },
        { definitions: { b: { type: 'number' } } }
      )).toEqual({ definitions: { a: { type: 'string' }, b: { type: 'number' } } });
    });

    it('keeps a matching definition when both values are identical', () => {
      expect(mergeSchemas(
        { definitions: { a: { type: 'string' }, b: { type: 'number' } } },
        { definitions: { a: { type: 'string' } } }
      )).toEqual({ definitions: { a: { type: 'string' }, b: { type: 'number' } } });
    });

    it('returns allOf when the same definition key has different values', () => {
      expect(mergeSchemas(
        { definitions: { a: { type: 'string' } } },
        { definitions: { a: { type: 'number' } } }
      )).toEqual({
        allOf: [
          { definitions: { a: { type: 'string' } } },
          { definitions: { a: { type: 'number' } } },
        ],
      });
    });

    it('returns allOf when a definitions value is not an object', () => {
      expect(mergeSchemas({ definitions: { a: { type: 'string' } } }, { definitions: 'ref' }))
        .toEqual({ allOf: [{ definitions: { a: { type: 'string' } } }, { definitions: 'ref' }] });
    });
  });

  describe('dependencies', () => {
    it('combines the keys of both dependencies objects', () => {
      expect(mergeSchemas(
        { dependencies: { a: ['x'] } },
        { dependencies: { b: ['y'] } }
      )).toEqual({ dependencies: { a: ['x'], b: ['y'] } });
    });

    it('unions two dependency arrays on the same key without duplicates', () => {
      expect(mergeSchemas(
        { dependencies: { a: ['x', 'y'] } },
        { dependencies: { a: ['y', 'z'] } }
      )).toEqual({ dependencies: { a: ['x', 'y', 'z'] } });
    });

    it('merges two dependency schema objects on the same key', () => {
      expect(mergeSchemas(
        { dependencies: { a: { type: 'object' } } },
        { dependencies: { a: { minProperties: 1 } } }
      )).toEqual({ dependencies: { a: { type: 'object', minProperties: 1 } } });
    });

    it('flattens the array into required when converting an array dependency to an object', () => {
      expect(mergeSchemas(
        { dependencies: { a: ['x'] } },
        { dependencies: { a: { type: 'object' } } }
      )).toEqual({ dependencies: { a: { required: ['x'], type: 'object' } } });
    });

    it('seeds the converted dependency with the already combined required array', () => {
      expect(mergeSchemas(
        { required: ['r'], dependencies: { a: ['x'] } },
        { dependencies: { a: { type: 'object' } } }
      )).toEqual({
        required: ['r'],
        dependencies: { a: { required: ['r', 'x'], type: 'object' } },
      });
    });

    it('returns allOf when a matching dependency key holds neither an array nor an object', () => {
      expect(mergeSchemas({ dependencies: { a: 'x' } }, { dependencies: { a: 'y' } }))
        .toEqual({ allOf: [{ dependencies: { a: 'x' } }, { dependencies: { a: 'y' } }] });
    });

    it('returns allOf when a dependencies value is not an object', () => {
      expect(mergeSchemas({ dependencies: { a: ['x'] } }, { dependencies: 5 }))
        .toEqual({ allOf: [{ dependencies: { a: ['x'] } }, { dependencies: 5 }] });
    });
  });

  describe('items', () => {
    // Both arrays means both are tuples, so slot i constrains slot i. These
    // previously intersected the two arrays by value, which dropped every slot
    // the tuples did not already agree on and shortened the result.
    it('merges tuple slots by position and keeps the longer length', () => {
      expect(mergeSchemas(
        { items: [{ type: 'string' }] },
        { items: [{ type: 'string' }, { type: 'number' }] }
      )).toEqual({ items: [{ type: 'string' }, { type: 'number' }] });
    });

    it('merges the schemas of a slot both tuples declare', () => {
      expect(mergeSchemas(
        { items: [{ type: 'string' }, { minLength: 2 }] },
        { items: [{ minLength: 1 }, { type: 'string' }] }
      )).toEqual({ items: [
        { type: 'string', minLength: 1 }, { minLength: 2, type: 'string' },
      ] });
    });

    it('defers a single slot to allOf rather than discarding the whole tuple', () => {
      expect(mergeSchemas({ items: [{ type: 'string' }] }, { items: [{ type: 'number' }] }))
        .toEqual({ items: [{ allOf: [{ type: 'string' }, { type: 'number' }] }] });
    });

    it('constrains a slot past the shorter tuple by its additionalItems', () => {
      expect(mergeSchemas(
        { items: [{ type: 'string' }], additionalItems: { maxLength: 4 } },
        { items: [{ type: 'string' }, { type: 'string' }] }
      )).toEqual({
        items: [{ type: 'string' }, { type: 'string', maxLength: 4 }],
        additionalItems: { maxLength: 4 },
      });
    });

    it('merges two items schema objects', () => {
      expect(mergeSchemas({ items: { type: 'string' } }, { items: { minLength: 2 } }))
        .toEqual({ items: { type: 'string', minLength: 2 } });
    });

    it('applies an items object to each slot of an items tuple', () => {
      expect(mergeSchemas({ items: [{ type: 'string' }] }, { items: { minLength: 1 } }))
        .toEqual({ items: [{ type: 'string', minLength: 1 }] });
    });

    it('applies an items object to each slot in either argument order', () => {
      expect(mergeSchemas({ items: { minLength: 1 } }, { items: [{ type: 'string' }] }))
        .toEqual({ items: [{ type: 'string', minLength: 1 }] });
    });

    it('returns allOf when an items value is neither an array nor an object', () => {
      expect(mergeSchemas({ items: { type: 'string' } }, { items: 'nope' }))
        .toEqual({ allOf: [{ items: { type: 'string' } }, { items: 'nope' }] });
    });

    it('returns allOf for two conflicting boolean items values', () => {
      expect(mergeSchemas({ items: true }, { items: false }))
        .toEqual({ allOf: [{ items: true }, { items: false }] });
    });
  });

  describe('multipleOf', () => {
    it('sets the least common multiple of both values', () => {
      expect(mergeSchemas({ multipleOf: 4 }, { multipleOf: 6 }))
        .toEqual({ multipleOf: 12 });
    });

    it('accepts numeric strings because isNumber is not strict', () => {
      expect(mergeSchemas({ multipleOf: '4' }, { multipleOf: 6 }))
        .toEqual({ multipleOf: 12 });
    });

    it('returns allOf when a multipleOf value is not numeric', () => {
      expect(mergeSchemas({ multipleOf: 2 }, { multipleOf: 'abc' }))
        .toEqual({ allOf: [{ multipleOf: 2 }, { multipleOf: 'abc' }] });
    });
  });

  describe('maximum, exclusiveMaximum, maxLength, maxItems and maxProperties', () => {
    it('keeps the lowest value for each of the maximum keywords', () => {
      expect(mergeSchemas(
        { maximum: 10, maxLength: 8, maxItems: 4, maxProperties: 6 },
        { maximum: 5, maxLength: 12, maxItems: 2, maxProperties: 3 }
      )).toEqual({ maximum: 5, maxLength: 8, maxItems: 2, maxProperties: 3 });
    });

    it('keeps boolean exclusiveMaximum values apart rather than coercing them', () => {
      expect(mergeSchemas({ exclusiveMaximum: true }, { exclusiveMaximum: false }))
        .toEqual({ allOf: [{ exclusiveMaximum: true }, { exclusiveMaximum: false }] });
    });

    it('returns allOf when a maximum keyword value is not numeric', () => {
      expect(mergeSchemas({ maxLength: 5 }, { maxLength: 'abc' }))
        .toEqual({ allOf: [{ maxLength: 5 }, { maxLength: 'abc' }] });
    });
  });

  describe('minimum, exclusiveMinimum, minLength, minItems and minProperties', () => {
    it('keeps the highest value for each of the minimum keywords', () => {
      expect(mergeSchemas(
        { minimum: 1, minLength: 8, minItems: 4, minProperties: 6 },
        { minimum: 5, minLength: 2, minItems: 9, minProperties: 3 }
      )).toEqual({ minimum: 5, minLength: 8, minItems: 9, minProperties: 6 });
    });

    it('keeps the highest exclusiveMinimum', () => {
      expect(mergeSchemas({ exclusiveMinimum: 2 }, { exclusiveMinimum: 7 }))
        .toEqual({ exclusiveMinimum: 7 });
    });

    it('returns allOf when a minimum keyword value is not numeric', () => {
      expect(mergeSchemas({ minimum: 5 }, { minimum: {} }))
        .toEqual({ allOf: [{ minimum: 5 }, { minimum: {} }] });
    });
  });

  describe('not', () => {
    it('combines two not schemas into an anyOf array', () => {
      expect(mergeSchemas({ not: { type: 'string' } }, { not: { type: 'number' } }))
        .toEqual({ not: { anyOf: [{ type: 'string' }, { type: 'number' }] } });
    });

    it('flattens a not value that contains only an anyOf array', () => {
      expect(mergeSchemas({ not: { anyOf: [{ type: 'string' }] } }, { not: { type: 'number' } }))
        .toEqual({ not: { anyOf: [{ type: 'string' }, { type: 'number' }] } });
    });

    it('flattens both not values when each contains only an anyOf array', () => {
      expect(mergeSchemas(
        { not: { anyOf: [{ type: 'string' }] } },
        { not: { anyOf: [{ type: 'number' }] } }
      )).toEqual({ not: { anyOf: [{ type: 'string' }, { type: 'number' }] } });
    });

    it('does not flatten an anyOf value that carries other keys', () => {
      expect(mergeSchemas(
        { not: { anyOf: [{ type: 'string' }], title: 'x' } },
        { not: { type: 'number' } }
      )).toEqual({
        not: { anyOf: [{ anyOf: [{ type: 'string' }], title: 'x' }, { type: 'number' }] },
      });
    });

    it('returns allOf when a not value is not an object', () => {
      expect(mergeSchemas({ not: { type: 'string' } }, { not: 'nope' }))
        .toEqual({ allOf: [{ not: { type: 'string' } }, { not: 'nope' }] });
    });
  });

  describe('patternProperties', () => {
    it('combines the keys of both patternProperties objects', () => {
      expect(mergeSchemas(
        { patternProperties: { '^a': { type: 'string' } } },
        { patternProperties: { '^b': { type: 'number' } } }
      )).toEqual({
        patternProperties: { '^a': { type: 'string' }, '^b': { type: 'number' } },
      });
    });

    it('merges the schemas of matching pattern keys', () => {
      expect(mergeSchemas(
        { patternProperties: { '^a': { type: 'string' } } },
        { patternProperties: { '^a': { minLength: 1 } } }
      )).toEqual({ patternProperties: { '^a': { type: 'string', minLength: 1 } } });
    });

    it('returns allOf when matching pattern keys are not both objects', () => {
      expect(mergeSchemas(
        { patternProperties: { '^a': 'x' } },
        { patternProperties: { '^a': 'y' } }
      )).toEqual({
        allOf: [{ patternProperties: { '^a': 'x' } }, { patternProperties: { '^a': 'y' } }],
      });
    });

    it('returns allOf when a patternProperties value is not an object', () => {
      expect(mergeSchemas({ patternProperties: { '^a': {} } }, { patternProperties: 3 }))
        .toEqual({ allOf: [{ patternProperties: { '^a': {} } }, { patternProperties: 3 }] });
    });
  });

  describe('properties', () => {
    it('combines the keys of both properties objects', () => {
      expect(mergeSchemas(
        { properties: { a: { type: 'string' } } },
        { properties: { b: { type: 'number' } } }
      )).toEqual({ properties: { a: { type: 'string' }, b: { type: 'number' } } });
    });

    it('merges the schemas of matching property keys', () => {
      expect(mergeSchemas(
        { properties: { a: { type: 'string' } } },
        { properties: { a: { minLength: 2 } } }
      )).toEqual({ properties: { a: { type: 'string', minLength: 2 } } });
    });

    it('merges nested properties recursively', () => {
      expect(mergeSchemas(
        { properties: { a: { properties: { x: { type: 'string' } } } } },
        { properties: { a: { properties: { y: { type: 'number' } } } } }
      )).toEqual({
        properties: { a: { properties: { x: { type: 'string' }, y: { type: 'number' } } } },
      });
    });

    it('embeds an allOf inside a property that cannot be merged', () => {
      expect(mergeSchemas(
        { properties: { a: { type: 'string' } } },
        { properties: { a: { type: 'number' } } }
      )).toEqual({
        properties: { a: { allOf: [{ type: 'string' }, { type: 'number' }] } },
      });
    });

    it('returns allOf when matching property keys are not both objects', () => {
      expect(mergeSchemas({ properties: { a: 'x' } }, { properties: { a: 'y' } }))
        .toEqual({ allOf: [{ properties: { a: 'x' } }, { properties: { a: 'y' } }] });
    });

    // additionalProperties sits beside properties. These previously passed a
    // property named after the keyword, which is what the code was reading, so
    // they described the misfire rather than the rule.
    it('drops a combined key the new schema forbids, keeping the ones it declares', () => {
      expect(mergeSchemas(
        { properties: { a: { type: 'string' }, z: { type: 'number' } } },
        { properties: { a: { minLength: 1 } }, additionalProperties: false }
      )).toEqual({
        properties: { a: { type: 'string', minLength: 1 } },
        additionalProperties: false,
      });
    });

    it('constrains a combined key the new schema does not declare by its additionalProperties', () => {
      expect(mergeSchemas(
        { properties: { a: { type: 'string' } } },
        { properties: {}, additionalProperties: { minLength: 3 } }
      )).toEqual({
        properties: { a: { type: 'string', minLength: 3 } },
        additionalProperties: { minLength: 3 },
      });
    });

    it('constrains a new key by the additionalProperties already folded in', () => {
      expect(mergeSchemas(
        { properties: {}, additionalProperties: { minLength: 2 } },
        { properties: { b: { type: 'string' } } }
      )).toEqual({
        properties: { b: { minLength: 2, type: 'string' } },
        additionalProperties: { minLength: 2 },
      });
    });

    it('leaves out a new key when a schema already folded in forbids it', () => {
      expect(mergeSchemas(
        { properties: {}, additionalProperties: false },
        { properties: { b: { type: 'string' } } }
      )).toEqual({ properties: {}, additionalProperties: false });
    });

    // The accumulated additionalProperties is read from the input rather than
    // from the half built result, so neither the order of the schemas nor the
    // order of the keys inside them changes the answer.
    it('gives the same answer whichever schema declares additionalProperties first', () => {
      const forbidding = { properties: { a: { type: 'string' } }, additionalProperties: false };
      const other = { properties: { b: { type: 'number' } } };
      const expected = { properties: { a: { type: 'string' } }, additionalProperties: false };
      expect(mergeSchemas(forbidding, other)).toEqual(expected);
      expect(mergeSchemas(other, forbidding)).toEqual(expected);
    });

    it('treats a property named additionalProperties as an ordinary property', () => {
      expect(mergeSchemas(
        { properties: { a: { type: 'string' } } },
        { properties: { additionalProperties: false, b: { type: 'number' } } }
      )).toEqual({
        properties: {
          a: { type: 'string' },
          additionalProperties: false,
          b: { type: 'number' },
        },
      });
    });

    it('returns allOf when a properties value is not an object', () => {
      expect(mergeSchemas({ properties: { a: {} } }, { properties: 'nope' }))
        .toEqual({ allOf: [{ properties: { a: {} } }, { properties: 'nope' }] });
    });
  });

  describe('required', () => {
    it('unions both required arrays without duplicates', () => {
      expect(mergeSchemas({ required: ['a', 'b'] }, { required: ['b', 'c'] }))
        .toEqual({ required: ['a', 'b', 'c'] });
    });

    it('ORs two boolean required values', () => {
      expect(mergeSchemas({ required: true }, { required: false }))
        .toEqual({ required: true });
      expect(mergeSchemas({ required: false }, { required: true }))
        .toEqual({ required: true });
    });

    it('returns allOf when one required value is an array and the other a boolean', () => {
      expect(mergeSchemas({ required: ['a'] }, { required: true }))
        .toEqual({ allOf: [{ required: ['a'] }, { required: true }] });
    });
  });

  describe('identifier and annotation keywords', () => {
    it('keeps the first value of $schema, $id and id', () => {
      expect(mergeSchemas(
        { $schema: 'draft-06', $id: 'first', id: 'firstId' },
        { $schema: 'draft-07', $id: 'second', id: 'secondId' }
      )).toEqual({ $schema: 'draft-06', $id: 'first', id: 'firstId' });
    });

    it('keeps the last value of title, description and $comment', () => {
      expect(mergeSchemas(
        { title: 'A', description: 'first', $comment: 'c1' },
        { title: 'B', description: 'second', $comment: 'c2' }
      )).toEqual({ title: 'B', description: 'second', $comment: 'c2' });
    });
  });

  describe('type', () => {
    it('reduces an array of types to the single common type', () => {
      expect(mergeSchemas({ type: ['string', 'number'] }, { type: 'number' }))
        .toEqual({ type: 'number' });
    });

    it('keeps an array when more than one type is common to both', () => {
      expect(mergeSchemas(
        { type: ['string', 'number', 'boolean'] },
        { type: ['number', 'boolean'] }
      )).toEqual({ type: ['number', 'boolean'] });
    });

    it('returns allOf when the types have nothing in common', () => {
      expect(mergeSchemas({ type: 'string' }, { type: 'number' }))
        .toEqual({ allOf: [{ type: 'string' }, { type: 'number' }] });
    });

    it('returns allOf when a type value is neither a string nor an array', () => {
      expect(mergeSchemas({ type: 'string' }, { type: { $ref: '#/x' } }))
        .toEqual({ allOf: [{ type: 'string' }, { type: { $ref: '#/x' } }] });
    });
  });

  describe('uniqueItems', () => {
    it('is true when either value is true', () => {
      expect(mergeSchemas({ uniqueItems: true }, { uniqueItems: false }))
        .toEqual({ uniqueItems: true });
      expect(mergeSchemas({ uniqueItems: false }, { uniqueItems: true }))
        .toEqual({ uniqueItems: true });
    });

    it('coerces truthy non-boolean values', () => {
      expect(mergeSchemas({ uniqueItems: 0 }, { uniqueItems: 1 }))
        .toEqual({ uniqueItems: true });
    });
  });

  describe('combined realistic schemas', () => {
    it('merges two object schemas across several keywords at once', () => {
      const result: any = mergeSchemas(
        {
          type: 'object',
          title: 'First',
          required: ['a'],
          properties: { a: { type: 'string' }, b: { type: 'number' } },
          maxProperties: 10,
        },
        {
          type: ['object', 'null'],
          title: 'Second',
          required: ['b'],
          properties: { a: { minLength: 2 }, c: { type: 'boolean' } },
          maxProperties: 4,
          minProperties: 1,
        }
      );

      expect(result).toEqual({
        type: 'object',
        title: 'Second',
        required: ['a', 'b'],
        properties: {
          a: { type: 'string', minLength: 2 },
          b: { type: 'number' },
          c: { type: 'boolean' },
        },
        maxProperties: 4,
        minProperties: 1,
      });
    });

    it('does not throw on deeply nested schemas that cannot be merged', () => {
      expect(() => mergeSchemas(
        { properties: { a: { items: { type: 'string' } } } },
        { properties: { a: { items: { type: 'number' } } } }
      )).not.toThrow();
    });
  });
});
