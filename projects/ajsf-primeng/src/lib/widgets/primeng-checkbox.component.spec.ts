import { vi } from 'vitest';
import { PrimengCheckboxComponent } from './primeng-checkbox.component';

describe('PrimengCheckboxComponent', () => {
  const make = (opts: any, layoutType = 'checkbox') => {
    const jsf = {
      initializeControl: vi.fn(),
      updateValue: vi.fn(),
      getFormControlValue: vi.fn().mockReturnValue(false),
    };
    const c = new PrimengCheckboxComponent(jsf as any);
    c.layoutNode = { type: layoutType, options: opts };
    c.ngOnInit();
    return { component: c, jsf };
  };

  it('initializes controlValue to false when null', () => {
    const { component, jsf } = make({});
    expect(component.controlValue).toBe(false);
    expect(jsf.updateValue).toHaveBeenCalledWith(component, false);
  });

  it('detects slide-toggle from layoutNode.type', () => {
    const { component } = make({}, 'slide-toggle');
    expect(component.showToggleSwitch).toBe(true);
  });

  it('detects slide-toggle from layoutNode.format', () => {
    const jsf = {
      initializeControl: vi.fn(),
      updateValue: vi.fn(),
      getFormControlValue: vi.fn().mockReturnValue(false),
    };
    const c = new PrimengCheckboxComponent(jsf as any);
    c.layoutNode = { type: 'checkbox', format: 'slide-toggle', options: {} };
    c.ngOnInit();
    expect(c.showToggleSwitch).toBe(true);
  });

  it('does not show toggle switch for regular checkbox', () => {
    const { component } = make({});
    expect(component.showToggleSwitch).toBe(false);
  });

  it('updates with trueValue on checked', () => {
    const { component, jsf } = make({});
    jsf.updateValue.mockClear();
    component.updateValue({ checked: true });
    expect(jsf.updateValue).toHaveBeenCalledWith(component, true);
  });

  it('updates with falseValue on unchecked', () => {
    const { component, jsf } = make({});
    jsf.updateValue.mockClear();
    component.updateValue({ checked: false });
    expect(jsf.updateValue).toHaveBeenCalledWith(component, false);
  });

  it('isChecked returns true when controlValue equals trueValue', () => {
    const { component, jsf } = make({});
    jsf.getFormControlValue.mockReturnValue(true);
    expect(component.isChecked).toBe(true);
  });

  it('passes !readonly to initializeControl', () => {
    const { jsf } = make({ readonly: true });
    expect(jsf.initializeControl).toHaveBeenCalledWith(expect.anything(), false);
  });
});
