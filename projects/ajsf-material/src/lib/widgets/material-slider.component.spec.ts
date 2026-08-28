import { MaterialSliderComponent } from './material-slider.component';

// effectiveMinimum and effectiveMaximum are unit tested in core; these confirm
// the slider wires its track min and max through them.

describe('MaterialSliderComponent minValue and maxValue', () => {
  const make = (options: any) => {
    const component = new MaterialSliderComponent({} as any);
    component.options = options;
    return component;
  };

  it('reads an inclusive or exclusive bound', () => {
    expect(make({ minimum: 1, maximum: 10 }).minValue).toBe(1);
    expect(make({ exclusiveMaximum: 100 }).maxValue).toBe(100);
  });

  it('uses the stronger bound when both are present', () => {
    const c = make({ minimum: 1, exclusiveMinimum: 3 });
    expect(c.minValue).toBe(3);
  });
});
