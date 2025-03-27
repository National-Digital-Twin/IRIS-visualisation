import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, inject, signal } from '@angular/core';
import { transformUrlForProxy } from '@core/helpers';
import { MapLayerFilter } from '@core/models/layer-filter.model';
import { URLStateModel } from '@core/models/url-state.model';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import mapboxgl, {
    ExpressionSpecification,
    Layer,
    LayerSpecification,
    LngLatBounds,
    LngLatLike,
    PaintSpecification,
    RasterDEMSourceSpecification,
    SourceSpecification,
} from 'mapbox-gl';
import { AsyncSubject, EMPTY, Observable, catchError, finalize, first, forkJoin, from, map, of, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapService {
    readonly #document = inject(DOCUMENT);
    readonly #zone = inject(NgZone);
    readonly #runtimeConfig = inject(RUNTIME_CONFIGURATION);

    public mapInstance!: mapboxgl.Map;
    public drawControl?: MapboxDraw;
    public mapLoaded$: Observable<boolean>;

    public currentMapBounds = signal<LngLatBounds | undefined>(undefined);

    private readonly mapLoaded = new AsyncSubject<boolean>();

    constructor() {
        this.mapLoaded$ = this.mapLoaded.asObservable();
    }

    public setup(config: URLStateModel): void {
        // Need onStable to wait for a potential @angular/route transition to end
        this.#zone.onStable.pipe(first()).subscribe(() => {
            this.createMap(config);
            this.hookEvents();
        });
    }

    public addMapSource(name: string, source: SourceSpecification): mapboxgl.Map {
        return this.#zone.runOutsideAngular(() => {
            const createdSource = this.mapInstance.addSource(name, source);

            if (source.type === 'raster-dem') {
                // add the DEM source as a terrain layer
                createdSource.setTerrain({ source: name });
            }

            return createdSource;
        });
    }

    public addMapLayer(layerConfig: LayerSpecification): mapboxgl.Map {
        return this.#zone.runOutsideAngular(() => this.mapInstance.addLayer(layerConfig));
    }

    /**
     * Add Map Image.
     *
     * Adds an image to the map instance. Runs outside of the ZoneJS.
     */
    private addMapImage(imageId: string, image: HTMLImageElement | ImageBitmap): void {
        return this.#zone.runOutsideAngular(() => this.mapInstance.addImage(imageId, image));
    }

    public filterMapLayer(filter: MapLayerFilter): mapboxgl.Map {
        const { layerId, expression } = filter;
        return this.#zone.runOutsideAngular(() => this.mapInstance.setFilter(layerId, expression));
    }

    /**
     * Set the paint property of a layer
     * @param layerId layer id to apply paint property to
     * @param paintProperty paint property to apply expression
     * @param value paint colour expression
     */
    public setMapLayerPaint(layerId: string, paintProperty: keyof PaintSpecification, value: ExpressionSpecification): mapboxgl.Map | void {
        if (value.length <= 3) {
            return;
        }
        return this.#zone.runOutsideAngular(() => this.mapInstance.setPaintProperty(layerId, paintProperty, value));
    }

    /** Query map features within current map bounds */
    public queryFeatures(): GeoJSON.Feature[] {
        return this.#zone.runOutsideAngular(() => this.mapInstance.queryRenderedFeatures({ layers: ['OS/TopographicArea_2/Building/1_2D'] }));
    }

    public setStyle(style: string): mapboxgl.Map {
        return this.#zone.runOutsideAngular(() => this.mapInstance.setStyle(style));
    }

    private createMap(config: URLStateModel): void {
        NgZone.assertNotInAngularZone();
        const { bearing, center, pitch, zoom, style } = config;

        this.mapInstance = new mapboxgl.Map({
            container: 'map',
            accessToken: 'undefined',
            pitch,
            zoom,
            center,
            bearing,
            style,
            // transform requests to use proxy
            transformRequest: (url: string): Record<'url', string> => {
                const host = `${this.#document.location.protocol}//${this.#document.location.host}`;
                if (url.indexOf('api.os.uk') > -1) {
                    url = url.includes('?') ? url : `${url}?srs=3857`;
                    url = transformUrlForProxy(host, url, 'os', 'key');
                } else if (url.indexOf('api.mapbox.com') > -1) {
                    url = transformUrlForProxy(host, url, 'mapbox-api', 'access_token');
                } else if (url.indexOf('events.mapbox.com') > -1) {
                    url = transformUrlForProxy(host, url, 'mapbox-events', 'access_token');
                }
                return { url: url };
            },
        });
    }

    private addTerrainLayer(): Observable<mapboxgl.Map> {
        const config: RasterDEMSourceSpecification = {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
        };
        return of(this.addMapSource('mapbox-dem', config));
    }

    /**
     * Add the following map layers
     *  - 2d buildings layer for spatial search
     *  - 3d buildings layer for extruding
     *  - 3d buildings layer for highlighting
     */
    public addLayers(): Observable<mapboxgl.Map[]> {
        return of(this.#runtimeConfig.mapLayers.map((layer: LayerSpecification) => this.addMapLayer(layer)));
    }

    public zoomToCoords(center: LngLatLike, zoom: number = 18): mapboxgl.Map {
        return this.#zone.runOutsideAngular(() => this.mapInstance.flyTo({ center, zoom }));
    }

    public destroyMap(): void {
        if (this.mapInstance) {
            this.mapInstance.remove();
        }
    }

    private hookEvents(): void {
        this.mapInstance.on('load', () => {
            this.addEPCPatterns()
                .pipe(
                    switchMap(() => this.addLayers()),
                    switchMap(() => this.addTerrainLayer()),
                    finalize(() => {
                        this.mapLoaded.next(true);
                        this.mapLoaded.complete();
                    }),
                )
                .subscribe();
        });
    }

    public addDrawControl(): MapboxDraw {
        const styles = [
            // ACTIVE (being drawn)
            // line stroke
            {
                id: 'gl-draw-line',
                type: 'line',
                filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round',
                },
                paint: {
                    'line-color': '#3bb2d0',
                    'line-dasharray': [0.2, 2],
                    'line-width': 2,
                },
            },
            // polygon fill
            {
                id: 'gl-draw-polygon-fill',
                type: 'fill',
                filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                paint: {
                    'fill-color': '#3bb2d0',
                    'fill-outline-color': '#3bb2d0',
                    'fill-opacity': 0.1,
                },
            },
            // polygon mid points
            {
                id: 'gl-draw-polygon-midpoint',
                type: 'circle',
                filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
                paint: {
                    'circle-radius': 3,
                    'circle-color': '#3bb2d0',
                },
            },
            // polygon outline stroke while drawing
            {
                id: 'gl-draw-polygon-stroke-active',
                type: 'line',
                filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round',
                },
                paint: {
                    'line-color': '#3bb2d0',
                    'line-dasharray': [0.2, 2],
                    'line-width': 2,
                },
            },
            // polygon outline stroke draw complete
            {
                id: 'gl-draw-polygon-stroke-inactive',
                type: 'line',
                filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round',
                },
                paint: {
                    'line-color': '#3bb2d0',
                    'line-width': 2,
                },
            },
            // vertex point halos
            {
                id: 'gl-draw-polygon-and-line-vertex-halo-active',
                type: 'circle',
                filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#FFF',
                },
            },
            // vertex points
            {
                id: 'gl-draw-polygon-and-line-vertex-active',
                type: 'circle',
                filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
                paint: {
                    'circle-radius': 3,
                    'circle-color': '#3bb2d0',
                },
            },
        ];
        this.drawControl = new MapboxDraw({
            displayControlsDefault: false,
            styles,
        });

        this.mapInstance.addControl(this.drawControl, 'top-right');
        return this.drawControl;
    }

    private addEPCPatterns(): Observable<void[]> {
        const { epcColours, epcColoursCD } = this.#runtimeConfig;

        /**
         * Combine the epcColours and epcColoursCD
         * objects into a single object and get the
         * selected colour from the map layer config.
         */
        const layer: Layer = this.#runtimeConfig.mapLayers.find((layer) => layer.id === 'OS/TopographicArea_2/Building/1_3D-Single-Dwelling-Selected') as Layer;
        const colors = <Record<string, string>>{
            ...epcColours,
            ...Object.keys(epcColoursCD).reduce((acc, key) => {
                return { ...acc, [`cb-${key}`]: epcColoursCD[key] };
            }, {}),
            selected: (layer?.paint as unknown as { 'fill-extrusion-color': string } | undefined)?.['fill-extrusion-color'] ?? '#CCCCCC',
        };

        const imageLoad = (pattern: string): Observable<ImageBitmap | ImageData | HTMLImageElement> =>
            new Observable((observer) => {
                this.mapInstance.loadImage(pattern, (error, success) => {
                    if (error) {
                        throw error;
                    }

                    if (!success) {
                        throw new Error(`Failed to create ${pattern}`);
                    }

                    observer.next(success);
                    observer.complete();
                });
            });

        const mapImages = Object.keys(colors).map((color) =>
            from(this.rasterizePattern(colors[color])).pipe(
                catchError((error) => {
                    console.error('error rasterizing pattern', error);
                    return EMPTY;
                }),
                switchMap((rasterizedPattern) => imageLoad(rasterizedPattern)),
                map((result) => this.addMapImage(`${color.toLowerCase()}-pattern`, result as HTMLImageElement)),
                catchError((e) => {
                    console.log(e);
                    return of();
                }),
            ),
        );

        /** Rasterize each pattern and add it to the map */
        return forkJoin(mapImages);
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
            function contrastColor(epcColor: string, lightColor: string, darkColor: string): string {
                const color = epcColor.startsWith('#') ? epcColor.substring(1, 7) : epcColor;
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
            circle.setAttribute('fill', contrastColor(epcColor, '#FFFFFF', '#000000'));
            svg.appendChild(circle);

            return svg;
        }

        /** Rasterize SVG to base64 string */
        const rasterizeSvgBase64String = (svgBase64: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                /** Create image element and set the src to the svg base64 string */
                const img = document.createElement('img');
                img.src = `data:image/svg+xml;base64,${svgBase64}`;

                /**
                 * When the image has loaded, draw it to a canvas
                 * then resolve the data url of the which can be
                 * used as a mapbox image.
                 */
                img.onload = (): void => {
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = canvas.width;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    try {
                        const data = canvas.toDataURL('image/png');
                        resolve(data);
                    } catch {
                        reject(new Error('Failed to create canvas'));
                    }
                };
                img.onerror = (): void => reject(new Error('Failed to load image'));
            });
        };

        /** Generate SVG, convert to base64 string, then rasterize to image data */
        const svg = genSVG(epcColor);
        const svgBase64 = document.defaultView?.btoa(svg.outerHTML);
        const imageData = rasterizeSvgBase64String(svgBase64 ?? '');

        return imageData;
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
