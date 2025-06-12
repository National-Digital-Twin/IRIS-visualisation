import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { MapBoxService } from '@core/services/map.service';
import { MAP_SERVICE } from '@core/services/map.token';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [provideRouter(routes, withComponentInputBinding()), { provide: MAP_SERVICE, useClass: MapBoxService }],
};

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
