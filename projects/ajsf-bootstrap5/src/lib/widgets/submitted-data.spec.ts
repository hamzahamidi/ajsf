import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Bootstrap5FrameworkModule } from '../bootstrap5-framework.module';

@Component({
  standalone: true,
  imports: [Bootstrap5FrameworkModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<json-schema-form
    [schema]="schema"
    [layout]="layout"
    [data]="data"
    framework="bootstrap-5"
    (onSubmit)="submitted = $event"></json-schema-form>`,
})
class SubmitHost {
  schema: any;
  layout: any;
  data: any;
  submitted: any;
}

// The expected values are what @ajsf/core and @ajsf/bootstrap3 submit for the
// same schemas and clicks.
describe('Bootstrap 5 check and radio submitted data', () => {
  let fixture: ComponentFixture<SubmitHost>;

  const render = (properties: any, layout?: any[], data?: any): HTMLElement => {
    fixture = TestBed.createComponent(SubmitHost);
    Object.assign(fixture.componentInstance, {
      schema: { type: 'object', properties }, layout, data,
    });
    fixture.detectChanges();
    return fixture.nativeElement;
  };

  const click = (input: Element) => {
    (input as HTMLInputElement).click();
    fixture.detectChanges();
  };

  const submit = () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    return fixture.componentInstance.submitted;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SubmitHost] }).compileComponents();
  });

  describe('boolean checkbox', () => {
    const accept = { accept: { type: 'boolean', title: 'Accept' } };

    it('submits true once checked', () => {
      click(render(accept).querySelector('input[type=checkbox]'));
      expect(submit()).toEqual({ accept: true });
    });

    it('submits false once checked and unchecked again', () => {
      const input = render(accept).querySelector('input[type=checkbox]');
      click(input);
      click(input);
      expect(submit()).toEqual({ accept: false });
    });

    it('renders a true value as checked and submits false once unchecked', () => {
      const input = render(accept, undefined, { accept: true })
        .querySelector('input[type=checkbox]') as HTMLInputElement;
      expect(input.checked, 'the saved value should show as checked').toBe(true);
      click(input);
      expect(submit()).toEqual({ accept: false });
    });
  });

  it('submits the checked items of a checkbox list', () => {
    const inputs = render(
      { colours: { type: 'array', items: { type: 'string', enum: ['red', 'green', 'blue'] } } },
      [{ key: 'colours', type: 'checkboxes' }],
    ).querySelectorAll('input[type=checkbox]');
    click(inputs[0]);
    click(inputs[2]);
    expect(submit()).toEqual({ colours: ['red', 'blue'] });
  });

  it('submits the selected radio', () => {
    const inputs = render(
      { size: { type: 'string', enum: ['small', 'large'] } },
      [{ key: 'size', type: 'radios' }],
    ).querySelectorAll('input[type=radio]');
    click(inputs[1]);
    expect(submit()).toEqual({ size: 'large' });
  });
});
