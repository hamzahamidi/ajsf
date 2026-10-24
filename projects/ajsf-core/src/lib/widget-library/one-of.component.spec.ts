import { OneOfComponent } from './one-of.component';

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

  it('disables control initialization for read only options', () => {
    const { initializeCalls } = make({
      type: 'one-of',
      options: { enum: ['a'], readonly: true },
    });

    expect(initializeCalls).toEqual([false]);
  });
});
