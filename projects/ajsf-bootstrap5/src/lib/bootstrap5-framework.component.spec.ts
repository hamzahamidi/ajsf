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
  });
});
