import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoFrameworkModule } from '../framework-library/no-framework.module';
import { JsonSchemaFormModule } from '../json-schema-form.module';
import { JsonSchemaFormService } from '../json-schema-form.service';
import { WizardComponent } from './wizard.component';

@Component({
  standalone: true,
  imports: [JsonSchemaFormModule, NoFrameworkModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <json-schema-form
      [schema]="schema"
      [layout]="layout"
      framework="no-framework">
    </json-schema-form>`,
})
class WizardHost {
  schema = {
    type: 'object',
    properties: {
      first: { type: 'string' },
      second: { type: 'string' },
    },
  };
  layout = [{
    type: 'wizard',
    items: [
      { type: 'section', options: { title: 'First step' }, items: ['first'] },
      { type: 'section', options: { title: 'Second step' }, items: ['second'] },
    ],
  }];
}

describe('WizardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WizardHost] }).compileComponents();
  });

  it('shows one step at a time and navigates in sequence', () => {
    const fixture = TestBed.createComponent(WizardHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input[name="first"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input[name="second"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.jsf-wizard-step-title').textContent.trim())
      .toBe('First step');

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input[name="first"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[name="second"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.jsf-wizard-step-title').textContent.trim())
      .toBe('Second step');

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input[name="first"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input[name="second"]')).toBeNull();
    fixture.destroy();
  });

  it('adds a referenced step when advancing to an available array item', () => {
    const setArrayItemTitle = vi.fn();
    const jsf = {
      addItem: vi.fn(),
      setArrayItemTitle,
    } as unknown as JsonSchemaFormService;
    const component = new WizardComponent(jsf);
    component.layoutNode = {
      dataType: 'array',
      items: [{ type: 'section' }, { type: '$ref', options: { maxItems: 2 } }],
    };
    component.layoutIndex = [3];
    component.dataIndex = [4];
    component.ngOnInit();
    setArrayItemTitle.mockReturnValue('Step');

    expect(component.activeItem).toBe(component.layoutNode.items[0]);
    expect(component.hasNextVisible(0)).toBe(true);
    component.next();

    expect(jsf.addItem).toHaveBeenCalledWith({
      layoutNode: component.layoutNode.items[1],
      layoutIndex: [3, 1],
      dataIndex: [4, 1],
    });
    expect(component.selectedItem).toBe(1);
    expect(component.setStepTitle(component.activeItem, 1)).toBe('Step');
  });

  it('does not navigate past the last step or below the first', () => {
    const jsf = {
      setArrayItemTitle: vi.fn().mockReturnValue(null),
    } as unknown as JsonSchemaFormService;
    const component = new WizardComponent(jsf);
    component.layoutNode = { items: [{ type: 'section' }] };
    component.ngOnInit();

    component.previous();
    component.next();

    expect(component.selectedItem).toBe(0);
    expect(component.hasNextVisible(0)).toBe(false);
    expect(component.hasNextVisible(-1)).toBe(false);
    expect(component.setStepTitle(component.activeItem, 0)).toBe('Step 1');
  });

  it('ignores invalid and unavailable referenced steps', () => {
    const jsf = { addItem: vi.fn() } as unknown as JsonSchemaFormService;
    const component = new WizardComponent(jsf);
    component.layoutNode = { items: [{ type: '$ref' }] };
    component.layoutIndex = [];
    component.dataIndex = [];
    component.ngOnInit();
    component.showAddStep = false;

    component.select(-1);
    component.select(1);
    component.select(0);

    expect(jsf.addItem).not.toHaveBeenCalled();
    expect(component.selectedItem).toBe(0);
  });

  it('keeps non-array references in the current data scope', () => {
    const jsf = { addItem: vi.fn() } as unknown as JsonSchemaFormService;
    const component = new WizardComponent(jsf);
    component.layoutNode = { items: [{ type: '$ref' }, { type: 'section' }] };
    component.layoutIndex = [2];
    component.dataIndex = [5];
    component.ngOnInit();
    component.showAddStep = true;
    component.select(0);

    expect(jsf.addItem).toHaveBeenCalledWith({
      layoutNode: component.layoutNode.items[0],
      layoutIndex: [2, 0],
      dataIndex: [5],
    });
  });

  it('stops offering a referenced step at its item limit', () => {
    const component = new WizardComponent(null as any);
    component.layoutNode = {
      items: [{ type: 'section' }, { type: '$ref', options: { maxItems: 1 } }],
    };
    component.ngOnInit();

    expect(component.hasNextVisible(0)).toBe(false);
    component.next();
    expect(component.selectedItem).toBe(0);
  });

  it('respects a zero item limit for referenced steps', () => {
    const component = new WizardComponent(null as any);
    component.layoutNode = {
      items: [{ type: 'section' }, { type: '$ref', options: { maxItems: 0 } }],
    };
    component.ngOnInit();

    expect(component.showAddStep).toBe(false);
    expect(component.hasNextVisible(0)).toBe(false);
  });
});
