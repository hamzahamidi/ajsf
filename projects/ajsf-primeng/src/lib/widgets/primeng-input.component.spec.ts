import { PrimengInputComponent } from './primeng-input.component';

describe('PrimengInputComponent', () => {
  const make = (opts: any, layoutType = 'text') => {
    const jsf = { initializeControl: jasmine.createSpy('initializeControl'), updateValue: jasmine.createSpy('updateValue') };
    const c = new PrimengInputComponent(jsf as any);
    c.layoutNode = { type: layoutType, options: opts };
    c.ngOnInit();
    return { component: c, jsf };
  };

  it('copies placeholder to description when title is shown and no description exists', () => {
    const { component } = make({ placeholder: 'Search here' });
    expect(component.options.description).toBe('Search here');
  });

  it('does not overwrite an existing description', () => {
    const { component } = make({ placeholder: 'Search here', description: 'Existing' });
    expect(component.options.description).toBe('Existing');
  });

  it('skips description copy when notitle is set', () => {
    const { component } = make({ notitle: true, placeholder: 'Search here' });
    expect(component.options.description).toBeUndefined();
  });

  it('forwards value updates through jsf', () => {
    const { component, jsf } = make({});
    component.updateValue({ target: { value: 'hello' } });
    expect(jsf.updateValue).toHaveBeenCalledWith(component, 'hello');
  });
});
