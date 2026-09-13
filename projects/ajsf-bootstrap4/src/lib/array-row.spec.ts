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


  // A group's midpoint moves as it grows, so the action anchors at its top.
  it('anchors the button at the top when the item is a group', () => {
    const el = render({
      schema: {
        people: {
          type: 'array',
          title: 'People',
          items: {
            type: 'object',
            properties: { first: { type: 'string' }, last: { type: 'string' } },
          },
        },
      },
      data: { people: [{ first: 'Jane', last: 'Doe' }] },
    });
    const button = el.querySelector('.d-flex > button') as HTMLElement;
    expect(button, 'a group item is still removable').toBeTruthy();
    const row = button.parentElement;
    expect(row.className, 'a group anchors at its top').toContain('align-items-start');
    expect(row.className, 'and is not centred on its contents').not.toContain('align-items-center');
    expect(row.querySelectorAll('input').length,
      'the row really does hold a group rather than one control').toBeGreaterThan(1);
  });


  // What the layout resolved it to decides this, not how many controls it has.
  it('treats a group holding a single field as a group', () => {
    const el = render({
      schema: {
        people: {
          type: 'array',
          title: 'People',
          items: { type: 'object', properties: { first: { type: 'string' } } },
        },
      },
      data: { people: [{ first: 'Jane' }] },
    });
    const row = (el.querySelector('.d-flex > button') as HTMLElement).parentElement;
    expect(row.querySelectorAll('input, select, textarea').length,
      'exactly one control, and it is still a group').toEqual(1);
    expect(row.className, 'so it anchors at the top').toContain('align-items-start');
  });

  // Two branches would rebuild the surviving control as this flag flips.
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

  // Bootstrap reveals .invalid-feedback only after the .is-invalid element.
  it('renders the message as a following sibling of the invalid element', () => {
    // initializeFramework reassigns formControl, so stub the service instead.
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

describe('Bootstrap 4 input widget classification', () => {
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

  const classify = (type: string) => {
    component.layoutNode = { type, options: {} };
    component.initializeFramework();
    return component.options.isInputWidget;
  };

  // The row alignment reads this flag: a missing type aligns as a group.
  it('counts every check and radio variant as a control', () => {
    ['checkbox', 'checkboxes', 'checkboxes-inline', 'checkboxbuttons',
      'radio', 'radios', 'radios-inline', 'radiobuttons'].forEach((type) => {
      expect(classify(type), `${type} is a control, not a group`).toBe(true);
    });
  });

  it('still counts a container as a group', () => {
    ['array', 'fieldset', 'section'].forEach((type) => {
      expect(classify(type), `${type} is a group`).toBeFalsy();
    });
  });
});
