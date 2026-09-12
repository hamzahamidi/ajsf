import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import {
  JsonSchemaFormModule,
  JsonSchemaFormService,
  WidgetLibraryModule
} from '@ajsf/core';
import { Bootstrap5FrameworkComponent } from './bootstrap5-framework.component';

describe('FwBootstrap5Component', () => {
  let component: Bootstrap5FrameworkComponent;
  let fixture: ComponentFixture<Bootstrap5FrameworkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
      ],
      declarations: [Bootstrap5FrameworkComponent],
      providers: [JsonSchemaFormService]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Bootstrap5FrameworkComponent);
    component = fixture.componentInstance;
    component.layoutNode = { options: {} };
    component.layoutIndex = [];
    component.dataIndex = [];
    // No initial detectChanges. Each test sets its own layoutNode and renders,
    // and rendering a placeholder node first makes the second pass see the
    // class binding change from schema-form-undefined, which Angular 21
    // reports as NG0100.
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The migration dropped the paragraph that rendered options.helpBlock below
  // the field, keeping only the copy guarded by messageLocation === 'top'.
  // Nothing sets messageLocation on this path, so that branch never runs and
  // help text rendered nowhere, while updateHelpBlock went on computing it.
  describe('help text', () => {
    const render = (options: any) => {
      component.layoutNode = { type: 'text', options };
      component.initializeFramework();
      fixture.detectChanges();
      return fixture.nativeElement.textContent;
    };

    it('renders help text when the field has no error', () => {
      expect(render({ help: 'Use your work address' })).toContain('Use your work address');
    });

    it('renders a description when the field has no error', () => {
      expect(render({ description: 'Two letters' })).toContain('Two letters');
    });

    it('prefers the description over help, as updateHelpBlock does', () => {
      const text = render({ description: 'Two letters', help: 'Use your work address' });
      expect(text).toContain('Two letters');
      expect(text).not.toContain('Use your work address');
    });

    it('renders the description once, not once per block', () => {
      const text = render({ description: 'Two letters' });
      expect(text.split('Two letters').length - 1).toEqual(1);
    });

    // Containers set messageLocation to 'top'. updateHelpBlock only runs when
    // there is a formControl, which a container has not got and this fixture
    // never provides, so asserting through the component would pass without
    // the upper paragraph ever rendering. These set helpBlock directly, which
    // is the state the template has to cope with.
    const containerOptions = (extra: any) =>
      ({ messageLocation: 'top', helpBlock: 'Container help', ...extra });

    it('renders help once when the layout asks for it at the top', () => {
      const text = render(containerOptions({ help: 'Container help' }));
      expect(text.split('Container help').length - 1).toEqual(1);
    });

    it('renders a description once when the layout asks for it at the top', () => {
      const text = render(containerOptions({ description: 'Container help' }));
      expect(text.split('Container help').length - 1).toEqual(1);
    });

    it('puts it above the field, where the layout asked for it', () => {
      component.layoutNode = { type: 'text', options: containerOptions({ help: 'Container help' }) };
      component.initializeFramework();
      fixture.detectChanges();
      const html = fixture.nativeElement.innerHTML;
      expect(html.indexOf('Container help')).toBeLessThan(html.indexOf('select-widget-widget'));
    });

    const CONTAINERS = ['array', 'fieldset', 'section', 'conditional',
      'advancedfieldset', 'authfieldset', 'selectfieldset', 'optionfieldset'];

    it('sets messageLocation to top for every container type', () => {
      CONTAINERS.forEach((type) => {
        component.layoutNode = { type, options: {} };
        component.initializeFramework();
        expect(component.options.messageLocation, `${type} should ask for its message at the top`)
          .toEqual('top');
      });
    });
  });

  // Bootstrap 5 defines neither .form-group nor .control-label, so emitting
  // them costs the field its spacing with nothing to show that it happened.
  describe('emitted classes', () => {
    const initialize = (type: string, extra: any = {}) => {
      component.layoutNode = { type, options: {}, ...extra };
      component.initializeFramework();
      return component;
    };

    it('spaces a field with mb-3 rather than form-group', () => {
      const { options } = initialize('text');
      expect(options.htmlClass).toContain('mb-3');
      expect(options.htmlClass).not.toContain('form-group');
    });

    it('labels a field with form-label rather than control-label', () => {
      const { options } = initialize('text');
      expect(options.labelHtmlClass).toContain('form-label');
      expect(options.labelHtmlClass).not.toContain('control-label');
    });

    it('keeps the list-group classes, which Bootstrap 5 still defines', () => {
      expect(initialize('array').options.htmlClass).toContain('list-group');
      expect(initialize('text', { arrayItem: true }).options.htmlClass)
        .toContain('list-group-item');
    });

    it('preserves an htmlClass supplied by the layout', () => {
      const { options } = initialize('text', { options: { htmlClass: 'mine' } });
      expect(options.htmlClass).toContain('mine');
      expect(options.htmlClass).toContain('mb-3');
    });

    it('gives checks and radios the Bootstrap 5 form-check trio', () => {
      const single = initialize('checkbox');
      expect(single.widgetOptions.fieldHtmlClass).toContain('form-check-input');
      expect(single.widgetOptions.itemLabelHtmlClass).toContain('form-check-label');

      const many = initialize('checkboxes');
      expect(many.widgetOptions.htmlClass).toContain('form-check');

      const radios = initialize('radios');
      expect(radios.widgetOptions.htmlClass).toContain('form-check');
      expect(radios.widgetOptions.fieldHtmlClass).toContain('form-check-input');
    });

    it('marks the inline checkbox list with form-check-inline on its wrapper', () => {
      // Sibling markup: the wrapper div is the input's ancestor, the label is
      // not, so the class has to live on htmlClass rather than on the label.
      const { widgetOptions } = initialize('checkboxes-inline');
      expect(widgetOptions.htmlClass).toContain('form-check-inline');
      expect(widgetOptions.itemLabelHtmlClass).toContain('form-check-label');
      expect(widgetOptions.itemLabelHtmlClass).not.toContain('form-check-inline');
      expect(widgetOptions.htmlClass).not.toContain('checkbox-inline');
    });

    it('marks inline radios with form-check-inline', () => {
      const { widgetOptions } = initialize('radios-inline');
      expect(widgetOptions.itemLabelHtmlClass).toContain('form-check-inline');
      expect(widgetOptions.itemLabelHtmlClass).not.toContain('radio-inline');
    });

    it('stops emitting the Bootstrap 3 checkbox and radio classes', () => {
      for (const type of ['checkbox', 'checkboxes', 'radio', 'radios']) {
        const { widgetOptions } = initialize(type);
        const emitted = [
          widgetOptions.htmlClass, widgetOptions.fieldHtmlClass,
          widgetOptions.itemLabelHtmlClass,
        ].join(' ');
        expect(emitted).not.toMatch(/(^|\s)(checkbox|radio)(\s|$)/);
      }
    });

    it('uses a live Bootstrap 5 button class for button sets', () => {
      const { widgetOptions } = initialize('radiobuttons');
      expect(widgetOptions.itemLabelHtmlClass).toContain('btn-outline-primary');
      expect(widgetOptions.fieldHtmlClass).toContain('visually-hidden');
      expect(widgetOptions.fieldHtmlClass).not.toContain('sr-only');
    });
  });

  // The single checkbox has no element of its own carrying htmlClass, so
  // .form-check has to come from the framework's own wrapper div.
  describe('single checkbox wrapper', () => {
    const render = (node: any) => {
      component.layoutNode = node;
      component.initializeFramework();
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('.form-check');
    };

    it('marks the wrapper for a plain checkbox', () => {
      expect(render({ type: 'checkbox', options: {} })).toBeTruthy();
    });

    it('leaves the wrapper alone for a text field', () => {
      expect(render({ type: 'text', options: {} })).toBeNull();
    });

    it('leaves the wrapper alone when an addon makes it an input group', () => {
      expect(render({ type: 'checkbox', options: { fieldAddonLeft: '@' } })).toBeNull();
    });
  });
});
