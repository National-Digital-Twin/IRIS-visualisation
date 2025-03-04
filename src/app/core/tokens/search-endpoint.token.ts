import { inject, InjectionToken } from '@angular/core';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { environment } from '@environment';

export const SEARCH_ENDPOINT = new InjectionToken<string>('SEARCH_ENDPOINT', {
    factory: (): string => `${inject(RUNTIME_CONFIGURATION).apiURL}${environment.sparql.path}`,
});
