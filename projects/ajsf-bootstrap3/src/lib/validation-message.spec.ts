import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Bootstrap3FrameworkModule } from './bootstrap3-framework.module';

@Component({
  standalone: true,
  imports: [Bootstrap3FrameworkModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<json-schema-form
    [schema]="schema"
    framework="bootstrap-3"></json-schema-form>`,
})
class ValidationHost {
  schema = {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name', minLength: 1 },
      age: { type: 'integer', title: 'Age', minimum: 18 },
    },
    required: ['name'],
  };
}

// Rendered through json-schema-form rather than a stubbed control, so the
// message has to arrive through the same path it takes in an application.
describe('Bootstrap 3 validation message', () => {
  let fixture: ComponentFixture<ValidationHost>;

  const input = (name: string): HTMLInputElement =>
    fixture.nativeElement.querySelector(`input[name="${name}"]`);
  const field = (name: string): HTMLElement =>
    input(name).closest('bootstrap-3-framework');
  const helpText = (name: string): string =>
    Array.from(field(name).querySelectorAll('.help-block'))
      .map((block) => block.textContent).join(' ');
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
    expect(helpText('name')).not.toContain('This field is required.');
    expect(field('name').querySelector('.has-error')).toBeNull();
  });

  it('shows the required message once the empty field is touched', () => {
    touch('name');
    expect(helpText('name')).toContain('This field is required.');
    expect(field('name').querySelector('.has-error')).toBeTruthy();
  });

  it('shows the minimum message once a value below it is entered', () => {
    enter('age', '16');
    expect(helpText('age'), 'a changed field reports before it is blurred')
      .toContain('Must be 18 or more');
    touch('age');
    expect(helpText('age')).toContain('Must be 18 or more');
    expect(field('age').querySelector('.has-error')).toBeTruthy();
  });

  it('clears the message once the value is valid', () => {
    enter('age', '16');
    enter('age', '36');
    expect(helpText('age')).not.toContain('Must be 18 or more');
    expect(field('age').querySelector('.has-error')).toBeNull();
  });
});
