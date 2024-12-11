import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CssFrameworkComponent } from './css-framework.component';

describe('CssFrameworkComponent', () => {
  let component: CssFrameworkComponent;
  let fixture: ComponentFixture<CssFrameworkComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CssFrameworkComponent]
    });
    fixture = TestBed.createComponent(CssFrameworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
