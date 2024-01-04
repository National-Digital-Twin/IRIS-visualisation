import { Injectable, NgZone, inject, signal } from '@angular/core';

import { AsyncSubject, Observable, first, EMPTY, catchError, tap } from 'rxjs';

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

import { MapLayerFilter } from '@core/models/layer-filter.model';
import { URLStateModel } from '@core/models/url-state.model';

import { environment } from 'src/environments/environment';

import { from, forkJoin, take } from 'rxjs';

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

  currentMapBounds = signal<LngLatBounds | undefined>(undefined);

  constructor(private zone: NgZone) {
    this.mapCreated$ = this.mapCreated.asObservable();
    this.mapLoaded$ = this.mapLoaded.asObservable();
  }

  setup(config: URLStateModel) {
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

  /**
   * Add Map Image.
   *
   * Adds an image to the map instance. Runs outside of the ZoneJS.
   */
  addMapImage(imageId: string, image: HTMLImageElement) {
    this.zone.runOutsideAngular(() => {
      this.mapInstance.addImage(imageId, image);
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
    this.currentMapBounds.set(bounds);
  }

  /**
   * Set the paint property of a layer
   * @param layerId layer id to apply paint property to
   * @param paintProperty paint property to apply expression
   * @param value paint colour expression
   */
  setMapLayerPaint(layerId: string, paintProperty: string, value: Expression) {
    if (value.length <= 3) return;
    this.zone.runOutsideAngular(() => {
      this.mapInstance.setPaintProperty(layerId, paintProperty, value);
    });
  }

  /** Query map features within current map bounds */
  queryFeatures(): GeoJSON.Feature[] {
    return this.zone.runOutsideAngular(() => {
      return this.mapInstance.queryRenderedFeatures({
        layers: ['OS/TopographicArea_2/Building/1_2D'],
      });
    });
  }

  queryFeaturesByGeom(bounds: number[]): GeoJSON.Feature[] {
    return this.zone.runOutsideAngular(() => {
      return this.mapInstance.queryRenderedFeatures(bounds, {
        layers: ['OS/TopographicArea_2/Building/1_2D'],
      });
    });
  }

  private createMap(config: URLStateModel) {
    NgZone.assertNotInAngularZone();
    const { bearing, center, pitch, zoom, style } = config;

    const accessToken = environment.mapbox.apiKey;
    const apiKey = environment.os.apiKey;

    this.mapInstance = new MapboxMap({
      container: 'map',
      accessToken,
      pitch,
      zoom,
      center,
      bearing,
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

  addTerrainLayer() {
    const config: RasterDemSource = {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    };
    this.addMapSource('mapbox-dem', config);
  }

  /**
   * Add the following map layers
   *  - 2d buildings layer for spatial search
   *  - 3d buildings layer for extruding
   *  - 3d buildings layer for highlighting
   */
  addLayers() {
    this.runtimeConfig.mapLayers.forEach((layer: Layer) =>
      this.addMapLayer(layer)
    );
  }

  destroyMap() {
    if (this.mapInstance) {
      this.mapInstance.remove();
    }
  }

  private hookEvents() {
    this.mapInstance.on('load', () => {
      this.addLayers();
      this.addTerrainLayer();
      this.addEPCPatterns();
      this.mapLoaded.next(undefined);
      this.mapLoaded.complete();
    });
  }

  private async addEPCPatterns() {
    const { epcColours, epcColoursCD } = this.runtimeConfig;

    /**
     * Combine the epcColours and epcColoursCD
     * objects into a single object and get the
     * selected colour from the map layer config.
     */
    const colors = <Record<string, string>>{
      ...epcColours,
      ...Object.keys(epcColoursCD).reduce((acc, key) => {
        return { ...acc, [`cb-${key}`]: epcColoursCD[key] };
      }, {}),
      selected:
        (
          this.runtimeConfig.mapLayers.find(
            layer =>
              layer.id ===
              'OS/TopographicArea_2/Building/1_3D-Single-Dwelling-Selected'
          )?.paint as unknown as { 'fill-extrusion-color': string } | undefined
        )?.['fill-extrusion-color'] ?? '#CCCCCC',
    };

    /** Rasterize each pattern and add it to the map */
    forkJoin(
      ...Object.keys(colors).map(key =>
        from(this.rasterizePattern(colors[key])).pipe(
          catchError(error => {
            console.error('error rasterizing pattern', error);
            return EMPTY;
          }),
          tap(rasterizedPattern => {
            this.mapInstance.loadImage(
              rasterizedPattern,
              (error: Error, image: HTMLImageElement) => {
                if (error) {
                  console.error(error);
                  return;
                }
                this.addMapImage(`${key.toLowerCase()}-pattern`, image);
              }
            );
          })
        )
      )
    )
      .pipe(take(1))
      .subscribe();
  }

  /**
   * Rasterize Pattern.
   *
   * Rasterizes a pattern from a hex colour string.
   */
  private rasterizePattern(epcColor: string): Promise<string> {
    /** With and height of the pattern */
    const width = 10;
    const height = width;

    /** Generate SVG */
    function genSVG(epcColor: string): HTMLElement {
      /** Contrast colour of Epc colour */
      function contrastColor(
        epcColor: string,
        lightColor: string,
        darkColor: string
      ): string {
        const color =
          epcColor.charAt(0) === '#' ? epcColor.substring(1, 7) : epcColor;
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);
        return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? darkColor : lightColor;
      }

      /** SVG element */
      const svg = document.createElement('svg');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('width', width.toString());
      svg.setAttribute('height', height.toString());

      const background = document.createElement('rect');
      background.setAttribute('width', width.toString());
      background.setAttribute('height', height.toString());
      background.setAttribute('fill', epcColor);
      svg.appendChild(background);

      const circle = document.createElement('circle');
      circle.setAttribute('cx', (width / 2).toString());
      circle.setAttribute('cy', (height / 2).toString());
      circle.setAttribute('r', (width / 4).toString());
      circle.setAttribute(
        'fill',
        contrastColor(epcColor, '#FFFFFF', '#000000')
      );
      svg.appendChild(circle);

      return svg;
    }

    /** Rasterize SVG to base64 string */
    function rasterizeSvgBase64String(svgBase64: string): Promise<string> {
      return new Promise((resolve, reject) => {
        /** Create image element and set the src to the svg base64 string */
        const img = document.createElement('img') as HTMLImageElement;
        img.src = `data:image/svg+xml;base64,${svgBase64}`;

        /**
         * When the image has loaded, draw it to a canvas
         * then resolve the data url of the which can be
         * used as a mapbox image.
         */
        img.onload = function () {
          const canvas = document.createElement('canvas') as HTMLCanvasElement;
          canvas.width = width;
          canvas.height = canvas.width;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            const data = canvas.toDataURL('image/png');
            resolve(data);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = error => reject(error);
      });
    }

    /** Generate SVG, convert to base64 string, then rasterize to image data */
    const svg = genSVG(epcColor);
    const svgBase64 = document.defaultView?.btoa(svg.outerHTML);
    const imageData = rasterizeSvgBase64String(svgBase64 ?? '');

    return imageData;
  }
}
