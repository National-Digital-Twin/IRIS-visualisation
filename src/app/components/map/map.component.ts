import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    HostListener,
    inject,
    input,
    InputSignal,
    OnDestroy,
    output,
    OutputEmitterRef,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipModule } from '@angular/material/tooltip';
import { LayerState, LegendComponent } from '@components/legend/legend.component';
import { MinimapData } from '@core/models/minimap-data.model';
import { URLStateModel } from '@core/models/url-state.model';
import { DataService } from '@core/services/data.service';
import { FilterableBuildingService } from '@core/services/filterable-building.service';
import { LayerFactoryService } from '@core/services/layers/layer-factory.service';
import { MAP_SERVICE, MapDraw } from '@core/services/map.token';
import { SETTINGS, SettingsService } from '@core/services/settings.service';
import { UiStateService } from '@core/services/ui-state.service';
import { UtilService } from '@core/services/utils.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { environment } from '@environment';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Polygon } from 'geojson';
import * as mapboxgl from 'mapbox-gl';
import { MapMouseEvent } from 'mapbox-gl';
import { map, skip, take } from 'rxjs';

@Component({
    selector: 'c477-map',
    imports: [CommonModule, LegendComponent, MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule, MatTooltipModule],
    templateUrl: './map.component.html',
    styleUrl: './map.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: { position: 'before' } }],
})
export class MapComponent implements AfterViewInit, OnDestroy {
    readonly #settings = inject(SettingsService);
    readonly #mapService = inject(MAP_SERVICE);
    readonly #runtimeConfig = inject(RUNTIME_CONFIGURATION);
    readonly #utilsService = inject(UtilService);
    readonly #dataService = inject(DataService);
    readonly #filterableBuildingService = inject(FilterableBuildingService);
    readonly #layerFactory = inject(LayerFactoryService);
    readonly #uiStateService = inject(UiStateService);
    readonly #elementRef = inject(ElementRef);

    public bearing: number = 0;
    public drawActive: boolean = false;
    public twoDimensions: boolean = false;

    public layersMenuOpen: boolean = false;
    public layerStates: LayerState = this.getDefaultLayerState();

