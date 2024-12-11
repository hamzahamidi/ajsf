import { TestBed } from '@angular/core/testing';

import { DaisyuiFrameworkService } from './daisyui-framework.service';

describe('DaisyuiFrameworkService', () => {
  let service: DaisyuiFrameworkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DaisyuiFrameworkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
