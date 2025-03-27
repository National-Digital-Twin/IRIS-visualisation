import { InjectionToken } from '@angular/core';

export const STORAGE_KEY = new InjectionToken('STORAGE_KEY', {
    providedIn: 'root',
    factory: (): string => 'c477-settings',
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
