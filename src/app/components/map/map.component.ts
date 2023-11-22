import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Subscription, tap } from 'rxjs';

import { MapService } from '@core/services/map.service';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

@Component({
  selector: 'c477-map',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements AfterViewInit, OnDestroy, OnInit {
  runtimeConfig = inject(RUNTIME_CONFIGURATION);
  mapService = inject(MapService);

  private subscription!: Subscription;

  ngOnInit(): void {
    this.subscription = this.mapService.mapLoaded$
      .pipe(
        tap(() => {
          this.addBuildingsLayer();
        })
      )
      .subscribe();
  }

  /**
   * Add the buildings layer by extruding
   * an the existing buildings layer in the
   * OS Vector Tile Service
   */
  addBuildingsLayer() {
    this.mapService.mapInstance.addLayer({
      id: 'OS/TopographicArea_2/Building/1_3D',
      type: 'fill-extrusion',
      source: 'esri',
      'source-layer': 'TopographicArea_2',
      filter: ['==', '_symbol', 4],
      minzoom: 15,
      layout: {},
      paint: {
        'fill-extrusion-color': '#DCD7C6',
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'RelHMax'],
        ],
        'fill-extrusion-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          16,
          0.9,
        ],
      },
    });
  }

  ngAfterViewInit() {
    this.mapService.setup(this.runtimeConfig.map);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  resetMapView() {
    this.mapService.mapInstance.easeTo({
      center: this.runtimeConfig.map.center,
      zoom: this.runtimeConfig.map.zoom,
      duration: 1500,
    });
  }

  setDrawMode(mode: string) {
    switch (mode) {
      case 'polygon': {
        this.updateMode('draw_polygon');
        break;
      }
      case 'delete': {
        this.drawControl.trash();
        break;
      }
      default:
        this.updateMode('simple_select');
        break;
    }
  }

  updateMode(mode: string) {
    this.drawControl.changeMode(mode);
  }

  zoomIn() {
    this.mapService.mapInstance.zoomIn();
  }

  zoomOut() {
    this.mapService.mapInstance.zoomOut();
  }
}
