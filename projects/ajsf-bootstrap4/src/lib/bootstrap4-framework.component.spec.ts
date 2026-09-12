import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import {
  JsonSchemaFormModule,
  JsonSchemaFormService,
  WidgetLibraryModule
} from '@ajsf/core';
import { Bootstrap4FrameworkComponent } from './bootstrap4-framework.component';

describe('FwBootstrap4Component', () => {
  let component: Bootstrap4FrameworkComponent;
  let fixture: ComponentFixture<Bootstrap4FrameworkComponent>;
  let jsf: JsonSchemaFormService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
      ],
      declarations: [Bootstrap4FrameworkComponent],
      providers: [JsonSchemaFormService]
    })
      .compileComponents();
  });

  beforeEach(() => {
    jsf = TestBed.inject(JsonSchemaFormService);
    fixture = TestBed.createComponent(Bootstrap4FrameworkComponent);
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

  /**
   * A control in the state issue #315 describes: blurred, still empty.
   *
   * statusChanges is part of the shape because initializeFramework subscribes
   * to it, so a stub without one throws before any assertion runs.
   */
  const touchedButUnchanged = (extra: any = {}) => ({
    status: 'INVALID',
    errors: { required: true },
    touched: true,
    dirty: false,
    statusChanges: { subscribe: () => ({ unsubscribe: () => undefined }) },
    ...extra,
  });

  // Issue #315, first symptom: "Touch required field, no message appears."
  // The message was gated on dirty, which means the value changed, so a focus
  // and blur with nothing typed produced nothing.
  describe('when the message appears', () => {
    // The control comes from the service, because initializeFramework assigns
    // this.formControl from it. Setting the field afterwards is overwritten on
    // the next initialize, and mutating it between change detection passes is
    // what NG0100 reports.
    const helpBlockFor = (control: any, options: any = {}) => {
      vi.spyOn(jsf, 'getFormControl').mockReturnValue(control);
      component.layoutNode = { type: 'text', options: { enableErrorState: true, ...options } };
      component.initializeFramework();
      component.updateHelpBlock(control.status);
      return component.options.helpBlock;
    };

    it('reports an error on a control that was touched but never changed', () => {
      expect(helpBlockFor(touchedButUnchanged()) ?? '').toMatch(/required/i);
    });

    it('still reports an error on a control that was changed', () => {
      expect(helpBlockFor(touchedButUnchanged({ touched: false, dirty: true })) ?? '')
        .toMatch(/required/i);
    });

    it('reports nothing on a control that has not been touched', () => {
      expect(helpBlockFor(touchedButUnchanged({ touched: false, dirty: false })))
        .toBeNull();
    });

    it('reports nothing while the field is valid', () => {
      expect(helpBlockFor(touchedButUnchanged({ status: 'VALID', errors: null, dirty: true })))
        .toBeNull();
    });
  });

  // Issue #315, second symptom: overriding the CSS turned description text red
  // too, because error text and description text shared one paragraph.
  describe('emitted classes', () => {
    const initialize = (type: string, extra: any = {}) => {
      component.layoutNode = { type, options: {}, ...extra };
      component.initializeFramework();
      return component;
    };

    it('spaces a field with form-group, which Bootstrap 4 still defines', () => {
      expect(initialize('text').options.htmlClass).toContain('form-group');
    });

    it('emits no label class, since Bootstrap 4 dropped control-label', () => {
      const { options } = initialize('text');
      expect(options.labelHtmlClass || '').not.toContain('control-label');
      expect(options.labelHtmlClass || '').not.toContain('col-form-label');
    });

    it('uses the neutral Bootstrap 4 button for button sets', () => {
      const { widgetOptions } = initialize('checkboxbuttons');
      expect(widgetOptions.itemLabelHtmlClass).toContain('btn-secondary');
      expect(widgetOptions.itemLabelHtmlClass).not.toContain('btn-default');
    });

    it('keeps sr-only, which Bootstrap 4 still defines', () => {
      expect(initialize('checkboxbuttons').widgetOptions.fieldHtmlClass)
        .toContain('sr-only');
    });
  });

  describe('rendered markup', () => {
    // One render, with the control already in place. Two passes with the
    // control appearing between them changes the is-invalid binding after
    // Angular has checked it, which is NG0100.
    const render = (options: any, control: any = null) => {
      vi.spyOn(jsf, 'getFormControl').mockReturnValue(control);
      component.layoutNode = { type: 'text', options };
      fixture.detectChanges();
      return fixture.nativeElement;
    };

    it('emits no class Bootstrap 4 dropped', () => {
      const html = render({ title: 'Name', helpBlock: 'Anything' }).innerHTML;
      ['has-error', 'has-success', 'has-feedback', 'help-block',
        'form-control-feedback', 'glyphicon', 'input-group-addon', 'pull-right']
        .forEach((dead) => expect(html, `${dead} is dead in Bootstrap 4`).not.toContain(dead));
    });

    // The reporter could not style the error without also styling the
    // description, because both went through one help-block paragraph.
    it('puts the error in an element that carries no description text', () => {
      const el = render(
        { enableErrorState: true, errorMessage: 'Name is required', helpBlock: 'Your full name' },
        touchedButUnchanged()
      );
      const error = el.querySelector('.invalid-feedback');
      expect(error, 'the error needs an element of its own').toBeTruthy();
      expect(error.textContent).toContain('Name is required');
      expect(error.textContent).not.toContain('Your full name');
    });

    it('puts help text in an element that carries no error text', () => {
      const el = render({ helpBlock: 'Your full name' });
      const help = el.querySelector('.form-text');
      expect(help, 'help text needs an element of its own').toBeTruthy();
      expect(help.textContent).toContain('Your full name');
      expect(el.querySelector('.invalid-feedback')).toBeNull();
    });

    it('marks the field so Bootstrap reveals the feedback beside it', () => {
      const el = render(
        { enableErrorState: true, errorMessage: 'Name is required' },
        touchedButUnchanged()
      );
      const invalid = el.querySelector('.is-invalid');
      expect(invalid, 'something must carry is-invalid').toBeTruthy();
      // Bootstrap reveals .invalid-feedback only as a following sibling of the
      // element carrying .is-invalid, so they have to share a parent.
      expect(invalid.parentElement.querySelector('.invalid-feedback')).toBeTruthy();
    });

    it('wraps an addon the way Bootstrap 4 documents it', () => {
      const el = render({ fieldAddonLeft: 'kg' });
      expect(el.querySelector('.input-group-prepend .input-group-text')).toBeTruthy();
    });
  });
});
