import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import {
  JsonSchemaFormModule,
  JsonSchemaFormService,
  WidgetLibraryModule
} from '@ajsf/core';
import { Bootstrap3FrameworkComponent } from './bootstrap3-framework.component';

describe('Bootstrap3FrameworkComponent', () => {
  let component: Bootstrap3FrameworkComponent;
  let fixture: ComponentFixture<Bootstrap3FrameworkComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
      ],
      declarations: [Bootstrap3FrameworkComponent],
      providers: [JsonSchemaFormService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Bootstrap3FrameworkComponent);
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
