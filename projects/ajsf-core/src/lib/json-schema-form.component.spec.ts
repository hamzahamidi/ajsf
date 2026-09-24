import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoFrameworkModule } from './framework-library/no-framework.module';
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
