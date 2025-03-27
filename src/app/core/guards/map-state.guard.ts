import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

export const mapStateGuard: CanActivateFn = (route) => {
    const router = inject(Router);
    const runtimeConfig = inject(RUNTIME_CONFIGURATION);

    const params = route.queryParams;

    const pitch = runtimeConfig.map.pitch;
    const bearing = runtimeConfig.map.bearing;
    const lat = runtimeConfig.map.center[0];
    const lng = runtimeConfig.map.center[1];
    const zoom = runtimeConfig.map.zoom;

    if (!params.bearing && !params.lat && !params.lng && !params.pitch && !params.zoom) {
        router.navigate(['/'], {
            queryParams: { bearing, lat, lng, pitch, zoom },
            queryParamsHandling: 'merge',
        });
        return false;
    }
    return true;
};

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
