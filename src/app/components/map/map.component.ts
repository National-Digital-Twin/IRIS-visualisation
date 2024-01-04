import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, tap } from 'rxjs';

import { Polygon } from 'geojson';
import { MapLayerMouseEvent } from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

import { MapService } from '@core/services/map.service';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { URLStateModel } from '@core/models/url-state.model';
import { LegendComponent } from '@components/legend/legend.component';

@Component({
  selector: 'c477-map',
  standalone: true,
  imports: [LegendComponent, MatButtonModule, MatIconModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private runtimeConfig = inject(RUNTIME_CONFIGURATION);
  private mapService = inject(MapService);

  private drawControl!: MapboxDraw;
  private mapSubscription!: Subscription;

  showLegend: boolean = false;

  @Input() mapConfig!: URLStateModel | undefined;

  @Output() resetMapView: EventEmitter<null> = new EventEmitter<null>();
  @Output() zoomIn: EventEmitter<null> = new EventEmitter<null>();
  @Output() zoomOut: EventEmitter<null> = new EventEmitter<null>();

  @Output() deleteSpatialFilter: EventEmitter<null> = new EventEmitter<null>();
  @Output() setSearchArea: EventEmitter<GeoJSON.Feature<Polygon>> =
    new EventEmitter<GeoJSON.Feature<Polygon>>();
  @Output() setSelectedBuildingTOID: EventEmitter<string | null> =
    new EventEmitter<string | null>();

  @Output() setRouteParams: EventEmitter<URLStateModel> =
    new EventEmitter<URLStateModel>();

  /** setup map */
  ngAfterViewInit() {
    const { bearing, zoom, pitch } = this.mapConfig!;
    const config: URLStateModel = {
      style: this.runtimeConfig.map.style!,
      center: [this.mapConfig!.center[0], this.mapConfig!.center[1]],
      bearing,
      zoom,
      pitch,
    };
    this.mapService.setup(config);
  }

  /** on map loaded, setup layers, controls etc */
  constructor() {
    this.mapSubscription = this.mapService.mapLoaded$
      .pipe(
        tap(() => {
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
    /** Get map state whenever the map is moved */
    this.mapService.mapInstance.on('moveend', () => {
      this.setRouterParams();
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
    // reset building colour to entire map
    // by updating map bounds to trigger
    // filter
    this.deleteSpatialFilter.emit();
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
    if (e.features && !this.drawControl.getAll().features.length) {
      this.setSelectedBuildingTOID.emit(e.features![0].properties!.TOID);
    }
  };

  setRouterParams() {
    const zoom = this.mapService.mapInstance.getZoom();
    const pitch = this.mapService.mapInstance.getPitch();
    const bearing = this.mapService.mapInstance.getBearing();
    const { lng, lat } = this.mapService.mapInstance.getCenter();
    const mapConfig: URLStateModel = {
      bearing,
      center: [lat, lng],
      pitch,
      zoom,
    };
    this.setRouteParams.emit(mapConfig);
  }

  ngOnDestroy(): void {
    this.mapService.destroyMap();
    this.mapSubscription.unsubscribe();
  }
}
