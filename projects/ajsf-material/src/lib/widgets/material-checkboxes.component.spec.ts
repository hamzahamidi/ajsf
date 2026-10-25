import { vi } from 'vitest';
import { MaterialCheckboxesComponent } from './material-checkboxes.component';

describe('MaterialCheckboxesComponent selection list', () => {
  it('copies selection-list state into the checkbox values and updates the form', () => {
    const jsf = { updateArrayCheckboxList: vi.fn() } as any;
    const component = new MaterialCheckboxesComponent(jsf);
    component.options = {};
    component.boundControl = true;
    component.checkboxList = [
      { name: 'Fast', value: 'fast', checked: false },
      { name: 'Safe', value: 'safe', checked: false },
    ];
    const event = {
      source: {
        options: {
          toArray: () => [
            { selected: true },
            { selected: false },
          ],
        },
      },
    };

    component.updateValueFromSelection(event);

    expect(component.checkboxList.map(item => item.checked)).toEqual([true, false]);
    expect(component.options.showErrors).toBe(true);
    expect(jsf.updateArrayCheckboxList).toHaveBeenCalledWith(
      component, component.checkboxList
    );
  });
});
