import { Injectable, NgZone, inject } from '@angular/core';

import { AsyncSubject, Observable, Subject } from 'rxjs';
import { first } from 'rxjs/operators';

// ignore mapbox-gl
// eslint-disable-next-line
// @ts-ignore
import { MapEvent, Map as MapboxMap } from '!mapbox-gl';
import {
  Expression,
  Layer,
  LngLatBounds,
  RasterDemSource,
  Source,
} from 'mapbox-gl';

import { MapLayerFilter } from '@core/models/layer-filter.model';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

import { environment } from 'src/environments/environment';
import { MapConfigModel } from '@core/models/map-configuration.model';
import { BuildingModel } from '@core/models/building.model';

/**
 * Service for the MapboxGLJS map
 */
@Injectable({
  providedIn: 'root',
})
export class MapService {
  mapInstance: MapboxMap;
  mapCreated$: Observable<void>;
  mapLoaded$: Observable<void>;
  mapEvents: MapEvent;

  private runtimeConfig = inject(RUNTIME_CONFIGURATION);
  private mapCreated = new AsyncSubject<void>();
  private mapLoaded = new AsyncSubject<void>();

  private mapBoundsSubject = new Subject<LngLatBounds | undefined>();
  mapBounds$ = this.mapBoundsSubject.asObservable();

  private epcColours = this.runtimeConfig.epcColours;

  constructor(private zone: NgZone) {
    this.mapCreated$ = this.mapCreated.asObservable();
    this.mapLoaded$ = this.mapLoaded.asObservable();
  }

  setup(config: MapConfigModel) {
    // Need onStable to wait for a potential @angular/route transition to end
    this.zone.onStable.pipe(first()).subscribe(() => {
      this.createMap(config);
      this.hookEvents();
      this.mapCreated.next(undefined);
      this.mapCreated.complete();
    });
  }

  addMapSource(name: string, source: Source | RasterDemSource) {
    this.zone.runOutsideAngular(() => {
      this.mapInstance.addSource(name, source);

      if (source.type === 'raster-dem') {
        // add the DEM source as a terrain layer
        this.mapInstance.setTerrain({
          source: name,
        });
      }
    });
  }

  addMapLayer(layerConfig: Layer) {
    this.zone.runOutsideAngular(() => {
      this.mapInstance.addLayer(layerConfig);
    });
  }

  filterMapLayer(filter: MapLayerFilter) {
    const { layerId, expression } = filter;
    this.zone.runOutsideAngular(() => {
      this.mapInstance.setFilter(layerId, expression);
    });
  }

  /** Set the current map bounds */
  setMapBounds(bounds: LngLatBounds) {
    this.mapBoundsSubject.next(bounds);
  }

  /**
   * Set the paint property of a layer
   * @param layerId layer id to apply paint property to
   * @param paintProperty paint property to apply expression
   * @param value paint colour expression
   */
  setMapLayerPaint(layerId: string, paintProperty: string, value: Expression) {
    this.zone.runOutsideAngular(() => {
      this.mapInstance.setPaintProperty(layerId, paintProperty, value);
    });
  }

  /**
   * Create an array of building TOIDS and colours from buildings
   * @param addresses filtered addresses within map bounds
   * @returns MapboxGLJS expression
   */
  createBuildingColourFilter(addresses: BuildingModel[]) {
    const matchExpression: Expression = ['match', ['get', 'TOID']];
    for (const row of addresses) {
      const colour = this.getEPCColour(row.SAPBand);
      matchExpression.push(row['TOID'], colour);
    }
    matchExpression.push(this.epcColours['default']);
    return matchExpression;
  }

  getEPCColour(SAPBand: string) {
    const color = SAPBand
      ? this.epcColours[SAPBand]
      : this.epcColours['default'];
    return color;
  }

  private createMap(config: MapConfigModel) {
    NgZone.assertNotInAngularZone();
    const { center, pitch, zoom, style } = config;

    const accessToken = environment.mapbox.apiKey;
    const apiKey = environment.os.apiKey;

    this.mapInstance = new MapboxMap({
      container: 'map',
      accessToken,
      pitch,
      zoom,
      center,
      style,
      // append OS api key and srs details to OS VTS requests
      transformRequest: (url: string) => {
        if (url.indexOf('api.os.uk') > -1) {
          if (!/[?&]key=/.test(url)) url += '?key=' + apiKey;
          return {
            url: url + '&srs=3857',
          };
        } else {
          return {
            url: url,
          };
        }
      },
    });
  }

  destroyMap() {
    if (this.mapInstance) {
      this.mapInstance.remove();
    }
  }

  private hookEvents() {
    this.mapInstance.on('load', () => {
      this.mapLoaded.next(undefined);
      this.mapLoaded.complete();
    });
  }
}
