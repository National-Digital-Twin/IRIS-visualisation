import { InjectionToken, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export const STORAGE = new InjectionToken<Storage>('STORAGE', {
  providedIn: 'root',
  factory: () => inject(DOCUMENT).defaultView!.localStorage,
});
