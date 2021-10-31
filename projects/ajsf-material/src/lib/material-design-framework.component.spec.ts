import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
      ],
      declarations: [MaterialDesignFrameworkComponent],
      providers: [JsonSchemaFormService]
    })
      .compileComponents();
  }));

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
});
