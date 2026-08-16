import { CheckboxesComponent } from './checkboxes.component';

describe('CheckboxesComponent updateValue', () => {
  const makeComponent = (values: any[]) => {
    const component = new CheckboxesComponent(null as any);
    component.checkboxList = values.map(value => ({ name: `${value}`, value, checked: false }));
    (component as any).boundControl = false;
    return component;
  };

  const clickOn = (component: any, item: any, checked = true) =>
    component.updateValue({ target: { value: `${item.value}`, checked } }, item);

  // The DOM coerces [value] to a string, so a numeric or boolean enum never
  // matched the stored value and every click was silently ignored.
  it('checks a numeric enum item', () => {
    const component = makeComponent([1, 2, 3]);
    clickOn(component, component.checkboxList[1]);
    expect(component.checkboxList.map(i => i.checked)).toEqual([false, true, false]);
  });

  it('checks a boolean enum item', () => {
    const component = makeComponent([true, false]);
    clickOn(component, component.checkboxList[0]);
    expect(component.checkboxList[0].checked).toBe(true);
  });

  it('still checks a string enum item', () => {
    const component = makeComponent(['a', 'b']);
    clickOn(component, component.checkboxList[0]);
    expect(component.checkboxList.map(i => i.checked)).toEqual([true, false]);
  });

  it('unchecks on a second click', () => {
    const component = makeComponent([1, 2]);
    clickOn(component, component.checkboxList[0], true);
    clickOn(component, component.checkboxList[0], false);
    expect(component.checkboxList[0].checked).toBe(false);
  });

  it('matches by stringified value when no item is supplied', () => {
    const component: any = makeComponent([1, 2, 3]);
    component.updateValue({ target: { value: '3', checked: true } });
    expect(component.checkboxList.map(i => i.checked)).toEqual([false, false, true]);
  });
});
