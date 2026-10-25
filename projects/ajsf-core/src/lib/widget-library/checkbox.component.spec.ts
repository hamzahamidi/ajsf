import { vi } from 'vitest';
import { CheckboxComponent } from './checkbox.component';

describe('CheckboxComponent', () => {
  it('cycles nullable boolean values through true, false, and null', () => {
    const jsf: any = {
      getFormControlValue: vi.fn()
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false),
      updateValue: vi.fn(),
    };
    const component = new CheckboxComponent(jsf);
    component.options = { ternary: true };
    const event = { preventDefault: vi.fn(), target: { checked: true } };

    component.updateValue(event);
    component.updateValue(event);
    component.updateValue(event);
    component.updateValue(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(4);
    expect(jsf.updateValue.mock.calls.map((call: any[]) => call[1])).toEqual([true, true, false, null]);
  });

  it('renders null and undefined values as indeterminate', () => {
    const jsf: any = { getFormControlValue: vi.fn(), updateValue: vi.fn() };
    const component = new CheckboxComponent(jsf);
    component.options = { ternary: true };

    jsf.getFormControlValue.mockReturnValueOnce(null).mockReturnValueOnce(undefined).mockReturnValueOnce(false);

    expect(component.isIndeterminate).toBe(true);
    expect(component.isIndeterminate).toBe(true);
    expect(component.isIndeterminate).toBe(false);
  });

  it('keeps ordinary checkboxes binary', () => {
    const jsf: any = { getFormControlValue: vi.fn(), updateValue: vi.fn() };
    const component = new CheckboxComponent(jsf);
    component.options = {};

    component.updateValue({ preventDefault: vi.fn(), target: { checked: false } });

    expect(jsf.updateValue).toHaveBeenCalledWith(component, false);
  });

  it('routes ternary clicks and binary changes to the value handler', () => {
    const jsf: any = { getFormControlValue: vi.fn(), updateValue: vi.fn() };
    const component = new CheckboxComponent(jsf);
    const updateValue = vi.spyOn(component, 'updateValue');
    const event = { preventDefault: vi.fn(), target: { checked: true } };

    component.options = { ternary: true };
    component.handleClick(event);
    component.handleChange(event);

    component.options = { ternary: false };
    component.handleClick(event);
    component.handleChange(event);

    expect(updateValue).toHaveBeenCalledTimes(2);
    expect(updateValue).toHaveBeenNthCalledWith(1, event);
    expect(updateValue).toHaveBeenNthCalledWith(2, event);
  });
});
