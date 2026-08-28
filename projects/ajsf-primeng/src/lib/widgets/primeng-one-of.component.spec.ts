import { PrimengOneOfComponent } from './primeng-one-of.component';

describe('PrimengOneOfComponent', () => {
  it('initializes with empty template (stub matching material parity)', () => {
    const jsf = { initializeControl: jasmine.createSpy('initializeControl'), updateValue: jasmine.createSpy('updateValue') };
    const c = new PrimengOneOfComponent(jsf as any);
    c.layoutNode = { type: 'one-of', options: {} };
    c.ngOnInit();
    expect(jsf.initializeControl).toHaveBeenCalledWith(c);
  });

  it('forwards value updates through jsf', () => {
    const jsf = { initializeControl: jasmine.createSpy('initializeControl'), updateValue: jasmine.createSpy('updateValue') };
    const c = new PrimengOneOfComponent(jsf as any);
    c.layoutNode = { type: 'one-of', options: {} };
    c.ngOnInit();
    c.updateValue({ target: { value: 'test' } });
    expect(jsf.updateValue).toHaveBeenCalledWith(c, 'test');
  });
});
