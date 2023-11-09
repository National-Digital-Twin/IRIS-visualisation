import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

import { MapComponent } from 'src/app/components/map/map.component';
import { MapConfigModel } from '@core/models/map-configuration.model';

@Component({
  selector: 'c477-shell',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ShellComponent {
  router = inject(Router);
  runtimeConfig = inject(RUNTIME_CONFIGURATION);

  title = 'C477 Visualisation';

  setRouteParams(params: MapConfigModel) {
    const { bearing, zoom, pitch, lng, lat } = params;
    this.router.navigate(['/'], {
      queryParams: { bearing, lat, lng, pitch, zoom },
    });
  }
}
