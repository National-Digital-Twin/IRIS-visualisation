import { DOCUMENT } from '@angular/common';
import { InjectionToken, inject } from '@angular/core';

export const STORAGE = new InjectionToken<Storage>('STORAGE', {
    providedIn: 'root',
    factory: (): Storage => inject(DOCUMENT).defaultView!.localStorage,
});
