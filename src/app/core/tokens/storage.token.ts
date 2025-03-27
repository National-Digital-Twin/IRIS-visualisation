import { DOCUMENT } from '@angular/common';
import { InjectionToken, inject } from '@angular/core';

export const STORAGE = new InjectionToken<Storage>('STORAGE', {
    providedIn: 'root',
    factory: (): Storage => inject(DOCUMENT).defaultView!.localStorage,
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
