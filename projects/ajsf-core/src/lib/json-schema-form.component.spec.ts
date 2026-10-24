import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoFrameworkModule } from './framework-library/no-framework.module';
import { JsonSchemaFormComponent } from './json-schema-form.component';
import { JsonSchemaFormModule } from './json-schema-form.module';

@Component({
  standalone: true,
  imports: [JsonSchemaFormModule, NoFrameworkModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <json-schema-form
      [form]="form"
      framework="no-framework"
      (isValid)="valid = $event"
      (onSubmit)="submitted = $event"
    ></json-schema-form>`,
})
class SchemaHost {
  form: any;
  valid: boolean | null = null;
  submitted: any = null;
}

describe('json-schema-form with a declared $schema', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SchemaHost] }).compileComponents();
  });

  const render = (schema: any, data: any): ComponentFixture<SchemaHost> => {
    const fixture = TestBed.createComponent(SchemaHost);
    fixture.componentInstance.form = { schema, data, options: { addSubmit: true } };
    fixture.detectChanges();
    return fixture;
  };

  const ageSchema = (draft: number, $schema: string): any => ({
    $schema,
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: draft === 4
        ? { type: 'number', minimum: 18, exclusiveMinimum: true }
        : { type: 'number', exclusiveMinimum: 18 },
    },
    required: ['name'],
  });

  const payloads = [{}, { name: 'Ada', age: 18 }, { name: 'Ada', age: 19 }];

  const outcome = (schema: any) => payloads.map(data => {
    const fixture = render(schema, data);
    return {
      controls: fixture.nativeElement.querySelectorAll('input:not([type=submit])').length,
      valid: fixture.componentInstance.valid,
    };
  });

  [4, 6, 7].forEach(draft => {
    const path = `json-schema.org/draft-0${draft}/schema`;
    const canonical = `http://${path}#`;

    it(`renders and validates canonical draft ${draft}`, () => {
      expect(outcome(ageSchema(draft, canonical))).toEqual([
        { controls: 2, valid: false },
        { controls: 2, valid: false },
        { controls: 2, valid: true },
      ]);
    });

    [`http://${path}`, `https://${path}#`, `https://${path}`].forEach(uri => {
      it(`treats ${uri} as ${canonical}`, () => {
        expect(outcome(ageSchema(draft, uri))).toEqual(outcome(ageSchema(draft, canonical)));
      });

      it(`submits a valid form declared as ${uri}`, () => {
        const fixture = render(ageSchema(draft, uri), { name: 'Ada', age: 19 });
        fixture.nativeElement.querySelector('input[type=submit]').click();
        expect(fixture.componentInstance.submitted).toEqual({ name: 'Ada', age: 19 });
      });
    });
  });

  [
    'https://json-schema.org/draft/2019-09/schema',
    'https://json-schema.org/draft/2020-12/schema',
  ].forEach(uri => {
    it(`fails to compile ${uri}`, () => {
      expect(() => render(ageSchema(7, uri), {}))
        .toThrowError(`no schema with key or ref "${uri}"`);
    });
  });
});

describe('JsonSchemaFormComponent input updates', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonSchemaFormModule, NoFrameworkModule],
    }).compileComponents();
  });

  const createComponent = (): ComponentFixture<JsonSchemaFormComponent> => {
    const fixture = TestBed.createComponent(JsonSchemaFormComponent);
    fixture.componentInstance.framework = 'no-framework';
    return fixture;
  };

  const schema = {
    type: 'object',
    properties: { name: { type: 'string' } },
  };

  it('updates a data input without rebuilding the form', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.schema = schema;
    component.data = { name: 'Ada' };
    component.initializeForm();
    component.updateForm();

    component.jsf.formGroup.get('name').markAsDirty();
    component.data = { name: 'Grace' };
    component.updateForm();

    expect(component.jsf.formGroup.value).toEqual({ name: 'Grace' });
    expect(component.jsf.formGroup.get('name').pristine).toBe(true);
    fixture.destroy();
  });

  it('updates a nested form data input without resetting its controls', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form = { schema, data: { name: 'Ada' } };
    component.initializeForm();
    component.updateForm();

    component.jsf.formGroup.get('name').markAsDirty();
    component.form = { ...component.form, data: { name: 'Grace' } };
    component.updateForm();

    expect(component.formValuesInput).toBe('form.data');
    expect(component.jsf.formGroup.value).toEqual({ name: 'Grace' });
    expect(component.jsf.formGroup.get('name').dirty).toBe(true);
    fixture.destroy();
  });

  it('notifies registered callbacks when a non-value input changes', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.schema = schema;
    component.data = { name: 'Ada' };
    component.initializeForm();
    component.updateForm();
    const onChange = vi.fn();
    const onTouched = vi.fn();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    component.schema = {
      ...schema,
      properties: { name: { type: 'string' }, age: { type: 'number' } },
    };
    component.updateForm();

    expect(onChange).toHaveBeenCalledWith(component.jsf.formValues);
    expect(onTouched).toHaveBeenCalledWith(component.jsf.formValues);
    fixture.destroy();
  });

  it('loads schemas from the React and JSON Form input shapes', () => {
    const reactFixture = createComponent();
    const reactComponent = reactFixture.componentInstance;
    reactComponent.JSONSchema = schema;
    reactComponent.initializeForm();
    expect(reactComponent.jsf.ReactJsonSchemaFormCompatibility).toBe(true);
    expect(reactComponent.jsf.schema.properties.name).toEqual({ type: 'string' });
    reactFixture.destroy();

    const formReactFixture = createComponent();
    const formReactComponent = formReactFixture.componentInstance;
    formReactComponent.form = { JSONSchema: schema };
    formReactComponent.initializeForm();
    expect(formReactComponent.jsf.ReactJsonSchemaFormCompatibility).toBe(true);
    expect(formReactComponent.jsf.schema.properties.name).toEqual({ type: 'string' });
    formReactFixture.destroy();

    const jsonFormFixture = createComponent();
    const jsonFormComponent = jsonFormFixture.componentInstance;
    jsonFormComponent.form = schema;
    jsonFormComponent.initializeForm();
    expect(jsonFormComponent.jsf.schema.properties.name).toEqual({ type: 'string' });
    jsonFormFixture.destroy();
  });

  it('returns false when no schema input is available', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form = {};

    expect((component as any).initializeSchemaFromInputs()).toBe(false);
    fixture.destroy();
  });

  it('normalizes alternate schema type shapes', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const normalize = (input: any): any => {
      component.jsf.schema = input;
      component.objectWrap = false;
      component.jsf.JsonFormCompatibility = false;
      (component as any).normalizeSchemaType();
      return component.jsf.schema;
    };

    expect(normalize({ type: ['object', 'null'] }).type).toBe('object');

    const wrapped = normalize({ type: 'string' });
    expect(component.objectWrap).toBe(true);
    expect(wrapped.properties['1'].type).toBe('string');

    expect(normalize({ properties: { name: { type: 'string' } } }).type).toBe('object');

    const shorthand = normalize({ name: { type: 'string' } });
    expect(component.jsf.JsonFormCompatibility).toBe(true);
    expect(shorthand.properties.name).toEqual({ type: 'string' });
    fixture.destroy();
  });
});
