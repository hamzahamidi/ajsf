import { PrimengStepperComponent } from './primeng-stepper.component';

describe('PrimengStepperComponent', () => {
  const jsf = () => ({
    addItem: jasmine.createSpy('addItem'),
    setArrayItemTitle: jasmine.createSpy('setArrayItemTitle').and.callFake(
      (_self, item, index) => item.options?.title || `Step ${index + 1}`
    ),
  });

  const make = (node: any) => {
    const j = jsf();
    const c = new PrimengStepperComponent(j as any);
    c.layoutNode = node;
    c.layoutIndex = [0];
    c.dataIndex = [0];
    c.ngOnInit();
    return { component: c, jsf: j };
  };

  it('initializes with first step selected', () => {
    const { component } = make({
      items: [
        { type: 'section', options: { title: 'Step A' } },
        { type: 'section', options: { title: 'Step B' } },
      ],
      options: {},
    });
    expect(component.selectedItem).toBe(0);
    expect(component.itemCount).toBe(1);
  });

  it('selects a step by index', () => {
    const { component } = make({
      items: [
        { type: 'section', options: { title: 'Step A' } },
        { type: 'section', options: { title: 'Step B' } },
      ],
      options: {},
    });
    component.select(1);
    expect(component.selectedItem).toBe(1);
  });

  it('calls jsf.addItem when selecting a $ref step', () => {
    const refItem = { type: '$ref', options: { maxItems: 5 } };
    const { component, jsf: j } = make({
      items: [
        { type: 'section', options: { title: 'Step A' } },
        refItem,
      ],
      options: {},
    });
    component.select(1);
    expect(j.addItem).toHaveBeenCalledWith({
      layoutNode: refItem,
      layoutIndex: [0, 1],
      dataIndex: [0, 1],
    });
    expect(component.selectedItem).toBe(1);
  });

  it('does not call jsf.addItem for non-$ref steps', () => {
    const { component, jsf: j } = make({
      items: [
        { type: 'section', options: { title: 'Step A' } },
        { type: 'section', options: { title: 'Step B' } },
      ],
      options: {},
    });
    component.select(1);
    expect(j.addItem).not.toHaveBeenCalled();
  });

  it('hides add step when maxItems is reached', () => {
    const { component } = make({
      items: [
        { type: 'section', options: {} },
        { type: '$ref', options: { maxItems: 1 } },
      ],
      options: {},
    });
    expect(component.showAddTab).toBe(false);
  });

  it('shows add step when under maxItems', () => {
    const { component } = make({
      items: [
        { type: '$ref', options: { maxItems: 5 } },
      ],
      options: {},
    });
    expect(component.showAddTab).toBe(true);
  });

  it('delegates step titles to jsf.setArrayItemTitle', () => {
    const item = { type: 'section', options: { title: 'My Step' } };
    const { component, jsf: j } = make({
      items: [item],
      options: {},
    });
    const result = component.setStepTitle(item, 0);
    expect(j.setArrayItemTitle).toHaveBeenCalledWith(component, item, 0);
    expect(result).toBe('My Step');
  });

  it('does not call initializeControl (layout container)', () => {
    const j = jsf();
    const c = new PrimengStepperComponent(j as any);
    c.layoutNode = {
      items: [{ type: 'section', options: {} }],
      options: {},
    };
    c.layoutIndex = [0];
    c.dataIndex = [0];
    c.ngOnInit();
    expect((j as any).initializeControl).toBeUndefined();
  });
});
