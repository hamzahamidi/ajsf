import { PrimengCheckboxesComponent } from './primeng-checkboxes.component';

describe('PrimengCheckboxesComponent', () => {
  const make = (opts: any, layoutType = 'checkboxes') => {
    const jsf = {
      initializeControl: jasmine.createSpy('initializeControl'),
      updateArrayCheckboxList: jasmine.createSpy('updateArrayCheckboxList'),
      getFormControl: jasmine.createSpy('getFormControl'),
    };
    const c = new PrimengCheckboxesComponent(jsf as any);
    c.layoutNode = { type: layoutType, options: opts };
    c.ngOnInit();
    return { component: c, jsf };
  };

  it('builds checkboxList from enum', () => {
    const { component } = make({ enum: ['red', 'green', 'blue'] });
    expect(component.checkboxList.length).toBe(3);
    expect(component.checkboxList[0].name).toBe('red');
    expect(component.checkboxList[0].value).toBe('red');
  });

  it('sets horizontalList for checkboxes-inline', () => {
    const { component } = make({ enum: ['a'] }, 'checkboxes-inline');
    expect(component.horizontalList).toBe(true);
  });

  it('sets horizontalList for checkboxbuttons', () => {
    const { component } = make({ enum: ['a'] }, 'checkboxbuttons');
    expect(component.horizontalList).toBe(true);
  });

  it('allChecked returns true when all items are checked', () => {
    const { component } = make({ enum: ['a', 'b'] });
    component.checkboxList.forEach(t => t.checked = true);
    expect(component.allChecked).toBe(true);
  });

  it('someChecked returns true when some but not all are checked', () => {
    const { component } = make({ enum: ['a', 'b', 'c'] });
    component.checkboxList[0].checked = true;
    expect(component.someChecked).toBe(true);
    expect(component.allChecked).toBe(false);
  });

  it('updateAllValues checks all items when event.checked is true', () => {
    const { component } = make({ enum: ['a', 'b'] });
    component.updateAllValues({ checked: true });
    expect(component.checkboxList.every(t => t.checked)).toBe(true);
  });

  it('updateAllValues unchecks all items when event.checked is false', () => {
    const { component } = make({ enum: ['a', 'b'] });
    component.checkboxList.forEach(t => t.checked = true);
    component.updateAllValues({ checked: false });
    expect(component.checkboxList.every(t => !t.checked)).toBe(true);
  });
});
