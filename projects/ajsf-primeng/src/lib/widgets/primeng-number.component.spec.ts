import { PrimengNumberComponent } from './primeng-number.component';

describe('PrimengNumberComponent', () => {
  const make = (opts: any, dataType = 'number') => {
    const jsf = { initializeControl: jasmine.createSpy('initializeControl'), updateValue: jasmine.createSpy('updateValue') };
    const c = new PrimengNumberComponent(jsf as any);
    c.layoutNode = { type: 'number', dataType, options: opts };
    c.ngOnInit();
    return { component: c, jsf };
  };

  it('copies placeholder to description when title is shown and no description exists', () => {
    const { component } = make({ placeholder: 'Enter amount' });
    expect(component.options.description).toBe('Enter amount');
  });

  it('does not overwrite an existing description', () => {
    const { component } = make({ placeholder: 'Enter amount', description: 'Existing' });
    expect(component.options.description).toBe('Existing');
  });

  it('disallows decimals for integer dataType', () => {
    const { component } = make({}, 'integer');
    expect(component.allowDecimal).toBe(false);
  });

  it('allows decimals for number dataType', () => {
    const { component } = make({}, 'number');
    expect(component.allowDecimal).toBe(true);
  });

  it('computes minValue from effectiveMinimum', () => {
    const { component } = make({ minimum: 5 });
    expect(component.minValue).toBe(5);
  });

  it('computes maxValue from effectiveMaximum', () => {
    const { component } = make({ maximum: 100 });
    expect(component.maxValue).toBe(100);
  });

  it('forwards value updates through jsf using event.value', () => {
    const { component, jsf } = make({});
    component.updateValue({ value: 42 });
    expect(jsf.updateValue).toHaveBeenCalledWith(component, 42);
  });
});
