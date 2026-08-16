import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
      ],
      declarations: [Bootstrap5FrameworkComponent],
      providers: [JsonSchemaFormService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Bootstrap5FrameworkComponent);
    component = fixture.componentInstance;
    component.layoutNode = { options: {} };
    component.layoutIndex = [];
    component.dataIndex = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

    it('marks inline checks and radios with form-check-inline', () => {
      for (const type of ['checkboxes-inline', 'radios-inline']) {
        const { widgetOptions } = initialize(type);
        expect(widgetOptions.itemLabelHtmlClass).toContain('form-check-inline');
        expect(widgetOptions.itemLabelHtmlClass).not.toContain('checkbox-inline');
        expect(widgetOptions.itemLabelHtmlClass).not.toContain('radio-inline');
      }
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
