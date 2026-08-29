import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { PrimengFrameworkModule } from '../primeng-framework.module';
import { PrimengOneOfComponent } from './primeng-one-of.component';

describe('PrimengOneOfComponent', () => {
  const jsf = () => ({
    initializeControl: jasmine.createSpy('initializeControl'),
    updateValue: jasmine.createSpy('updateValue'),
  });

  const make = (node: any) => {
    const j = jsf();
    const c = new PrimengOneOfComponent(j as any);
    c.layoutNode = node;
    c.ngOnInit();
    return { component: c, jsf: j };
  };

  describe('data-bound oneOf/anyOf mode', () => {
    it('builds selectList from titleMap', () => {
      const { component } = make({
        type: 'one-of',
        options: {
          titleMap: [{ name: 'Option A', value: 'a' }, { name: 'Option B', value: 'b' }],
          required: true,
        },
      });
      expect(component.isFieldset).toBe(false);
      expect(component.selectList.length).toBe(2);
      expect(component.selectList[0].name).toBe('Option A');
    });

    it('builds selectList from enum', () => {
      const { component } = make({
        type: 'one-of',
        options: { enum: ['x', 'y'], required: true },
      });
      expect(component.selectList.length).toBe(2);
    });

    it('passes !readonly to initializeControl', () => {
      const { jsf: j } = make({
        type: 'one-of',
        options: { enum: ['a'], readonly: true },
      });
      expect(j.initializeControl).toHaveBeenCalledWith(jasmine.anything(), false);
    });

    it('forwards value updates through jsf using event.value', () => {
      const { component, jsf: j } = make({
        type: 'one-of',
        options: { enum: ['a'] },
      });
      component.updateValue({ value: 'a' });
      expect(j.updateValue).toHaveBeenCalledWith(component, 'a');
    });
  });

  describe('selectfieldset mode (unkeyed)', () => {
    const unkeyedNode = {
      type: 'selectfieldset',
      options: { title: 'Make a choice' },
      items: [
        { type: 'section', options: { legend: 'Search by text' } },
        { type: 'section', options: { legend: 'Search by category' } },
      ],
    };

    it('detects fieldset mode from layoutNode.type and items', () => {
      const { component } = make(unkeyedNode);
      expect(component.isFieldset).toBe(true);
    });

    it('builds selectList from items legends', () => {
      const { component } = make(unkeyedNode);
      expect(component.selectList.length).toBe(2);
      expect(component.selectList[0]).toEqual({ name: 'Search by text', value: 0 });
      expect(component.selectList[1]).toEqual({ name: 'Search by category', value: 1 });
    });

    it('does not call initializeControl (no data key)', () => {
      const { jsf: j } = make(unkeyedNode);
      expect(j.initializeControl).not.toHaveBeenCalled();
    });

    it('defaults to first child selected', () => {
      const { component } = make(unkeyedNode);
      expect(component.selectedItem).toBe(0);
    });

    it('switches selectedItem on selectChild', () => {
      const { component } = make(unkeyedNode);
      component.selectChild({ value: 1 });
      expect(component.selectedItem).toBe(1);
    });

    it('does not write to form data on selectChild', () => {
      const { component, jsf: j } = make(unkeyedNode);
      component.selectChild({ value: 1 });
      expect(j.updateValue).not.toHaveBeenCalled();
    });

    it('falls back to item title when legend is absent', () => {
      const { component } = make({
        type: 'selectfieldset',
        options: {},
        items: [
          { type: 'section', options: { title: 'By text' } },
          { type: 'section', options: {} },
        ],
      });
      expect(component.selectList[0].name).toBe('By text');
      expect(component.selectList[1].name).toBe('Option 2');
    });
  });

  describe('selectfieldset mode (keyed)', () => {
    it('uses buildTitleMap when titleMap is present', () => {
      const { component, jsf: j } = make({
        type: 'selectfieldset',
        options: {
          titleMap: [
            { name: 'Search by text', value: 'text' },
            { name: 'Search by category', value: 'cat' },
          ],
          required: true,
        },
        items: [
          { type: 'section', options: { legend: 'Search by text' } },
          { type: 'section', options: { legend: 'Search by category' } },
        ],
      });
      expect(component.isFieldset).toBe(true);
      expect(component.selectList.length).toBe(2);
      expect(component.selectList[0].value).toBe('text');
      expect(j.initializeControl).toHaveBeenCalled();
    });

    it('derives selectedItem from formControl value', () => {
      const j = jsf();
      const c = new PrimengOneOfComponent(j as any);
      c.layoutNode = {
        type: 'selectfieldset',
        options: {
          titleMap: [
            { name: 'Text', value: 'text' },
            { name: 'Category', value: 'cat' },
          ],
          required: true,
        },
        items: [{ type: 'section', options: {} }, { type: 'section', options: {} }],
      };
      c.ngOnInit();
      c.boundControl = true;
      c.formControl = { value: 'cat' } as any;
      expect(c.selectedItem).toBe(1);
    });

    it('maps correctly when buildTitleMap prepends an empty entry (not required)', () => {
      const j = jsf();
      const c = new PrimengOneOfComponent(j as any);
      c.layoutNode = {
        type: 'selectfieldset',
        options: {
          titleMap: [
            { name: 'Text', value: 'text' },
            { name: 'Category', value: 'cat' },
          ],
        },
        items: [{ type: 'section', options: {} }, { type: 'section', options: {} }],
      };
      c.ngOnInit();
      expect(c.selectList.length).toBe(3);
      c.boundControl = true;
      c.formControl = { value: 'text' } as any;
      expect(c.selectedItem).toBe(0);
      c.formControl = { value: 'cat' } as any;
      expect(c.selectedItem).toBe(1);
    });
  });

  describe('optionfieldset alias', () => {
    it('detects fieldset mode for optionfieldset type', () => {
      const { component } = make({
        type: 'optionfieldset',
        options: {},
        items: [{ type: 'section', options: { legend: 'A' } }],
      });
      expect(component.isFieldset).toBe(true);
    });
  });
});

