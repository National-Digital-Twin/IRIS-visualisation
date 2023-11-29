import { TestBed } from '@angular/core/testing';

import { SignalsService } from './signals.service';

describe('SignalsService', () => {
  let service: SignalsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignalsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
