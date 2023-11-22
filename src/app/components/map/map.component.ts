import {
  AfterViewInit,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Subscription, tap } from 'rxjs';

import MapboxDraw from '@mapbox/mapbox-gl-draw';

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

  @Output() setSearchArea: EventEmitter<GeoJSON.Feature> =
    new EventEmitter<GeoJSON.Feature>();

  private drawControl!: MapboxDraw;
  private subscription!: Subscription;

  ngOnInit(): void {
    this.subscription = this.mapService.mapLoaded$
      .pipe(
        tap(() => {
          this.addTerrainLayer();
          this.addBuildingsLayer();
          this.addControls();
          this.initMapEvents();
        })
      )
      .subscribe();
  }

  /**
   * Map event listeners
   */
  initMapEvents() {
    this.mapService.mapInstance.on('draw.create', this.onDrawCreate);
  }

  addTerrainLayer() {
    this.mapService.mapInstance.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    });
    // add the DEM source as a terrain layer
    this.mapService.mapInstance.setTerrain({
      source: 'mapbox-dem',
    });
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

  /**
   * Add draw tool to the map but hide
   * ui as we're using custom buttons
   */
  addControls(): void {
    this.drawControl = new MapboxDraw({
      displayControlsDefault: false,
    });
    this.mapService.mapInstance.addControl(this.drawControl, 'top-right');
  }

  ngAfterViewInit() {
    this.mapService.setup(this.runtimeConfig.map);
  }

  resetMapView() {
    this.mapService.mapInstance.easeTo({
      center: this.runtimeConfig.map.center,
      zoom: this.runtimeConfig.map.zoom,
      pitch: this.runtimeConfig.map.pitch,
      bearing: this.runtimeConfig.map.bearing,
      duration: 1500,
    });
  }

  setDrawMode(mode: string) {
    switch (mode) {
      case 'polygon': {
        this.drawControl.deleteAll();
        this.updateMode('draw_polygon');
        break;
      }
      case 'delete': {
        this.drawControl.deleteAll();
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

  onDrawCreate = (e: MapboxDraw.DrawCreateEvent) => {
    this.setSearchArea.emit(e.features[0]);
  };

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
