import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { skip, Subscription, tap } from 'rxjs';

import { Polygon } from 'geojson';
import { MapLayerMouseEvent } from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

import { SETTINGS, SettingsService } from '@core/services/settings.service';
import { MapService } from '@core/services/map.service';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { URLStateModel } from '@core/models/url-state.model';
import { MinimapData } from '@core/models/minimap-data.model';

import { LegendComponent } from '@components/legend/legend.component';

@Component({
  selector: 'c477-map',
  standalone: true,
  imports: [
    CommonModule,
    LegendComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private readonly theme = inject(SettingsService).get(SETTINGS.Theme);
  public readonly theme$ = toObservable(this.theme).pipe(takeUntilDestroyed());
  private runtimeConfig = inject(RUNTIME_CONFIGURATION);
  private mapService = inject(MapService);

  private drawControl!: MapboxDraw;
  private mapSubscription!: Subscription;

  showLegend: boolean = false;
  twoDimensions: boolean = false;

  @Input() mapConfig!: URLStateModel | undefined;

  @Output() resetMapView: EventEmitter<null> = new EventEmitter<null>();
  @Output() resetNorth: EventEmitter<null> = new EventEmitter<null>();
  @Output() tilt2D: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() zoomIn: EventEmitter<null> = new EventEmitter<null>();
  @Output() zoomOut: EventEmitter<null> = new EventEmitter<null>();

  @Output() deleteSpatialFilter: EventEmitter<null> = new EventEmitter<null>();
  @Output() setSearchArea: EventEmitter<GeoJSON.Feature<Polygon>> =
    new EventEmitter<GeoJSON.Feature<Polygon>>();
  @Output() setSelectedBuildingTOID: EventEmitter<string | null> =
    new EventEmitter<string | null>();

  @Output() setRouteParams: EventEmitter<URLStateModel> =
    new EventEmitter<URLStateModel>();
  @Output() setMinimapData: EventEmitter<MinimapData> =
    new EventEmitter<MinimapData>();
  @Output() toggleMinimap: EventEmitter<null> = new EventEmitter<null>();

  /** setup map */
  ngAfterViewInit() {
    if (this.runtimeConfig.map.style) {
      const theme = this.theme();
      const style = this.runtimeConfig.map.style[theme];
      const { bearing, zoom, pitch } = this.mapConfig!;
      const config: URLStateModel = {
        center: [this.mapConfig!.center[0], this.mapConfig!.center[1]],
        style: style,
        bearing,
        zoom,
        pitch,
      };
      this.mapService.setup(config);
    }
    /* skip first value as we've already set the map style based on theme */
    this.theme$.pipe(skip(1)).subscribe(theme => {
      this.mapService.setStyle(this.runtimeConfig.map.style[theme]);
    });
  }

  /** on map loaded, setup layers, controls etc */
  constructor() {
    this.mapSubscription = this.mapService.mapLoaded$
      .pipe(
        tap(() => {
          this.addControls();
          this.initMapEvents();
          this.updateMinimap();
        })
      )
      .subscribe();
  }

  /**
   * Map event listeners
   */
  initMapEvents() {
    /* If the map style changes, re-add layers */
    this.mapService.mapInstance.on('style.load', () =>
      this.mapService.addLayers()
    );
    /** Spatial search events */
    this.mapService.mapInstance.on('draw.create', this.onDrawCreate);
    this.mapService.mapInstance.on('draw.update', this.onDrawUpdate);
    /** Select building event */
    this.mapService.mapInstance.on(
      'click',
      'OS/TopographicArea_2/Building/1_3D-Single-Dwelling',
      this.setSelectedTOID
    );
    this.mapService.mapInstance.on(
      'click',
      'OS/TopographicArea_2/Building/1_3D-Multi-Dwelling',
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

    /** update the minimap as the map moves */
    this.mapService.mapInstance.on('move', () => {
      this.updateMinimap();
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
        this.deleteSearchArea();
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

  changeDimensions(): void {
    this.twoDimensions = !this.twoDimensions;
    this.tilt2D.emit(this.twoDimensions);
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

  updateMinimap() {
    this.setMinimapData.emit({
      position: this.mapService.mapInstance
        .getFreeCameraOptions()
        ._position.toLngLat(),
      bearing: this.mapService.mapInstance.getBearing(),
    });
  }

  setSelectedTOID = (e: MapLayerMouseEvent) => {
    if (e.features && this.drawControl.getMode() !== 'draw_polygon') {
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
