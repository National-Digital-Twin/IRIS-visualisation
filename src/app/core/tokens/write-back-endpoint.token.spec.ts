import { TestBed } from '@angular/core/testing';
import { WRITE_BACK_ENDPOINT } from './write-back-endpoint.token';

describe('WRITE_BACK_ENDPOINT token', () => {
  it('should resolve to "/write-api"', () => {
    TestBed.configureTestingModule({});
    const endpoint = TestBed.inject(WRITE_BACK_ENDPOINT);
    expect(endpoint).toBe('/write-api');
  });
});
