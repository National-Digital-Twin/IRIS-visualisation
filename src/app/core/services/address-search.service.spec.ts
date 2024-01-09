import { TestBed } from '@angular/core/testing';

import { AddressSearchService } from './address-search.service';

describe('AddressSearchService', () => {
  let service: AddressSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddressSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
