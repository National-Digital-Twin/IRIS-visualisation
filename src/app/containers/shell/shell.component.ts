import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

import { DataService } from '@core/services/data.service';

import { MapComponent } from 'src/app/components/map/map.component';
import { MapConfigModel } from '@core/models/map-configuration.model';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'c477-shell',
  standalone: true,
  providers: [DataService],
  imports: [CommonModule, MapComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ShellComponent {
  dataService = inject(DataService);
  router = inject(Router);
  runtimeConfig = inject(RUNTIME_CONFIGURATION);

  // TODO - remove, this is for testing purposes only

  data$: Observable<object[]> = this.dataService
    .getUPRNs$()
    .pipe(map(data => this.dataService.createGeoJSON(data)));

  title = 'C477 Visualisation';

  setRouteParams(params: MapConfigModel) {
    const { bearing, center, pitch, zoom } = params;
    this.router.navigate(['/'], {
      queryParams: { bearing, lat: center[1], lng: center[0], pitch, zoom },
    });
  }
}
