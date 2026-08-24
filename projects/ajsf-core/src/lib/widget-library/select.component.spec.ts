import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { JsonSchemaFormModule } from '../json-schema-form.module';
import { NoFrameworkModule } from '../framework-library/no-framework.module';
import { SelectComponent } from './select.component';

// The corpus harness presses nothing, so the value a select hands back after a
// real change event is only covered here.

describe('SelectComponent updateValue (unbound)', () => {
  const makeComponent = (values: any[]) => {
    const updates: any[] = [];
    const component = new SelectComponent({
      updateValue: (_widget: any, value: any) => updates.push(value),
    } as any);
    component.selectList = values.map(value => ({ name: `${value}`, value }));
    return { component, updates };
  };

  // The DOM reports every selection as a string, so a numeric enum stored
  // strings and the None option stored the four-character string "null".
  it('hands back null for the None option, not the string "null"', () => {
    const { component, updates } = makeComponent(['a', 'b']);
    component.selectList.unshift({ name: '<em>None</em>', value: null });
    component.updateValue({ target: { value: 'null' } });
    expect(updates).toEqual([null]);
  });

  it('hands back a number for a numeric enum', () => {
    const { component, updates } = makeComponent([1, 2, 3]);
    component.updateValue({ target: { value: '2' } });
    expect(updates).toEqual([2]);
  });

  it('hands back a boolean for a boolean enum', () => {
    const { component, updates } = makeComponent([true, false]);
    component.updateValue({ target: { value: 'false' } });
    expect(updates).toEqual([false]);
  });

  it('still hands back a string for a string enum', () => {
    const { component, updates } = makeComponent(['red', 'blue']);
    component.updateValue({ target: { value: 'blue' } });
    expect(updates).toEqual(['blue']);
  });

  it('finds a value inside an optgroup', () => {
    const { component, updates } = makeComponent(['x']);
    component.selectList.push({ group: 'g', items: [{ name: '7', value: 7 }] });
    component.updateValue({ target: { value: '7' } });
    expect(updates).toEqual([7]);
  });

  it('passes an unmatched value through unchanged', () => {
    const { component, updates } = makeComponent(['a']);
    component.updateValue({ target: { value: 'zz' } });
    expect(updates).toEqual(['zz']);
  });
});

describe('SelectComponent bound to a form control', () => {
  @Component({
      template: `
      <json-schema-form
        [form]="form"
        framework="no-framework"
        (onChanges)="data = $event"
        (isValid)="valid = $event"
      ></json-schema-form>`,
      standalone: false
  })
  class HostComponent {
    form: any;
    data: any;
    valid: boolean | null = null;
  }

  let fixture: ComponentFixture<HostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HostComponent],
      imports: [JsonSchemaFormModule, NoFrameworkModule],
    }).compileComponents();
  }));

  const render = (schema: any, data: any = {}) => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.form = { schema, data };
    fixture.detectChanges();
    return fixture;
  };

  const pickOption = (label: RegExp) => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    const option = Array.from(select.options)
      .find(candidate => label.test(candidate.textContent || ''));
    select.value = option.value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    return fixture.componentInstance.data;
  };

  // Picking None used to write the string "null" into the control, which the
  // formatter passed through as a real value.
  it('stores no value when the None option is picked, not the string "null"', () => {
    render({
      type: 'object',
      properties: { color: { type: 'string', enum: ['red', 'blue'] } },
    }, { color: 'red' });
    const data = pickOption(/None/);
    expect(data.color).toBeUndefined();
  });

  // The string "null" also violated the enum, so clearing an optional field
  // flipped the whole form invalid.
  it('stays valid after picking None on an optional enum', () => {
    render({
      type: 'object',
      properties: { color: { type: 'string', enum: ['red', 'blue'] } },
    }, { color: 'red' });
    pickOption(/None/);
    expect(fixture.componentInstance.valid).toBe(true);
  });

  it('stores the number when a numeric enum option is picked', () => {
    render({
      type: 'object',
      properties: { count: { type: 'number', enum: [1, 2, 3] } },
    }, { count: 1 });
    const data = pickOption(/^3$/);
    expect(data.count).toBe(3);
  });

  it('shows the initial value as selected', () => {
    render({
      type: 'object',
      properties: { color: { type: 'string', enum: ['red', 'blue'] } },
    }, { color: 'blue' });
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.selectedOptions[0].textContent).toContain('blue');
  });
});
