import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LegendComponent } from '@components/legend/legend.component';
import { MapLayerConfig } from '@core/models/map-layer-config.model';
import { MinimapData } from '@core/models/minimap-data.model';
import { URLStateModel } from '@core/models/url-state.model';
import { MapService } from '@core/services/map.service';
import { SETTINGS, SettingsService } from '@core/services/settings.service';
import { UtilService } from '@core/services/utils.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { FeatureCollection, GeoJsonProperties, Geometry, Polygon } from 'geojson';
import { AnyLayer, FillLayerSpecification, MapboxGeoJSONFeature, MapLayerMouseEvent, Popup, SourceSpecification } from 'mapbox-gl';
import { skip, Subscription, tap } from 'rxjs';

@Component({
    selector: 'c477-map',
    imports: [CommonModule, LegendComponent, MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: './map.component.html',
    styleUrl: './map.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {
    #settings = inject(SettingsService);
    #mapService = inject(MapService);
    #runtimeConfig = inject(RUNTIME_CONFIGURATION);
    #utilsService = inject(UtilService);

    public bearing: number = 0;
    public drawActive: boolean = false;
    public showLegend: boolean = false;
    public twoDimensions: boolean = false;

    private theme = this.#settings.get(SETTINGS.Theme);
    private colorBlindMode$ = toObservable(this.#settings.get(SETTINGS.ColorBlindMode)).pipe(takeUntilDestroyed());
    private drawControl!: MapboxDraw;
    private mapSubscription!: Subscription;
    private epcColours = this.#runtimeConfig.epcColours;
    private wardPopup = new Popup();

    @Input() public mapConfig!: URLStateModel | undefined;
    @Input() public contextData: FeatureCollection<Geometry, GeoJsonProperties>[] | undefined | null;
    @Input() public spatialFilterEnabled: boolean = false;

    @Output() public resetMapView: EventEmitter<null> = new EventEmitter<null>();
    @Output() public resetNorth: EventEmitter<null> = new EventEmitter<null>();
    @Output() public tilt2D: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() public zoomIn: EventEmitter<null> = new EventEmitter<null>();
    @Output() public zoomOut: EventEmitter<null> = new EventEmitter<null>();
    @Output() public deleteSpatialFilter: EventEmitter<null> = new EventEmitter<null>();
    @Output() public setSearchArea: EventEmitter<GeoJSON.Feature<Polygon>> = new EventEmitter<GeoJSON.Feature<Polygon>>();
    @Output() public setSelectedBuildingTOID: EventEmitter<string | null> = new EventEmitter<string | null>();
    @Output() public setRouteParams: EventEmitter<URLStateModel> = new EventEmitter<URLStateModel>();
    @Output() public setMinimapData: EventEmitter<MinimapData> = new EventEmitter<MinimapData>();
    @Output() public toggleMinimap: EventEmitter<null> = new EventEmitter<null>();
    @Output() public downloadAddresses: EventEmitter<null> = new EventEmitter<null>();

    public theme$ = toObservable(this.theme).pipe(takeUntilDestroyed());

    /** on map loaded, setup layers, controls etc */
    constructor() {
        this.mapSubscription = this.#mapService.mapLoaded$
            .pipe(
                tap(() => {
                    this.initMapEvents();
                    this.updateMinimap();
                }),
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

    get mapInstance(): mapboxgl.Map {
        return this.#mapService.mapInstance;
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.contextData && changes.contextData.currentValue) {
            this.addContextLayers();
            /**
             * add draw controls last so the draw layers are above
             * all other layers
             */
            this.addControls();
        }
    }

    public ngAfterViewInit(): void {
        if (this.#runtimeConfig.map.style) {
            const theme = this.theme();
            const style = this.#runtimeConfig.map.style[theme];
            const { bearing, zoom, pitch } = this.mapConfig!;
            const config: URLStateModel = {
                center: [this.mapConfig!.center[0], this.mapConfig!.center[1]],
                style: style,
                bearing,
                zoom,
                pitch,
            };
            this.#mapService.setup(config);
        }
        /* skip first value as we've already set the map style based on theme */
        this.theme$.pipe(skip(1)).subscribe((theme) => {
            this.#mapService.setStyle(this.#runtimeConfig.map.style[theme]);
        });
    }

    public ngOnDestroy(): void {
        this.#mapService.destroyMap();
        this.mapSubscription.unsubscribe();
    }

    /**
     * Map event listeners
     */
    private initMapEvents(): void {
        /* If the map style changes, re-add layers */
        this.#mapService.mapInstance.on('style.load', () => this.#mapService.addLayers());
        /** Spatial search events */
        this.#mapService.mapInstance.on('draw.create', this.onDrawCreate);
        this.#mapService.mapInstance.on('draw.update', this.onDrawUpdate);
        /** Select building event */
        this.#mapService.mapInstance.on('click', 'OS/TopographicArea_2/Building/1_3D-Single-Dwelling', this.setSelectedTOID);
        this.#mapService.mapInstance.on('click', 'OS/TopographicArea_2/Building/1_3D-Multi-Dwelling', this.setSelectedTOID);
        /** Change mouse cursor on building hover */
        this.#mapService.mapInstance.on('mouseenter', 'OS/TopographicArea_2/Building/1_3D-Single-Dwelling', () => {
            if (this.drawControl.getMode() !== 'draw_polygon') {
                this.#mapService.mapInstance.getCanvas().style.cursor = 'pointer';
            }
        });
        this.#mapService.mapInstance.on('mouseenter', 'OS/TopographicArea_2/Building/1_3D-Multi-Dwelling', () => {
            if (this.drawControl.getMode() !== 'draw_polygon') {
                this.#mapService.mapInstance.getCanvas().style.cursor = 'pointer';
            }
        });
        /** Remove mouse cursor when hovering off a building */
        this.#mapService.mapInstance.on(
            'mouseleave',
            'OS/TopographicArea_2/Building/1_3D-Single-Dwelling',
            () => (this.#mapService.mapInstance.getCanvas().style.cursor = ''),
        );
        this.#mapService.mapInstance.on(
            'mouseleave',
            'OS/TopographicArea_2/Building/1_3D-Multi-Dwelling',
            () => (this.#mapService.mapInstance.getCanvas().style.cursor = ''),
        );
        /** Get map state whenever the map is moved */
        this.#mapService.mapInstance.on('moveend', () => {
            this.setRouterParams();
        });

        /** wards layer click */
        this.#mapService.mapInstance.on('click', 'wards', (e: MapLayerMouseEvent) => {
            /** check if the active draw layer is being clicked */
            const features: MapboxGeoJSONFeature[] = this.#mapService.mapInstance
                .queryRenderedFeatures(e.point)
                .filter((feature: MapboxGeoJSONFeature) => feature.source === 'mapbox-gl-draw-hot');
            /** display popup if active draw layer is not being clicked */
            if (features.length === 0) {
                if (this.drawControl.getMode() !== 'draw_polygon') {
                    this.wardsLayerClick(e);
                }
            }
        });

        this.#mapService.mapInstance.on('mouseenter', 'wards', () => {
            if (this.drawControl.getMode() !== 'draw_polygon') {
                this.#mapService.mapInstance.getCanvas().style.cursor = 'pointer';
            }
        });

        this.#mapService.mapInstance.on('mouseleave', 'wards', () => {
            if (this.drawControl.getMode() !== 'draw_polygon') {
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
        this.#mapService.addDrawControl();
        this.drawControl = this.#mapService.drawControl;
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
        this.drawControl.changeMode(mode);
    }

    public changeDimensions(): void {
        this.twoDimensions = !this.twoDimensions;
        this.tilt2D.emit(this.twoDimensions);
    }

    private deleteSearchArea(): void {
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
    private onDrawCreate = (e: MapboxDraw.DrawCreateEvent): void => {
        this.drawActive = false;
        this.setSearchArea.emit(e.features[0] as GeoJSON.Feature<Polygon>);
    };

    /**
     * Set search area when an existing search area updated (moved)
     * @param e Mapbox draw update event
     */
    private onDrawUpdate = (e: MapboxDraw.DrawUpdateEvent): void => {
        this.setSearchArea.emit(e.features[0] as GeoJSON.Feature<Polygon>);
    };

    private updateMinimap(): void {
        this.bearing = this.#mapService.mapInstance.getBearing();
        this.setMinimapData.emit({
            position: this.#mapService.mapInstance.getFreeCameraOptions().position!.toLngLat(),
            bearing: this.#mapService.mapInstance.getBearing(),
        });
    }

    private setSelectedTOID = (e: MapLayerMouseEvent): void => {
        if (e.features && this.drawControl.getMode() !== 'draw_polygon') {
            this.setSelectedBuildingTOID.emit(e.features![0].properties!.TOID);
        }
    };

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

    private wardsLayerClick(e: MapLayerMouseEvent): void {
        if (e.features?.length) {
            /** highlight selected ward */
            this.#mapService.filterMapLayer({
                layerId: 'wards-selected',
                expression: ['==', 'WD23NM', `${e.features[0].properties!.WD23NM}`],
            });
            const properties = e.features[0].properties;
            /** extract ratings from properties */
            const epcRatings = Object.keys(properties!)
                .filter((k) => !isNaN(properties![k]))
                .map((k) => {
                    return {
                        rating: k,
                        count: properties![k],
                    };
                })
                .sort((a, b) => a.rating.localeCompare(b.rating));
            const histogram = this.#utilsService.createHistogram(epcRatings);
            const popupContent = `
                <div class="popupContent">
                    <h1>${e.features[0].properties!.WD23NM}</h1>
                    ${histogram}
                    <p class="disclaimer">*Mix of domestic and commercial buildings. Excluded from ward visualisation.</p>
                </div>
            `;
            this.wardPopup.setLngLat(e.lngLat).setMaxWidth('none').setHTML(popupContent).addTo(this.#mapService.mapInstance);
        }
    }

    /**
     * Add context layers to map
     */
    private addContextLayers(): void {
        if (this.contextData) {
            this.#runtimeConfig.contextLayers.forEach((config: MapLayerConfig) => {
                const data = this.contextData?.find(
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
    }

    /**
     * update context layer paint when color blind mode changes
     */
    private updateLayerPaint(): void {
        if (!this.#mapService.mapInstance) return;
        this.#runtimeConfig.contextLayers.forEach((config: MapLayerConfig) => {
            const lyr = this.#mapService.mapInstance.getLayer(config.id);
            if (lyr && config.type !== 'line') {
                const paint = this.getWardLayerPaint();
                this.#mapService.mapInstance.setPaintProperty(lyr.id, 'fill-color', paint['fill-color']);
            }
        });
    }

    private getWardLayerPaint(): NonNullable<FillLayerSpecification['paint']> {
        const EPCRatings = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'none'];
        const defaultColor = this.epcColours['default'];
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
