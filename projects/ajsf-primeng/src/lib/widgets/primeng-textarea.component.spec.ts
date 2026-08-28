import { PrimengTextareaComponent } from './primeng-textarea.component';

describe('PrimengTextareaComponent', () => {
  const make = (opts: any) => {
    const jsf = { initializeControl: jasmine.createSpy('initializeControl'), updateValue: jasmine.createSpy('updateValue') };
    const c = new PrimengTextareaComponent(jsf as any);
    c.layoutNode = { type: 'textarea', options: opts };
    c.ngOnInit();
    return { component: c, jsf };
  };

  it('copies placeholder to description when title is shown and no description exists', () => {
    const { component } = make({ placeholder: 'Enter details' });
    expect(component.options.description).toBe('Enter details');
  });

  it('does not overwrite an existing description', () => {
    const { component } = make({ placeholder: 'Enter details', description: 'Existing' });
    expect(component.options.description).toBe('Existing');
  });

  it('skips description copy when notitle is set', () => {
    const { component } = make({ notitle: true, placeholder: 'Enter details' });
    expect(component.options.description).toBeUndefined();
  });

  it('forwards value updates through jsf', () => {
    const { component, jsf } = make({});
    component.updateValue({ target: { value: 'world' } });
    expect(jsf.updateValue).toHaveBeenCalledWith(component, 'world');
  });
});
