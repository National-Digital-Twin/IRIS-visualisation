import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

export const mapStateGuard: CanActivateFn = route => {
  const router = inject(Router);
  const runtimeConfig = inject(RUNTIME_CONFIGURATION);

  const params = route.queryParams;

  const pitch = runtimeConfig.map.pitch;
  const bearing = runtimeConfig.map.bearing;
  const lat = runtimeConfig.map.center[0];
  const lng = runtimeConfig.map.center[1];
  const zoom = runtimeConfig.map.zoom;

  if (
    !params.bearing &&
    !params.lat &&
    !params.lng &&
    !params.pitch &&
    !params.zoom
  ) {
    router.navigate(['/'], {
      queryParams: { bearing, lat, lng, pitch, zoom },
    });
    return false;
  }
  return true;
};
