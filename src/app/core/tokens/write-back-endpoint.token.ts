import { InjectionToken } from '@angular/core';

export const WRITE_BACK_ENDPOINT = new InjectionToken<string>('WRITE_BACK_ENDPOINT', {
    providedIn: 'root',
    factory: (): string => `/write-api`,
});
