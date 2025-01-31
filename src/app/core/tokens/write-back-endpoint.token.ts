import { InjectionToken, inject } from '@angular/core';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

export const WRITE_BACK_ENDPOINT = new InjectionToken<string>(
  'WRITE_BACK_ENDPOINT',
  {
    providedIn: 'root',
    factory: () => `/write-api`,
  }
);
