import { InjectionToken } from '@angular/core';
import { environment } from '@environment';

export const SEARCH_ENDPOINT = new InjectionToken<string>('SEARCH_ENDPOINT', {
    factory: (): string => `${environment.sparql.url}`,
});
