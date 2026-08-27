import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { JsonSchemaFormModule } from '../json-schema-form.module';
import { NoFrameworkModule } from '../framework-library/no-framework.module';

// The corpus counts input elements, not their attributes, so the native min and
// max a number input carries for an exclusive bound is only covered here.

describe('NumberComponent min and max attributes', () => {
  @Component({
      template: `
      <json-schema-form
        [form]="form"
        framework="no-framework"
      ></json-schema-form>`,
      standalone: false
  })
  class HostComponent {
    form: any;
  }

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent],
      imports: [JsonSchemaFormModule, NoFrameworkModule],
    }).compileComponents();
  }));

  const render = (schema: any) => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.form = { schema };
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('input');
  };

  it('sets min from an inclusive minimum', () => {
    const input = render({
      type: 'object',
      properties: { n: { type: 'number', minimum: 2 } },
    });
    expect(input.getAttribute('min')).toBe('2');
  });

  it('sets min from a draft 6 numeric exclusiveMinimum', () => {
    const input = render({
      type: 'object',
      properties: { n: { type: 'number', exclusiveMinimum: 5 } },
    });
    expect(input.getAttribute('min')).toBe('5');
  });

  it('sets max from a draft 6 numeric exclusiveMaximum', () => {
    const input = render({
      type: 'object',
      properties: { n: { type: 'number', exclusiveMaximum: 10 } },
    });
    expect(input.getAttribute('max')).toBe('10');
  });

  it('uses the stronger bound when minimum and exclusiveMinimum are both present', () => {
    const input = render({
      type: 'object',
      properties: { n: { type: 'number', minimum: 2, exclusiveMinimum: 5 } },
    });
    expect(input.getAttribute('min')).toBe('5');
  });

  // A draft 4 boolean exclusiveMinimum converts to a numeric one with the
  // minimum removed, so a boolean must never reach the binding as "true".
  it('sets a numeric min from a draft 4 boolean exclusiveMinimum', () => {
    const input = render({
      type: 'object',
      properties: { n: { type: 'number', minimum: 5, exclusiveMinimum: true } },
    });
    expect(input.getAttribute('min')).toBe('5');
  });
});
