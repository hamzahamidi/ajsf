import { vi } from 'vitest';
import { CheckboxComponent } from './checkbox.component';

describe('CheckboxComponent', () => {
  it('cycles nullable boolean values through true, false, and null', () => {
    const jsf: any = {
      getFormControlValue: vi.fn()
        .mockReturnValueOnce(null)
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

    expect(event.preventDefault).toHaveBeenCalledTimes(3);
    expect(jsf.updateValue.mock.calls.map((call: any[]) => call[1])).toEqual([true, false, null]);
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
});
