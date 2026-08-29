import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialDesignFrameworkModule } from '../material-design-framework.module';

@Component({
    template: `
    <json-schema-form
      [schema]="schema"
      [layout]="layout"
      [data]="data"
      [framework]="'material-design'"
      (onChanges)="value = $event"
      (isValid)="valid = $event"
    ></json-schema-form>`,
    standalone: false
})
class TestHostComponent {
  schema: any = {};
  layout: any;
  data: any;
  value: any;
  valid: boolean | null = null;
}

describe('Material widget integration', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MaterialDesignFrameworkModule, NoopAnimationsModule],
      declarations: [TestHostComponent],
      schemas: [],
    }).compileComponents();
  }));

  function create(schema: any, data?: any, layout?: any) {
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    host.schema = schema;
    if (data !== undefined) { host.data = data; }
    if (layout !== undefined) { host.layout = layout; }
    fixture.detectChanges();
  }

  describe('chip-list', () => {
    const tagsSchema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
          'x-schema-form': { type: 'tagsinput' }
        }
      }
    };

    it('renders a mat-chip-grid', () => {
      create(tagsSchema, { tags: ['a', 'b'] });
      const grid = fixture.nativeElement.querySelector('mat-chip-grid');
      expect(grid).toBeTruthy();
    });

    it('displays initial values as chip rows', () => {
      create(tagsSchema, { tags: ['alpha', 'beta'] });
      const rows = fixture.nativeElement.querySelectorAll('mat-chip-row');
      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toContain('alpha');
      expect(rows[1].textContent).toContain('beta');
    });

    it('removes a chip and updates the form data', () => {
      create(tagsSchema, { tags: ['keep', 'remove'] });
      const removeButtons = fixture.nativeElement.querySelectorAll('button[matchipremove]');
      expect(removeButtons.length).toBe(2);
      removeButtons[1].click();
      fixture.detectChanges();
      const rows = fixture.nativeElement.querySelectorAll('mat-chip-row');
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain('keep');
    });
  });

  describe('file', () => {
    const fileSchema = {
      type: 'object',
      properties: {
        doc: {
          type: 'string',
          'x-schema-form': { type: 'file' }
        }
      }
    };

    it('renders an upload button and hidden file input', () => {
      create(fileSchema);
      const button = fixture.nativeElement.querySelector('button[mat-raised-button]');
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('Choose File');
      const input = fixture.nativeElement.querySelector('input[type="file"]');
      expect(input).toBeTruthy();
      expect(input.hidden).toBe(true);
    });
  });

  describe('stepper', () => {
    const stepperLayout = [
      {
        type: 'stepper',
        title: 'Wizard',
        items: [
          { type: 'section', title: 'Step 1', items: ['name'] },
          { type: 'section', title: 'Step 2', items: ['age'] }
        ]
      }
    ];
    const stepperSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    };

    it('renders mat-stepper with steps', () => {
      create(stepperSchema, undefined, stepperLayout);
      const stepper = fixture.nativeElement.querySelector('mat-stepper');
      expect(stepper).toBeTruthy();
      const labels = fixture.nativeElement.querySelectorAll('.mat-step-label');
      expect(labels.length).toBeGreaterThanOrEqual(2);
    });

    it('renders Back/Next navigation buttons', () => {
      create(stepperSchema, undefined, stepperLayout);
      const nextBtn = fixture.nativeElement.querySelector('button[matsteppernext]');
      expect(nextBtn).toBeTruthy();
    });
  });

  describe('one-of (selectfieldset)', () => {
    const fieldsetSchema = {
      type: 'object',
      properties: {
        choice: {
          type: 'string'
        }
      }
    };
    const fieldsetLayout = [
      {
        type: 'selectfieldset',
        title: 'Pick one',
        items: [
          { type: 'section', title: 'Option A', items: ['choice'] },
          { type: 'section', title: 'Option B', items: [] }
        ]
      }
    ];

    it('renders a mat-select for the fieldset picker', () => {
      create(fieldsetSchema, undefined, fieldsetLayout);
      const select = fixture.nativeElement.querySelector('mat-select');
      expect(select).toBeTruthy();
    });

    it('renders the first child by default', () => {
      create(fieldsetSchema, undefined, fieldsetLayout);
      const widgets = fixture.nativeElement.querySelectorAll('select-framework-widget');
      expect(widgets.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('one-of (simple enum)', () => {
    const enumSchema = {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          oneOf: [
            { const: 'red', title: 'Red' },
            { const: 'blue', title: 'Blue' }
          ]
        }
      }
    };

    it('renders a mat-select for oneOf enum', () => {
      create(enumSchema);
      const select = fixture.nativeElement.querySelector('mat-select');
      expect(select).toBeTruthy();
    });
  });
});
