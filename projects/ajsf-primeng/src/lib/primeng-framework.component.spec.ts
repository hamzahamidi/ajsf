import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import {
  JsonSchemaFormModule,
  JsonSchemaFormService,
  WidgetLibraryModule
} from '@ajsf/core';
import { PrimengFrameworkComponent } from './primeng-framework.component';

describe('PrimengFrameworkComponent', () => {
  let component: PrimengFrameworkComponent;
  let fixture: ComponentFixture<PrimengFrameworkComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
      ],
      declarations: [PrimengFrameworkComponent],
      providers: [JsonSchemaFormService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrimengFrameworkComponent);
    component = fixture.componentInstance;
    component.layoutNode = { options: {} };
    component.layoutIndex = [];
    component.dataIndex = [];
    fixture.detectChanges();
  });

  it('creates and resolves widgets through core', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('select-widget-widget')).toBeTruthy();
  });
});
