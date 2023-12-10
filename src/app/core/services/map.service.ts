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

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

import { MapConfigModel } from '@core/models/map-configuration.model';
import { MapLayerFilter } from '@core/models/layer-filter.model';
import { EPCMap } from '@core/models/epc.model';
import { ToidMap } from '@core/models/toid.model';

import { environment } from 'src/environments/environment';

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
  createBuildingColourFilter(toids: ToidMap, epcs: EPCMap) {
    const matchExpression: Expression = ['match', ['get', 'TOID']];
    // iterate through toid object and get toid (as key)
    Object.keys(toids).forEach((key: string) => {
      const toid = key;
      // get the uprns for the corresponding toid
      const uprns: number[] = toids[key];
      /* One UPRN for a TOID */
      if (uprns.length === 1) {
        const epc = epcs[uprns[0]];
        if (epc) {
          const colour = this.getEPCColour(epc['epc']);
          matchExpression.push(toid, colour);
        } else {
          matchExpression.push(toid, this.epcColours['default']);
        }
      } else if (uprns.length > 1) {
        /**
         * Multiple UPRNs for a single TOID.
         *
         * Get the EPC value for each
         * UPRN and add to array
         */
        const buildingEPCs: string[] = [];
        uprns.forEach(uprn => {
          const epc = epcs[uprn];
          if (epc) {
            buildingEPCs.push(epc['epc']);
          }
        });
        /**
         * If there are no EPCs for any of the
         * building UPRNs, add the default colour
         */
        if (buildingEPCs.length === 0) {
          matchExpression.push(toid, this.epcColours['default']);
        } else {
          /**
           * If there are mulitple EPCs, get the mean value
           */
          const meanEPC = this.getMeanEPCValue(buildingEPCs);

          const buildingColor = this.getEPCColour(meanEPC);
          matchExpression.push(toid, buildingColor);
        }
      }
    });
    matchExpression.push(this.epcColours['default']);
    return matchExpression;
  }

  /**
   *
   * @param epcRatings Array of EPC ratings
   * @returns The mean EPC rating
   */
  getMeanEPCValue(epcRatings: string[]) {
    let meanEPC = '';
    // assign a weighting to the EPC ratings
    const weightings: { [key: string]: number } = {
      A: 1,
      B: 2,
      C: 3,
      D: 4,
      E: 5,
      F: 6,
      G: 7,
    };
    const scores: number[] = [];
    // get the weighting for each epc value
    epcRatings.forEach(val => scores.push(weightings[val]));
    const sum = scores.reduce((a, c) => a + c, 0);
    const mean = sum / scores.length;
    Object.keys(weightings).forEach((epc: string) => {
      // find the corresponding weighting for the mean
      if (Math.floor(mean) === weightings[epc]) {
        meanEPC = epc;
      }
    });
    return meanEPC;
  }

  getEPCColour(SAPBand: string) {
    const color = SAPBand
      ? this.epcColours[SAPBand]
      : this.epcColours['default'];
    return color;
  }

  queryFeatures() {
    this.zone.runOutsideAngular(() => {
      const features = this.mapInstance.queryRenderedFeatures({
        layers: ['OS/TopographicArea_2/Building/1_3D'],
      });
      console.log(features);
    });
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
