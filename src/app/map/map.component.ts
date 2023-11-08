import { AfterViewInit, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// eslint-disable-next-line
// @ts-ignore
import { Map as MapboxMap } from '!mapbox-gl';

import { environment } from 'src/environments/environment';
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
  map: MapboxMap | undefined;

  /** Map config */
  center = this.runtimeConfig.map.center;
  pitch = this.runtimeConfig.map.pitch;
  zoom = this.runtimeConfig.map.zoom;
  style = this.runtimeConfig.map.style;
  accessToken = environment.mapbox.apiKey;

  ngAfterViewInit() {
    // delay map creation until after parent
    // containers are created
    setTimeout(() => {
      this.initializeMap();
      this.setupMapListeners();
    }, 0);
  }

  initializeMap() {
    this.map = new MapboxMap({
      container: 'map',
      accessToken: this.accessToken,
      pitch: this.pitch,
      zoom: this.zoom,
      center: this.center,
      style: this.style,
    });
  }

  setupMapListeners() {
    this.map.on('style.load', () => {
      this.map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
      this.getMapState();
    });

    this.map.on('moveend', () => {
      this.getMapState();
    });
  }

  getMapState() {
    console.log('Map bounds ', this.map.getBounds());
    console.log('Map zoom ', this.map.getZoom());
    console.log('Map pitch ', this.map.getPitch());
    console.log('Map bearing ', this.map.getBearing());
    console.log('Map center ', this.map.getCenter());
  }
}
