import { vi } from 'vitest';
import { PrimengButtonComponent } from './primeng-button.component';

describe('PrimengButtonComponent', () => {
  const make = (opts: any) => {
    const jsf = {
      initializeControl: vi.fn(),
      updateValue: vi.fn(),
      formOptions: {},
      isValid: true,
      isValidChanges: { subscribe: vi.fn() },
    };
    const c = new PrimengButtonComponent(jsf as any);
    c.layoutNode = { type: 'submit', options: opts };
    c.ngOnInit();
    return { component: c, jsf };
  };

  it('sets controlDisabled from options.disabled', () => {
    const { component } = make({ disabled: true });
    expect(component.controlDisabled).toBe(true);
  });

  it('subscribes to isValidChanges when disableInvalidSubmit is set', () => {
    const jsf = {
      initializeControl: vi.fn(),
      updateValue: vi.fn(),
      formOptions: { disableInvalidSubmit: true },
      isValid: false,
      isValidChanges: { subscribe: vi.fn() },
    };
    const c = new PrimengButtonComponent(jsf as any);
    c.layoutNode = { type: 'submit', options: {} };
    c.ngOnInit();
    expect(c.controlDisabled).toBe(true);
    expect(jsf.isValidChanges.subscribe).toHaveBeenCalled();
  });

  it('calls onClick function when provided', () => {
    const onClick = vi.fn();
    const { component, jsf } = make({ onClick });
    const event = { target: { value: 'test' } };
    component.updateValue(event);
    expect(onClick).toHaveBeenCalledWith(event);
    expect(jsf.updateValue).not.toHaveBeenCalled();
  });

  it('falls back to jsf.updateValue when no onClick', () => {
    const { component, jsf } = make({});
    component.updateValue({ target: { value: 'clicked' } });
    expect(jsf.updateValue).toHaveBeenCalledWith(component, 'clicked');
  });
});
