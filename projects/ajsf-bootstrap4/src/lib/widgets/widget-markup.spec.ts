import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Bootstrap4FrameworkModule } from '../bootstrap4-framework.module';

@Component({
  standalone: true,
  imports: [Bootstrap4FrameworkModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<json-schema-form [form]="form" framework="bootstrap-4"></json-schema-form>`,
})
class MarkupHost {
  form: any;
}

describe('Bootstrap 4 check and radio markup', () => {
  let fixture: ComponentFixture<MarkupHost>;

  const renderForm = (form: any): HTMLElement => {
    fixture = TestBed.createComponent(MarkupHost);
    fixture.componentInstance.form = form;
    fixture.detectChanges();
    return fixture.nativeElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MarkupHost] }).compileComponents();
  });

  describe('single checkbox', () => {
    const form = {
      schema: { accept: { type: 'boolean', title: 'Accept' } },
      form: [{ key: 'accept', type: 'checkbox' }],
    };

    it('renders the input and its label as siblings', () => {
      const input = renderForm(form).querySelector('input[type=checkbox]');
      const label = input.parentElement.querySelector('label');
      expect(input, 'the checkbox should render').toBeTruthy();
      expect(label, 'the label should be a sibling, not an ancestor').toBeTruthy();
      expect(label.contains(input), 'the label must not wrap the input').toBe(false);
    });

    it('pairs label[for] with input[id]', () => {
      const el = renderForm(form);
      const input = el.querySelector('input[type=checkbox]');
      const label = el.querySelector('label');
      expect(input.getAttribute('id')).toBeTruthy();
      expect(label.getAttribute('for')).toEqual(input.getAttribute('id'));
    });

    it('classes them as Bootstrap 4 documents, not as Bootstrap 3', () => {
      const el = renderForm(form);
      const input = el.querySelector('input[type=checkbox]');
      const label = el.querySelector('label');
      const wrapper = input.closest('.form-check');
      expect(wrapper, 'the input must sit inside a .form-check').toBeTruthy();
      expect(label.closest('.form-check')).toBe(wrapper);
      expect(wrapper.parentElement.closest('.form-check'),
        'nesting two .form-check elements doubles Bootstrap padding').toBeNull();
      expect(input.className).toContain('form-check-input');
      expect(label.className).toContain('form-check-label');
      expect(input.closest('.checkbox'), 'the Bootstrap 3 wrapper class is gone').toBeNull();
    });

    it('still toggles the control when the label is clicked', () => {
      const el = renderForm(form);
      const input = el.querySelector('input[type=checkbox]') as HTMLInputElement;
      const before = input.checked;
      (el.querySelector('label') as HTMLLabelElement).click();
      fixture.detectChanges();
      expect(input.checked, 'clicking the label should toggle the input').toEqual(!before);
    });
  });

  describe('checkbox list', () => {
    const form = {
      schema: {
        colours: { type: 'array', title: 'Colours', items: { type: 'string', enum: ['red', 'green'] } },
      },
      form: [{ key: 'colours', type: 'checkboxes' }],
    };

    it('renders every item as an input beside its own label', () => {
      const el = renderForm(form);
      const inputs = [...el.querySelectorAll('input[type=checkbox]')];
      expect(inputs.length, 'both enum values should render').toEqual(2);
      inputs.forEach((input) => {
        const label = input.parentElement.querySelector('label');
        expect(label, 'each item needs its own label').toBeTruthy();
        expect(label.contains(input), 'the label must not wrap the input').toBe(false);
        expect(label.getAttribute('for')).toEqual(input.getAttribute('id'));
      });
    });

    it('classes each item as Bootstrap 4 documents', () => {
      const input = renderForm(form).querySelector('input[type=checkbox]');
      const label = input.parentElement.querySelector('label');
      const wrapper = input.closest('.form-check');
      expect(wrapper, 'the input must sit inside a .form-check').toBeTruthy();
      expect(label.closest('.form-check')).toBe(wrapper);
      expect(wrapper.parentElement.closest('.form-check'),
        'nesting two .form-check elements doubles Bootstrap padding').toBeNull();
      expect(input.className).toContain('form-check-input');
      expect(label.className).toContain('form-check-label');
    });

    // Bootstrap 4 has no btn-check. Its toggle buttons keep the input inside
    // the label, so this exception is asserted rather than assumed.
    it('keeps the input inside the label for button sets, as Bootstrap 4 documents', () => {
      const el = renderForm({
        ...form,
        form: [{ key: 'colours', type: 'checkboxbuttons' }],
      });
      const input = el.querySelector('input[type=checkbox]');
      const label = input.closest('label');
      expect(label, 'a Bootstrap 4 toggle button wraps its input').toBeTruthy();
    });
  });
});
