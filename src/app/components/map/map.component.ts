import { AfterViewInit, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MapService } from '@core/services/map.service';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

@Component({
  selector: 'c477-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements AfterViewInit {
  runtimeConfig = inject(RUNTIME_CONFIGURATION);
  mapService = inject(MapService);

  ngAfterViewInit() {
    this.mapService.setup(this.runtimeConfig.map);
  }
}
