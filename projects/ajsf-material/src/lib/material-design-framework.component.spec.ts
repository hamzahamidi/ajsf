import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import {
  JsonSchemaFormModule,
  JsonSchemaFormService,
  WidgetLibraryModule
} from '@ajsf/core';
import { MaterialDesignFrameworkComponent } from './material-design-framework.component';

describe('FwBootstrap4Component', () => {
  let component: MaterialDesignFrameworkComponent;
  let fixture: ComponentFixture<MaterialDesignFrameworkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
      ],
      declarations: [MaterialDesignFrameworkComponent],
      providers: [JsonSchemaFormService]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialDesignFrameworkComponent);
    component = fixture.componentInstance;
    component.layoutNode = { options: {} };
    component.layoutIndex = [];
    component.dataIndex = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it.each([
    ['plain title', false],
    ['{{}}', false],
    ['{{value\n}}', false],
    ['{{}}\n{{value}}', true],
  ])('detects template expressions in %s', (title, hasExpression) => {
    const jsf = TestBed.inject(JsonSchemaFormService);
    vi.spyOn(jsf, 'getFormControl').mockReturnValue(null as any);
    vi.spyOn(jsf, 'getFormControlValue').mockReturnValue(null as any);
    vi.spyOn(jsf, 'getFormControlGroup').mockReturnValue({ value: {} } as any);
    vi.spyOn(jsf, 'parseText').mockReturnValue(title as string);
    component.layoutNode = { type: 'text', options: { title } };

    component.initializeFramework();

    expect(component.dynamicTitle !== null).toBe(hasExpression);
  });
});