    public showLegend = computed(() => this.#uiStateService.showLegend());
    public showLayersAndControls = computed(() => this.#uiStateService.showLayersAndControls());

    public legendLayerState = computed(() => {
        if (this.showLayersAndControls()) {
            return this.layerStates;
        }

        return this.getDefaultLayerState();
    });

    private getDefaultLayerState(): LayerState {
        return {
            epc: {
                region: false,
                county: false,
                district: false,
                ward: false,
            },
            windDrivenRain: {
                twoDegree: false,
                fourDegree: false,
            },
            icingDays: false,
            hotSummerDays: false,
        };
    }

    public toggleLegend(): void {
        this.#uiStateService.toggleLegend();
    }

    public get activeLayersCount(): number {
        return this.#layerFactory.getVisibleLayers().length;
    }

    private drawControl?: MapDraw;

    public mapConfig: InputSignal<URLStateModel> = input.required();
    public spatialFilterEnabled: InputSignal<boolean> = input(false);
    public filtersExist: InputSignal<boolean> = input.required();

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

        this.#mapService.mapLoaded$
            .pipe(
                take(1),
                map(() => this.addControls()),
                takeUntilDestroyed(),
            )
            .subscribe();
    }

    get mapInstance(): mapboxgl.Map {
        return this.#mapService.mapInstance;
    }

    public ngAfterViewInit(): void {
        if (this.#runtimeConfig.map.style) {
            const theme = this.#settings.get(SETTINGS.Theme);
            const configStyle = this.#runtimeConfig.map.style[theme()];
            const style = configStyle.includes('maptiler') ? `${configStyle}?key=${environment.maptiler.apiKey}` : configStyle;
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
        this.#mapService.mapInstance.on('error', (error: Error) => console.log('[MAP]', 'Map Error', { error }));
        this.#mapService.mapInstance.on('styleimagemissing', (error: Error) => console.log('[MAP]', 'Image Missing', { error }));

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

            // Load buildings for the current viewport
            this.loadBuildingsForCurrentViewport();
        });

        /** Load initial data if map renders at a high zoom level */
        this.#mapService.mapInstance.once('idle', () => {
            // Load buildings for the initial viewport
            this.loadBuildingsForCurrentViewport();

            // Set initial layer controls and layer visibility based on initial zoom level
            const initialZoom = this.#mapService.mapInstance.getZoom();
            this.#uiStateService.setLayersAndControlsVisibility(initialZoom < 16);
            this.updateLayersVisibility();
        });

        /** update the minimap as the map moves */
        this.#mapService.mapInstance.on('move', () => {
            this.updateMinimap();
        });

        /** close popup if open and zoom is > 15 and remove selection*/
        this.#mapService.mapInstance.on('zoomend', () => {
            const zoom = this.#mapService.mapInstance.getZoom();

            if (zoom < 16) {
                this.#dataService.clearBuildingsCache();
            }
            this.#uiStateService.setLayersAndControlsVisibility(zoom < 16);
            this.updateLayersVisibility();
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

    public toggleEpcLayer(type: 'region' | 'county' | 'district' | 'ward'): void {
        const layerId = `epc-${type}-layer`;
        const layer = this.#layerFactory.getLayer(layerId);

        if (layer) {
            if (this.layerStates.epc[type]) {
                layer.hide();
                this.hideOutlineLayer(`${layerId}-outline`);
                this.layerStates.epc[type] = false;
            } else {
                this.hideAllLayers();
                layer.show();
                this.layerStates.epc[type] = true;
            }
            this.updateLayersVisibility();
        }
    }

    public toggleWindDrivenRainLayer(type: 'twoDegree' | 'fourDegree'): void {
        const layerId = `wind-driven-rain-${type}-layer`;
        const layer = this.#layerFactory.getLayer(layerId);

        if (layer) {
            if (this.layerStates.windDrivenRain[type]) {
                layer.hide();
                this.hideOutlineLayer(`${layerId}-outline`);
                this.layerStates.windDrivenRain[type] = false;
            } else {
                this.hideAllLayers();
                layer.show();
                this.layerStates.windDrivenRain[type] = true;
            }
            this.updateLayersVisibility();
        }
    }

    public toggleIcingDaysLayer(): void {
        const layerId = 'icing-days-layer';
        const layer = this.#layerFactory.getLayer(layerId);

        if (layer) {
            if (this.layerStates.icingDays) {
                layer.hide();
                this.hideOutlineLayer(`${layerId}-outline`);
                this.layerStates.icingDays = false;
            } else {
                this.hideAllLayers();
                layer.show();
                this.layerStates.icingDays = true;
            }
            this.updateLayersVisibility();
        }
    }

    public toggleHotSummerDaysLayer(): void {
        const layerId = 'hot-summer-days-layer';
        const layer = this.#layerFactory.getLayer(layerId);

        if (layer) {
            if (this.layerStates.hotSummerDays) {
                layer.hide();
                this.hideOutlineLayer(`${layerId}-outline`);
                this.layerStates.hotSummerDays = false;
            } else {
                this.hideAllLayers();
                layer.show();
                this.layerStates.hotSummerDays = true;
            }
            this.updateLayersVisibility();
        }
    }

    private hideAllLayers(): void {
        this.hideLayerGroup(this.layerStates.epc, 'epc', '-layer');
        this.hideLayerGroup(this.layerStates.epc, 'epc', '-layer-outline');
        this.hideLayerGroup(this.layerStates.windDrivenRain, 'wind-driven-rain', '-layer');
        this.hideLayerGroup(this.layerStates.windDrivenRain, 'wind-driven-rain', '-layer-outline');

        const icingDaysLayer = 'icing-days-layer';
        this.hideSingleLayerWithOutline(
            icingDaysLayer,
            `${icingDaysLayer}-outline`,
            () => this.layerStates.icingDays,
            (value) => (this.layerStates.icingDays = value),
        );

        const hotSummerDaysLayer = 'hot-summer-days-layer';
        this.hideSingleLayerWithOutline(
            hotSummerDaysLayer,
            `${hotSummerDaysLayer}-outline`,
            () => this.layerStates.hotSummerDays,
            (value) => (this.layerStates.hotSummerDays = value),
        );
    }

    private hideLayerGroup<T extends Record<string, boolean>>(layerGroup: T, prefix: string, suffix: string): void {
        Object.keys(layerGroup).forEach((type) => {
            const layerId = `${prefix}-${type}${suffix}`;
            const layerFactoryLayer = this.#layerFactory.getLayer(layerId);
            const layerEnabled = layerGroup[type as keyof T];
            if (layerFactoryLayer && layerEnabled) {
                layerFactoryLayer.hide();
            }
            const mapLayer = this.mapInstance.getLayer(layerId);
            if (mapLayer) {
                this.mapInstance.removeLayer(layerId);
            }

            (layerGroup as any)[type] = false;
        });
    }

    private hideSingleLayerWithOutline(layerId: string, outlineLayerId: string, getState: () => boolean, setState: (value: boolean) => void): void {
        if (getState()) {
            const layer = this.#layerFactory.getLayer(layerId);
            if (layer) {
                layer.hide();
            }
            this.hideOutlineLayer(outlineLayerId);
            setState(false);
        }
    }

    private hideOutlineLayer(layerId: string): void {
        const outlineLayer = this.mapInstance.getLayer(layerId);
        if (outlineLayer) {
            this.mapInstance.removeLayer(layerId);
        }
    }

    private deleteSearchArea(): void {
        this.drawActive = false;
        this.drawControl?.deleteAll();
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
            position: this.#mapService.mapInstance.getCenter(),
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
            center: [lat, lng],
            pitch,
            zoom,
        };
        this.setRouteParams.emit(mapConfig);
    }

    /**
     * Load buildings for the current viewport if zoom level is appropriate
     */
    private loadBuildingsForCurrentViewport(): void {
        const bounds = this.#mapService.mapInstance.getBounds();
        if (bounds) {
            const viewport = {
                minLat: bounds.getSouth(),
                maxLat: bounds.getNorth(),
                minLng: bounds.getWest(),
                maxLng: bounds.getEast(),
            };

            // Only load data when buildings become 3D models
            const zoom = this.#mapService.mapInstance.getZoom();
            if (zoom >= 16) {
                this.#dataService.loadBuildingsForViewport(viewport).subscribe({
                    next: () => {
                        // After loading, make sure the util service refreshes the colors
                        this.#utilsService.createBuildingColourFilter();
                    },
                    error: () => {
                        this.#dataService.viewportBuildingsLoading.set(false);
                    },
                });
                this.#filterableBuildingService.loadFilterableBuildingModelsInViewport(viewport).subscribe({
                    next: () => {
                        // After loading, make sure the util service refreshes the colors
                        if (this.filtersExist()) {
                            this.#utilsService.createBuildingColourFilter();
                        }
                    },
                });
            }
        }
    }

    private updateLayersVisibility(): void {
        const shouldShowLayers = this.showLayersAndControls();
        const visibleLayers = this.#layerFactory.getVisibleLayers();

        visibleLayers.forEach((layer) => {
            if (shouldShowLayers) {
                this.#mapService.mapInstance.setLayoutProperty(layer.id, 'visibility', 'visible');
            } else {
                this.#mapService.mapInstance.setLayoutProperty(layer.id, 'visibility', 'none');
            }
        });
    }

    @HostListener('document:click', ['$event'])
    public onDocumentClick(event: Event): void {
        if (this.#uiStateService.showLegend()) {
            const target = event.target as HTMLElement;
            const legendElement = this.#elementRef.nativeElement.querySelector('c477-legend');
            const legendButton = this.#elementRef.nativeElement.querySelector('button[matTooltip="Legend"]');

            if (legendElement && !legendElement.contains(target) && !legendButton?.contains(target)) {
                this.#uiStateService.toggleLegend();
            }
        }
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
