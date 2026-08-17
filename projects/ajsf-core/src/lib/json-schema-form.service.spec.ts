import { TestBed } from '@angular/core/testing';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';

import { JsonSchemaFormModule } from './json-schema-form.module';
import { JsonSchemaFormService } from './json-schema-form.service';
import { WidgetLibraryService } from './widget-library/widget-library.service';
import { convertSchemaToDraft6, resolveSchemaReferences } from './shared';

/**
 * Characterization tests for JsonSchemaFormService.
 *
 * These pin the behaviour the service has today, bugs included. Anything that
 * looks wrong is still asserted exactly as it really behaves and flagged with a
 * `// BUG:` comment.
 *
 * JsonSchemaFormService is declared `@Injectable()` with no `providedIn`, and
 * the only place that provides it is JsonSchemaFormComponent. So it has to be
 * listed in `providers` here; importing JsonSchemaFormModule alone is not
 * enough. JsonSchemaFormModule is imported from the source path (never dist)
 * for the same reason corpus.spec.ts does: this project is @ajsf/core itself,
 * and mixing the two copies produces NG0300.
 */
describe('JsonSchemaFormService', () => {
  let jsf: JsonSchemaFormService;
  let widgetLibrary: WidgetLibraryService;

  /** Deep clone, kept independent of the library's own cloneDeep. */
  const clone = (value: any): any => JSON.parse(JSON.stringify(value));

  /**
   * Replays the sequence JsonSchemaFormComponent runs in initializeSchema() and
   * activateForm(), minus the parts that need a rendered component. Everything
   * downstream (layout, formGroupTemplate, formGroup, dataMap, arrayMap) is
   * produced by the real code paths.
   */
  function buildForm(schema: any, layout: any[] = null, formValues: any = null): void {
    jsf.resetAllValues();
    jsf.schema = convertSchemaToDraft6(clone(schema));
    jsf.compileAjvSchema();
    jsf.schema = resolveSchemaReferences(
      jsf.schema,
      jsf.schemaRefLibrary,
      jsf.schemaRecursiveRefMap,
      jsf.dataRecursiveRefMap,
      jsf.arrayMap
    );
    jsf.layout = layout ? clone(layout) : ['*'];
    jsf.formValues = formValues || {};
    jsf.buildLayout(widgetLibrary);
    jsf.buildFormGroupTemplate(jsf.formValues);
    jsf.buildFormGroup();
  }

  const personSchema: any = {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name', minLength: 3 },
      age: { type: 'integer' },
      tags: { type: 'array', title: 'Tag {{idx}}', items: { type: 'string' } },
    },
    required: ['name'],
  };

  /** Index of a top level layout node, by its name. */
  const nodeIndex = (name: string): number =>
    jsf.layout.findIndex((node: any) => node.name === name);

  /** A widget context object of the shape the widget components build. */
  const ctxFor = (name: string): any => {
    const index = nodeIndex(name);
    return { layoutNode: jsf.layout[index], dataIndex: [], layoutIndex: [index] };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [JsonSchemaFormModule],
      providers: [JsonSchemaFormService],
    });
    jsf = TestBed.inject(JsonSchemaFormService);
    widgetLibrary = TestBed.inject(WidgetLibraryService);
    jsf.resetAllValues();
  });

  // ---------------------------------------------------------------------------
  describe('a newly constructed service, before resetAllValues', () => {
    // A direct `new` is used here because the shared beforeEach already reset
    // the injected instance. The constructor takes no arguments, so this is the
    // same object DI would hand out.
    let raw: JsonSchemaFormService;

    beforeEach(() => {
      raw = new JsonSchemaFormService();
    });

    it('leaves formOptions undefined until resetAllValues runs', () => {
      // BUG: `formOptions` has no field initializer, so every method that reads
      // it (setOptions, initializeControl, validateData) fails on a service that
      // has not been reset yet.
      expect(raw.formOptions).toBeUndefined();
    });

    it('throws from setOptions because formOptions is still undefined', () => {
      // BUG: same root cause as above.
      expect(() => raw.setOptions({ debug: true })).toThrowError(TypeError);
    });

    it('starts with empty data, schema and layout', () => {
      expect(raw.data).toEqual({});
      expect(raw.schema).toEqual({});
      expect(raw.layout).toEqual([]);
    });

    it('starts with a layoutRefLibrary that holds a single null root entry', () => {
      expect(raw.layoutRefLibrary).toEqual({ '': null });
    });

    it('starts with no compiled validator and an unknown validity', () => {
      expect(raw.validateFormData).toBeNull();
      expect(raw.isValid).toBeNull();
      expect(raw.validData).toBeNull();
      expect(raw.formGroup).toBeNull();
    });

    it('loads the English validation messages from the constructor', () => {
      expect(raw.language).toEqual('en-US');
      expect(raw.defaultFormOptions.defautWidgetOptions.validationMessages.required)
        .toEqual('This field is required.');
    });
  });

  // ---------------------------------------------------------------------------
  describe('setLanguage', () => {
    it('uses the two letter prefix to pick the message set', () => {
      jsf.setLanguage('fr-FR');
      expect(jsf.language).toEqual('fr-FR');
      expect(jsf.defaultFormOptions.defautWidgetOptions.validationMessages.required)
        .toEqual('Est obligatoire.');
    });

    it('accepts a bare two letter code', () => {
      jsf.setLanguage('de');
      expect(jsf.defaultFormOptions.defautWidgetOptions.validationMessages.required)
        .toEqual('Darf nicht leer sein');
    });

    it('falls back to English when called with no argument', () => {
      jsf.setLanguage('zh');
      jsf.setLanguage();
      expect(jsf.language).toEqual('en-US');
      expect(jsf.defaultFormOptions.defautWidgetOptions.validationMessages.required)
        .toEqual('This field is required.');
    });

    it('wipes the validation messages for an unsupported language', () => {
      // BUG: an unknown language code looks up `undefined` and cloneDeep passes
      // it straight through, so every field loses its messages instead of
      // falling back to English.
      jsf.setLanguage('xx-XX');
      expect(jsf.language).toEqual('xx-XX');
      expect(jsf.defaultFormOptions.defautWidgetOptions.validationMessages).toBeUndefined();
    });

    it('copies the messages rather than sharing the locale object', () => {
      jsf.setLanguage('en-US');
      const messages = jsf.defaultFormOptions.defautWidgetOptions.validationMessages;
      messages.required = 'mutated';
      jsf.setLanguage('en-US');
      expect(jsf.defaultFormOptions.defautWidgetOptions.validationMessages.required)
        .toEqual('This field is required.');
    });

    it('is picked up by the next resetAllValues', () => {
      jsf.setLanguage('de');
      jsf.resetAllValues();
      expect(jsf.formOptions.defautWidgetOptions.validationMessages.required)
        .toEqual('Darf nicht leer sein');
    });
  });

  // ---------------------------------------------------------------------------
  describe('getData, getSchema and getLayout', () => {
    it('returns the live data object', () => {
      jsf.data = { a: 1 };
      expect(jsf.getData()).toBe(jsf.data);
      expect(jsf.getData()).toEqual({ a: 1 });
    });

    it('returns the live schema object', () => {
      jsf.schema = { type: 'object' };
      expect(jsf.getSchema()).toBe(jsf.schema);
    });

    it('returns the live layout array', () => {
      jsf.layout = ['*'];
      expect(jsf.getLayout()).toBe(jsf.layout);
    });

    it('returns the built schema and layout after a form is built', () => {
      buildForm(personSchema, null, { name: 'Bob' });
      expect(jsf.getSchema().type).toEqual('object');
      expect(Array.isArray(jsf.getLayout())).toBe(true);
      expect(jsf.getData()).toEqual(jasmine.objectContaining({ name: 'Bob' }));
    });
  });

  // ---------------------------------------------------------------------------
  describe('resetAllValues', () => {
    it('clears the schema, layout, formGroup and data', () => {
      buildForm(personSchema, null, { name: 'Bob' });
      jsf.resetAllValues();

      expect(jsf.schema).toEqual({});
      expect(jsf.layout).toEqual([]);
      expect(jsf.formGroup).toBeNull();
      expect(jsf.formGroupTemplate).toEqual({});
      expect(jsf.data).toEqual({});
      expect(jsf.formValues).toEqual({});
      expect(jsf.validData).toBeNull();
      expect(jsf.isValid).toBeNull();
      expect(jsf.validationErrors).toBeNull();
      expect(jsf.validateFormData).toBeNull();
      expect(jsf.framework).toBeNull();
    });

    it('replaces the four lookup maps with empty ones', () => {
      buildForm(personSchema, null, { name: 'Bob', tags: ['x'] });
      expect(jsf.arrayMap.size).toBeGreaterThan(0);
      expect(jsf.dataMap.size).toBeGreaterThan(0);

      jsf.resetAllValues();

      expect(jsf.arrayMap.size).toEqual(0);
      expect(jsf.dataMap.size).toEqual(0);
      expect(jsf.dataRecursiveRefMap.size).toEqual(0);
      expect(jsf.schemaRecursiveRefMap.size).toEqual(0);
    });

    it('clears the three ref libraries and drops the root layoutRefLibrary key', () => {
      jsf.resetAllValues();
      expect(jsf.layoutRefLibrary).toEqual({});
      expect(jsf.schemaRefLibrary).toEqual({});
      expect(jsf.templateRefLibrary).toEqual({});
    });

    it('clears the three compatibility flags and tpldata', () => {
      jsf.JsonFormCompatibility = true;
      jsf.ReactJsonSchemaFormCompatibility = true;
      jsf.AngularSchemaFormCompatibility = true;
      jsf.setTpldata({ a: 1 });

      jsf.resetAllValues();

      expect(jsf.JsonFormCompatibility).toBe(false);
      expect(jsf.ReactJsonSchemaFormCompatibility).toBe(false);
      expect(jsf.AngularSchemaFormCompatibility).toBe(false);
      expect(jsf.tpldata).toEqual({});
    });

    it('gives formOptions a fresh copy of defaultFormOptions', () => {
      jsf.resetAllValues();
      expect(jsf.formOptions).not.toBe(jsf.defaultFormOptions);
      expect(jsf.formOptions.addSubmit).toEqual('auto');
      expect(jsf.formOptions.defautWidgetOptions).not.toBe(
        jsf.defaultFormOptions.defautWidgetOptions
      );
    });

    it('leaves ajvErrors, dataErrors and hasRootReference behind', () => {
      // BUG: resetAllValues resets validationErrors but not ajvErrors, and it
      // never clears dataErrors or hasRootReference, so stale state survives a
      // form reload.
      jsf.ajvErrors = [{ dataPath: '/x' }];
      jsf.dataErrors.set('/x', 'boom');
      jsf.hasRootReference = true;

      jsf.resetAllValues();

      expect(jsf.ajvErrors).toEqual([{ dataPath: '/x' }]);
      expect(jsf.dataErrors.size).toEqual(1);
      expect(jsf.hasRootReference).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  describe('setOptions', () => {
    it('assigns top level options onto formOptions', () => {
      jsf.setOptions({ addSubmit: false, debug: true });
      expect(jsf.formOptions.addSubmit).toBe(false);
      expect(jsf.formOptions.debug).toBe(true);
    });

    it('folds the legacy defaultOptions key into defautWidgetOptions', () => {
      jsf.setOptions({ defaultOptions: { notitle: true } });
      expect(jsf.formOptions.defautWidgetOptions.notitle).toBe(true);
      expect('defaultOptions' in jsf.formOptions).toBe(false);
    });

    it('merges defautWidgetOptions without replacing the whole object', () => {
      jsf.setOptions({ defautWidgetOptions: { feedback: true } });
      expect(jsf.formOptions.defautWidgetOptions.feedback).toBe(true);
      expect(jsf.formOptions.defautWidgetOptions.addable).toBe(true);
    });

    it('converts disableErrorState and disableSuccessState to their enable form', () => {
      jsf.setOptions({
        defautWidgetOptions: { disableErrorState: true, disableSuccessState: false },
      });
      expect(jsf.formOptions.defautWidgetOptions.enableErrorState).toBe(false);
      expect(jsf.formOptions.defautWidgetOptions.enableSuccessState).toBe(true);
      expect('disableErrorState' in jsf.formOptions.defautWidgetOptions).toBe(false);
      expect('disableSuccessState' in jsf.formOptions.defautWidgetOptions).toBe(false);
    });

    it('copies the incoming options instead of keeping a reference', () => {
      const incoming: any = { widgets: { custom: 'x' } };
      jsf.setOptions(incoming);
      expect(jsf.formOptions.widgets).not.toBe(incoming.widgets);
      expect(jsf.formOptions.widgets).toEqual({ custom: 'x' });
    });

    it('ignores null, undefined, strings and numbers', () => {
      const before = JSON.stringify(Object.keys(jsf.formOptions));
      jsf.setOptions(null);
      jsf.setOptions(undefined);
      jsf.setOptions('nope');
      jsf.setOptions(5);
      jsf.setOptions(true);
      expect(JSON.stringify(Object.keys(jsf.formOptions))).toEqual(before);
    });

    it('accepts an array without changing anything, because isObject allows arrays', () => {
      jsf.setOptions([]);
      expect(jsf.formOptions.addSubmit).toEqual('auto');
    });

    it('can be called repeatedly, later calls winning', () => {
      jsf.setOptions({ framework: 'a' });
      jsf.setOptions({ framework: 'b' });
      expect(jsf.formOptions.framework).toEqual('b');
    });
  });

  // ---------------------------------------------------------------------------
  describe('compileAjvSchema', () => {
    it('throws on a schema that has no properties key', () => {
      // BUG: the 'ui:order' check reads `this.schema.properties['ui:order']`
      // without checking that `properties` exists, so a bare
      // `{ type: 'object' }` schema (which the component passes through
      // untouched) crashes before ajv is ever called.
      jsf.schema = { type: 'object' };
      expect(() => jsf.compileAjvSchema()).toThrowError(TypeError);
    });

    it('throws on the empty schema left by resetAllValues', () => {
      expect(() => jsf.compileAjvSchema()).toThrowError(TypeError);
    });

    it('compiles a valid schema into a callable validator', () => {
      jsf.schema = { type: 'object', properties: { a: { type: 'string' } } };
      jsf.compileAjvSchema();
      expect(typeof jsf.validateFormData).toEqual('function');
      expect(jsf.validateFormData({ a: 'x' })).toBe(true);
      expect(jsf.validateFormData({ a: 1 })).toBe(false);
    });

    it('moves a ui:order array out of properties and onto the schema root', () => {
      jsf.schema = {
        type: 'object',
        properties: { 'ui:order': ['b', 'a'], a: { type: 'string' }, b: { type: 'string' } },
      };
      jsf.compileAjvSchema();
      expect(jsf.schema['ui:order']).toEqual(['b', 'a']);
      expect('ui:order' in jsf.schema.properties).toBe(false);
    });

    it('leaves a non array ui:order property alone', () => {
      jsf.schema = {
        type: 'object',
        properties: { 'ui:order': { a: 1 }, a: { type: 'string' } },
      };
      jsf.compileAjvSchema();
      expect(jsf.schema['ui:order']).toBeUndefined();
      expect(jsf.schema.properties['ui:order']).toEqual({ a: 1 });
    });

    it('does not recompile once a validator exists', () => {
      jsf.schema = { type: 'object', properties: { a: { type: 'string' } } };
      jsf.compileAjvSchema();
      const first = jsf.validateFormData;
      jsf.schema = { type: 'object', properties: { b: { type: 'number' } } };
      jsf.compileAjvSchema();
      expect(jsf.validateFormData).toBe(first);
    });
  });

  // ---------------------------------------------------------------------------
  describe('validateData', () => {
    it('throws when no schema has been compiled yet', () => {
      spyOn(console, 'error');
      expect(() => jsf.validateData({ a: 1 })).toThrowError(TypeError);
    });

    it('marks valid data as valid and mirrors it into validData', () => {
      buildForm(personSchema, null, { name: 'Bob', age: 42, tags: ['x'] });
      jsf.validateData({ name: 'Bobby', age: 42, tags: ['x'] });

      expect(jsf.isValid).toBe(true);
      expect(jsf.validData).toBe(jsf.data);
      expect(jsf.data).toEqual({ name: 'Bobby', age: 42, tags: ['x'] });
      expect(jsf.validationErrors).toEqual({});
      expect(jsf.ajvErrors).toBeNull();
    });

    it('collects ajv errors keyed by instance path when the data is invalid', () => {
      buildForm(personSchema, null, { name: 'Bob' });
      jsf.validateData({ name: 'x', age: 1, tags: [] });

      expect(jsf.isValid).toBe(false);
      expect(jsf.validData).toBeNull();
      expect(Object.keys(jsf.validationErrors)).toEqual(['/name']);
      expect(jsf.validationErrors['/name'].length).toEqual(1);
      expect(Array.isArray(jsf.ajvErrors)).toBe(true);
      // ajv 8 renamed dataPath to instancePath. Both are JSON pointers, so the
      // validationErrors keys above are unchanged, but the raw error objects
      // reach consumers through the validationErrors output.
      expect(jsf.ajvErrors[0].instancePath).toEqual('/name');
      expect(jsf.ajvErrors[0].keyword).toEqual('minLength');
    });

    it('emits on dataChanges, isValidChanges and validationErrorChanges', () => {
      buildForm(personSchema, null, { name: 'Bob' });
      const seen: any = { data: null, valid: null, errors: 'untouched' };
      jsf.dataChanges.subscribe(value => (seen.data = value));
      jsf.isValidChanges.subscribe(value => (seen.valid = value));
      jsf.validationErrorChanges.subscribe(value => (seen.errors = value));

      jsf.validateData({ name: 'Bobby' });

      expect(seen.data).toEqual({ name: 'Bobby' });
      expect(seen.valid).toBe(true);
      expect(seen.errors).toBeNull();
    });

    it('skips the observables when updateSubscriptions is false', () => {
      buildForm(personSchema, null, { name: 'Bob' });
      let emissions = 0;
      jsf.dataChanges.subscribe(() => emissions++);
      jsf.isValidChanges.subscribe(() => emissions++);
      jsf.validationErrorChanges.subscribe(() => emissions++);

      jsf.validateData({ name: 'Bobby' }, false);

      expect(emissions).toEqual(0);
      expect(jsf.isValid).toBe(true);
    });

    it('drops empty arrays and objects because returnEmptyFields is read off the wrong level', () => {
      // BUG: the default lives at formOptions.defautWidgetOptions.returnEmptyFields,
      // but validateData reads formOptions.returnEmptyFields, which is undefined.
      // formatFormData therefore always runs with returnEmptyFields falsy.
      buildForm(personSchema, null, { name: 'Bob' });
      expect(jsf.formOptions.returnEmptyFields).toBeUndefined();
      expect(jsf.formOptions.defautWidgetOptions.returnEmptyFields).toBe(true);

      jsf.validateData({ name: 'Bobby', age: null, tags: [] });

      expect(jsf.data).toEqual({ name: 'Bobby' });
    });

    it('keeps empty containers once returnEmptyFields is set at the top level', () => {
      buildForm(
        { type: 'object', properties: { a: { type: 'string' }, list: { type: 'array', items: { type: 'string' } } } },
        null,
        {}
      );
      jsf.formOptions.returnEmptyFields = true;
      jsf.validateData(jsf.formGroup.value);
      expect(jsf.data).toEqual({ a: '', list: [''] });
    });

    it('runs again whenever the formGroup value changes', () => {
      buildForm(personSchema, null, { name: 'Bobby' });
      expect(jsf.isValid).toBe(true);

      jsf.formGroup.get('name').setValue('Al');

      expect(jsf.isValid).toBe(false);
      expect(jsf.data.name).toEqual('Al');
    });
  });

  // ---------------------------------------------------------------------------
  describe('buildLayout', () => {
    it('expands a "*" layout into one node per schema property plus a submit button', () => {
      buildForm(personSchema, null, { name: 'Bob' });
      const types = jsf.layout.map((node: any) => node.type);
      expect(types).toEqual(['text', 'integer', 'array', 'submit']);
      expect(jsf.layout.map((node: any) => node.name))
        .toEqual(['name', 'age', 'tags', undefined]);
    });

    it('attaches a widget and a dataPointer to each control node', () => {
      buildForm(personSchema, null, { name: 'Bob' });
      const nameNode: any = jsf.layout[0];
      expect(nameNode.dataPointer).toEqual('/name');
      expect(nameNode.dataType).toEqual('string');
      expect(nameNode.widget).toBeDefined();
      expect(nameNode.options.title).toEqual('Name');
      expect(nameNode.options.minLength).toEqual(3);
      expect(nameNode.required).toBe(true);
    });

    it('honours an explicit layout and drops the properties it does not mention', () => {
      buildForm(personSchema, [{ key: 'age', title: 'Years' }], {});
      expect(jsf.layout.map((node: any) => node.name)).toEqual(['age', undefined]);
      expect(jsf.layout[0].type).toEqual('integer');
      expect(jsf.layout[0].options.title).toEqual('Years');
    });

    it('falls back to a known widget type when the layout names an unknown one', () => {
      buildForm({ type: 'object', properties: { a: { type: 'string' } } },
        [{ key: 'a', type: 'no-such-widget' }], {});
      expect(jsf.layout[0].type).toEqual('text');
      expect(jsf.layout[0].widget).toBeDefined();
    });

    it('builds one item node per array value plus a trailing $ref add button', () => {
      buildForm(personSchema, null, { name: 'Bob', tags: ['x', 'y'] });
      const tags: any = jsf.layout[nodeIndex('tags')];
      expect(tags.items.length).toEqual(3);
      expect(tags.items.map((item: any) => item.type)).toEqual(['text', 'text', '$ref']);
      expect(tags.items.every((item: any) => item.arrayItem === true)).toBe(true);
      expect(tags.items[2].$ref).toEqual('/tags/-');
    });

    it('records the array in arrayMap and the item template in templateRefLibrary', () => {
      buildForm(personSchema, null, { name: 'Bob', tags: ['x'] });
      expect(jsf.arrayMap.get('/tags')).toEqual(0);
      expect(Object.keys(jsf.templateRefLibrary)).toEqual(['/tags/-']);
      expect(Object.keys(jsf.layoutRefLibrary)).toEqual(['/tags/-']);
    });

    it('maps every data pointer into dataMap', () => {
      buildForm(personSchema, null, { name: 'Bob', tags: ['x'] });
      expect([...jsf.dataMap.keys()]).toEqual(['', '/name', '/age', '/tags', '/tags/-']);
    });
  });

  // ---------------------------------------------------------------------------
  describe('buildFormGroupTemplate and buildFormGroup', () => {
    it('builds a FormGroup template that mirrors the schema properties', () => {
      buildForm(personSchema, null, { name: 'Bob' });
      expect(jsf.formGroupTemplate.controlType).toEqual('FormGroup');
      expect(Object.keys(jsf.formGroupTemplate.controls)).toEqual(['name', 'age', 'tags']);
    });

    it('builds a real FormGroup carrying the supplied values', () => {
      buildForm(personSchema, null, { name: 'Bob', age: 42, tags: ['x', 'y'] });
      expect(jsf.formGroup instanceof UntypedFormGroup).toBe(true);
      expect(jsf.formGroup.value).toEqual({ name: 'Bob', age: 42, tags: ['x', 'y'] });
      expect(jsf.formGroup.get('tags') instanceof UntypedFormArray).toBe(true);
    });

    it('applies schema defaults when no form values are supplied', () => {
      buildForm({ type: 'object', properties: { a: { type: 'string', default: 'D' } } });
      expect(jsf.formGroup.value).toEqual({ a: 'D' });
    });

    it('leaves the controls empty when setValues is false', () => {
      jsf.resetAllValues();
      jsf.schema = convertSchemaToDraft6({
        type: 'object', properties: { a: { type: 'string', default: 'D' } },
      });
      jsf.compileAjvSchema();
      jsf.schema = resolveSchemaReferences(
        jsf.schema, jsf.schemaRefLibrary, jsf.schemaRecursiveRefMap,
        jsf.dataRecursiveRefMap, jsf.arrayMap
      );
      jsf.layout = ['*'];
      jsf.formValues = { a: 'V' };
      jsf.buildLayout(widgetLibrary);
      jsf.buildFormGroupTemplate(jsf.formValues, false);
      jsf.buildFormGroup();

      expect(jsf.formGroup.value).toEqual({ a: null });
    });

    it('leaves formGroup null when the template is empty', () => {
      jsf.buildFormGroup();
      expect(jsf.formGroup).toBeNull();
    });

    it('validates immediately after the formGroup is built', () => {
      buildForm(personSchema, null, { name: 'Bo' });
      expect(jsf.isValid).toBe(false);
      expect(jsf.validationErrors['/name']).toBeDefined();
    });

    it('unsubscribes the previous valueChanges subscription when rebuilt', () => {
      buildForm(personSchema, null, { name: 'Bob' });
      const first = jsf.formValueSubscription;
      jsf.buildFormGroup();
      expect(jsf.formValueSubscription).not.toBe(first);
      expect(first.closed).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  describe('getFormControl and friends', () => {
    beforeEach(() => buildForm(personSchema, null, { name: 'Bob', age: 42, tags: ['x', 'y'] }));

    it('returns the control for a bound layout node', () => {
      expect(jsf.getFormControl(ctxFor('name')).value).toEqual('Bob');
    });

    it('returns the control value directly', () => {
      // The `AbstractControl` return type on getFormControlValue is wrong: the
      // method returns `control.value`, so the cast is what the callers really
      // deal with.
      expect(<any>jsf.getFormControlValue(ctxFor('name'))).toEqual('Bob');
    });

    it('returns the containing group for a top level control', () => {
      expect(jsf.getFormControlGroup(ctxFor('name'))).toBe(jsf.formGroup);
    });

    it('returns the control name and its indexed data pointer', () => {
      expect(jsf.getFormControlName(ctxFor('name'))).toEqual('name');
      expect(jsf.getDataPointer(ctxFor('name'))).toEqual('/name');
      expect(jsf.getLayoutPointer(ctxFor('name'))).toEqual('/0');
      expect(jsf.isControlBound(ctxFor('name'))).toBe(true);
    });

    it('resolves array item pointers through arrayMap', () => {
      const tagsIndex = nodeIndex('tags');
      const itemCtx: any = {
        layoutNode: (jsf.layout[tagsIndex] as any).items[1],
        dataIndex: [1],
        layoutIndex: [tagsIndex, 1],
      };
      expect(jsf.getDataPointer(itemCtx)).toEqual('/tags/1');
      expect(<any>jsf.getFormControlValue(itemCtx)).toEqual('y');
      expect(jsf.getFormControlName(itemCtx)).toEqual('1');
      expect(jsf.getLayoutPointer(itemCtx)).toEqual('/2/items/1');
      expect(jsf.isControlBound(itemCtx)).toBe(true);
    });

    it('returns the layout array and the parent node for a top level node', () => {
      expect(jsf.getLayoutArray(ctxFor('name')).length).toEqual(4);
      expect(jsf.getParentNode(ctxFor('name')).length).toEqual(4);
    });

    it('returns the array node as the parent of an array item', () => {
      const tagsIndex = nodeIndex('tags');
      const itemCtx: any = {
        layoutNode: (jsf.layout[tagsIndex] as any).items[0],
        dataIndex: [0],
        layoutIndex: [tagsIndex, 0],
      };
      expect(jsf.getParentNode(itemCtx).name).toEqual('tags');
      expect(jsf.getLayoutArray(itemCtx).length).toEqual(3);
    });

    it('returns null from every accessor when the context has no layoutNode', () => {
      spyOn(console, 'error');
      expect(jsf.getFormControl({})).toBeNull();
      expect(jsf.getFormControlValue({})).toBeNull();
      expect(jsf.getFormControlGroup({})).toBeNull();
      expect(jsf.getFormControlName({})).toBeNull();
      expect(jsf.getDataPointer({})).toBeNull();
      expect(jsf.getLayoutPointer({})).toBeNull();
      expect(jsf.isControlBound({})).toBe(false);
    });

    it('returns null for a layout node with no dataPointer', () => {
      const ctx: any = { layoutNode: { name: 'x' }, dataIndex: [], layoutIndex: [0] };
      expect(jsf.getFormControl(ctx)).toBeNull();
      expect(jsf.getFormControlValue(ctx)).toBeNull();
      expect(jsf.getFormControlGroup(ctx)).toBeNull();
      expect(jsf.getFormControlName(ctx)).toBeNull();
      expect(jsf.getDataPointer(ctx)).toBeNull();
    });

    it('refuses to resolve a $ref node to a control', () => {
      const ctx: any = {
        layoutNode: { type: '$ref', dataPointer: '/name' }, dataIndex: [], layoutIndex: [0],
      };
      expect(jsf.getFormControl(ctx)).toBeNull();
      expect(jsf.getFormControlValue(ctx)).toBeNull();
    });

    it('still resolves the containing group for a $ref node', () => {
      const ctx: any = {
        layoutNode: { type: '$ref', dataPointer: '/name' }, dataIndex: [], layoutIndex: [0],
      };
      expect(jsf.getFormControlGroup(ctx)).toBe(jsf.formGroup);
    });

    it('returns null from getFormControlName when dataIndex is missing', () => {
      expect(jsf.getFormControlName({ layoutNode: { dataPointer: '/name' } })).toBeNull();
      expect(jsf.getDataPointer({ layoutNode: { dataPointer: '/name' } })).toBeNull();
    });

    it('returns undefined, not null, for a pointer that does not exist', () => {
      // BUG: getControl falls off the end of its search loop with a bare
      // `return;`, so getFormControl hands back undefined rather than the null
      // its signature and its own guard clauses promise.
      const consoleError = spyOn(console, 'error');
      const ctx: any = { layoutNode: { dataPointer: '/nope' }, dataIndex: [], layoutIndex: [0] };
      expect(jsf.getFormControl(ctx)).toBeUndefined();
      expect(consoleError).toHaveBeenCalled();
    });

    it('normalises a missing control to null in getFormControlValue', () => {
      spyOn(console, 'error');
      const ctx: any = { layoutNode: { dataPointer: '/nope' }, dataIndex: [], layoutIndex: [0] };
      expect(jsf.getFormControlValue(ctx)).toBeNull();
    });

    it('reports an unbound control as not bound', () => {
      spyOn(console, 'error');
      const ctx: any = { layoutNode: { dataPointer: '/nope' }, dataIndex: [], layoutIndex: [0] };
      expect(jsf.isControlBound(ctx)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  describe('initializeControl', () => {
    beforeEach(() => buildForm(personSchema, null, { name: 'Bob' }));

    it('returns false for a non object context', () => {
      expect(jsf.initializeControl(null)).toBe(false);
      expect(jsf.initializeControl(undefined)).toBe(false);
      expect(jsf.initializeControl('ctx')).toBe(false);
      expect(jsf.initializeControl(7)).toBe(false);
    });

    it('binds a context to its control and fills in the control metadata', () => {
      const ctx = ctxFor('name');
      expect(jsf.initializeControl(ctx)).toBe(true);
      expect(ctx.boundControl).toBe(true);
      expect(ctx.controlName).toEqual('name');
      expect(ctx.controlValue).toEqual('Bob');
      expect(ctx.controlDisabled).toBe(false);
      expect(ctx.formControl).toBe(jsf.formGroup.get('name'));
    });

    it('reports the disabled state of the control', () => {
      jsf.formGroup.get('name').disable();
      const ctx = ctxFor('name');
      jsf.initializeControl(ctx);
      expect(ctx.controlDisabled).toBe(true);
    });

    it('does not bind when bind is false, but still finds the control', () => {
      const ctx = ctxFor('name');
      expect(jsf.initializeControl(ctx, false)).toBe(false);
      expect(ctx.boundControl).toBe(false);
      expect(ctx.formControl).toBeTruthy();
      expect(ctx.controlValue).toEqual('Bob');
    });

    it('copies formOptions into ctx.options when the layout node has none', () => {
      spyOn(console, 'error');
      const ctx: any = { layoutNode: { name: 'ghost' }, dataIndex: [], layoutIndex: [0] };
      jsf.initializeControl(ctx);
      expect(ctx.options.addSubmit).toEqual('auto');
      expect(ctx.options).not.toBe(jsf.formOptions);
    });

    it('keeps the layout node options for a built control node', () => {
      const ctx = ctxFor('name');
      jsf.initializeControl(ctx);
      expect(ctx.options).toBe(jsf.layout[0].options);
    });

    it('prefers the layoutNode options when they are not empty', () => {
      const ctx: any = {
        layoutNode: { name: 'ghost', options: { title: 'T' } },
        dataIndex: [], layoutIndex: [0],
      };
      spyOn(console, 'error');
      jsf.initializeControl(ctx, false);
      expect(ctx.options).toBe(ctx.layoutNode.options);
      expect(ctx.options.title).toEqual('T');
    });

    it('falls back to the layoutNode name and value for an unbound control', () => {
      const ctx: any = {
        layoutNode: { name: 'ghost', value: 'gv' }, dataIndex: [], layoutIndex: [0],
      };
      spyOn(console, 'error');
      expect(jsf.initializeControl(ctx)).toBe(false);
      expect(ctx.controlName).toEqual('ghost');
      expect(ctx.controlValue).toEqual('gv');
    });

    it('uses null when the unbound layoutNode has no value', () => {
      const ctx: any = { layoutNode: { name: 'ghost' }, dataIndex: [], layoutIndex: [0] };
      spyOn(console, 'error');
      jsf.initializeControl(ctx);
      expect(ctx.controlValue).toBeNull();
    });

    it('warns on the console when a bound control cannot be found', () => {
      const consoleError = spyOn(console, 'error');
      const ctx: any = {
        layoutNode: { name: 'nope', dataPointer: '/nope' }, dataIndex: [], layoutIndex: [0],
      };
      jsf.initializeControl(ctx, true);
      expect(consoleError).toHaveBeenCalled();
    });

    it('sets errorMessage to null for a control that already validates', () => {
      const ctx = ctxFor('name');
      jsf.initializeControl(ctx);
      expect(ctx.options.errorMessage).toBeNull();
    });

    it('formats the current errors for a control that does not validate', () => {
      buildForm(personSchema, null, { name: 'Al' });
      const ctx = ctxFor('name');
      jsf.initializeControl(ctx);
      expect(ctx.options.errorMessage)
        .toEqual('Must be 3 characters or longer (current length: 2)');
    });

    it('turns showErrors on for a control that has a value under validateOnRender auto', () => {
      const ctx = ctxFor('name');
      jsf.initializeControl(ctx);
      expect(ctx.options.showErrors).toBe(true);
    });

    it('leaves showErrors off for an empty control under validateOnRender auto', () => {
      buildForm(personSchema, null, {});
      const ctx = ctxFor('name');
      jsf.initializeControl(ctx);
      expect(ctx.options.showErrors).toBe(false);
    });

    it('leaves showErrors off when validateOnRender is false', () => {
      jsf.formOptions.validateOnRender = false;
      const ctx = ctxFor('name');
      jsf.initializeControl(ctx);
      expect(ctx.options.showErrors).toBe(false);
    });

    it('turns showErrors on for every control when validateOnRender is true', () => {
      buildForm(personSchema, null, {});
      jsf.formOptions.validateOnRender = true;
      const ctx = ctxFor('name');
      jsf.initializeControl(ctx);
      expect(ctx.options.showErrors).toBe(true);
    });

    it('refreshes errorMessage from the statusChanges subscription', () => {
      const ctx = ctxFor('name');
      jsf.initializeControl(ctx);

      ctx.formControl.setValue('Al');
      expect(ctx.options.errorMessage)
        .toEqual('Must be 3 characters or longer (current length: 2)');

      ctx.formControl.setValue('Alice');
      expect(ctx.options.errorMessage).toBeNull();
    });

    it('ignores falsy values in the valueChanges subscription', () => {
      // BUG: the subscription guards with `if (!!value)`, so clearing a field
      // leaves ctx.controlValue holding the previous value.
      const ctx = ctxFor('name');
      jsf.initializeControl(ctx);

      ctx.formControl.setValue('Alice');
      expect(ctx.controlValue).toEqual('Alice');

      ctx.formControl.setValue('');
      expect(ctx.controlValue).toEqual('Alice');
    });
  });

  // ---------------------------------------------------------------------------
  describe('formatErrors', () => {
    it('returns null when there are no errors', () => {
      expect(jsf.formatErrors(null)).toBeNull();
      expect(jsf.formatErrors(undefined)).toBeNull();
      expect(jsf.formatErrors({})).toBeNull();
    });

    it('shows a required error when it is the only one', () => {
      expect(jsf.formatErrors({ required: true })).toEqual('Required Error: True');
    });

    it('hides the required error when another error is present', () => {
      expect(jsf.formatErrors({
        required: true,
        minLength: { minimumLength: 3, currentLength: 1 },
      })).toEqual('Min Length Error: Minimum Length: 3, Current Length: 1');
    });

    it('calls a function message with the error data', () => {
      expect(jsf.formatErrors(
        { minLength: { minimumLength: 3 } },
        { minLength: (error: any) => `need ${error.minimumLength}` }
      )).toEqual('need 3');
    });

    it('returns a plain string message unchanged', () => {
      expect(jsf.formatErrors({ minLength: {} }, { minLength: 'Too short' }))
        .toEqual('Too short');
    });

    it('substitutes {{property}} placeholders from the error data', () => {
      expect(jsf.formatErrors(
        { minLength: { minimumLength: 3, currentLength: 1 } },
        { minLength: 'Must be {{minimumLength}} long, got {{currentLength}}' }
      )).toEqual('Must be 3 long, got 1');
    });

    it('builds a fallback message from the error data when no custom message exists', () => {
      expect(jsf.formatErrors({ minLength: { minimumLength: 3 } }, {}))
        .toEqual('Min Length Error: Minimum Length: 3');
    });

    it('renders boolean error values as the key and its negation', () => {
      expect(jsf.formatErrors({ someRule: true }, {})).toEqual('Some Rule Error: True');
      expect(jsf.formatErrors({ someRule: false }, {})).toEqual('Some Rule Error: False');
    });

    it('renders a scalar error value with underscores turned into spaces', () => {
      expect(jsf.formatErrors({ some_rule: 'bad' }, {})).toEqual('Some rule Error: Bad');
    });

    it('joins several errors with a line break', () => {
      expect(jsf.formatErrors({ aRule: true, bRule: false }, {}))
        .toEqual('ARule Error: True<br>BRule Error: False');
    });

    it('ignores a string passed as validationMessages', () => {
      // BUG: the guard replaces any non object validationMessages with {} before
      // the `typeof validationMessages === 'string'` branch can ever be reached,
      // so that branch is dead code and a plain string message is discarded.
      expect(jsf.formatErrors({ minLength: {} }, 'One message'))
        .toEqual('Min Length Error: ');
    });

    it('ignores a number passed as validationMessages', () => {
      expect(jsf.formatErrors({ someRule: true }, 5)).toEqual('Some Rule Error: True');
    });

    it('ignores null passed as validationMessages', () => {
      expect(jsf.formatErrors({ someRule: true }, null)).toEqual('Some Rule Error: True');
    });

    it('recurses into nested error objects', () => {
      expect(jsf.formatErrors({ outer: { inner: { deep: true } } }, {}))
        .toEqual('Outer Error: Inner: Deep');
    });
  });

  // ---------------------------------------------------------------------------
  describe('parseText', () => {
    it('returns an empty string when called with no arguments', () => {
      expect(jsf.parseText()).toEqual('');
    });

    it('passes through text that has no placeholders', () => {
      expect(jsf.parseText('plain text')).toEqual('plain text');
    });

    it('passes null straight through', () => {
      expect(jsf.parseText(null)).toBeNull();
    });

    it('substitutes the current value', () => {
      expect(jsf.parseText('Hi {{value}}', 'Bob')).toEqual('Hi Bob');
    });

    it('substitutes a one based index for idx and $index', () => {
      expect(jsf.parseText('Item {{idx}}', {}, {}, 2)).toEqual('Item 3');
      expect(jsf.parseText('Item {{$index}}', {}, {}, 2)).toEqual('Item 3');
    });

    it('substitutes several placeholders in one pass', () => {
      expect(jsf.parseText('{{value.first}} {{value.last}}', { first: 'A', last: 'B' }))
        .toEqual('A B');
    });

    it('reads from the surrounding values object, with or without the values prefix', () => {
      expect(jsf.parseText('{{values.other}}', {}, { other: 'X' })).toEqual('X');
      expect(jsf.parseText('{{other}}', {}, { other: 'X' })).toEqual('X');
    });

    it('replaces an unresolvable placeholder with an empty string', () => {
      expect(jsf.parseText('[{{nope}}]', {}, {})).toEqual('[]');
    });

    it('reads from tpldata once it has been set', () => {
      jsf.setTpldata({ site: 'AJSF' });
      expect(jsf.parseText('{{tpldata.site}}')).toEqual('AJSF');
    });
  });

  // ---------------------------------------------------------------------------
  describe('parseExpression', () => {
    it('returns the empty values object for an empty expression', () => {
      expect(jsf.parseExpression()).toEqual({});
    });

    it('returns an empty string for a non string expression', () => {
      expect(jsf.parseExpression(<any>42)).toEqual('');
      expect(jsf.parseExpression(<any>null)).toEqual('');
      expect(jsf.parseExpression(<any>{})).toEqual('');
    });

    it('unwraps a single or double quoted literal', () => {
      expect(jsf.parseExpression("'hello'")).toEqual('hello');
      expect(jsf.parseExpression('"hello"')).toEqual('hello');
    });

    it('refuses to unwrap a literal that contains its own quote character', () => {
      expect(jsf.parseExpression("'a'b'")).toEqual('');
    });

    it('turns a numeric key into a one based index', () => {
      expect(jsf.parseExpression('idx', {}, {}, 3)).toEqual('4');
      expect(jsf.parseExpression('$index', {}, {}, 0)).toEqual('1');
    });

    it('uses a string key verbatim', () => {
      expect(jsf.parseExpression('$index', {}, {}, 'k')).toEqual('k');
    });

    it('resolves idx to an empty string when there is no key', () => {
      expect(jsf.parseExpression('idx', {}, {}, null)).toEqual('');
    });

    it('returns the current value for the bare "value" expression', () => {
      expect(jsf.parseExpression('value', 'V', {})).toEqual('V');
    });

    it('prefers a values entry named value over the current value', () => {
      expect(jsf.parseExpression('value', 'V', { value: 'S' })).toEqual('S');
    });

    it('resolves a dotted path against value, values and tpldata', () => {
      expect(jsf.parseExpression('value.a', { a: 1 }, {})).toEqual(<any>1);
      expect(jsf.parseExpression('values.b', {}, { b: 2 })).toEqual(<any>2);
      expect(jsf.parseExpression('tpldata.t', {}, {}, null, { t: 'TP' })).toEqual('TP');
    });

    it('resolves an unprefixed path against values', () => {
      expect(jsf.parseExpression('c', {}, { c: 3 })).toEqual(<any>3);
    });

    it('returns an empty string for a path that resolves nowhere', () => {
      expect(jsf.parseExpression('zzz', {}, {})).toEqual('');
    });

    it('evaluates an || chain left to right', () => {
      expect(jsf.parseExpression("zzz || 'fallback'", {}, {})).toEqual('fallback');
      expect(jsf.parseExpression("a || 'fallback'", {}, { a: 'A' })).toEqual('A');
    });

    it('evaluates an && chain', () => {
      expect(jsf.parseExpression('a && b', {}, { a: 'A', b: 'B' })).toEqual('B');
      expect(jsf.parseExpression('zzz && b', {}, { b: 'B' })).toEqual('');
    });

    it('concatenates the terms of a + chain', () => {
      expect(jsf.parseExpression("a + '-' + b", {}, { a: 'A', b: 'B' })).toEqual('A-B');
    });

    it('returns an empty string for an expression it cannot parse', () => {
      expect(jsf.parseExpression('a b c')).toEqual('');
    });

    it('returns an empty string for an indexed path expression', () => {
      // BUG: [idx] is substituted, but the resulting bracket path is then handed
      // to parseObjectPath in a form it cannot resolve, so the whole term is
      // dropped instead of reading the array element.
      expect(jsf.parseExpression(
        "values.list[idx].n + ''", {}, { list: [{ n: 'zero' }, { n: 'one' }] }, 0
      )).toEqual('');
    });
  });

  // ---------------------------------------------------------------------------
  describe('evaluateCondition', () => {
    beforeEach(() => {
      jsf.data = { name: 'Bob', items: [{ flag: true }, { flag: false }] };
    });

    it('is true when the node has no options at all', () => {
      expect(jsf.evaluateCondition({}, [])).toBe(true);
    });

    it('is true when the node has options but no condition', () => {
      expect(jsf.evaluateCondition({ options: {} }, [])).toBe(true);
    });

    it('resolves a model prefixed string condition against the data', () => {
      expect(jsf.evaluateCondition({ options: { condition: 'model.name' } }, [])).toBe(true);
      expect(jsf.evaluateCondition({ options: { condition: 'model.missing' } }, [])).toBe(false);
    });

    it('resolves an unprefixed string condition against the data directly', () => {
      expect(jsf.evaluateCondition({ options: { condition: 'name' } }, [])).toBe(true);
    });

    it('substitutes [arrayIndex] with the last dataIndex entry', () => {
      const node = { options: { condition: 'model.items[arrayIndex].flag' } };
      expect(jsf.evaluateCondition(node, [0])).toBe(true);
      expect(jsf.evaluateCondition(node, [1])).toBe(false);
    });

    it('tolerates a null dataIndex', () => {
      expect(jsf.evaluateCondition({ options: { condition: 'model.name' } }, null)).toBe(true);
    });

    it('calls a function condition with the data', () => {
      const condition = jasmine.createSpy('condition').and.returnValue(false);
      expect(jsf.evaluateCondition({ options: { condition } }, [])).toBe(false);
      expect(condition).toHaveBeenCalledWith(jsf.data);
    });

    it('compiles and runs a functionBody condition', () => {
      expect(jsf.evaluateCondition(
        { options: { condition: { functionBody: 'return model.name === "Bob";' } } }, []
      )).toBe(true);
      expect(jsf.evaluateCondition(
        { options: { condition: { functionBody: 'return model.name === "Ann";' } } }, []
      )).toBe(false);
    });

    it('passes dataIndex to the functionBody as arrayIndices', () => {
      expect(jsf.evaluateCondition(
        { options: { condition: { functionBody: 'return arrayIndices[0] === 1;' } } }, [1]
      )).toBe(true);
    });

    it('falls back to true and logs when the functionBody throws', () => {
      const consoleError = spyOn(console, 'error');
      expect(jsf.evaluateCondition(
        { options: { condition: { functionBody: 'return nope.nope;' } } }, []
      )).toBe(true);
      expect(consoleError).toHaveBeenCalled();
    });

    it('is true for a condition object with no functionBody', () => {
      expect(jsf.evaluateCondition({ options: { condition: { foo: 1 } } }, [])).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  describe('setItemTitle', () => {
    beforeEach(() => buildForm(personSchema, null, { name: 'Bob' }));

    it('returns null for an unnamed array item with no explicit title', () => {
      expect(jsf.setItemTitle({ options: {}, layoutNode: { name: '2' }, dataIndex: [0] }))
        .toBeNull();
      expect(jsf.setItemTitle({ options: {}, layoutNode: { name: '-' }, dataIndex: [0] }))
        .toBeNull();
    });

    it('title cases the layout node name when there is no explicit title', () => {
      expect(jsf.setItemTitle({ options: {}, layoutNode: { name: 'first_name' }, dataIndex: [0] }))
        .toEqual('First_name');
    });

    it('resolves the value placeholder to null instead of the control value', () => {
      // BUG: setItemTitle calls getFormControlValue(this) and
      // getFormControlGroup(this), passing the service instead of the ctx it was
      // handed. The service has no layoutNode, so both guards bail out and every
      // {{value}} placeholder resolves against null.
      expect(jsf.setItemTitle({
        options: { title: 'Hello {{value}}' },
        layoutNode: jsf.layout[0],
        dataIndex: [],
      })).toEqual('Hello null');
    });

    it('uses the explicit title when there is no placeholder', () => {
      expect(jsf.setItemTitle({
        options: { title: 'Plain' }, layoutNode: { name: '0' }, dataIndex: [0],
      })).toEqual('Plain');
    });
  });

  // ---------------------------------------------------------------------------
  describe('setArrayItemTitle', () => {
    beforeEach(() => buildForm(personSchema, null, { name: 'Bob', tags: ['x', 'y'] }));

    const tagsCtx = (): any => ctxFor('tags');
    const tagsItem = (index: number): any => (jsf.layout[nodeIndex('tags')] as any).items[index];

    it('falls back to the parent array title and parses its index placeholder', () => {
      expect(jsf.setArrayItemTitle(tagsCtx(), tagsItem(0), 0)).toEqual('Tag 1');
      expect(jsf.setArrayItemTitle(tagsCtx(), tagsItem(0), 1)).toEqual('Tag 2');
    });

    it('prefers the child title when the child is a $ref node', () => {
      expect(jsf.setArrayItemTitle(tagsCtx(), tagsItem(2), 0)).toEqual('Add to Tag 1');
    });

    it('returns the falsy text unchanged when no title or legend is found', () => {
      const parentCtx: any = {
        layoutNode: { type: 'section', options: {} }, dataIndex: [], layoutIndex: [0],
      };
      expect(jsf.setArrayItemTitle(parentCtx, { type: 'text', options: {} }, 0)).toBeNull();
    });

    it('throws when called with no arguments at all', () => {
      // BUG: parentCtx defaults to {}, so parentNode is undefined and the very
      // next line reads `parentNode.type`.
      expect(() => jsf.setArrayItemTitle()).toThrowError(TypeError);
    });

    it('uses the whole parent value when the index is past the end of the array', () => {
      expect(jsf.setArrayItemTitle(tagsCtx(), tagsItem(0), 99)).toEqual('Tag 100');
    });
  });

  // ---------------------------------------------------------------------------
  describe('updateValue', () => {
    beforeEach(() => buildForm(personSchema, null, { name: 'Bob', age: 42, tags: ['x'] }));

    it('writes the value to the control, the context and the layout node', () => {
      const ctx = ctxFor('name');
      jsf.initializeControl(ctx);

      jsf.updateValue(ctx, 'Alice');

      expect(jsf.formGroup.get('name').value).toEqual('Alice');
      expect(ctx.controlValue).toEqual('Alice');
      expect(ctx.layoutNode.value).toEqual('Alice');
      expect(ctx.formControl.dirty).toBe(true);
    });

    it('updates only the context when the control is not bound', () => {
      const ctx: any = { layoutNode: { name: 'x' }, options: {}, boundControl: false };
      jsf.updateValue(ctx, 7);
      expect(ctx.controlValue).toEqual(7);
      expect(ctx.layoutNode.value).toEqual(7);
    });

    it('copies the value into every control listed in copyValueTo', () => {
      const ctx = ctxFor('name');
      jsf.initializeControl(ctx);
      ctx.options.copyValueTo = ['/age'];

      jsf.updateValue(ctx, 'Alice');

      expect(jsf.formGroup.get('age').value).toEqual('Alice');
      expect(jsf.formGroup.get('age').dirty).toBe(true);
    });

    it('skips a copyValueTo pointer that resolves to nothing', () => {
      const consoleError = spyOn(console, 'error');
      const ctx: any = {
        layoutNode: { name: 'x' }, options: { copyValueTo: ['/nope'] }, boundControl: false,
      };
      expect(() => jsf.updateValue(ctx, 1)).not.toThrow();
      expect(consoleError).toHaveBeenCalled();
    });

    it('ignores a copyValueTo value that is not an array', () => {
      const ctx: any = {
        layoutNode: { name: 'x' }, options: { copyValueTo: '/age' }, boundControl: false,
      };
      expect(() => jsf.updateValue(ctx, 1)).not.toThrow();
      expect(jsf.formGroup.get('age').value).toEqual(42);
    });
  });

  // ---------------------------------------------------------------------------
  describe('updateArrayCheckboxList', () => {
    beforeEach(() => buildForm(personSchema, null, { name: 'Bob', tags: ['x', 'y'] }));

    it('replaces the formArray contents with the checked items only', () => {
      jsf.updateArrayCheckboxList(ctxFor('tags'), [
        { value: 'a', checked: true },
        { value: 'b', checked: false },
        { value: 'c', checked: true },
      ]);

      expect(jsf.formGroup.get('tags').value).toEqual(['a', 'c']);
      expect(jsf.formGroup.get('tags').dirty).toBe(true);
    });

    it('empties the formArray when nothing is checked', () => {
      jsf.updateArrayCheckboxList(ctxFor('tags'), [{ value: 'a', checked: false }]);
      expect(jsf.formGroup.get('tags').value).toEqual([]);
    });

    it('empties the formArray for an empty checkbox list', () => {
      jsf.updateArrayCheckboxList(ctxFor('tags'), []);
      expect(jsf.formGroup.get('tags').value).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  describe('buildRemoteError', () => {
    beforeEach(() => buildForm(personSchema, null, { name: 'Bob' }));

    it('sets the supplied error code and message on the matching control', () => {
      jsf.buildRemoteError({ name: [{ message: 'Bad name', code: 'bad_name' }] });
      expect(jsf.formGroup.get('name').errors).toEqual({ bad_name: 'Bad name' });
    });

    it('keeps only the last error when several are supplied for one control', () => {
      jsf.buildRemoteError({
        name: [
          { message: 'First', code: 'first' },
          { message: 'Second', code: 'second' },
        ],
      });
      expect(jsf.formGroup.get('name').errors).toEqual({ second: 'Second' });
    });

    it('ignores keys that do not match a control', () => {
      expect(() => jsf.buildRemoteError({ nope: [{ message: 'x', code: 'y' }] }))
        .not.toThrow();
    });

    it('does nothing for an empty error map', () => {
      jsf.buildRemoteError({});
      expect(jsf.formGroup.get('name').errors).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  describe('addItem, moveArrayItem and removeItem', () => {
    beforeEach(() => buildForm(personSchema, null, { name: 'Bob', tags: ['x', 'y'] }));

    const tagsIndex = (): number => nodeIndex('tags');
    const tagsNode = (): any => jsf.layout[tagsIndex()];
    const refCtx = (): any => {
      const items = tagsNode().items;
      return {
        layoutNode: items[items.length - 1],
        dataIndex: [items.length - 1],
        layoutIndex: [tagsIndex(), items.length - 1],
      };
    };
    const itemCtx = (index: number): any => ({
      layoutNode: tagsNode().items[index],
      dataIndex: [index],
      layoutIndex: [tagsIndex(), index],
    });

    it('rejects a context that is missing $ref, dataIndex or layoutIndex', () => {
      expect(jsf.addItem({})).toBe(false);
      expect(jsf.addItem({ layoutNode: { $ref: '/tags/-' } })).toBe(false);
      expect(jsf.addItem({ layoutNode: { $ref: '/tags/-' }, dataIndex: [0] })).toBe(false);
      expect(jsf.addItem({ layoutNode: {}, dataIndex: [0], layoutIndex: [0] })).toBe(false);
    });

    it('pushes a new control onto the formArray and a new node into the layout', () => {
      expect(jsf.addItem(refCtx())).toBe(true);
      expect(jsf.formGroup.get('tags').value).toEqual(['x', 'y', null]);
      expect(tagsNode().items.length).toEqual(4);
    });

    it('copies arrayItem and arrayItemType onto the new layout node', () => {
      jsf.addItem(refCtx());
      const added: any = tagsNode().items[tagsNode().items.length - 2];
      expect(added.arrayItem).toBe(true);
      expect(added.arrayItemType).toEqual('list');
      expect(added.type).toEqual('text');
      expect(added.dataPointer).toEqual('/tags/-');
    });

    it('adds a named control to the formGroup when the node is not an array item', () => {
      const items = tagsNode().items;
      const synthetic: any = clone(items[items.length - 1]);
      synthetic.arrayItem = false;
      delete synthetic.arrayItemType;
      synthetic.dataPointer = '/placeholder';
      const ctx: any = { layoutNode: synthetic, dataIndex: [], layoutIndex: [jsf.layout.length] };

      expect(jsf.addItem(ctx, 'extra')).toBe(true);
      expect(jsf.formGroup.get('extra')).toBeTruthy();
      const added: any = jsf.layout[jsf.layout.length - 1];
      expect(added.name).toEqual('extra');
      expect(added.options.title).toEqual('Extra');
      expect(added.dataPointer).toEqual('/tags/-/extra');
    });

    it('rejects a moveArrayItem call with a missing or identical index', () => {
      expect(jsf.moveArrayItem({}, 0, 1)).toBe(false);
      expect(jsf.moveArrayItem(itemCtx(0), 0, 0)).toBe(false);
      expect(jsf.moveArrayItem(itemCtx(0), undefined, 1)).toBe(false);
      expect(jsf.moveArrayItem(itemCtx(0), 0, undefined)).toBe(false);
    });

    it('moves an item in both the formArray and the layout', () => {
      expect(jsf.moveArrayItem(itemCtx(0), 0, 1)).toBe(true);
      expect(jsf.formGroup.get('tags').value).toEqual(['y', 'x']);
      expect(tagsNode().items.length).toEqual(3);
    });

    it('rejects a removeItem call with an incomplete context', () => {
      expect(jsf.removeItem({})).toBe(false);
      expect(jsf.removeItem({ layoutNode: { dataPointer: '/tags/-' } })).toBe(false);
      expect(jsf.removeItem({ layoutNode: { dataPointer: '/tags/-' }, dataIndex: [0] }))
        .toBe(false);
    });

    it('removes an array item from both the formArray and the layout', () => {
      expect(jsf.removeItem(itemCtx(0))).toBe(true);
      expect(jsf.formGroup.get('tags').value).toEqual(['y']);
      expect(tagsNode().items.length).toEqual(2);
    });
  });

  // ---------------------------------------------------------------------------
  describe('buildSchemaFromData and buildSchemaFromLayout', () => {
    it('infers a draft 6 schema from the internal formValues', () => {
      jsf.formValues = { a: 'x', n: 3 };
      jsf.buildSchemaFromData();
      expect(jsf.schema).toEqual({
        $schema: 'http://json-schema.org/draft-06/schema#',
        type: 'object',
        properties: { a: { type: 'string' }, n: { type: 'number' } },
      });
    });

    it('returns the schema without storing it when data is passed in', () => {
      const before = jsf.schema;
      const result = jsf.buildSchemaFromData({ z: true });
      expect(result.properties).toEqual({ z: { type: 'boolean' } });
      expect(jsf.schema).toBe(before);
    });

    it('marks every property required when asked to', () => {
      expect(jsf.buildSchemaFromData({ z: true }, true).required).toEqual(['z']);
    });

    it('wipes the schema, because buildSchemaFromLayout is an unfinished stub', () => {
      // BUG: shared/json-schema.functions.ts buildSchemaFromLayout is a bare
      // `return;` with its body commented out, so calling this method sets the
      // service schema to undefined.
      jsf.layout = [{ key: 'a', type: 'text' }];
      jsf.buildSchemaFromLayout();
      expect(jsf.schema).toBeUndefined();
    });

    it('returns undefined for an explicitly passed layout too', () => {
      expect(jsf.buildSchemaFromLayout([{ key: 'q', type: 'number' }])).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  describe('setTpldata', () => {
    it('stores the supplied template data', () => {
      jsf.setTpldata({ a: 1 });
      expect(jsf.tpldata).toEqual({ a: 1 });
    });

    it('resets to an empty object when called with no argument', () => {
      jsf.setTpldata({ a: 1 });
      jsf.setTpldata();
      expect(jsf.tpldata).toEqual({});
    });
  });
});
