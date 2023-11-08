import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// eslint-disable-next-line
// @ts-ignore
import { Map as MapboxMap } from '!mapbox-gl';

import { environment } from 'src/environments/environment';

@Component({
  selector: 'c477-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements AfterViewInit {
  map: MapboxMap | undefined;
  lat = 50.7561;
  lng = -1.30303;
  pitch = 64.9;
  zoom = 16;
  accessToken = environment.mapbox.apiKey;

  ngAfterViewInit() {
    // delay map creation until after parent
    // containers are created
    setTimeout(() => {
      this.initializeMap();
    }, 0);
  }

  initializeMap() {
    this.map = new MapboxMap({
      container: 'map',
      accessToken: this.accessToken,
      pitch: this.pitch,
      zoom: this.zoom,
      center: [this.lng, this.lat],
    });

    this.map.on('style.load', () => {
      this.map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
    });
  }
}
