import { PrimengDatepickerComponent } from './primeng-datepicker.component';

describe('PrimengDatepickerComponent', () => {
  const jsf = () => ({
    initializeControl: jasmine.createSpy('initializeControl'),
    updateValue: jasmine.createSpy('updateValue'),
  });

  const make = (node: any) => {
    const j = jsf();
    const c = new PrimengDatepickerComponent(j as any);
    c.layoutNode = node;
    c.ngOnInit();
    return { component: c, jsf: j };
  };

  it('reads options from layoutNode', () => {
    const { component } = make({
      type: 'date',
      options: { title: 'Birth date' },
    });
    expect(component.options.title).toBe('Birth date');
  });

  it('calls initializeControl with writable binding', () => {
    const { jsf: j } = make({
      type: 'date',
      options: {},
    });
    expect(j.initializeControl).toHaveBeenCalledWith(jasmine.anything(), true);
  });

  it('respects readonly option', () => {
    const { jsf: j } = make({
      type: 'date',
      options: { readonly: true },
    });
    expect(j.initializeControl).toHaveBeenCalledWith(jasmine.anything(), false);
  });

  it('converts minimum to minDate', () => {
    const { component } = make({
      type: 'date',
      options: { minimum: '2020-01-01' },
    });
    expect(component.minDate).toEqual(new Date('2020-01-01'));
  });

  it('converts maximum to maxDate', () => {
    const { component } = make({
      type: 'date',
      options: { maximum: '2030-12-31' },
    });
    expect(component.maxDate).toEqual(new Date('2030-12-31'));
  });

  it('leaves minDate/maxDate undefined when not specified', () => {
    const { component } = make({
      type: 'date',
      options: {},
    });
    expect(component.minDate).toBeUndefined();
    expect(component.maxDate).toBeUndefined();
  });

  it('converts controlValue to dateValue', () => {
    const j = jsf();
    const c = new PrimengDatepickerComponent(j as any);
    c.layoutNode = { type: 'date', options: {} };
    c.controlValue = '2025-06-15';
    c.ngOnInit();
    expect(c.dateValue).toEqual(new Date('2025-06-15'));
  });

  it('falls back description to placeholder', () => {
    const { component } = make({
      type: 'date',
      options: { placeholder: 'Pick a date' },
    });
    expect(component.options.description).toBe('Pick a date');
  });

  it('forwards value updates through jsf', () => {
    const { component, jsf: j } = make({
      type: 'date',
      options: {},
    });
    const date = new Date('2025-08-29');
    component.updateValue(date);
    expect(j.updateValue).toHaveBeenCalledWith(component, date);
    expect(component.options.showErrors).toBe(true);
  });
});
