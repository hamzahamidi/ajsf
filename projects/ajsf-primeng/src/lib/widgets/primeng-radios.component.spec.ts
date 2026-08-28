import { PrimengRadiosComponent } from './primeng-radios.component';

describe('PrimengRadiosComponent', () => {
  const make = (opts: any, layoutType = 'radios') => {
    const jsf = {
      initializeControl: jasmine.createSpy('initializeControl'),
      updateValue: jasmine.createSpy('updateValue'),
    };
    const c = new PrimengRadiosComponent(jsf as any);
    c.layoutNode = { type: layoutType, options: opts };
    c.ngOnInit();
    return { component: c, jsf };
  };

  it('builds radiosList from enum', () => {
    const { component } = make({ enum: ['yes', 'no'] });
    expect(component.radiosList.length).toBe(2);
    expect(component.radiosList[0].name).toBe('yes');
  });

  it('sets column direction by default', () => {
    const { component } = make({ enum: ['a'] });
    expect(component.flexDirection).toBe('column');
  });

  it('sets row direction for radios-inline', () => {
    const { component } = make({ enum: ['a'] }, 'radios-inline');
    expect(component.flexDirection).toBe('row');
  });

  it('forwards value updates through jsf', () => {
    const { component, jsf } = make({ enum: ['a'] });
    component.updateValue('a');
    expect(jsf.updateValue).toHaveBeenCalledWith(component, 'a');
  });

  it('passes !readonly to initializeControl', () => {
    const { jsf } = make({ enum: ['a'], readonly: true });
    expect(jsf.initializeControl).toHaveBeenCalledWith(jasmine.anything(), false);
  });
});
