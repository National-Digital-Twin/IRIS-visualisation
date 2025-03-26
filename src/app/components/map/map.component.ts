import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, effect, inject, input, InputSignal, OnDestroy, output, OutputEmitterRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipModule } from '@angular/material/tooltip';
import { LegendComponent } from '@components/legend/legend.component';
import { DataService } from '@core/services/data.service';
import { MapLayerConfig } from '@core/models/map-layer-config.model';
import { MinimapData } from '@core/models/minimap-data.model';
import { URLStateModel } from '@core/models/url-state.model';
import { MapService } from '@core/services/map.service';
import { SETTINGS, SettingsService } from '@core/services/settings.service';
import { UtilService } from '@core/services/utils.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { FeatureCollection, GeoJsonProperties, Geometry, Polygon } from 'geojson';
import { AnyLayer, FillLayerSpecification, GeoJSONFeature, MapMouseEvent, Popup, SourceSpecification } from 'mapbox-gl';
import { map, skip, take } from 'rxjs';

@Component({
    selector: 'c477-map',
    imports: [CommonModule, LegendComponent, MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: './map.component.html',
    styleUrl: './map.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: { position: 'before' } }],
})
export class MapComponent implements AfterViewInit, OnDestroy {
    readonly #settings = inject(SettingsService);
    readonly #mapService = inject(MapService);
    readonly #runtimeConfig = inject(RUNTIME_CONFIGURATION);
    readonly #utilsService = inject(UtilService);
    readonly #dataService = inject(DataService);

    public bearing: number = 0;
    public drawActive: boolean = false;
    public showLegend: boolean = false;
    public twoDimensions: boolean = false;

    private drawControl?: MapboxDraw;
    private readonly wardPopup = new Popup();

    public mapConfig: InputSignal<URLStateModel> = input.required();
    public spatialFilterEnabled: InputSignal<boolean> = input(false);
    public contextData: InputSignal<FeatureCollection<Geometry, GeoJsonProperties>[]> = input.required();

    public resetMapView: OutputEmitterRef<null> = output();
    public resetNorth: OutputEmitterRef<null> = output();
    public tilt2D: OutputEmitterRef<boolean> = output();
    public zoomIn: OutputEmitterRef<null> = output();
    public zoomOut: OutputEmitterRef<null> = output();
    public deleteSpatialFilter: OutputEmitterRef<null> = output();
    public setSearchArea: OutputEmitterRef<GeoJSON.Feature<Polygon>> = output();
    public setSelectedBuildingTOID: OutputEmitterRef<string | null> = output();
    public setRouteParams: OutputEmitterRef<URLStateModel> = output();
    public setMinimapData: OutputEmitterRef<MinimapData> = output();
    public toggleMinimap: OutputEmitterRef<null> = output();
    public downloadAddresses: OutputEmitterRef<null> = output();

    public readonly theme$ = toObservable(this.#settings.get(SETTINGS.Theme)).pipe(takeUntilDestroyed());
    private readonly colorBlindMode$ = toObservable(this.#settings.get(SETTINGS.ColorBlindMode)).pipe(takeUntilDestroyed());

    /** on map loaded, setup layers, controls etc */
    constructor() {
        this.#mapService.mapLoaded$
            .pipe(
                map(() => {
                    this.initMapEvents();
                    this.updateMinimap();
                }),
                takeUntilDestroyed(),
            )
            .subscribe();

        /** update context layer colors when color blind mode changes */
        this.colorBlindMode$.subscribe({
            next: () => {
                this.wardPopup.remove();
                this.updateLayerPaint();
            },
        });

        effect(() => {
            const contextData = this.contextData();

            if (contextData.length) {
                this.addContextLayers(contextData);
                this.addControls();
            }
        });
    }

    get mapInstance(): mapboxgl.Map {
        return this.#mapService.mapInstance;
    }

    public ngAfterViewInit(): void {
        if (this.#runtimeConfig.map.style) {
            const theme = this.#settings.get(SETTINGS.Theme);
            const style = this.#runtimeConfig.map.style[theme()];
            const { bearing, zoom, pitch, center } = this.mapConfig();
            const config: URLStateModel = { bearing, center, pitch, style, zoom };
            this.#mapService.setup(config);
        }
        /* skip first value as we've already set the map style based on theme */
        this.theme$.pipe(skip(1)).subscribe((theme) => {
            this.#mapService.setStyle(this.#runtimeConfig.map.style[theme]);
        });
    }

    public ngOnDestroy(): void {
        this.#mapService.destroyMap();
    }

    /**
     * Map event listeners
     */
    private initMapEvents(): void {
        this.#mapService.mapInstance.on('error', (error) => console.log('[MAP]', 'Map Error', { error }));
        this.#mapService.mapInstance.on('styleimagemissing', (error) => console.log('[MAP]', 'Image Missing', { error }));

        /* If the map style changes, re-add layers */
        this.#mapService.mapInstance.on('style.load', () => this.#mapService.addLayers().pipe(take(1)).subscribe());

        /** Spatial search events */
        this.#mapService.mapInstance.on('draw.create', this.onDrawCreate.bind(this));
        this.#mapService.mapInstance.on('draw.update', this.onDrawUpdate.bind(this));

        /** Select building event */
        this.#mapService.mapInstance.on(
            'click',
            ['OS/TopographicArea_2/Building/1_3D-Single-Dwelling', 'OS/TopographicArea_2/Building/1_3D-Multi-Dwelling'],
            (e: MapMouseEvent) => this.setSelectedTOID(e),
        );

        /** Change mouse cursor on building hover */
        this.#mapService.mapInstance.on(
            'mouseenter',
            ['OS/TopographicArea_2/Building/1_3D-Single-Dwelling', 'OS/TopographicArea_2/Building/1_3D-Multi-Dwelling'],
            () => {
                if (this.drawControl?.getMode() !== 'draw_polygon') {
                    this.#mapService.mapInstance.getCanvas().style.cursor = 'pointer';
                }
            },
        );

        /** Remove mouse cursor when hovering off a building */
        this.#mapService.mapInstance.on(
            'mouseleave',
            ['OS/TopographicArea_2/Building/1_3D-Single-Dwelling', 'OS/TopographicArea_2/Building/1_3D-Multi-Dwelling'],
            () => (this.#mapService.mapInstance.getCanvas().style.cursor = ''),
        );

        /** Get map state whenever the map is moved */
        this.#mapService.mapInstance.on('moveend', () => {
            this.setRouterParams();

            // Get current viewport bounds
            const bounds = this.#mapService.mapInstance.getBounds();
            if (bounds) {
                const viewport = {
                    minLat: bounds.getSouth(),
                    maxLat: bounds.getNorth(),
                    minLng: bounds.getWest(),
                    maxLng: bounds.getEast()
                };

                // Only load data when buildings become 3D models
                const zoom = this.#mapService.mapInstance.getZoom();
                if (zoom >= 16) {
                    this.#dataService.loadBuildingsForViewport(viewport).subscribe({
                        next: () => {
                            // After loading, make sure the util service refreshes the colors
                            this.#utilsService.createBuildingColourFilter();
                        },
                        error: (err) => {
                            console.error('Error loading buildings for viewport:', err);
                            this.#dataService.viewportBuildingsLoading.set(false);
                        }
                    });
                }
            }
        });

        /** wards layer click */
        this.#mapService.mapInstance.on('click', 'wards', (e: MapMouseEvent) => {
            /** check if the active draw layer is being clicked */
            const features: GeoJSONFeature[] = this.#mapService.mapInstance
                .queryRenderedFeatures(e.point)
                .filter((feature: GeoJSONFeature) => feature.source === 'mapbox-gl-draw-hot');
            /** display popup if active draw layer is not being clicked */
            if (features.length === 0) {
                if (this.drawControl?.getMode() !== 'draw_polygon') {
                    this.wardsLayerClick(e);
                }
            }
        });

        this.#mapService.mapInstance.on('mouseenter', 'wards', () => {
            if (this.drawControl?.getMode() !== 'draw_polygon') {
                this.#mapService.mapInstance.getCanvas().style.cursor = 'pointer';
            }
        });

        this.#mapService.mapInstance.on('mouseleave', 'wards', () => {
            if (this.drawControl?.getMode() !== 'draw_polygon') {
                this.#mapService.mapInstance.getCanvas().style.cursor = '';
            }
        });

        /** update the minimap as the map moves */
        this.#mapService.mapInstance.on('move', () => {
            this.updateMinimap();
        });

        /** close popup if open and zoom is > 15 and remove selection*/
        this.#mapService.mapInstance.on('zoomend', () => {
            const zoom = this.#mapService.mapInstance.getZoom();
            if (zoom >= 15 && this.wardPopup.isOpen()) {
                this.wardPopup.remove();
                this.#mapService.filterMapLayer({
                    layerId: 'wards-selected',
                    expression: ['==', 'WD23NM', ``],
                });
            }
        });

        this.wardPopup.on('close', () => {
            this.#mapService.filterMapLayer({
                layerId: 'wards-selected',
                expression: ['==', 'WD23NM', ``],
            });
        });
    }

    /**
     * Add draw tool to the map
     */
    private addControls(): void {
        /** add draw control to map instance */
        this.drawControl = this.#mapService.addDrawControl();
    }

    public setDrawMode(mode: string): void {
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

    private updateMode(mode: string): void {
        this.drawControl?.changeMode(mode);
    }

    public changeDimensions(): void {
        this.twoDimensions = !this.twoDimensions;
        this.tilt2D.emit(this.twoDimensions);
    }

    private deleteSearchArea(): void {
        this.drawActive = false;
        // delete search geom
        this.drawControl?.deleteAll();
        // reset building colour to entire map
        // by updating map bounds to trigger
        // filter
        this.deleteSpatialFilter.emit(null);
    }

    /**
     * Set search area when a search area is drawn
     * @param e Mapbox draw create event
     */
    private onDrawCreate(e: MapboxDraw.DrawCreateEvent): void {
        this.drawActive = false;
        this.setSearchArea.emit(e.features[0] as GeoJSON.Feature<Polygon>);
    }

    /**
     * Set search area when an existing search area updated (moved)
     * @param e Mapbox draw update event
     */
    private onDrawUpdate(e: MapboxDraw.DrawUpdateEvent): void {
        this.setSearchArea.emit(e.features[0] as GeoJSON.Feature<Polygon>);
    }

    private updateMinimap(): void {
        this.bearing = this.#mapService.mapInstance.getBearing();
        this.setMinimapData.emit({
            position: this.#mapService.mapInstance.getFreeCameraOptions().position!.toLngLat(),
            bearing: this.#mapService.mapInstance.getBearing(),
        });
    }

    private setSelectedTOID(e: MapMouseEvent): void {
        if (e.features && this.drawControl?.getMode() !== 'draw_polygon') {
            this.setSelectedBuildingTOID.emit(e.features![0].properties!.TOID);
        }
    }

    private setRouterParams(): void {
        const zoom = this.#mapService.mapInstance.getZoom();
        const pitch = this.#mapService.mapInstance.getPitch();
        const bearing = this.#mapService.mapInstance.getBearing();
        const { lng, lat } = this.#mapService.mapInstance.getCenter();
        const mapConfig: URLStateModel = {
            bearing,
            center: [lng, lat],
            pitch,
            zoom,
        };
        this.setRouteParams.emit(mapConfig);
    }

    private wardsLayerClick(e: MapMouseEvent): void {
        if (e.features?.length) {
            /** highlight selected ward */
            this.#mapService.filterMapLayer({
                layerId: 'wards-selected',
                expression: ['==', 'WD23NM', `${e.features[0].properties!.WD23NM}`],
            });

            const properties = e.features[0].properties as Record<string, number>;

            /** extract ratings from properties */
            const epcRatings = Object.keys(properties)
                .filter((k) => !isNaN(properties[k]))
                .map((k) => ({ rating: k, count: properties[k] }))
                .sort((a, b) => a.rating.localeCompare(b.rating));

            const histogram = this.#utilsService.createHistogram(epcRatings);

            const popupContent = `
                <div class="popup">
                    <h3>${e.features[0].properties!.WD23NM}</h3>
                    ${histogram}
                    <p class="footnote">* Mix of domestic and commercial buildings. Excluded from ward visualisation.</p>
                </div>
            `;

            this.wardPopup.setLngLat(e.lngLat).setMaxWidth('none').setHTML(popupContent).addTo(this.#mapService.mapInstance);
        }
    }

    /**
     * Add context layers to map
     */
    private addContextLayers(contextData: FeatureCollection<Geometry, GeoJsonProperties>[]): void {
        this.#runtimeConfig.contextLayers.map((config: MapLayerConfig) => {
            const data = contextData.find(
                /**
                 * find matching source data, ignore 'selected' part
                 * of layer id
                 */
                // eslint-disable-next-line
                // @ts-ignore
                (d: unknown) => d.name === config.id.split('-')[0],
            );
            const geojsonSource: SourceSpecification = {
                type: 'geojson',
                data,
            };
            this.#mapService.addMapSource(config.id, geojsonSource);

            const paint = this.getWardLayerPaint();

            const newConfig = {
                ...config,
                paint: {
                    ...paint,
                    ...config.paint,
                },
            } as AnyLayer;
            this.#mapService.addMapLayer(newConfig);
        });
    }

    /**
     * update context layer paint when color blind mode changes
     */
    private updateLayerPaint(): void {
        if (!this.#mapService.mapInstance) return;
        this.#runtimeConfig.contextLayers.map((config: MapLayerConfig) => {
            const lyr = this.#mapService.mapInstance.getLayer(config.id);
            if (lyr && config.type !== 'line') {
                const paint = this.getWardLayerPaint();
                this.#mapService.mapInstance.setPaintProperty(lyr.id, 'fill-color', paint['fill-color']);
            }
        });
    }

    private getWardLayerPaint(): NonNullable<FillLayerSpecification['paint']> {
        const EPCRatings = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'none'];
        const defaultColor = this.#runtimeConfig.epcColours['default'];
        const colors: string[] = [];

        EPCRatings.forEach((rating: string) => {
            colors.push(rating);
            const color = this.#utilsService.getEPCColour(rating);
            colors.push(color);
        });
        colors.push(defaultColor);

        const paint: NonNullable<FillLayerSpecification['paint']> = {
            'fill-color': ['match', ['get', 'aggEPC'], ...colors],
        };

        return paint;
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
