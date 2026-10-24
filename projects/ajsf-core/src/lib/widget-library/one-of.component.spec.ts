import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { OneOfComponent } from './one-of.component';
import { JsonSchemaFormService } from '../json-schema-form.service';
import { WidgetLibraryModule } from './widget-library.module';

describe('OneOfComponent', () => {
  const make = (layoutNode: any, initialValue?: any) => {
    const updates: any[] = [];
    const initializeCalls: any[] = [];
    const jsf = {
      initializeControl: (widget: any, enabled: boolean) => {
        initializeCalls.push(enabled);
        if (initialValue !== undefined) {
          widget.boundControl = true;
          widget.formControl = { value: initialValue };
          widget.controlValue = initialValue;
        }
      },
      updateValue: (_widget: any, value: any) => updates.push(value),
    };
    const component = new OneOfComponent(jsf as any);
    component.layoutNode = layoutNode;
    component.ngOnInit();
    return { component, initializeCalls, updates };
  };

  it('builds a typed select list and forwards the selected value', () => {
    const { component, updates, initializeCalls } = make({
      type: 'one-of',
      options: {
        titleMap: [
          { name: 'One', value: 1 },
          { name: 'Two', value: 2 },
        ],
        required: true,
      },
    });

    expect(component.selectList).toEqual([
      { name: 'One', value: 1 },
      { name: 'Two', value: 2 },
    ]);
    component.onUnboundValueChange(2);
    expect(updates).toEqual([2]);
    expect(initializeCalls).toEqual([true]);
  });

  it('shows the selected child for an unkeyed fieldset', () => {
    const { component, initializeCalls, updates } = make({
      type: 'selectfieldset',
      options: {},
      items: [
        { type: 'section', options: { legend: 'First' } },
        { type: 'section', options: { title: 'Second' } },
      ],
    });

    expect(component.isFieldset).toBe(true);
    expect(component.selectList).toEqual([
      { name: 'First', value: 0 },
      { name: 'Second', value: 1 },
    ]);
    expect(component.selectedItem).toBe(0);
    component.onUnboundValueChange(1);
    expect(component.selectedItem).toBe(1);
    expect(updates).toEqual([]);
    expect(initializeCalls).toEqual([]);
  });

  it('selects the matching child from an explicitly keyed fieldset', () => {
    const { component, initializeCalls } = make({
      type: 'selectfieldset',
      options: {
        titleMap: [
          { name: 'First', value: 'first' },
          { name: 'Second', value: 'second' },
        ],
      },
      items: [{}, {}],
    }, 'second');

    expect(initializeCalls).toEqual([true]);
    expect(component.selectedValue).toBe('second');
    expect(component.selectedItem).toBe(1);
  });

  it('maps grouped options to their fieldset children', () => {
    const { component } = make({
      type: 'selectfieldset',
      options: {
        titleMap: [
          { group: 'Group', name: 'First', value: 'first' },
          { group: 'Group', name: 'Second', value: 'second' },
        ],
      },
      items: [{}, {}],
    }, 'second');

    expect(component.selectedItem).toBe(1);
  });

  it('uses a numeric fieldset value as its child index when it is not in the value map', () => {
    const { component } = make({
      type: 'selectfieldset',
      options: { titleMap: [{ name: 'First', value: 'first' }] },
      items: [{}, {}],
    }, 1);

    expect(component.selectedItem).toBe(1);
  });

  it('disables control initialization for read only options', () => {
    const { initializeCalls } = make({
      type: 'one-of',
      options: { enum: ['a'], readonly: true },
    });

    expect(initializeCalls).toEqual([false]);
  });
});

describe('OneOfComponent template', () => {
  let fixture: ComponentFixture<OneOfComponent>;
  let jsf: any;

  beforeEach(async () => {
    jsf = {
      framework: null,
      initializeControl: vi.fn((widget: any) => {
        widget.boundControl = false;
        widget.controlValue = null;
        widget.controlName = 'choice';
      }),
      updateValue: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [WidgetLibraryModule, FormsModule, ReactiveFormsModule],
      providers: [{ provide: JsonSchemaFormService, useValue: jsf }],
    }).compileComponents();
  });

  afterEach(() => fixture?.destroy());

  const render = (layoutNode: any): ComponentFixture<OneOfComponent> => {
    fixture = TestBed.createComponent(OneOfComponent);
    fixture.componentInstance.layoutNode = layoutNode;
    fixture.detectChanges();
    return fixture;
  };

  it('renders grouped options and the description for an unbound select', () => {
    const view = render({
      type: 'one-of',
      _id: 'choice',
      options: {
        title: 'Choice',
        titleMap: [
          { group: 'Group', name: 'First', value: 'first' },
          { group: 'Group', name: 'Second', value: 'second' },
        ],
        flatList: false,
        description: 'Choose one value',
      },
    });

    expect(view.nativeElement.querySelector('label').textContent).toContain('Choice');
    expect(view.nativeElement.querySelectorAll('optgroup')).toHaveLength(1);
    expect(view.nativeElement.querySelectorAll('optgroup option')).toHaveLength(2);
    expect(view.nativeElement.querySelector('small').textContent).toContain('Choose one value');
  });

  it('renders grouped options and errors for a bound select and reveals errors on blur', () => {
    jsf.initializeControl = vi.fn((widget: any) => {
      widget.boundControl = true;
      widget.formControl = new FormControl('first');
      widget.controlName = 'choice';
      widget.options.errorMessage = 'Choose a valid option';
      widget.options.showErrors = false;
    });
    const view = render({
      type: 'one-of',
      _id: 'choice',
      options: {
        titleMap: [
          { group: 'Group', name: 'First', value: 'first' },
          { group: 'Group', name: 'Second', value: 'second' },
        ],
        flatList: false,
      },
    });

    expect(view.nativeElement.querySelectorAll('optgroup option')).toHaveLength(2);
    const select: HTMLSelectElement = view.nativeElement.querySelector('select');
    select.dispatchEvent(new Event('blur'));
    view.detectChanges();

    expect(view.nativeElement.textContent).toContain('Choose a valid option');
  });

  it('renders the selected array fieldset child with its array data index', () => {
    const view = render({
      type: 'selectfieldset',
      dataType: 'array',
      dataPointer: '/items',
      options: {},
      items: [{ type: 'text', name: 'First' }],
    });
    expect(view.nativeElement.querySelectorAll('option')).toHaveLength(1);
    expect(view.nativeElement.querySelector('select-framework-widget')).toBeTruthy();
  });
});
