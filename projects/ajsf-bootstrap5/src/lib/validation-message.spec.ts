import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Bootstrap5FrameworkModule } from './bootstrap5-framework.module';

@Component({
  standalone: true,
  imports: [Bootstrap5FrameworkModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<json-schema-form
    [schema]="schema"
    framework="bootstrap-5"></json-schema-form>`,
})
class ValidationHost {
  schema = {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name', minLength: 1 },
      age: { type: 'integer', title: 'Age', minimum: 18 },
      contact: {
        type: 'object',
        title: 'Contact',
        minProperties: 2,
        properties: { email: { type: 'string' }, phone: { type: 'string' } },
      },
    },
    required: ['name'],
  };
}

describe('Bootstrap 5 validation message', () => {
  let fixture: ComponentFixture<ValidationHost>;

  const input = (name: string): HTMLInputElement =>
    fixture.nativeElement.querySelector(`input[name="${name}"]`);
  const field = (name: string): HTMLElement =>
    input(name).closest('bootstrap-5-framework');
  const touch = (name: string) => {
    input(name).dispatchEvent(new Event('focus'));
    input(name).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(input(name).classList, 'the blur has to reach the form control').toContain('ng-touched');
  };
  const enter = (name: string, value: string) => {
    input(name).value = value;
    input(name).dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ValidationHost] }).compileComponents();
    fixture = TestBed.createComponent(ValidationHost);
    fixture.detectChanges();
  });

  it('shows nothing on a required field that has not been touched', () => {
    expect(field('name').querySelector('.invalid-feedback')).toBeNull();
    expect(field('name').querySelector('.is-invalid')).toBeNull();
  });

  it('shows the required message once the empty field is touched', () => {
    touch('name');
    const feedback = field('name').querySelector('.invalid-feedback');
    expect(feedback, 'the message needs an .invalid-feedback element').toBeTruthy();
    expect(feedback.textContent).toContain('This field is required.');
    expect(field('name').querySelectorAll('.is-invalid ~ .invalid-feedback').length,
      'Bootstrap hides .invalid-feedback unless it follows .is-invalid').toEqual(1);
  });

  it('shows the minimum message once a value below it is entered', () => {
    enter('age', '16');
    const feedback = field('age').querySelector('.invalid-feedback');
    expect(feedback, 'a changed field reports before it is blurred').toBeTruthy();
    expect(feedback.textContent).toContain('Must be 18 or more');
    touch('age');
    expect(field('age').querySelector('.invalid-feedback').textContent)
      .toContain('Must be 18 or more');
    expect(field('age').querySelectorAll('.is-invalid ~ .invalid-feedback').length).toEqual(1);
  });

  it('does not repeat a container message below the container', () => {
    enter('email', 'ada@example.com');
    const text: string = fixture.nativeElement.textContent;
    expect(text.split('Must have 2 or more items').length - 1).toEqual(1);
  });

  it('clears the message once the value is valid', () => {
    enter('age', '16');
    enter('age', '36');
    expect(field('age').querySelector('.invalid-feedback')).toBeNull();
    expect(field('age').querySelector('.is-invalid')).toBeNull();
  });
});
