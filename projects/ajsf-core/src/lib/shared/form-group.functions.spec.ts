import {
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
} from '@angular/forms';
import {
  buildFormGroup,
  buildFormGroupTemplate,
  formatFormData,
  getControl,
  mergeValues,
  setRequiredFields,
} from './form-group.functions';

/**
 * Characterization tests for the form group function library.
 *
 * Every expectation below was taken from the function's actual output, so a few
 * of them pin behaviour that is almost certainly wrong. Those are marked BUG.
 */

/**
 * Builds a minimal stand-in for the JsonSchemaFormService, with the handful of
 * properties buildFormGroupTemplate actually reads. A fresh object (and fresh
 * Maps) is required for every call, because buildFormGroupTemplate mutates
 * dataMap, templateRefLibrary and formOptions.fieldsRequired as it runs.
 */
function makeJsf(schema: any, options: any = {}): any {
  return {
    schema,
    formValues: 'formValues' in options ? options.formValues : {},
    formOptions: {
      setSchemaDefaults: 'auto',
      fieldsRequired: false,
      ...(options.formOptions || {}),
    },
    dataMap: options.dataMap || new Map<string, any>(),
    arrayMap: options.arrayMap || new Map<string, number>(),
    dataRecursiveRefMap: options.dataRecursiveRefMap || new Map<string, string>(),
    schemaRecursiveRefMap: options.schemaRecursiveRefMap || new Map<string, string>(),
    templateRefLibrary: options.templateRefLibrary || {},
  };
}

/** Turns a plain object description into the nested Map shape of jsf.dataMap. */
function makeDataMap(entries: any): Map<string, any> {
  const dataMap = new Map<string, any>();
  Object.keys(entries).forEach(pointer => {
    dataMap.set(pointer, new Map<string, any>(Object.entries(entries[pointer])));
  });
  return dataMap;
}

const noMap: any = new Map();

