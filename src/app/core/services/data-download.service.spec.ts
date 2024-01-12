import { TestBed } from '@angular/core/testing';

import { DataDownloadService } from './data-download.service';

describe('DataDownloadService', () => {
  let service: DataDownloadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataDownloadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
