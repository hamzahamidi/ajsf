import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import {
  JsonSchemaFormModule,
  WidgetLibraryModule,
  JsonSchemaFormService
} from '@ajsf/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MaterialDatepickerComponent } from './material-datepicker.component';

describe('MaterialDatepickerComponent', () => {
  let component: MaterialDatepickerComponent;
  let fixture: ComponentFixture<MaterialDatepickerComponent>;

  class MockJsonSchemaFormService {
    public initializeControl(ctx: any, bind?: boolean): boolean {
      return true;
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        JsonSchemaFormModule,
        CommonModule,
        WidgetLibraryModule,
        MatDatepickerModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatNativeDateModule,
        MatInputModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: JsonSchemaFormService, useClass: MockJsonSchemaFormService }
      ],
      declarations: [MaterialDatepickerComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialDatepickerComponent);
    component = fixture.componentInstance;

  });

  it('should create', () => {
    component.layoutNode = { options: {} };
    component.layoutIndex = [];
    component.dataIndex = [];
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