describe('form-group.functions', () => {

  describe('buildFormGroupTemplate: FormControl leaves', () => {

    it('builds a FormControl template for a bare string schema', () => {
      expect(buildFormGroupTemplate(makeJsf({ type: 'string' }))).toEqual({
        controlType: 'FormControl',
        value: { value: null, disabled: false },
        validators: {},
      } as any);
    });

    it('stores a primitive nodeValue on the control', () => {
      const result: any = buildFormGroupTemplate(makeJsf({ type: 'string' }), 'hi');

      expect(result.value).toEqual({ value: 'hi', disabled: false });
    });

    it('ignores a non-primitive nodeValue', () => {
      const result: any = buildFormGroupTemplate(makeJsf({ type: 'string' }), { a: 1 });

      expect(result.value).toEqual({ value: null, disabled: false });
    });

    it('reads the disabled flag out of the existing dataMap entry', () => {
      const dataMap = new Map<string, any>();
      dataMap.set('', new Map<string, any>([['disabled', true]]));
      const result: any = buildFormGroupTemplate(makeJsf({ type: 'string' }, { dataMap }));

      expect(result.value).toEqual({ value: null, disabled: true });
    });

    it('falls back to FormControl for an empty schema', () => {
      const result: any = buildFormGroupTemplate(makeJsf({}));

      expect(result.controlType).toBe('FormControl');
      expect(result.validators).toEqual({});
    });

    it('falls back to FormControl for type object without properties', () => {
      const result: any = buildFormGroupTemplate(makeJsf({ type: 'object' }));

      expect(result.controlType).toBe('FormControl');
    });

    it('falls back to FormControl for type array without items', () => {
      const result: any = buildFormGroupTemplate(makeJsf({ type: 'array' }));

      expect(result.controlType).toBe('FormControl');
    });

    it('falls back to FormControl when type is an array of types', () => {
      // BUG: the controlType test uses `schemaType === 'object'`, so a perfectly
      // legal `type: ['object', 'null']` schema never becomes a FormGroup and its
      // properties are silently dropped.
      const result: any = buildFormGroupTemplate(makeJsf({
        type: ['object', 'null'],
        properties: { a: { type: 'string' } },
      }));

      expect(result.controlType).toBe('FormControl');
      expect(result.controls).toBeUndefined();
    });

    it('collects string validators from the schema', () => {
      const result: any = buildFormGroupTemplate(makeJsf({
        type: 'string', minLength: 2, maxLength: 5, pattern: '^a',
      }));

      expect(result.validators).toEqual({
        pattern: ['^a'], minLength: [2], maxLength: [5],
      });
    });

    it('collects numeric validators, naming the exclusive bound', () => {
      const result: any = buildFormGroupTemplate(makeJsf({
        type: 'integer', minimum: 1, exclusiveMinimum: true, maximum: 9, multipleOf: 2,
      }));

      expect(result.validators).toEqual({
        exclusiveMinimum: [1],
        maximum: [9],
        multipleOf: [2],
        type: ['integer'],
      });
    });

    it('collects an enum validator', () => {
      const result: any = buildFormGroupTemplate(makeJsf({ type: 'string', enum: ['a', 'b'] }));

      expect(result.validators).toEqual({ enum: [['a', 'b']] });
    });
  });

  describe('buildFormGroupTemplate: FormGroup', () => {

    it('builds a FormGroup for a flat object of two strings', () => {
      const result: any = buildFormGroupTemplate(makeJsf({
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'string' } },
      }));

      expect(result).toEqual({
        controlType: 'FormGroup',
        controls: {
          a: { controlType: 'FormControl', value: { value: null, disabled: false }, validators: {} },
          b: { controlType: 'FormControl', value: { value: null, disabled: false }, validators: {} },
        },
        validators: {},
      });
    });

    it('nests a FormGroup inside a FormGroup', () => {
      const result: any = buildFormGroupTemplate(makeJsf({
        type: 'object',
        properties: { outer: { type: 'object', properties: { inner: { type: 'number' } } } },
      }));

      expect(result.controls.outer.controlType).toBe('FormGroup');
      expect(result.controls.outer.controls.inner.controlType).toBe('FormControl');
      expect(result.controls.outer.controls.inner.validators).toEqual({ type: ['number'] });
    });

    it('distributes a nodeValue object across the child controls', () => {
      const result: any = buildFormGroupTemplate(
        makeJsf({ type: 'object', properties: { a: { type: 'string' } } }),
        { a: 'given' }
      );

      expect(result.controls.a.value).toEqual({ value: 'given', disabled: false });
    });

    it('produces no controls for additionalProperties without properties', () => {
      const result: any = buildFormGroupTemplate(makeJsf({
        type: 'object', additionalProperties: { type: 'string' },
      }));

      expect(result.controlType).toBe('FormGroup');
      expect(result.controls).toEqual({});
    });

    it('builds an additionalProperties control for a key named only in ui:order', () => {
      const result: any = buildFormGroupTemplate(makeJsf({
        type: 'object',
        'ui:order': ['a', 'extra'],
        properties: { a: { type: 'string' } },
        additionalProperties: { type: 'number' },
      }));

      expect(Object.keys(result.controls)).toEqual(['a', 'extra']);
      expect(result.controls.extra.validators).toEqual({ type: ['number'] });
    });

    it('honours the ui:order key ordering', () => {
      const result: any = buildFormGroupTemplate(makeJsf({
        type: 'object',
        'ui:order': ['b', 'a'],
        properties: { a: { type: 'string' }, b: { type: 'string' } },
      }));

      expect(Object.keys(result.controls)).toEqual(['b', 'a']);
    });

    it('expands a * in ui:order into the unnamed property keys', () => {
      const result: any = buildFormGroupTemplate(makeJsf({
        type: 'object',
        'ui:order': ['c', '*'],
        properties: { a: { type: 'string' }, b: { type: 'string' }, c: { type: 'string' } },
      }));

      expect(Object.keys(result.controls)).toEqual(['c', 'a', 'b']);
    });

    it('rewrites the caller ui:order array in place while expanding *', () => {
      // BUG: propertyKeys is the very array held by schema['ui:order'], and the
      // splice on line 121 mutates it, so the caller schema is modified.
      const schema: any = {
        type: 'object',
        'ui:order': ['c', '*'],
        properties: { a: { type: 'string' }, b: { type: 'string' }, c: { type: 'string' } },
      };
      buildFormGroupTemplate(makeJsf(schema));

      expect(schema['ui:order']).toEqual(['c', 'a', 'b']);
    });

    it('skips a ui:order key that matches no property', () => {
      const result: any = buildFormGroupTemplate(makeJsf({
        type: 'object', 'ui:order': ['a', 'zzz'], properties: { a: { type: 'string' } },
      }));

      expect(Object.keys(result.controls)).toEqual(['a']);
    });
  });

  describe('buildFormGroupTemplate: schema defaults', () => {

    it('applies a schema default when setSchemaDefaults is auto and formValues is empty', () => {
      const result: any = buildFormGroupTemplate(makeJsf({
        type: 'object', properties: { a: { type: 'string', default: 'hello' } },
      }));

      expect(result.controls.a.value).toEqual({ value: 'hello', disabled: false });
    });

    it('skips the schema default when setSchemaDefaults is auto and formValues is set', () => {
      const result: any = buildFormGroupTemplate(makeJsf(
        { type: 'object', properties: { a: { type: 'string', default: 'hello' } } },
        { formValues: { a: 'x' } }
      ));

      expect(result.controls.a.value).toEqual({ value: null, disabled: false });
    });

    it('applies the schema default when setSchemaDefaults is true even with formValues', () => {
      const result: any = buildFormGroupTemplate(makeJsf(
        { type: 'object', properties: { a: { type: 'string', default: 'hello' } } },
        { formValues: { a: 'x' }, formOptions: { setSchemaDefaults: true } }
      ));

      expect(result.controls.a.value).toEqual({ value: 'hello', disabled: false });
    });

    it('never applies a schema default when setSchemaDefaults is false', () => {
      const result: any = buildFormGroupTemplate(makeJsf(
        { type: 'object', properties: { a: { type: 'string', default: 'hello' } } },
        { formOptions: { setSchemaDefaults: false } }
      ));

      expect(result.controls.a.value).toEqual({ value: null, disabled: false });
    });

    it('discards the supplied nodeValue when setValues is false', () => {
      const result: any = buildFormGroupTemplate(
        makeJsf({ type: 'object', properties: { a: { type: 'string', default: 'hello' } } }),
        { a: 'given' }, false
      );

      expect(result.controls.a.value).toEqual({ value: null, disabled: false });
    });
  });

  describe('buildFormGroupTemplate: required fields', () => {

    it('adds a required validator to the named control and reports fieldsRequired', () => {
      const jsf = makeJsf({
        type: 'object', required: ['a'],
        properties: { a: { type: 'string' }, b: { type: 'string' } },
      });
      const result: any = buildFormGroupTemplate(jsf);

      expect(result.controls.a.validators).toEqual({ required: [] });
      expect(result.controls.b.validators).toEqual({});
      expect(jsf.formOptions.fieldsRequired).toBe(true);
    });

    it('accepts a bare string as the required value', () => {
      const jsf = makeJsf({
        type: 'object', required: 'a', properties: { a: { type: 'string' } },
      });
      const result: any = buildFormGroupTemplate(jsf);

      expect(result.controls.a.validators).toEqual({ required: [] });
      expect(jsf.formOptions.fieldsRequired).toBe(true);
    });

    it('treats an empty required array as no required fields', () => {
      const jsf = makeJsf({
        type: 'object', required: [], properties: { a: { type: 'string' } },
      });
      const result: any = buildFormGroupTemplate(jsf);

      expect(result.controls.a.validators).toEqual({});
      expect(jsf.formOptions.fieldsRequired).toBe(false);
    });

    it('resets fieldsRequired to false when an outer group has no required list', () => {
      // BUG: fieldsRequired is assigned (not OR-ed) after the children recurse,
      // so an outer object with no `required` overwrites the true a nested group
      // just set, and the form reports that it has no required fields at all.
      const jsf = makeJsf({
        type: 'object',
        properties: {
          inner: { type: 'object', required: ['x'], properties: { x: { type: 'string' } } },
        },
      });
      const result: any = buildFormGroupTemplate(jsf);

      expect(result.controls.inner.controls.x.validators).toEqual({ required: [] });
      expect(jsf.formOptions.fieldsRequired).toBe(false);
    });
  });

  describe('buildFormGroupTemplate: FormArray with list items', () => {

    it('builds an empty FormArray and one template library entry when no data is given', () => {
      const jsf = makeJsf({ type: 'array', items: { type: 'string' } });
      const result: any = buildFormGroupTemplate(jsf);

      expect(result.controlType).toBe('FormArray');
      expect(result.controls).toEqual([]);
      expect(jsf.templateRefLibrary['/-']).toEqual({
        controlType: 'FormControl',
        value: { value: null, disabled: false },
        validators: {},
      });
    });

    it('builds one control per item of the supplied nodeValue array', () => {
      const result: any = buildFormGroupTemplate(
        makeJsf({ type: 'array', items: { type: 'string' } }), ['a', 'b']
      );

      expect(result.controls.length).toBe(2);
      expect(result.controls[0].value).toEqual({ value: 'a', disabled: false });
      expect(result.controls[1].value).toEqual({ value: 'b', disabled: false });
    });

    it('builds a FormGroup per item for an array of objects', () => {
      const result: any = buildFormGroupTemplate(
        makeJsf({ type: 'array', items: { type: 'object', properties: { n: { type: 'string' } } } }),
        [{ n: 'x' }]
      );

      expect(result.controls.length).toBe(1);
      expect(result.controls[0].controlType).toBe('FormGroup');
      expect(result.controls[0].controls.n.value).toEqual({ value: 'x', disabled: false });
    });

    it('produces no controls for minItems when there is no data', () => {
      // BUG: minItems is only consulted inside the tuple-items branch, so a plain
      // list schema with minItems: 3 still starts out with zero controls.
      const result: any = buildFormGroupTemplate(
        makeJsf({ type: 'array', items: { type: 'string' }, minItems: 3 })
      );

      expect(result.controls).toEqual([]);
      expect(result.validators).toEqual({ minItems: [3] });
    });

    it('truncates the supplied data to maxItems', () => {
      const result: any = buildFormGroupTemplate(
        makeJsf({ type: 'array', items: { type: 'string' }, maxItems: 1 }), ['a', 'b', 'c']
      );

      expect(result.controls.length).toBe(1);
      expect(result.controls[0].value).toEqual({ value: 'a', disabled: false });
    });

    it('collects the array validators', () => {
      const result: any = buildFormGroupTemplate(makeJsf({
        type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4, uniqueItems: true,
      }));

      expect(result.validators).toEqual({ minItems: [1], maxItems: [4], uniqueItems: [true] });
    });

    it('seeds the array from tupleItems plus listItems held in the dataMap', () => {
      const dataMap = new Map<string, any>();
      dataMap.set('', new Map<string, any>([['tupleItems', 2], ['listItems', 1]]));
      const result: any = buildFormGroupTemplate(
        makeJsf({ type: 'array', items: { type: 'string' } }, { dataMap })
      );

      expect(result.controls.length).toBe(3);
      expect(result.controls[0]).toEqual({
        controlType: 'FormControl', value: { value: null, disabled: false }, validators: {},
      });
    });

    it('caps the seeded array length at the dataMap maxItems', () => {
      const dataMap = new Map<string, any>();
      dataMap.set('', new Map<string, any>([['maxItems', 2], ['tupleItems', 5], ['listItems', 0]]));
      const result: any = buildFormGroupTemplate(
        makeJsf({ type: 'array', items: { type: 'string' } }, { dataMap })
      );

      expect(result.controls.length).toBe(2);
    });

    it('fills a recursive array from the supplied data', () => {
      // The guard here never admitted a recursive array, so every supplied item
      // was dropped and patchValue could not add them back to an empty FormArray.
      const jsf = makeJsf(
        { type: 'array', items: { type: 'string' } },
        { dataRecursiveRefMap: new Map<string, string>([['/-', '']]) }
      );
      const result: any = buildFormGroupTemplate(jsf, ['a', 'b']);

      expect(result.controls.length).toBe(2);
      expect(Object.keys(jsf.templateRefLibrary)).toEqual(['']);
    });

    it('still creates no controls for a recursive array with no data', () => {
      const jsf = makeJsf(
        { type: 'array', items: { type: 'string' } },
        { dataRecursiveRefMap: new Map<string, string>([['/-', '']]) }
      );

      expect(buildFormGroupTemplate(jsf, null).controls).toEqual([]);
    });

    it('throws when additionalItems is given without items', () => {
      // BUG: with no `items` key the else branch points additionalItemsPointer at
      // '/items', which resolves to undefined and blows up reading `.type`.
      expect(() => buildFormGroupTemplate(
        makeJsf({ type: 'array', additionalItems: { type: 'boolean' } })
      )).toThrowError(TypeError);
    });
  });

  describe('buildFormGroupTemplate: FormArray with tuple items', () => {

    it('builds one control per tuple entry', () => {
      const jsf = makeJsf({ type: 'array', items: [{ type: 'string' }, { type: 'number' }] });
      const result: any = buildFormGroupTemplate(jsf);

      expect(result.controls.length).toBe(2);
      expect(result.controls[0].validators).toEqual({});
      expect(result.controls[1].validators).toEqual({ type: ['number'] });
      expect(Object.keys(jsf.templateRefLibrary)).toEqual(['/0', '/1']);
    });

    it('builds tuple entries below minItems directly, without a library entry', () => {
      const jsf = makeJsf({
        type: 'array', items: [{ type: 'string' }, { type: 'number' }], minItems: 1,
      });
      const result: any = buildFormGroupTemplate(jsf);

      expect(result.controls.length).toBe(2);
      expect(Object.keys(jsf.templateRefLibrary)).toEqual(['/1']);
    });

    it('fills the tuple entries from the supplied nodeValue array', () => {
      const result: any = buildFormGroupTemplate(
        makeJsf({ type: 'array', items: [{ type: 'string' }, { type: 'number' }] }), ['a', 5]
      );

      expect(result.controls[0].value).toEqual({ value: 'a', disabled: false });
      expect(result.controls[1].value).toEqual({ value: 5, disabled: false });
    });

    it('pushes null for a tuple entry whose data pointer is recursive', () => {
      const jsf = makeJsf(
        { type: 'array', items: [{ type: 'string' }, { type: 'number' }] },
        { dataRecursiveRefMap: new Map<string, string>([['/1', '']]) }
      );
      const result: any = buildFormGroupTemplate(jsf);

      expect(result.controls.length).toBe(2);
      expect(result.controls[1]).toBeNull();
      expect(Object.keys(jsf.templateRefLibrary)).toEqual(['/0', '']);
    });

    it('registers an additionalItems template alongside the tuple templates', () => {
      const jsf = makeJsf({
        type: 'array', items: [{ type: 'string' }], additionalItems: { type: 'boolean' },
      });
      const result: any = buildFormGroupTemplate(jsf);

      expect(result.controls.length).toBe(1);
      expect(Object.keys(jsf.templateRefLibrary)).toEqual(['/0', '/-']);
    });

    it('throws when the dataMap claims more tuple items than the schema has', () => {
      const dataMap = new Map<string, any>();
      dataMap.set('', new Map<string, any>([['tupleItems', 3]]));

      expect(() => buildFormGroupTemplate(
        makeJsf({ type: 'array', items: [{ type: 'string' }] }, { dataMap })
      )).toThrowError(TypeError);
    });
  });

  describe('buildFormGroupTemplate: $ref', () => {

    it('returns null and leaves the library empty for a root $ref into definitions', () => {
      // BUG: JsonPointer.toDataPointer is called with the local sub-schema rather
      // than the root schema, so the reference never resolves and nothing is ever
      // stored in templateRefLibrary for an ordinary #/definitions/... reference.
      const jsf = makeJsf({
        definitions: { thing: { type: 'string' } }, $ref: '#/definitions/thing',
      });

      expect(buildFormGroupTemplate(jsf)).toBeNull();
      expect(jsf.templateRefLibrary).toEqual({});
    });

    it('stores null for a $ref property inside a FormGroup', () => {
      const jsf = makeJsf({
        type: 'object',
        definitions: { thing: { type: 'string' } },
        properties: { a: { $ref: '#/definitions/thing' } },
      });
      const result: any = buildFormGroupTemplate(jsf);

      expect(result.controls.a).toBeNull();
      expect(jsf.templateRefLibrary).toEqual({});
    });

    it('does not resolve a $ref that points at a sibling property', () => {
      const jsf = makeJsf({
        type: 'object',
        properties: { a: { type: 'string' }, b: { $ref: '#/properties/a' } },
      });
      const result: any = buildFormGroupTemplate(jsf);

      expect(result.controls.a.controlType).toBe('FormControl');
      expect(result.controls.b).toBeNull();
      expect(jsf.templateRefLibrary).toEqual({});
    });

    it('stores the boolean setValues flag as the referenced control value', () => {
      // BUG: the recursive call on line 251 is
      // buildFormGroupTemplate(jsf, setValues, setValues, schemaRef), which passes
      // the boolean setValues where nodeValue belongs, so the stored template
      // carries `value: true` instead of the schema default or null.
      const jsf = makeJsf({ $ref: '#/properties/a', properties: { a: { type: 'string' } } });

      expect(buildFormGroupTemplate(jsf)).toBeNull();
      expect(jsf.templateRefLibrary['/a']).toEqual({
        controlType: 'FormControl',
        value: { value: true, disabled: false },
        validators: {},
      });
    });

    it('removes the placeholder library entry when the referenced template is null', () => {
      const jsf = makeJsf({ $ref: '#/properties/a', properties: { a: { $ref: '#/nowhere' } } });

      expect(buildFormGroupTemplate(jsf)).toBeNull();
      expect(Object.keys(jsf.templateRefLibrary)).toEqual([]);
    });
  });

  describe('buildFormGroupTemplate: dataMap side effects', () => {

    it('records a schemaPointer, schemaType, templatePointer and templateType per node', () => {
      const jsf = makeJsf({
        type: 'object', properties: { a: { type: 'string' } },
      });
      buildFormGroupTemplate(jsf);

      expect([...jsf.dataMap.keys()]).toEqual(['', '/a']);
      expect([...jsf.dataMap.get('/a')]).toEqual([
        ['schemaPointer', '/properties/a'],
        ['schemaType', 'string'],
        ['templatePointer', '/controls/a'],
        ['templateType', 'FormControl'],
      ]);
    });

    it('records the pointers of a nested object', () => {
      const jsf = makeJsf({
        type: 'object',
        properties: { outer: { type: 'object', properties: { inner: { type: 'number' } } } },
      });
      buildFormGroupTemplate(jsf);

      expect([...jsf.dataMap.keys()]).toEqual(['', '/outer', '/outer/inner']);
      expect(jsf.dataMap.get('/outer/inner').get('schemaPointer'))
        .toBe('/properties/outer/properties/inner');
      expect(jsf.dataMap.get('/outer/inner').get('templatePointer'))
        .toBe('/controls/outer/controls/inner');
    });

    it('records the generic /- pointer for a list array item', () => {
      const jsf = makeJsf({ type: 'array', items: { type: 'string' } });
      buildFormGroupTemplate(jsf);

      expect([...jsf.dataMap.keys()]).toEqual(['', '/-']);
      expect(jsf.dataMap.get('/-').get('schemaPointer')).toBe('/items');
      expect(jsf.dataMap.get('').get('templateType')).toBe('FormArray');
    });

    it('records an undefined schemaType for a schema with no type', () => {
      const jsf = makeJsf({});
      buildFormGroupTemplate(jsf);

      expect(jsf.dataMap.get('').get('schemaType')).toBeUndefined();
      expect(jsf.dataMap.get('').get('templateType')).toBe('FormControl');
    });

    it('infers a string schemaType from a format when no type is given', () => {
      const jsf = makeJsf({ format: 'date-time' });
      buildFormGroupTemplate(jsf);

      expect(jsf.dataMap.get('').get('schemaType')).toBe('string');
      expect(jsf.dataMap.get('').get('schemaFormat')).toBe('date-time');
    });

    it('leaves an existing dataMap entry alone when it already carries a schemaType', () => {
      const dataMap = new Map<string, any>();
      dataMap.set('', new Map<string, any>([['schemaType', 'preset']]));
      const jsf = makeJsf({ type: 'string', format: 'date' }, { dataMap });
      buildFormGroupTemplate(jsf);

      expect([...jsf.dataMap.get('')]).toEqual([['schemaType', 'preset']]);
    });
  });

  describe('buildFormGroupTemplate: defensive inputs', () => {

    it('throws when jsf is null', () => {
      expect(() => buildFormGroupTemplate(null)).toThrowError(TypeError);
    });

    it('throws when jsf has no formOptions', () => {
      expect(() => buildFormGroupTemplate({})).toThrowError(TypeError);
    });

    it('throws when the schema is undefined', () => {
      expect(() => buildFormGroupTemplate(makeJsf(undefined))).toThrowError(TypeError);
    });

    it('throws when the schema is null', () => {
      expect(() => buildFormGroupTemplate(makeJsf(null))).toThrowError(TypeError);
    });

    it('throws when the schemaPointer does not resolve', () => {
      const jsf = makeJsf({ type: 'object', properties: { a: { type: 'string' } } });

      expect(() => buildFormGroupTemplate(jsf, null, true, '/properties/nope'))
        .toThrowError(TypeError);
    });
  });

  describe('buildFormGroup', () => {

    it('returns null for null', () => {
      expect(buildFormGroup(null)).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(buildFormGroup(undefined)).toBeNull();
    });

    it('returns null for a string', () => {
      expect(buildFormGroup('nope')).toBeNull();
    });

    it('returns null for an empty template', () => {
      expect(buildFormGroup({})).toBeNull();
    });

    it('returns null for an unrecognised controlType', () => {
      expect(buildFormGroup({ controlType: 'Nope', validators: {} })).toBeNull();
    });

    it('builds a FormControl carrying the template value', () => {
      const control: any = buildFormGroup({
        controlType: 'FormControl', value: { value: 'x', disabled: false }, validators: {},
      });

      expect(control instanceof UntypedFormControl).toBe(true);
      expect(control.value).toBe('x');
      expect(control.valid).toBe(true);
    });

    it('builds a disabled FormControl from the value object', () => {
      const control: any = buildFormGroup({
        controlType: 'FormControl', value: { value: 'x', disabled: true }, validators: {},
      });

      expect(control.value).toBe('x');
      expect(control.disabled).toBe(true);
    });

    it('tolerates a template with no validators key', () => {
      const control: any = buildFormGroup({
        controlType: 'FormControl', value: { value: 'x', disabled: false },
      });

      expect(control.value).toBe('x');
    });

    it('tolerates a null validators object', () => {
      const control: any = buildFormGroup({
        controlType: 'FormControl', value: { value: 'x', disabled: false }, validators: null,
      });

      expect(control.value).toBe('x');
    });

    it('applies a required validator to a FormControl', () => {
      const control: any = buildFormGroup({
        controlType: 'FormControl', value: { value: '', disabled: false },
        validators: { required: [] },
      });

      expect(control.valid).toBe(false);
      expect(control.errors).toEqual({ required: true });
    });

    it('ignores a validator name that is not on JsonValidators', () => {
      const control: any = buildFormGroup({
        controlType: 'FormControl', value: { value: 'x', disabled: false },
        validators: { notARealValidator: [1] },
      });

      expect(control.valid).toBe(true);
    });

    it('applies a failing minLength validator to a FormControl', () => {
      const control: any = buildFormGroup({
        controlType: 'FormControl', value: { value: 'x', disabled: false },
        validators: { minLength: [3] },
      });

      expect(control.errors).toEqual({ minLength: { minimumLength: 3, currentLength: 1 } });
    });

    it('applies several validators to a FormControl', () => {
      const control: any = buildFormGroup({
        controlType: 'FormControl', value: { value: 'xxxxx', disabled: false },
        validators: { minLength: [2], maxLength: [3] },
      });

      expect(control.errors).toEqual({ maxLength: { maximumLength: 3, currentLength: 5 } });
    });

    it('builds a FormGroup from a controls object', () => {
      const group: any = buildFormGroup({
        controlType: 'FormGroup',
        controls: {
          a: { controlType: 'FormControl', value: { value: 'A', disabled: false }, validators: {} },
          b: { controlType: 'FormControl', value: { value: 2, disabled: false }, validators: {} },
        },
        validators: {},
      });

      expect(group instanceof UntypedFormGroup).toBe(true);
      expect(group.value).toEqual({ a: 'A', b: 2 });
    });

    it('drops a child template that builds to null', () => {
      const group: any = buildFormGroup({
        controlType: 'FormGroup',
        controls: {
          a: { controlType: 'FormControl', value: { value: 'A', disabled: false }, validators: {} },
          b: null,
        },
        validators: {},
      });

      expect(Object.keys(group.controls)).toEqual(['a']);
      expect(group.value).toEqual({ a: 'A' });
    });

    it('applies a single group-level validator', () => {
      const group: any = buildFormGroup({
        controlType: 'FormGroup',
        controls: {
          a: { controlType: 'FormControl', value: { value: null, disabled: false }, validators: {} },
        },
        validators: { minProperties: [3] },
      });

      expect(group.valid).toBe(false);
      expect(group.errors).toEqual({ minProperties: { minimumProperties: 3, currentProperties: 0 } });
    });

    it('composes two group-level validators', () => {
      const group: any = buildFormGroup({
        controlType: 'FormGroup',
        controls: {
          a: { controlType: 'FormControl', value: { value: 'x', disabled: false }, validators: {} },
          b: { controlType: 'FormControl', value: { value: 'y', disabled: false }, validators: {} },
        },
        validators: { minProperties: [5], maxProperties: [9] },
      });

      expect(group.valid).toBe(false);
      expect(group.errors).toEqual({ minProperties: { minimumProperties: 5, currentProperties: 2 } });
    });

    it('builds a FormArray from a controls array', () => {
      const array: any = buildFormGroup({
        controlType: 'FormArray',
        controls: [
          { controlType: 'FormControl', value: { value: 'x', disabled: false }, validators: {} },
          { controlType: 'FormControl', value: { value: 'y', disabled: false }, validators: {} },
        ],
        validators: {},
      });

      expect(array instanceof UntypedFormArray).toBe(true);
      expect(array.length).toBe(2);
      expect(array.value).toEqual(['x', 'y']);
    });

    it('filters out array children that build to null', () => {
      const array: any = buildFormGroup({
        controlType: 'FormArray',
        controls: [
          null,
          { controlType: 'FormControl', value: { value: 'y', disabled: false }, validators: {} },
          {},
        ],
        validators: {},
      });

      expect(array.length).toBe(1);
      expect(array.value).toEqual(['y']);
    });

    it('applies an array-level minItems validator', () => {
      const array: any = buildFormGroup({
        controlType: 'FormArray',
        controls: [
          { controlType: 'FormControl', value: { value: 'x', disabled: false }, validators: {} },
        ],
        validators: { minItems: [3] },
      });

      expect(array.valid).toBe(false);
      expect(array.errors).toEqual({ minItems: { minimumItems: 3, currentItems: 1 } });
    });

    it('builds nested groups and arrays', () => {
      const group: any = buildFormGroup({
        controlType: 'FormGroup',
        controls: {
          outer: {
            controlType: 'FormGroup',
            controls: {
              inner: { controlType: 'FormControl', value: { value: 1, disabled: false }, validators: {} },
            },
            validators: {},
          },
          list: {
            controlType: 'FormArray',
            controls: [
              { controlType: 'FormControl', value: { value: 'a', disabled: false }, validators: {} },
            ],
            validators: {},
          },
        },
        validators: {},
      });

      expect(group.value).toEqual({ outer: { inner: 1 }, list: ['a'] });
    });

    it('builds a working FormGroup straight from buildFormGroupTemplate', () => {
      const jsf = makeJsf({
        type: 'object',
        required: ['a'],
        properties: { a: { type: 'string' }, b: { type: 'array', items: { type: 'number' } } },
      });
      const template = buildFormGroupTemplate(jsf, { a: 'hello', b: [1, 2] });
      const group: any = buildFormGroup(template);

      expect(group instanceof UntypedFormGroup).toBe(true);
      expect(group.value).toEqual({ a: 'hello', b: [1, 2] });
      expect(group.valid).toBe(true);
    });
  });

  describe('mergeValues', () => {

    it('returns null when called with no arguments', () => {
      expect(mergeValues()).toBeNull();
    });

    it('returns null when every argument is empty', () => {
      expect(mergeValues(null, undefined, '')).toBeNull();
    });

    it('returns a lone primitive unchanged', () => {
      expect(mergeValues('a')).toBe('a');
    });

    it('lets a later primitive overwrite an earlier one', () => {
      expect(mergeValues(1, 2)).toBe(2);
    });

    it('skips empty values such as 0 and keeps the last non-empty one', () => {
      expect(mergeValues(0, false)).toBe(false);
    });

    it('lets a primitive overwrite an object', () => {
      expect(mergeValues({ a: 1 }, 5)).toBe(5);
    });

    it('lets an object overwrite a primitive', () => {
      expect(mergeValues(5, { a: 1 })).toEqual({ a: 1 });
    });

    it('copies a single object rather than returning it', () => {
      const source: any = { a: 1 };
      const result: any = mergeValues(source);

      expect(result).toEqual({ a: 1 });
      expect(result).not.toBe(source);
    });

    it('merges two objects key by key', () => {
      expect(mergeValues({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
    });

    it('lets the later object win on a shared key', () => {
      expect(mergeValues({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
    });

    it('merges only the top level, replacing nested objects wholesale', () => {
      expect(mergeValues({ a: { x: 1 } }, { a: { y: 2 } })).toEqual({ a: { y: 2 } });
    });

    it('overlays a shorter array onto a longer one', () => {
      expect(mergeValues([1, 2], [3])).toEqual([3, 2]);
    });

    it('overlays a longer array onto a shorter one', () => {
      expect(mergeValues([1], [2, 3])).toEqual([2, 3]);
    });

    it('overlays arrays of arrays without merging their contents', () => {
      expect(mergeValues([[1], [2]], [[3]])).toEqual([[3], [2]]);
    });

    it('copies array indexes onto an object as numeric keys', () => {
      // BUG: isObject() is true for arrays, so the object + array case never
      // reaches the dedicated array branches and Object.assign copies the array
      // indexes across as plain keys instead.
      expect(mergeValues({ a: 1 }, [{ b: 2 }, { c: 3 }]))
        .toEqual({ 0: { b: 2 }, 1: { c: 3 }, a: 1 } as any);
    });

    it('assigns object keys onto an array instead of merging into each entry', () => {
      // BUG: same root cause. The array is kept and the object's keys are pasted
      // onto it as non-index properties, so lines 336 to 359 are unreachable.
      const result: any = mergeValues([{ a: 1 }], { c: 3 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ a: 1 });
      expect(result.c).toBe(3);
    });

    it('ignores an empty object argument', () => {
      expect(mergeValues([1, 2], {})).toEqual([1, 2]);
    });

    it('ignores an empty array argument', () => {
      expect(mergeValues({}, [1, 2])).toEqual([1, 2]);
    });
  });

  describe('setRequiredFields', () => {

    it('sets a required validator for each name in the required array', () => {
      const template: any = {};

      expect(setRequiredFields({ required: ['a', 'b'] }, template)).toBe(true);
      expect(template).toEqual({
        a: { validators: { required: [] } },
        b: { validators: { required: [] } },
      });
    });

    it('writes the validator next to an existing control entry', () => {
      const template: any = { controls: { a: {} } };
      setRequiredFields({ required: ['a'] }, template);

      expect(template.a).toEqual({ validators: { required: [] } });
    });

    it('wraps a bare string required value in an array', () => {
      const template: any = {};

      expect(setRequiredFields({ required: 'a' }, template)).toBe(true);
      expect(template).toEqual({ a: { validators: { required: [] } } });
    });

    it('stringifies a boolean required value into a key', () => {
      // BUG: `required: true` is a draft-3 style flag, but it is wrapped in an
      // array and used as a property name, producing a control called "true".
      const template: any = {};

      expect(setRequiredFields({ required: true }, template)).toBe(true);
      expect(template).toEqual({ true: { validators: { required: [] } } });
    });

    it('returns false and changes nothing when there is no required key', () => {
      const template: any = {};

      expect(setRequiredFields({ type: 'object' }, template)).toBe(false);
      expect(template).toEqual({});
    });

    it('returns false for an empty required array', () => {
      const template: any = {};

      expect(setRequiredFields({ required: [] }, template)).toBe(false);
      expect(template).toEqual({});
    });

    it('returns false for a null schema', () => {
      expect(setRequiredFields(null, {})).toBe(false);
    });

    it('returns false for an undefined schema', () => {
      expect(setRequiredFields(undefined, {})).toBe(false);
    });

    it('throws when the template is null and there are required fields', () => {
      expect(() => setRequiredFields({ required: ['a'] }, null)).toThrowError(TypeError);
    });
  });

  describe('formatFormData', () => {

    let errorSpy: jasmine.Spy;

    beforeEach(() => {
      errorSpy = spyOn(console, 'error');
    });

    it('returns a non-object input unchanged', () => {
      expect(formatFormData('str', noMap, noMap, noMap)).toBe('str');
      expect(formatFormData(7, noMap, noMap, noMap)).toBe(7);
      expect(formatFormData(null, noMap, noMap, noMap)).toBeNull();
      expect(formatFormData(undefined, noMap, noMap, noMap)).toBeUndefined();
    });

    it('converts a string to an integer', () => {
      const dataMap = makeDataMap({ '/n': { schemaType: 'integer' } });

      expect(formatFormData({ n: '42' }, dataMap, noMap, noMap)).toEqual({ n: 42 });
    });

    it('converts a string to a number', () => {
      const dataMap = makeDataMap({ '/n': { schemaType: 'number' } });

      expect(formatFormData({ n: '4.5' }, dataMap, noMap, noMap)).toEqual({ n: 4.5 });
    });

    it('converts a string to a boolean', () => {
      const dataMap = makeDataMap({ '/b': { schemaType: 'boolean' } });

      expect(formatFormData({ b: 'true' }, dataMap, noMap, noMap)).toEqual({ b: true });
    });

    it('converts a number to a string', () => {
      const dataMap = makeDataMap({ '/s': { schemaType: 'string' } });

      expect(formatFormData({ s: 12 }, dataMap, noMap, noMap)).toEqual({ s: '12' });
    });

    it('accepts an array of schema types', () => {
      const dataMap = makeDataMap({ '/a': { schemaType: ['string', 'null'] } });

      expect(formatFormData({ a: 5 }, dataMap, noMap, noMap)).toEqual({ a: '5' });
    });

    it('keeps a false boolean and a zero number', () => {
      const dataMap = makeDataMap({ '/a': { schemaType: 'boolean' }, '/b': { schemaType: 'number' } });

      expect(formatFormData({ a: false, b: 0 }, dataMap, noMap, noMap)).toEqual({ a: false, b: 0 });
    });

    it('forces a null schemaType to null whatever the value was', () => {
      const dataMap = makeDataMap({ '/z': { schemaType: 'null' } });

      expect(formatFormData({ z: 'anything' }, dataMap, noMap, noMap)).toEqual({ z: null });
    });

    it('drops a value that cannot be converted when fixErrors is off', () => {
      const dataMap = makeDataMap({ '/n': { schemaType: 'integer' } });

      expect(formatFormData({ n: 'abc' }, dataMap, noMap, noMap)).toEqual({});
    });

    it('coerces a value that cannot be converted when fixErrors is on', () => {
      const dataMap = makeDataMap({ '/n': { schemaType: 'integer' } });

      expect(formatFormData({ n: 'abc' }, dataMap, noMap, noMap, false, true)).toEqual({ n: 0 });
    });

    it('drops an empty string by default', () => {
      const dataMap = makeDataMap({ '/s': { schemaType: 'string' } });

      expect(formatFormData({ s: '' }, dataMap, noMap, noMap)).toEqual({});
    });

    it('keeps an empty string when returnEmptyFields is on', () => {
      const dataMap = makeDataMap({ '/s': { schemaType: 'string' } });

      expect(formatFormData({ s: '' }, dataMap, noMap, noMap, true)).toEqual({ s: '' });
    });

    it('turns a null string field into an empty string when returnEmptyFields is on', () => {
      const dataMap = makeDataMap({ '/s': { schemaType: 'string' } });

      expect(formatFormData({ s: null }, dataMap, noMap, noMap, true)).toEqual({ s: '' });
    });

    it('drops empty arrays and objects by default', () => {
      const dataMap = makeDataMap({
        '/arr': { schemaType: 'array' }, '/obj': { schemaType: 'object' },
      });

      expect(formatFormData({ arr: [], obj: {} }, dataMap, noMap, noMap)).toEqual({});
    });

    it('keeps empty arrays and objects when returnEmptyFields is on', () => {
      const dataMap = makeDataMap({
        '/arr': { schemaType: 'array' }, '/obj': { schemaType: 'object' },
      });

      expect(formatFormData({ arr: [], obj: {} }, dataMap, noMap, noMap, true))
        .toEqual({ arr: [], obj: {} });
    });

    it('drops a value whose schemaType is a container type', () => {
      const dataMap = makeDataMap({ '/a': { schemaType: 'array' } });

      expect(formatFormData({ a: ['x'] }, dataMap, noMap, noMap)).toEqual({});
    });

    it('drops a value whose dataMap entry has no schemaType', () => {
      const dataMap = makeDataMap({ '/a': { schemaPointer: '/properties/a' } });

      expect(formatFormData({ a: 'v' }, dataMap, noMap, noMap)).toEqual({});
    });

    it('walks into nested objects', () => {
      const dataMap = makeDataMap({
        '/o': { schemaType: 'object' }, '/o/n': { schemaType: 'integer' },
      });

      expect(formatFormData({ o: { n: '3' } }, dataMap, noMap, noMap)).toEqual({ o: { n: 3 } });
    });

    it('returns an array when the form data is an array', () => {
      const dataMap = makeDataMap({
        '/0': { schemaType: 'integer' }, '/1': { schemaType: 'integer' },
      });
      const result: any = formatFormData(['1', '2'], dataMap, noMap, noMap);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([1, 2]);
    });

    it('uses the arrayMap to find the generic pointer of an array item', () => {
      const dataMap = makeDataMap({
        '': { schemaType: 'object' },
        '/list': { schemaType: 'array' },
        '/list/-': { schemaType: 'object' },
        '/list/-/n': { schemaType: 'integer' },
      });
      const arrayMap: any = new Map([['/list', 0]]);

      expect(formatFormData({ list: [{ n: '1' }, { n: '2' }] }, dataMap, noMap, arrayMap))
        .toEqual({ list: [{ n: 1 }, { n: 2 }] });
    });

    it('serialises a Date value through the string schema type', () => {
      // Built from local date parts, because toIsoString reads getFullYear,
      // getMonth and getDate, all of which are timezone dependent.
      const dataMap = makeDataMap({ '/d': { schemaType: 'string' } });
      const result: any = formatFormData({ d: new Date(2000, 2, 14) }, dataMap, noMap, noMap);

      expect(result.d).toBe('2000-03-14');
    });

    it('appends Z to a date-time missing its timezone', () => {
      const dataMap = makeDataMap({ '/d': { schemaType: 'string', schemaFormat: 'date-time' } });

      expect(formatFormData({ d: '2000-03-14T01:59:26.535' }, dataMap, noMap, noMap))
        .toEqual({ d: '2000-03-14T01:59:26.535Z' });
    });

    it('appends :00Z to a date-time missing its seconds', () => {
      const dataMap = makeDataMap({ '/d': { schemaType: 'string', schemaFormat: 'date-time' } });

      expect(formatFormData({ d: '2000-03-14T01:59' }, dataMap, noMap, noMap))
        .toEqual({ d: '2000-03-14T01:59:00Z' });
    });

    it('accepts a space instead of T as the date-time separator', () => {
      const dataMap = makeDataMap({ '/d': { schemaType: 'string', schemaFormat: 'date-time' } });

      expect(formatFormData({ d: '2000-03-14 01:59' }, dataMap, noMap, noMap))
        .toEqual({ d: '2000-03-14 01:59:00Z' });
    });

    it('leaves a complete date-time alone', () => {
      const dataMap = makeDataMap({ '/d': { schemaType: 'string', schemaFormat: 'date-time' } });

      expect(formatFormData({ d: '2000-03-14T01:59:26.535Z' }, dataMap, noMap, noMap))
        .toEqual({ d: '2000-03-14T01:59:26.535Z' });
    });

    it('leaves a bare date alone when fixErrors is off', () => {
      const dataMap = makeDataMap({ '/d': { schemaType: 'string', schemaFormat: 'date-time' } });

      expect(formatFormData({ d: '2000-03-14' }, dataMap, noMap, noMap))
        .toEqual({ d: '2000-03-14' });
    });

    it('builds an invalid date-time when fixing a bare date', () => {
      // BUG: the comment above the branch says it should append 'T00:00:00Z', but
      // the template literal appends ':00:00:00Z', producing '2000-03-14:00:00:00Z'.
      const dataMap = makeDataMap({ '/d': { schemaType: 'string', schemaFormat: 'date-time' } });

      expect(formatFormData({ d: '2000-03-14' }, dataMap, noMap, noMap, false, true))
        .toEqual({ d: '2000-03-14:00:00:00Z' });
    });

    it('logs an error and drops a primitive with no dataMap entry', () => {
      expect(formatFormData({ x: 'y' }, noMap, noMap, noMap)).toEqual({});
      expect(errorSpy).toHaveBeenCalled();
    });

    it('logs only for the leaf value when a nested object has no dataMap entry', () => {
      // The containing object skips the error branch (its value is an object),
      // so only the leaf number reaches the console.error block.
      expect(formatFormData({ x: { y: 1 } }, noMap, noMap, noMap)).toEqual({});
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('getControl', () => {

    let errorSpy: jasmine.Spy;
    let group: UntypedFormGroup;
    let template: any;

    beforeEach(() => {
      errorSpy = spyOn(console, 'error');
      group = new UntypedFormGroup({
        a: new UntypedFormControl('A'),
        g: new UntypedFormGroup({ b: new UntypedFormControl('B') }),
        arr: new UntypedFormArray([
          new UntypedFormControl('one'), new UntypedFormControl('two'),
        ]),
      });
      template = {
        controlType: 'FormGroup',
        controls: {
          a: { controlType: 'FormControl', value: 'A' },
          g: {
            controlType: 'FormGroup',
            controls: { b: { controlType: 'FormControl', value: 'B' } },
          },
          arr: {
            controlType: 'FormArray',
            controls: [{ controlType: 'FormControl', value: 'one' }],
          },
        },
      };
    });

    it('returns a top level control of a real FormGroup', () => {
      const control: any = getControl(group, '/a');

      expect(control instanceof UntypedFormControl).toBe(true);
      expect(control.value).toBe('A');
    });

    it('returns a nested control of a real FormGroup', () => {
      expect(getControl(group, '/g/b').value).toBe('B');
    });

    it('returns the containing group when returnGroup is true', () => {
      const control: any = getControl(group, '/g/b', true);

      expect(control instanceof UntypedFormGroup).toBe(true);
      expect(control.value).toEqual({ b: 'B' });
    });

    it('returns the root group when returnGroup is used on a top level control', () => {
      expect(getControl(group, '/a', true)).toBe(group as any);
    });

    it('returns the group itself for the empty root pointer', () => {
      expect(getControl(group, '')).toBe(group as any);
    });

    it('accepts an array pointer', () => {
      expect(getControl(group, ['g', 'b']).value).toBe('B');
    });

    it('returns the group itself for an empty array pointer', () => {
      expect(getControl(group, [])).toBe(group as any);
    });

    it('falls back to dot notation when the pointer is not a JSON pointer', () => {
      expect(getControl(group, 'g.b').value).toBe('B');
    });

    it('returns null for a dot path that matches nothing', () => {
      expect(getControl(group, 'nope.nope')).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('resolves an indexed FormArray item', () => {
      expect(getControl(group, '/arr/0').value).toBe('one');
    });

    it('resolves the last FormArray item for the - key', () => {
      expect(getControl(group, '/arr/-').value).toBe('two');
    });

    it('works when the root is a FormArray', () => {
      const array = new UntypedFormArray([new UntypedFormControl('z')]);

      expect(getControl(array, '/0').value).toBe('z');
      expect(getControl(array, '/-').value).toBe('z');
    });

    it('returns undefined and logs when a key is missing', () => {
      // BUG: the failure path ends in a bare `return;`, so a missing control comes
      // back as undefined here while the invalid-input paths return null.
      expect(getControl(group, '/missing')).toBeUndefined();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('walks a key that contains a dot instead of using formGroup.get', () => {
      const dotted: any = { controls: { 'a.b': { controlType: 'FormControl', value: 1 } } };

      expect(getControl(dotted, ['a.b'])).toEqual({ controlType: 'FormControl', value: 1 });
    });

    it('reads a control out of a formGroup template', () => {
      expect(getControl(template, '/a')).toEqual({ controlType: 'FormControl', value: 'A' });
    });

    it('reads a nested control out of a formGroup template', () => {
      expect(getControl(template, '/g/b')).toEqual({ controlType: 'FormControl', value: 'B' });
    });

    it('reads the containing group out of a formGroup template', () => {
      expect(getControl(template, '/g/b', true)).toEqual({
        controlType: 'FormGroup',
        controls: { b: { controlType: 'FormControl', value: 'B' } },
      });
    });

    it('reads the last entry of a template FormArray', () => {
      expect(getControl(template, '/arr/-')).toEqual({ controlType: 'FormControl', value: 'one' });
    });

    it('reads the last entry when the template controls are a bare array', () => {
      const bare: any = {
        controls: [
          { controlType: 'FormControl', value: 1 },
          { controlType: 'FormControl', value: 2 },
        ],
      };

      expect(getControl(bare, '/-')).toEqual({ controlType: 'FormControl', value: 2 });
    });

    it('returns undefined and logs for a missing key in a template', () => {
      expect(getControl(template, '/zzz')).toBeUndefined();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('returns null when the formGroup is not an object', () => {
      expect(getControl(null, '/a')).toBeNull();
      expect(getControl(undefined, '/a')).toBeNull();
      expect(getControl('nope', '/a')).toBeNull();
    });

    it('returns null for a pointer that is neither a JSON pointer nor a matching path', () => {
      expect(getControl(group, 'not a pointer')).toBeNull();
    });

    it('returns null for a non-string, non-array pointer', () => {
      expect(getControl(group, 5 as any)).toBeNull();
      expect(getControl(group, undefined)).toBeNull();
    });

    it('throws on a dot path when the subject has no get method', () => {
      // BUG: formGroup.get is called before checking that it exists, so passing a
      // formGroup template plus a dot path throws instead of logging and
      // returning null the way the invalid-pointer path is meant to.
      expect(() => getControl(template, 'a.b')).toThrowError(TypeError);
    });
  });
});

describe('buildFormGroupTemplate, keys needing escaping', () => {
  // A key holding / or ~ produced a pointer isJsonPointer rejects, so compile()
  // returned null and the whole form failed to build rather than one field.
  it('builds a control for a key containing a tilde', () => {
    const result: any = buildFormGroupTemplate(makeJsf({
      type: 'object', properties: { 'a~b': { type: 'string' } },
    }));
    expect(Object.keys(result.controls)).toContain('a~b');
  });

  it('builds a control for a key containing a slash', () => {
    const result: any = buildFormGroupTemplate(makeJsf({
      type: 'object', properties: { 'a/b': { type: 'string' } },
    }));
    expect(Object.keys(result.controls)).toContain('a/b');
  });

  it('marks such a key required without corrupting the pointer', () => {
    const result: any = buildFormGroupTemplate(makeJsf({
      type: 'object', required: ['a/b'], properties: { 'a/b': { type: 'string' } },
    }));
    expect(result.controls['a/b'].validators.required).toEqual([]);
  });
});
