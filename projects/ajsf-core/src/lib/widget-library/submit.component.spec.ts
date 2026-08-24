import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { JsonSchemaFormModule } from '../json-schema-form.module';
import { NoFrameworkModule } from '../framework-library/no-framework.module';

// disableInvalidSubmit was dead for any layout-declared submit: the widget
// treats an explicit `disabled` option as an override, and the default options
// used to carry `disabled: false` into every layout node, so the override
// branch always won. The corpus presses nothing, so only these tests see it.
describe('SubmitComponent with a layout-declared submit', () => {
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

  const requiredName = {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
  };

  const render = (layout: any[], data: any = {}) => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.form = { schema: requiredName, layout, data };
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('input[type=submit]') as HTMLInputElement;
  };

  it('disables a layout-declared submit while the form is invalid', () => {
    const submit = render(['*', { type: 'submit', title: 'Save' }]);
    expect(submit.disabled).toBe(true);
  });

  it('enables the submit once the form becomes valid', () => {
    const submit = render(['*', { type: 'submit', title: 'Save' }]);
    const name: HTMLInputElement = fixture.nativeElement.querySelector('input[type=text]');
    name.value = 'Ada';
    name.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(submit.disabled).toBe(false);
  });

  it('lets an explicit disabled false keep the submit enabled while invalid', () => {
    const submit = render(['*', { type: 'submit', title: 'Save', disabled: false }]);
    expect(submit.disabled).toBe(false);
  });

  it('honours an explicit disabled true whatever the validity', () => {
    const submit = render(['*', { type: 'submit', title: 'Save', disabled: true }], { name: 'Ada' });
    expect(submit.disabled).toBe(true);
  });

  it('disables the auto-added submit the same way', () => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.form = {
      schema: requiredName, data: {}, options: { addSubmit: true },
    };
    fixture.detectChanges();
    const submit = fixture.nativeElement.querySelector('input[type=submit]') as HTMLInputElement;
    expect(submit.disabled).toBe(true);
  });
});
