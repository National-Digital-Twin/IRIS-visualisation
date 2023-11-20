import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
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
export class MapComponent implements AfterViewInit, OnChanges {
  @Input() data: Array<object> | undefined;
  @Output() setRouteParams = new EventEmitter<MapConfigModel>();

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

  ngOnChanges(changes: SimpleChanges): void {
    this.addLayerToMap(changes.data.currentValue);
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
      this.addLayerToMap(this.data!);
    });

    this.map.on('moveend', () => {
      this.getMapState();
    });
  }

  getMapState() {
    const zoom = this.map.getZoom();
    const pitch = this.map.getPitch();
    const bearing = this.map.getBearing();
    const { lng, lat } = this.map.getCenter();
    const mapConfig: MapConfigModel = {
      bearing,
      center: [lat, lng],
      pitch,
      zoom,
    };
    this.setRouteParams.emit(mapConfig);
  }

  // TODO remove or refactor.  Temp method to add EPC points to the map
  /**
   * A: #084A28;
     B: #2C9F29
     C: #9DCB3C
     D: #FFDF4C
     E: #E1A900
     F: #E66E23
     G: #940004
   */
  addLayerToMap(featureCollection: Array<object>) {
    if (!this.map) return;
    this.map.addLayer({
      type: 'circle',
      id: 'uprn',
      slot: 'top',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: featureCollection,
        },
      },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2, 10, 6],
        'circle-color': [
          'match',
          ['get', 'epc'],
          'A',
          '#084A28',
          'B',
          '#2C9F29',
          'C',
          '#9DCB3C',
          'D',
          '#FFDF4C',
          'E',
          '#E1A900',
          'F',
          '#E66E23',
          'G',
          '#940004',
          '#ccc',
        ],
      },
    });
  }
}
