import { PrimengSelectComponent } from './primeng-select.component';

describe('PrimengSelectComponent', () => {
  const make = (opts: any) => {
    const jsf = {
      initializeControl: jasmine.createSpy('initializeControl'),
      updateValue: jasmine.createSpy('updateValue'),
    };
    const c = new PrimengSelectComponent(jsf as any);
    c.layoutNode = { type: 'select', options: opts };
    c.ngOnInit();
    return { component: c, jsf };
  };

  it('builds a flat selectList from enum', () => {
    const { component } = make({ enum: ['a', 'b', 'c'], required: true });
    expect(component.selectList.length).toBe(3);
    expect(component.selectList[0].name).toBe('a');
    expect(component.selectList[0].value).toBe('a');
    expect(component.hasGroups).toBe(false);
  });

  it('copies placeholder to description when title is shown and no description exists', () => {
    const { component } = make({ placeholder: 'Pick one', enum: ['x'] });
    expect(component.options.description).toBe('Pick one');
  });

  it('does not overwrite an existing description', () => {
    const { component } = make({ placeholder: 'Pick one', description: 'Existing', enum: ['x'] });
    expect(component.options.description).toBe('Existing');
  });

  it('forwards value updates through jsf using event.value', () => {
    const { component, jsf } = make({ enum: ['a'] });
    component.updateValue({ value: 'a' });
    expect(jsf.updateValue).toHaveBeenCalledWith(component, 'a');
  });

  it('passes !readonly to initializeControl', () => {
    const { jsf } = make({ enum: ['a'], readonly: true });
    expect(jsf.initializeControl).toHaveBeenCalledWith(jasmine.anything(), false);
  });
});
