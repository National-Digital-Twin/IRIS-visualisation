import { InjectionToken } from '@angular/core';

export const WRITE_BACK_ENDPOINT = new InjectionToken<string>('WRITE_BACK_ENDPOINT', {
    providedIn: 'root',
    factory: (): string => `/api`,
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
