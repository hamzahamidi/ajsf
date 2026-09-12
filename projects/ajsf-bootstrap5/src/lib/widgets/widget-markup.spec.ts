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
});
