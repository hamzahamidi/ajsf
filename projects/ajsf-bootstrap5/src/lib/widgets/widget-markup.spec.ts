import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Bootstrap5FrameworkModule } from '../bootstrap5-framework.module';

@Component({
  standalone: true,
  imports: [Bootstrap5FrameworkModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<json-schema-form [form]="form" framework="bootstrap-5"></json-schema-form>`,
})
class MarkupHost {
  form: any;
}

describe('Bootstrap 5 check and radio markup', () => {
  let fixture: ComponentFixture<MarkupHost>;

  /** Renders a whole form, which is how a consumer reaches these widgets. */
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

    // The pairing is the whole reason a sibling label still toggles the input.
    it('pairs label[for] with input[id]', () => {
      const el = renderForm(form);
      const input = el.querySelector('input[type=checkbox]');
      const label = el.querySelector('label');
      expect(input.getAttribute('id')).toBeTruthy();
      expect(label.getAttribute('for')).toEqual(input.getAttribute('id'));
    });

    it('wraps them in form-check and classes them as Bootstrap 5 documents', () => {
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

    it('classes each item as Bootstrap 5 documents', () => {
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

    it('marks the inline variant with form-check-inline', () => {
      const el = renderForm({
        ...form,
        form: [{ key: 'colours', type: 'checkboxes-inline' }],
      });
      const input = el.querySelector('input[type=checkbox]');
      expect(input.closest('.form-check-inline'),
        'the inline variant wraps items in .form-check-inline').toBeTruthy();
    });

    // Bootstrap 5 replaced the nested toggle-button idiom with btn-check on a
    // sibling input beside a label.btn.
    it('uses the btn-check idiom for button sets', () => {
      const el = renderForm({
        ...form,
        form: [{ key: 'colours', type: 'checkboxbuttons' }],
      });
      const input = el.querySelector('input[type=checkbox]');
      const label = input.parentElement.querySelector('label');
      expect(input.className).toContain('btn-check');
      expect(label.contains(input), 'btn-check keeps the input outside the label').toBe(false);
    });
  });

  describe('radio list', () => {
    const form = {
      schema: { size: { type: 'string', title: 'Size', enum: ['small', 'large'] } },
      form: [{ key: 'size', type: 'radios' }],
    };

    it('renders every item as an input beside its own label', () => {
      const el = renderForm(form);
      const inputs = [...el.querySelectorAll('input[type=radio]')];
      expect(inputs.length, 'both enum values should render').toEqual(2);
      inputs.forEach((input) => {
        const label = input.parentElement.querySelector('label');
        expect(label, 'each item needs its own label').toBeTruthy();
        expect(label.contains(input), 'the label must not wrap the input').toBe(false);
        expect(label.getAttribute('for')).toEqual(input.getAttribute('id'));
      });
    });

    it('classes each item as Bootstrap 5 documents', () => {
      const input = renderForm(form).querySelector('input[type=radio]');
      const label = input.parentElement.querySelector('label');
      const wrapper = input.closest('.form-check');
      expect(wrapper, 'the input must sit inside a .form-check').toBeTruthy();
      expect(label.closest('.form-check')).toBe(wrapper);
      expect(wrapper.parentElement.closest('.form-check'),
        'nesting two .form-check elements doubles Bootstrap padding').toBeNull();
      expect(input.className).toContain('form-check-input');
      expect(label.className).toContain('form-check-label');
    });

    it('marks the inline variant with form-check-inline', () => {
      const el = renderForm({ ...form, form: [{ key: 'size', type: 'radios-inline' }] });
      expect(el.querySelector('input[type=radio]').closest('.form-check-inline'),
        'the inline variant wraps items in .form-check-inline').toBeTruthy();
    });

    it('selects the item matching the control value', () => {
      const el = renderForm({
        ...form,
        form: [{ key: 'size', type: 'radios' }],
        formData: { size: 'large' },
      });
      const checked = [...el.querySelectorAll('input[type=radio]')]
        .filter((i: HTMLInputElement) => i.checked);
      expect(checked.length, 'exactly one radio should be checked').toEqual(1);
    });
  });
});
