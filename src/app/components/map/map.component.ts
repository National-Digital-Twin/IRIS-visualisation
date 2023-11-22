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

import { Polygon } from 'geojson';

import { Layer, RasterDemSource } from 'mapbox-gl';
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

  @Output() setSearchArea: EventEmitter<GeoJSON.Feature<Polygon>> =
    new EventEmitter<GeoJSON.Feature<Polygon>>();

  private drawControl!: MapboxDraw;
  private subscription!: Subscription;

  ngOnInit(): void {
    this.subscription = this.mapService.mapLoaded$
      .pipe(
        tap(() => {
          this.addTerrainLayer();
          this.addLayers();
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
    this.mapService.mapInstance.on('draw.update', this.onDrawUpdate);
  }

  addTerrainLayer() {
    const config: RasterDemSource = {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    };
    this.mapService.addMapSource('mapbox-dem', config);
  }

  /**
   * Add the following map layers
   *  - 2d buildings layer for spatial search
   *  - 3d buildings layer for extruding
   *  - 3d buildings layer for highlighting
   */
  addLayers() {
    this.runtimeConfig.mapLayers.forEach((layer: Layer) =>
      this.mapService.addMapLayer(layer)
    );
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
        this.deleteSearchArea();
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

  deleteSearchArea() {
    // delete search geom
    this.drawControl.deleteAll();
    // reset building highlight layer
    this.mapService.filterMapLayer(
      'OS/TopographicArea_2/Building/1_3D-highlighted',
      ['all', ['==', '_symbol', 4], ['in', 'TOID', '']]
    );
  }

  zoomIn() {
    this.mapService.mapInstance.zoomIn();
  }

  zoomOut() {
    this.mapService.mapInstance.zoomOut();
  }

  /**
   * Set search area when a search area is drawn
   * @param e Mapbox draw create event
   */
  onDrawCreate = (e: MapboxDraw.DrawCreateEvent) => {
    this.setSearchArea.emit(e.features[0] as GeoJSON.Feature<Polygon>);
  };

  /**
   * Set search area when an existing search area updated (moved)
   * @param e Mapbox draw update event
   */
  onDrawUpdate = (e: MapboxDraw.DrawUpdateEvent) => {
    this.setSearchArea.emit(e.features[0] as GeoJSON.Feature<Polygon>);
  };

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
