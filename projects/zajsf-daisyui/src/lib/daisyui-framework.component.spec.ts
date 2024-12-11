import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaisyUIFrameworkComponent } from './daisyui-framework.component';

describe('DaisyUIFrameworkComponent', () => {
  let component: DaisyUIFrameworkComponent;
  let fixture: ComponentFixture<DaisyUIFrameworkComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DaisyUIFrameworkComponent]
    });
    fixture = TestBed.createComponent(DaisyUIFrameworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
