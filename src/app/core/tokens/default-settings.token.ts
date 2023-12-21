import { InjectionToken } from '@angular/core';
import { SettingsModel } from '@core/services/setting.service';

export const DEFAULT_SETTINGS = new InjectionToken<SettingsModel>(
  'DEFAULT_SETTINGS',
  {
    providedIn: 'root',
    factory: () => ({ colorBlindMode: false }),
  }
);
