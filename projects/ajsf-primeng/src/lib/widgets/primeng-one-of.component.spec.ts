import { PrimengOneOfComponent } from './primeng-one-of.component';

describe('PrimengOneOfComponent', () => {
  const make = (opts: any) => {
    const jsf = {
      initializeControl: jasmine.createSpy('initializeControl'),
      updateValue: jasmine.createSpy('updateValue'),
    };
    const c = new PrimengOneOfComponent(jsf as any);
    c.layoutNode = { type: 'one-of', options: opts };
    c.ngOnInit();
    return { component: c, jsf };
  };

  it('builds selectList from titleMap', () => {
    const { component } = make({
      titleMap: [{ name: 'Option A', value: 'a' }, { name: 'Option B', value: 'b' }],
      required: true,
    });
    expect(component.selectList.length).toBe(2);
    expect(component.selectList[0].name).toBe('Option A');
    expect(component.selectList[0].value).toBe('a');
  });

  it('builds selectList from enum', () => {
    const { component } = make({ enum: ['x', 'y'], required: true });
    expect(component.selectList.length).toBe(2);
  });

  it('falls back to boolean titleMap when no titleMap or enum exists', () => {
    const { component } = make({});
    expect(component.selectList.length).toBeGreaterThan(0);
  });

  it('passes !readonly to initializeControl', () => {
    const { jsf } = make({ enum: ['a'], readonly: true });
    expect(jsf.initializeControl).toHaveBeenCalledWith(jasmine.anything(), false);
  });

  it('forwards value updates through jsf using event.value', () => {
    const { component, jsf } = make({ enum: ['a'] });
    component.updateValue({ value: 'a' });
    expect(jsf.updateValue).toHaveBeenCalledWith(component, 'a');
  });
});
