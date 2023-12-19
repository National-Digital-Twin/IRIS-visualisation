import { InjectionToken } from '@angular/core';

export const STORAGE_KEY = new InjectionToken('STORAGE_KEY', {
  providedIn: 'root',
  factory: () => 'c477-settings',
});
