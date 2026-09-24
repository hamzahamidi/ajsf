import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Bootstrap4FrameworkModule } from './bootstrap4-framework.module';

@Component({
  standalone: true,
  imports: [Bootstrap4FrameworkModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<json-schema-form
    [schema]="schema"
    [layout]="layout"
    framework="bootstrap-4"></json-schema-form>`,
})
class ValidationHost {
  layout: any[];
  schema = {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name', minLength: 1, description: 'Your full name' },
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

describe('Bootstrap 4 validation message', () => {
  let fixture: ComponentFixture<ValidationHost>;

  const render = (layout?: any[]) => {
    fixture = TestBed.createComponent(ValidationHost);
    fixture.componentInstance.layout = layout;
    fixture.detectChanges();
  };
  const input = (name: string): HTMLInputElement =>
    fixture.nativeElement.querySelector(`input[name="${name}"]`);
  const field = (name: string): HTMLElement =>
    input(name).closest('bootstrap-4-framework');
  const feedbackText = (name: string): string[] =>
    Array.from(field(name).querySelectorAll('.invalid-feedback')).map((el) => el.textContent);
  const shownFeedback = (name: string): number =>
    field(name).querySelectorAll('.is-invalid ~ .invalid-feedback').length;
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
  const selectTab = (title: string) => {
    const tab = Array.from(fixture.nativeElement.querySelectorAll('tabs-widget a'))
      .find((a: HTMLElement) => a.textContent.trim() === title) as HTMLElement;
    tab.click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ValidationHost] }).compileComponents();
  });

  it('shows nothing on a required field that has not been touched', () => {
    render();
    expect(field('name').querySelector('.invalid-feedback')).toBeNull();
    expect(field('name').querySelector('.is-invalid')).toBeNull();
  });

  it('shows the required message once the empty field is touched', () => {
    render();
    touch('name');
    expect(feedbackText('name'), 'the message needs an .invalid-feedback element')
      .toEqual(['This field is required.']);
    expect(shownFeedback('name'),
      'Bootstrap hides .invalid-feedback unless it follows .is-invalid').toEqual(1);
  });

  it('shows the minimum message once a value below it is entered', () => {
    render();
    enter('age', '16');
    expect(feedbackText('age'), 'a changed field reports before it is blurred')
      .toEqual(['Must be 18 or more']);
    touch('age');
    expect(feedbackText('age')).toEqual(['Must be 18 or more']);
    expect(shownFeedback('age')).toEqual(1);
  });

  it('does not repeat a container message below the container', () => {
    render();
    enter('email', 'ada@example.com');
    const text: string = fixture.nativeElement.textContent;
    expect(text.split('Must have 2 or more items').length - 1).toEqual(1);
  });

  it('clears the message once the value is valid', () => {
    render();
    enter('age', '16');
    enter('age', '36');
    expect(field('age').querySelector('.invalid-feedback')).toBeNull();
    expect(field('age').querySelector('.is-invalid')).toBeNull();
  });

  it('shows the message on the first render when the layout sets feedbackOnRender', () => {
    render([{ key: 'name', feedbackOnRender: true }, 'age']);
    expect(feedbackText('name')).toEqual(['This field is required.']);
    expect(shownFeedback('name')).toEqual(1);
  });

  it('keeps the message on a touched field that renders again', () => {
    render([{ type: 'tabs', tabs: [{ title: 'One', items: ['name'] }, { title: 'Two', items: ['age'] }] }]);
    touch('name');
    selectTab('Two');
    selectTab('One');
    expect(input('name').classList).toContain('ng-touched');
    expect(feedbackText('name')).toEqual(['This field is required.']);
    expect(shownFeedback('name')).toEqual(1);
  });

  it('shows no error state when the layout sets enableErrorState to false', () => {
    render([{ key: 'name', enableErrorState: false }, 'age']);
    touch('name');
    expect(field('name').querySelector('.is-invalid')).toBeNull();
    expect(field('name').querySelector('.invalid-feedback')).toBeNull();
    expect(field('name').querySelector('.form-text').textContent).toContain('Your full name');
  });

  it('does not show the description beside the message', () => {
    render();
    touch('name');
    expect(feedbackText('name')).toEqual(['This field is required.']);
    expect(field('name').querySelector('.form-text')).toBeNull();
  });
});
