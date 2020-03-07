import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import {
  JsonSchemaFormModule,
  WidgetLibraryModule
} from '@ajsf/core';
import { MaterialDesignFrameworkComponent } from './material-design-framework.component';

describe('FwBootstrap4Component', () => {
  let component: MaterialDesignFrameworkComponent;
  let fixture: ComponentFixture<MaterialDesignFrameworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
      ],
      declarations: [MaterialDesignFrameworkComponent]
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
