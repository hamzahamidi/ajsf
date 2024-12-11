import { TestBed } from '@angular/core/testing';

import { CssframeworkService } from './css-framework.service';

describe('CssframeworkService', () => {
  let service: CssframeworkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CssframeworkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
