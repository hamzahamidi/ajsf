import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {Bootstrap4FrameworkComponent} from './bootstrap4-framework.component';

describe('FwBootstrap4Component', () => {
  let component: Bootstrap4FrameworkComponent;
  let fixture: ComponentFixture<Bootstrap4FrameworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [Bootstrap4FrameworkComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Bootstrap4FrameworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
