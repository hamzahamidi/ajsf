import { MaterialNumberComponent } from './material-number.component';

// effectiveMinimum and effectiveMaximum are unit tested in core; these confirm
// the widget wires its native min and max through them.

describe('MaterialNumberComponent minValue and maxValue', () => {
  const make = (options: any) => {
    const component = new MaterialNumberComponent(null, {} as any);
    component.options = options;
    return component;
  };

  it('reads an inclusive or exclusive bound', () => {
    expect(make({ minimum: 2, maximum: 8 }).minValue).toBe(2);
    expect(make({ exclusiveMinimum: 5 }).minValue).toBe(5);
  });

  it('uses the stronger bound when both are present', () => {
    expect(make({ maximum: 8, exclusiveMaximum: 4 }).maxValue).toBe(4);
  });
});
