import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// eslint-disable-next-line
// @ts-ignore
import { Map as MapboxMap } from '!mapbox-gl';

import { MapConfigModel } from '@core/models/map-configuration.model';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'c477-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements AfterViewInit {
  @Output() setRouteParams = new EventEmitter<MapConfigModel>();

  runtimeConfig = inject(RUNTIME_CONFIGURATION);
  map: MapboxMap | undefined;

  /** Map config */
  lng = this.runtimeConfig.map.lng;
  lat = this.runtimeConfig.map.lat;
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
      center: [this.lng, this.lat],
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
    const zoom = this.map.getZoom();
    const pitch = this.map.getPitch();
    const bearing = this.map.getBearing();
    const { lng, lat } = this.map.getCenter();
    const mapConfig: MapConfigModel = {
      bearing,
      lat,
      lng,
      pitch,
      zoom,
    };
    this.setRouteParams.emit(mapConfig);
  }
}
