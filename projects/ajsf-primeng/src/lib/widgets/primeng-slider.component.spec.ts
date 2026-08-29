import { PrimengSliderComponent } from './primeng-slider.component';

describe('PrimengSliderComponent', () => {
  const jsf = () => ({
    initializeControl: jasmine.createSpy('initializeControl'),
    updateValue: jasmine.createSpy('updateValue'),
  });

  const make = (node: any) => {
    const j = jsf();
    const c = new PrimengSliderComponent(j as any);
    c.layoutNode = node;
    c.ngOnInit();
    return { component: c, jsf: j };
  };

  it('reads options from layoutNode', () => {
    const { component } = make({
      type: 'slider',
      options: { minimum: 0, maximum: 100, multipleOf: 5 },
    });
    expect(component.options.minimum).toBe(0);
    expect(component.options.maximum).toBe(100);
  });

  it('calls initializeControl with writable binding', () => {
    const { jsf: j } = make({
      type: 'slider',
      options: {},
    });
    expect(j.initializeControl).toHaveBeenCalledWith(jasmine.anything(), true);
  });

  it('respects readonly option', () => {
    const { jsf: j } = make({
      type: 'slider',
      options: { readonly: true },
    });
    expect(j.initializeControl).toHaveBeenCalledWith(jasmine.anything(), false);
  });

  it('computes minValue from options.minimum', () => {
    const { component } = make({
      type: 'slider',
      options: { minimum: 10 },
    });
    expect(component.minValue).toBe(10);
  });

  it('computes maxValue from options.maximum', () => {
    const { component } = make({
      type: 'slider',
      options: { maximum: 200 },
    });
    expect(component.maxValue).toBe(200);
  });

  it('handles exclusiveMinimum', () => {
    const { component } = make({
      type: 'slider',
      options: { exclusiveMinimum: 5 },
    });
    expect(component.minValue).toBe(5);
  });

  it('handles exclusiveMaximum', () => {
    const { component } = make({
      type: 'slider',
      options: { exclusiveMaximum: 100 },
    });
    expect(component.maxValue).toBe(100);
  });

  it('picks the tighter of minimum and exclusiveMinimum', () => {
    const { component } = make({
      type: 'slider',
      options: { minimum: 2, exclusiveMinimum: 8 },
    });
    expect(component.minValue).toBe(8);
  });

  it('picks the tighter of maximum and exclusiveMaximum', () => {
    const { component } = make({
      type: 'slider',
      options: { maximum: 50, exclusiveMaximum: 30 },
    });
    expect(component.maxValue).toBe(30);
  });

  it('forwards value updates through jsf', () => {
    const { component, jsf: j } = make({
      type: 'slider',
      options: {},
    });
    component.updateValue({ value: 42 });
    expect(j.updateValue).toHaveBeenCalledWith(component, 42);
    expect(component.options.showErrors).toBe(true);
  });
});
