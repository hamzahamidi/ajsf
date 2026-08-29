import { PrimengChipListComponent } from './primeng-chip-list.component';

describe('PrimengChipListComponent', () => {
  const jsf = () => ({
    initializeControl: jasmine.createSpy('initializeControl'),
    updateValue: jasmine.createSpy('updateValue'),
  });

  const make = (node: any) => {
    const j = jsf();
    const c = new PrimengChipListComponent(j as any);
    c.layoutNode = node;
    c.ngOnInit();
    return { component: c, jsf: j };
  };

  it('reads options from layoutNode', () => {
    const { component } = make({
      type: 'chip-list',
      options: { title: 'Tags' },
    });
    expect(component.options.title).toBe('Tags');
  });

  it('calls initializeControl without bound mode', () => {
    const { jsf: j } = make({
      type: 'chip-list',
      options: {},
    });
    expect(j.initializeControl).toHaveBeenCalledWith(jasmine.anything(), false);
  });

  it('filters suggestions from typeahead source', () => {
    const { component } = make({
      type: 'chip-list',
      options: { typeahead: { source: ['apple', 'banana', 'apricot'] } },
    });
    component.search({ query: 'ap' });
    expect(component.suggestions).toEqual(['apple', 'apricot']);
  });

  it('returns all suggestions on empty query', () => {
    const { component } = make({
      type: 'chip-list',
      options: { typeahead: { source: ['a', 'b'] } },
    });
    component.search({ query: '' });
    expect(component.suggestions).toEqual(['a', 'b']);
  });

  it('handles missing typeahead source', () => {
    const { component } = make({
      type: 'chip-list',
      options: {},
    });
    component.search({ query: 'test' });
    expect(component.suggestions).toEqual([]);
  });

  it('forwards array value updates through jsf', () => {
    const { component, jsf: j } = make({
      type: 'chip-list',
      options: {},
    });
    const tags = ['foo', 'bar'];
    component.updateValue(tags);
    expect(j.updateValue).toHaveBeenCalledWith(component, tags);
    expect(component.options.showErrors).toBe(true);
  });
});
