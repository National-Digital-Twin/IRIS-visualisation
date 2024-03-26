import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  ChangeDetectionStrategy,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { skip, Subscription, tap } from 'rxjs';

import {
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  Polygon,
} from 'geojson';
import {
  FillPaint,
  GeoJSONSourceRaw,
  MapLayerMouseEvent,
  Popup,
} from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

import { SETTINGS, SettingsService } from '@core/services/settings.service';
import { MapService } from '@core/services/map.service';
import { UtilService } from '@core/services/utils.service';

import { MapLayerConfig } from '@core/models/map-layer-config.model';
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
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly settings = inject(SettingsService);
  private readonly theme = this.settings.get(SETTINGS.Theme);
  public readonly theme$ = toObservable(this.theme).pipe(takeUntilDestroyed());
  private readonly colorBlindMode$ = toObservable(
    this.settings.get(SETTINGS.ColorBlindMode)
  ).pipe(takeUntilDestroyed());
  private runtimeConfig = inject(RUNTIME_CONFIGURATION);
  mapService = inject(MapService);
  private utilsService = inject(UtilService);

  private drawControl!: MapboxDraw;
  private mapSubscription!: Subscription;

  private epcColours = this.runtimeConfig.epcColours;

  private wardPopup = new Popup();

  drawActive: boolean = false;
  showLegend: boolean = false;
  twoDimensions: boolean = false;
  bearing: number = 0;

  @Input() mapConfig!: URLStateModel | undefined;
  @Input() contextData:
    | FeatureCollection<Geometry, GeoJsonProperties>[]
    | undefined
    | null;
  @Input() spatialFilterEnabled: boolean = false;

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

  @Output() downloadAddresses: EventEmitter<null> = new EventEmitter<null>();

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes.contextData && changes.contextData.currentValue) {
      this.addContextLayers();
    }
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

    /** update context layer colors when color blind mode changes */
    this.colorBlindMode$.subscribe({
      next: () => {
        this.wardPopup.remove();
        this.updateLayerPaint();
      },
    });
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
      'OS/TopographicArea_2/Building/1_3D-Single-Dwelling',
      () => {
        if (this.drawControl.getMode() !== 'draw_polygon') {
          this.mapService.mapInstance.getCanvas().style.cursor = 'pointer';
        }
      }
    );
    this.mapService.mapInstance.on(
      'mouseenter',
      'OS/TopographicArea_2/Building/1_3D-Multi-Dwelling',
      () => {
        if (this.drawControl.getMode() !== 'draw_polygon') {
          this.mapService.mapInstance.getCanvas().style.cursor = 'pointer';
        }
      }
    );
    /** Remove mouse cursor when hovering off a building */
    this.mapService.mapInstance.on(
      'mouseleave',
      'OS/TopographicArea_2/Building/1_3D-Single-Dwelling',
      () => (this.mapService.mapInstance.getCanvas().style.cursor = '')
    );
    this.mapService.mapInstance.on(
      'mouseleave',
      'OS/TopographicArea_2/Building/1_3D-Multi-Dwelling',
      () => (this.mapService.mapInstance.getCanvas().style.cursor = '')
    );
    /** Get map state whenever the map is moved */
    this.mapService.mapInstance.on('moveend', () => {
      this.setRouterParams();
    });

    /** wards layer click */
    this.mapService.mapInstance.on(
      'click',
      'wards',
      (e: MapLayerMouseEvent) => {
        this.wardsLayerClick(e);
      }
    );

    this.mapService.mapInstance.on('mouseenter', 'wards', () => {
      this.mapService.mapInstance.getCanvas().style.cursor = 'pointer';
    });

    this.mapService.mapInstance.on('mouseleave', 'wards', () => {
      this.mapService.mapInstance.getCanvas().style.cursor = '';
    });

    /** update the minimap as the map moves */
    this.mapService.mapInstance.on('move', () => {
      this.updateMinimap();
    });

    /** close popup if open and zoom is > 15 and remove selection*/
    this.mapService.mapInstance.on('zoomend', () => {
      const zoom = this.mapService.mapInstance.getZoom();
      if (zoom >= 15 && this.wardPopup.isOpen()) {
        this.wardPopup.remove();
        this.mapService.filterMapLayer({
          layerId: 'wards-selected',
          expression: ['==', 'WD23NM', ``],
        });
      }
    });
    this.wardPopup.on('close', () => {
      this.mapService.filterMapLayer({
        layerId: 'wards-selected',
        expression: ['==', 'WD23NM', ``],
      });
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
        this.drawActive = true;
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
    this.drawActive = false;
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
    this.drawActive = false;
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
    this.bearing = this.mapService.mapInstance.getBearing();
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

  wardsLayerClick(e: MapLayerMouseEvent) {
    if (this.drawControl.getMode() === 'draw_polygon') return;
    if (e.features?.length) {
      /** highlight selected ward */
      this.mapService.filterMapLayer({
        layerId: 'wards-selected',
        expression: ['==', 'WD23NM', `${e.features[0].properties!.WD23NM}`],
      });
      const properties = e.features[0].properties;
      /** extract ratings from properties */
      const epcRatings = Object.keys(properties!)
        .filter(k => !isNaN(properties![k]))
        .map(k => {
          return {
            rating: k,
            count: properties![k],
          };
        })
        .sort((a, b) => a.rating.localeCompare(b.rating));
      const histogram = this.utilsService.createHistogram(epcRatings);
      const popupContent = `
        <div class="popupContent">
          <h1>${e.features[0].properties!.WD23NM}</h1>
          ${histogram}
          <p class="disclaimer">*Mix of domestic and commercial buildings. Excluded from ward visualisation.</p>
        </div>
      `;
      this.wardPopup
        .setLngLat(e.lngLat)
        .setMaxWidth('none')
        .setHTML(popupContent)
        .addTo(this.mapService.mapInstance);
    }
  }
  /**
   * Add context layers to map
   */
  private addContextLayers(): void {
    if (this.contextData) {
      this.runtimeConfig.contextLayers.forEach((config: MapLayerConfig) => {
        const data = this.contextData?.find(
          /**
           * find matching source data, ignore 'selected' part
           * of layer id
           */
          // eslint-disable-next-line
          // @ts-ignore
          (d: unknown) => d.name === config.id.split('-')[0]
        );
        const geojsonSource = {
          type: 'geojson',
          data,
        } as GeoJSONSourceRaw;
        this.mapService.addMapSource(config.id, geojsonSource);

        const paint = this.getWardLayerPaint();

        const newConfig = {
          ...config,
          paint: {
            ...paint,
            ...config.paint,
          },
        };
        this.mapService.addMapLayer(newConfig);
      });
    }
  }

  /**
   * update context layer paint when color blind mode changes
   */
  private updateLayerPaint() {
    if (!this.mapService.mapInstance) return;
    this.runtimeConfig.contextLayers.forEach((config: MapLayerConfig) => {
      const lyr = this.mapService.mapInstance.getLayer(config.id);
      if (lyr && config.type !== 'line') {
        const paint = this.getWardLayerPaint();
        this.mapService.mapInstance.setPaintProperty(
          lyr.id,
          'fill-color',
          paint['fill-color']
        );
      }
    });
  }

  private getWardLayerPaint() {
    const EPCRatings = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'none'];
    const defaultColor = this.epcColours['default'];
    const colors: string[] = [];

    EPCRatings.forEach((rating: string) => {
      colors.push(rating);
      const color = this.utilsService.getEPCColour(rating);
      colors.push(color);
    });
    colors.push(defaultColor);

    const paint = {
      'fill-color': ['match', ['get', 'aggEPC'], ...colors],
    } as FillPaint;

    return paint;
  }

  ngOnDestroy(): void {
    this.mapService.destroyMap();
    this.mapSubscription.unsubscribe();
  }
}
