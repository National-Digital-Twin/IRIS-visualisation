import { TestBed } from '@angular/core/testing';
import { SEARCH_ENDPOINT } from './search-endpoint.token';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

describe('SEARCH_ENDPOINT token', () => {
  it('should resolve to the correct search endpoint using RUNTIME_CONFIGURATION', () => {
    const apiURL = 'https://example.com/api';
    const runtimeConfig = { apiURL };

    TestBed.configureTestingModule({
      providers: [
        { provide: RUNTIME_CONFIGURATION, useValue: runtimeConfig }
      ]
    });

    const searchEndpoint = TestBed.inject(SEARCH_ENDPOINT);
    expect(searchEndpoint).toBe(`${apiURL}/knowledge/query`);
  });
});
