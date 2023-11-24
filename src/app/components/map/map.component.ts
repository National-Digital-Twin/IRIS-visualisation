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

import { Layer, MapLayerMouseEvent, RasterDemSource } from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

import { MapService } from '@core/services/map.service';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

import { MapLayerFilter } from '@core/models/layer-filter.model';

@Component({
  selector: 'c477-map',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements AfterViewInit, OnDestroy, OnInit {
  private runtimeConfig = inject(RUNTIME_CONFIGURATION);
  private mapService = inject(MapService);

  private drawControl!: MapboxDraw;
  private subscription!: Subscription;

  @Output() resetMapView: EventEmitter<null> = new EventEmitter<null>();
  @Output() zoomIn: EventEmitter<null> = new EventEmitter<null>();
  @Output() zoomOut: EventEmitter<null> = new EventEmitter<null>();

  @Output() filterLayer: EventEmitter<MapLayerFilter> =
    new EventEmitter<MapLayerFilter>();
  @Output() setSearchArea: EventEmitter<GeoJSON.Feature<Polygon>> =
    new EventEmitter<GeoJSON.Feature<Polygon>>();
  @Output() setSelectedBuildingTOID: EventEmitter<string | null> =
    new EventEmitter<string | null>();

  /** setup map */
  ngAfterViewInit() {
    this.mapService.setup(this.runtimeConfig.map);
  }

  /** on map loaded, setup layers, controls etc */
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
    /** Spatial search events */
    this.mapService.mapInstance.on('draw.create', this.onDrawCreate);
    this.mapService.mapInstance.on('draw.update', this.onDrawUpdate);
    /** Select building event */
    this.mapService.mapInstance.on(
      'click',
      'OS/TopographicArea_2/Building/1_3D',
      this.setSelectedTOID
    );
    /** Change mouse cursor on building hover */
    this.mapService.mapInstance.on(
      'mouseenter',
      'OS/TopographicArea_2/Building/1_3D',
      () => {
        if (this.drawControl.getMode() !== 'draw_polygon') {
          this.mapService.mapInstance.getCanvas().style.cursor = 'pointer';
        }
      }
    );
    /** Remove mouse cursor when hovering off a building */
    this.mapService.mapInstance.on(
      'mouseleave',
      'OS/TopographicArea_2/Building/1_3D',
      () => (this.mapService.mapInstance.getCanvas().style.cursor = '')
    );
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
    this.filterLayer.emit({
      layerId: 'OS/TopographicArea_2/Building/1_3D-highlighted',
      expression: ['all', ['==', '_symbol', 4], ['in', 'TOID', '']],
    });
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

  setSelectedTOID = (e: MapLayerMouseEvent) => {
    if (e.features && this.drawControl.getMode() !== 'draw_polygon') {
      this.setSelectedBuildingTOID.emit(e.features![0].properties!.TOID);
    }
  };

  ngOnDestroy(): void {
    this.mapService.destroyMap();
    this.subscription.unsubscribe();
  }
}
