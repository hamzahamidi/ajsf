import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonSchemaFormService } from '@ajsf/core';
import { Bootstrap5FrameworkModule } from '../bootstrap5-framework.module';

@Component({
  standalone: true,
  imports: [Bootstrap5FrameworkModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<json-schema-form
    [form]="form"
    framework="bootstrap-5"
    (onChanges)="value = $event"></json-schema-form>`,
})
class MarkupHost {
  form: any;
  value: any;
}

@Component({
  standalone: true,
  imports: [Bootstrap5FrameworkModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<bootstrap5-checkboxes-widget
      [layoutNode]="checkboxes" [dataIndex]="[]" [layoutIndex]="[]"></bootstrap5-checkboxes-widget>
    <bootstrap5-radios-widget
      [layoutNode]="radios" [dataIndex]="[]" [layoutIndex]="[]"></bootstrap5-radios-widget>`,
  providers: [JsonSchemaFormService],
})
class StandaloneHost {
  checkboxes: any = {
    _id: 1, type: 'checkboxes', dataPointer: '/colours',
    options: { title: 'Colours', enum: ['red', 'green'] },
  };
  radios: any = {
    _id: 2, type: 'radios', dataPointer: '/size',
    options: { title: 'Size', enum: ['small', 'large'] },
  };
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

    // A layout item with no key gets no form control, and the widget renders
    // its unbound input instead, which is a second copy of the markup.
    it('renders the unbound input as a sibling too', () => {
      const el = renderForm({
        schema: { accept: { type: 'boolean', title: 'Accept' } },
        form: [{ type: 'checkbox', title: 'Accept' }],
      });
      const input = el.querySelector('input[type=checkbox]') as HTMLInputElement;
      const label = input.parentElement.querySelector('label');
      expect(label.contains(input), 'the label must not wrap the input').toBe(false);
      expect(label.getAttribute('for')).toEqual(input.getAttribute('id'));
      expect(input.className).toContain('form-check-input');
      (label as HTMLLabelElement).click();
      fixture.detectChanges();
      expect(input.checked, 'clicking the label should still reach the input').toBe(true);
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

    it('renders inline checkboxes as siblings, each in its own wrapper', () => {
      const el = renderForm({
        ...form,
        form: [{ key: 'colours', type: 'checkboxes-inline' }],
      });
      const inputs = [...el.querySelectorAll('input[type=checkbox]')];
      expect(inputs.length, 'both enum values should render').toEqual(2);
      inputs.forEach((input) => {
        const label = input.parentElement.querySelector('label');
        expect(label, 'each item needs its own label').toBeTruthy();
        expect(label.contains(input), 'the label must not wrap the input').toBe(false);
        expect(label.getAttribute('for')).toEqual(input.getAttribute('id'));

        const wrapper = input.closest('.form-check-inline');
        expect(wrapper, 'the input must sit inside a form-check-inline element').toBeTruthy();
        expect(label.closest('.form-check-inline')).toBe(wrapper);
        expect(wrapper.parentElement.closest('.form-check-inline'),
          'each item must own its wrapper rather than sharing one').toBeNull();
        expect(wrapper.querySelectorAll('input').length,
          'a shared wrapper would hold every input').toEqual(1);
        expect(input.className).toContain('form-check-input');
        expect(label.className).toContain('form-check-label');
      });
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

    it('reports the clicked value from every layout variant', () => {
      ['checkboxes', 'checkboxes-inline', 'checkboxbuttons'].forEach((type) => {
        const el = renderForm({ ...form, form: [{ key: 'colours', type }] });
        const red = el.querySelector('input[type=checkbox]') as HTMLInputElement;
        (el.querySelector(`label[for="${red.id}"]`) as HTMLLabelElement).click();
        fixture.detectChanges();
        expect(fixture.componentInstance.value.colours,
          `${type} should report the item the label points at`).toEqual(['red']);
      });
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

    // A checkbox list is a FormArray, which core never disables from this
    // flag, so only the radio list can assert it.
    it('disables every rendered input when the control is disabled', () => {
      const el = renderForm({
        ...form,
        form: [{ key: 'size', type: 'radios', disabled: true }],
      });
      const inputs = [...el.querySelectorAll('input[type=radio]')] as HTMLInputElement[];
      expect(inputs.length, 'both enum values should render').toEqual(2);
      inputs.forEach((input) => {
        expect(input.disabled, 'the disabled attribute belongs on the input').toBe(true);
      });
    });

    it('renders inline radios as siblings, each in its own wrapper', () => {
      const el = renderForm({ ...form, form: [{ key: 'size', type: 'radios-inline' }] });
      const inputs = [...el.querySelectorAll('input[type=radio]')];
      expect(inputs.length, 'both enum values should render').toEqual(2);
      inputs.forEach((input) => {
        const label = input.parentElement.querySelector('label');
        expect(label, 'each item needs its own label').toBeTruthy();
        expect(label.contains(input), 'the label must not wrap the input').toBe(false);
        expect(label.getAttribute('for')).toEqual(input.getAttribute('id'));

        const wrapper = input.closest('.form-check-inline');
        expect(wrapper, 'the input must sit inside a form-check-inline element').toBeTruthy();
        expect(label.closest('.form-check-inline')).toBe(wrapper);
        expect(wrapper.parentElement.closest('.form-check-inline'),
          'each item must own its wrapper rather than sharing one').toBeNull();
        expect(wrapper.querySelectorAll('input').length,
          'a shared wrapper would hold every input').toEqual(1);
        expect(input.className).toContain('form-check-input');
        expect(label.className).toContain('form-check-label');
      });
    });

    // Bootstrap 4 nests the input inside the label for toggle buttons; this
    // pins the opposite for Bootstrap 5, which uses the btn-check idiom here too.
    it('uses the btn-check idiom for radio button sets, unlike Bootstrap 4', () => {
      const el = renderForm({ ...form, form: [{ key: 'size', type: 'radiobuttons' }] });
      const input = el.querySelector('input[type=radio]');
      const label = input.parentElement.querySelector('label');
      expect(input.className).toContain('btn-check');
      expect(label.contains(input), 'btn-check keeps the input outside the label').toBe(false);
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

    it('reports the clicked value from every layout variant', () => {
      ['radios', 'radios-inline', 'radiobuttons'].forEach((type) => {
        const el = renderForm({ ...form, form: [{ key: 'size', type }] });
        const large = [...el.querySelectorAll('input[type=radio]')].pop() as HTMLInputElement;
        (el.querySelector(`label[for="${large.id}"]`) as HTMLLabelElement).click();
        fixture.detectChanges();
        expect(fixture.componentInstance.value.size,
          `${type} should report the item the label points at`).toEqual('large');
      });
    });
  });

  // The framework component renders the group title itself and blanks the one
  // it passes on, so this title only appears when the widget is used directly,
  // which the package's public API allows.
  describe('a widget used without the framework', () => {
    const render = (): HTMLElement => {
      const standalone = TestBed.createComponent(StandaloneHost);
      standalone.detectChanges();
      return standalone.nativeElement;
    };

    it('renders its own group title', () => {
      const el = render();
      const checkboxes = el.querySelector('bootstrap5-checkboxes-widget');
      const radios = el.querySelector('bootstrap5-radios-widget');
      expect(checkboxes.querySelector('label').textContent).toEqual('Colours');
      expect(radios.querySelector('label').textContent).toEqual('Size');
      expect(checkboxes.querySelectorAll('input').length,
        'the items should render beneath the title').toEqual(2);
    });

    it('hides the group title when notitle is set', () => {
      const standalone = TestBed.createComponent(StandaloneHost);
      standalone.componentInstance.checkboxes.options.notitle = true;
      standalone.detectChanges();
      const title = standalone.nativeElement
        .querySelector('bootstrap5-checkboxes-widget label') as HTMLElement;
      expect(title.style.display, 'notitle should hide the title, not drop it').toEqual('none');
    });
  });
});
