import { vi } from 'vitest';
import { Subject } from 'rxjs';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { JsonSchemaFormModule, JsonSchemaFormService, WidgetLibraryModule } from '@ajsf/core';
import { Bootstrap4FrameworkModule } from './bootstrap4-framework.module';
import { Bootstrap4FrameworkComponent } from './bootstrap4-framework.component';

@Component({
  standalone: true,
  imports: [Bootstrap4FrameworkModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<json-schema-form
    [form]="form"
    framework="bootstrap-4"></json-schema-form>`,
})
class ArrayHost {
  form: any;
}

const arrayForm = (minItems: number, items: number) => ({
  schema: {
    contacts: {
      type: 'array',
      title: 'Contacts',
      minItems,
      items: { type: 'string', title: 'Contact' },
    },
  },
  data: { contacts: Array.from({ length: items }, (_, i) => `c${i}`) },
});

describe('Bootstrap 4 array row', () => {
  let fixture: ComponentFixture<ArrayHost>;

  const render = (form: any): HTMLElement => {
    fixture = TestBed.createComponent(ArrayHost);
    fixture.componentInstance.form = form;
    fixture.detectChanges();
    return fixture.nativeElement;
  };

  /** The field wrapper of the first array item, whatever classes it carries. */
  const fieldWrapper = (el: HTMLElement): HTMLElement =>
    el.querySelector('input').closest('select-widget-widget').parentElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ArrayHost] }).compileComponents();
  });

  it('puts the remove button and the field in one flex row', () => {
    const el = render(arrayForm(0, 2));
    const button = el.querySelector('button[type=button]') as HTMLElement;
    expect(button, 'an array item should offer a remove button').toBeTruthy();
    const row = button.parentElement;
    expect(row.className, 'the row must be a flex container, or the float stands').toContain('d-flex');
    expect(row.className, 'the button aligns against the field, not the whole group')
      .toContain('align-items-center');
    expect(fieldWrapper(el).parentElement,
      'the button and the field must be siblings in that row').toBe(row);
    expect(button.className,
      'float utilities do nothing to a flex item, so the class should be gone').not.toContain('float-right');
  });

  // showRemoveButton flips while the form is live, so this has to be one
  // fixture crossing minItems rather than two separate renders. Two branches
  // for wrapped and unwrapped would rebuild the surviving control here, taking
  // its focus and its state with it.
  it('keeps the surviving control across a removal that crosses minItems', () => {
    const el = render(arrayForm(1, 2));
    const items = () => [...el.querySelectorAll('input:not([type=submit])')] as HTMLInputElement[];
    const removers = () => [...el.querySelectorAll('.d-flex > button')] as HTMLElement[];

    expect(items().length, 'two entries render two inputs').toEqual(2);
    expect(removers().length, 'both are removable above minItems').toEqual(2);

    const survivor = items()[0];
    const survivorWrapper = survivor.closest('select-widget-widget').parentElement;
    const survivorRow = survivorWrapper.parentElement;
    const jsf = fixture.debugElement.query(By.css('json-schema-form'))
      .injector.get(JsonSchemaFormService);
    const control = jsf.formGroup.get(['contacts', '0']);

    removers()[1].click();
    fixture.detectChanges();

    expect(items().length, 'one entry left').toEqual(1);
    expect(items()[0], 'the surviving input must be the same node').toBe(survivor);
    expect(items()[0].closest('select-widget-widget').parentElement,
      'and sit in the same wrapper').toBe(survivorWrapper);
    expect(survivorWrapper.parentElement, 'inside the same row').toBe(survivorRow);
    expect(jsf.formGroup.get(['contacts', '0']),
      'backed by the same control').toBe(control);
    expect(removers().length, 'at minItems the button goes').toEqual(0);
    expect(survivorRow.className,
      'and the row stops being a flex container without being replaced').not.toContain('d-flex');
  });

  it('leaves a field outside an array alone', () => {
    const el = render({ schema: { name: { type: 'string', title: 'Name' } } });
    expect(el.querySelector('button[type=button]'), 'nothing to remove').toBeFalsy();
    expect(el.querySelectorAll('.d-flex').length, 'no flex row without a button').toEqual(0);
  });
});

describe('Bootstrap 4 invalid feedback placement', () => {
  let component: Bootstrap4FrameworkComponent;
  let fixture: ComponentFixture<Bootstrap4FrameworkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonSchemaFormModule, CommonModule, WidgetLibraryModule],
      declarations: [Bootstrap4FrameworkComponent],
      providers: [JsonSchemaFormService],
    }).compileComponents();
    fixture = TestBed.createComponent(Bootstrap4FrameworkComponent);
    component = fixture.componentInstance;
    component.layoutIndex = [];
    component.dataIndex = [];
  });

  // Bootstrap reveals .invalid-feedback only as a following sibling of the
  // element carrying .is-invalid. The row the remove button joined now carries
  // that marker, so this is the assertion that the move preserved the rule.
  it('renders the message as a following sibling of the invalid element', () => {
    // initializeFramework reassigns formControl from the service, so the stub
    // has to be the service's answer rather than a field set on the component.
    const jsf = TestBed.inject(JsonSchemaFormService);
    vi.spyOn(jsf, 'getFormControl').mockReturnValue({
      status: 'INVALID',
      errors: { minLength: true },
      touched: true,
      dirty: false,
      statusChanges: new Subject(),
    } as any);
    component.layoutNode = { type: 'text', options: { errorMessage: 'Too short', enableErrorState: true } };
    component.initializeFramework();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.is-invalid'), 'the invalid marker should render').toBeTruthy();
    expect(el.querySelector('.invalid-feedback'), 'the message should render').toBeTruthy();
    expect(el.querySelectorAll('.is-invalid ~ .invalid-feedback').length,
      'the message must follow the element carrying is-invalid, not merely exist').toEqual(1);
  });
});
