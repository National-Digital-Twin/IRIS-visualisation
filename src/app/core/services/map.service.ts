import { Injectable, NgZone } from '@angular/core';

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

  private mapCreated = new AsyncSubject<void>();
  private mapLoaded = new AsyncSubject<void>();

  private mapBoundsSubject = new Subject<LngLatBounds | undefined>();
  mapBounds$ = this.mapBoundsSubject.asObservable();

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

  setMapLayerPaint(layerId: string, paintProperty: string, value: Expression) {
    this.zone.runOutsideAngular(() => {
      this.mapInstance.setPaintProperty(layerId, paintProperty, value);
    });
  }

  createBuildingColourFilter(addresses: BuildingModel[]) {
    const matchExpression: Expression = ['match', ['get', 'TOID']];
    for (const row of addresses) {
      const colour = this.setColour(row);
      matchExpression.push(row['TOID'], colour);
    }
    matchExpression.push('#ccc');
    return matchExpression;
  }

  setColour(address: BuildingModel) {
    let color = '#ccc';
    switch (address.SAPBand) {
      case 'A': {
        color = '#084A28';
        return color;
      }
      case 'B': {
        color = '#2C9F29';
        return color;
      }
      case 'C': {
        color = '#9DCB3C';
        return color;
      }
      case 'D': {
        color = '#FFDF4C';
        return color;
      }
      case 'E': {
        color = '#E1A900';
        return color;
      }
      case 'F': {
        color = '#E66E23';
        return color;
      }
      case 'G': {
        color = '#E66E23';
        return color;
      }
      case '':
        color = '#ccc';
        return color;
      default:
        color = '#ccc';
        return color;
    }
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
      // this.mapBoundsSubject.next(this.mapInstance.getBounds());
      this.mapLoaded.next(undefined);
      this.mapLoaded.complete();
    });
  }
}
