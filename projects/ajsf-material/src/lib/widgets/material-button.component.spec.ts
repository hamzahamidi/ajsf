import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { JsonSchemaFormModule } from '@ajsf/core';
import { MaterialDesignFrameworkModule } from '../material-design-framework.module';

// The material submit renders through material-button, which carried the same
// dead disableInvalidSubmit branch as the core submit widget.
describe('MaterialButtonComponent as a layout-declared submit', () => {
  @Component({
      template: `
      <json-schema-form
        [form]="form"
        framework="material-design"
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
      imports: [JsonSchemaFormModule, MaterialDesignFrameworkModule, NoopAnimationsModule],
    }).compileComponents();
  }));

  const render = (layout: any[], data: any = {}) => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.form = {
      schema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
      layout, data,
    };
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('material-button-widget button') as HTMLButtonElement;
  };

  it('disables a layout-declared submit while the form is invalid', () => {
    const button = render(['*', { type: 'submit', title: 'Save' }]);
    expect(button.disabled).toBe(true);
  });

  it('honours an explicit disabled true whatever the validity', () => {
    const button = render(['*', { type: 'submit', title: 'Save', disabled: true }], { name: 'Ada' });
    expect(button.disabled).toBe(true);
  });
});
