import { PrimengButtonGroupComponent } from './primeng-button-group.component';

describe('PrimengButtonGroupComponent', () => {
  const make = (opts: any) => {
    const jsf = {
      initializeControl: jasmine.createSpy('initializeControl'),
      updateValue: jasmine.createSpy('updateValue'),
    };
    const c = new PrimengButtonGroupComponent(jsf as any);
    c.layoutNode = { type: 'button-group', options: opts };
    c.ngOnInit();
    return { component: c, jsf };
  };

  it('builds radiosList from enum', () => {
    const { component } = make({ enum: ['opt1', 'opt2', 'opt3'] });
    expect(component.radiosList.length).toBe(3);
    expect(component.radiosList[0].name).toBe('opt1');
    expect(component.radiosList[0].value).toBe('opt1');
  });

  it('forwards value updates through jsf using event.value', () => {
    const { component, jsf } = make({ enum: ['a'] });
    component.updateValue({ value: 'a' });
    expect(jsf.updateValue).toHaveBeenCalledWith(component, 'a');
  });

  it('sets showErrors on update', () => {
    const { component } = make({ enum: ['a'] });
    component.updateValue({ value: 'a' });
    expect(component.options.showErrors).toBe(true);
  });
});