@Component({
    template: `
    <json-schema-form
      [form]="form"
      [framework]="'primeng'"
      (isValid)="valid = $event"
    ></json-schema-form>`,
    standalone: false
})
class OneOfHostComponent {
  form: any;
  valid: boolean | null = null;
}

describe('PrimengOneOfComponent (TestBed)', () => {
  let fixture: ComponentFixture<OneOfHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PrimengFrameworkModule, NoopAnimationsModule],
      declarations: [OneOfHostComponent],
      schemas: [],
    }).compileComponents();
  }));

  describe('unkeyed selectfieldset child rendering', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(OneOfHostComponent);
      fixture.componentInstance.form = {
        schema: {
          text: { type: 'string', title: 'Text' },
          category: {
            type: 'string', title: 'Category',
            enum: ['Geography', 'Entertainment', 'History', 'Arts', 'Science', 'Sports'],
          },
        },
        form: [{
          type: 'selectfieldset',
          title: 'Make a choice',
          items: [
            { key: 'text', legend: 'Search by text' },
            { key: 'category', legend: 'Search by category' },
          ],
        }],
      };
      fixture.detectChanges();
    });

    it('renders the first child by default', () => {
      const oneOf = fixture.debugElement.query(By.directive(PrimengOneOfComponent));
      expect(oneOf).toBeTruthy();
      const comp = oneOf.componentInstance as PrimengOneOfComponent;
      expect(comp.isFieldset).toBe(true);
      expect(comp.selectList.length).toBe(2);
      const el = oneOf.nativeElement as HTMLElement;
      const fwWidgets = el.querySelectorAll('select-framework-widget');
      expect(fwWidgets.length).toBe(1);
    });

    it('switches rendered child after selectChild', waitForAsync(() => {
      const oneOf = fixture.debugElement.query(By.directive(PrimengOneOfComponent));
      const comp = oneOf.componentInstance as PrimengOneOfComponent;
      const el = oneOf.nativeElement as HTMLElement;
      expect(comp.selectedItem).toBe(0);
      const selectsBefore = el.querySelectorAll('p-select').length;
      comp.selectChild({ value: 1 });
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(comp.selectedItem).toBe(1);
        const selectsAfter = el.querySelectorAll('p-select').length;
        expect(selectsAfter).toBeGreaterThan(selectsBefore);
      });
    }));
  });

  describe('keyed selectfieldset child rendering', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(OneOfHostComponent);
      fixture.componentInstance.form = {
        schema: {
          choice: { type: 'string', enum: ['text', 'cat'] },
          text: { type: 'string', title: 'Text' },
          category: {
            type: 'string', title: 'Category',
            enum: ['Geography', 'Entertainment', 'History', 'Arts', 'Science', 'Sports'],
          },
        },
        form: [{
          type: 'selectfieldset',
          key: 'choice',
          title: 'Make a choice',
          titleMap: { text: 'Search by text', cat: 'Search by category' },
          items: ['text', 'category'],
        }],
      };
      fixture.detectChanges();
    });

    it('is a keyed fieldset with bound control', () => {
      const oneOf = fixture.debugElement.query(By.directive(PrimengOneOfComponent));
      expect(oneOf).toBeTruthy();
      const comp = oneOf.componentInstance as PrimengOneOfComponent;
      expect(comp.isFieldset).toBe(true);
      expect(comp.boundControl).toBe(true);
      expect(comp.selectList.length).toBeGreaterThanOrEqual(2);
    });

    it('renders a child and switches on formControl change', waitForAsync(() => {
      const oneOf = fixture.debugElement.query(By.directive(PrimengOneOfComponent));
      const comp = oneOf.componentInstance as PrimengOneOfComponent;
      const el = oneOf.nativeElement as HTMLElement;
      expect(el.querySelectorAll('select-framework-widget').length).toBeGreaterThanOrEqual(1);
      expect(comp.formControl).toBeTruthy();
      const selectsBefore = el.querySelectorAll('p-select').length;
      comp.formControl.setValue('cat');
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(comp.selectedItem).toBe(1);
        const selectsAfter = el.querySelectorAll('p-select').length;
        expect(selectsAfter).toBeGreaterThan(selectsBefore);
      });
    }));
  });
});
