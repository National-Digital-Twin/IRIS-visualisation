import { InjectionToken } from '@angular/core';
import { environment } from '@environment';

export const SEARCH_ENDPOINT = new InjectionToken<string>('SEARCH_ENDPOINT', {
    factory: (): string => `${environment.sparql.url}`,
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
