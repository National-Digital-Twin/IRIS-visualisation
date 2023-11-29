import { inject, InjectionToken } from '@angular/core';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

/**
 * Search Endpoint Factory.
 *
 * Factory function to create an search endpoint string.
 */
function searchEndpointFactory(): string {
  return `${inject(RUNTIME_CONFIGURATION).apiURL}/api/sparql/knowledge/query`;
}

/**
 * Search Endpoint.
 *
 * The search endpoint string.
 */
export const SEARCH_ENDPOINT = new InjectionToken<string>('SEARCH_ENDPOINT', {
  factory: searchEndpointFactory,
});
