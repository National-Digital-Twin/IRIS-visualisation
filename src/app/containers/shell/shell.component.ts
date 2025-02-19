import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ComponentType } from '@angular/cdk/portal';
import { AsyncPipe, CommonModule, DOCUMENT } from '@angular/common';
import {
    AfterViewInit,
    CUSTOM_ELEMENTS_SCHEMA,
    Component,
    ElementRef,
    Input,
    InputSignal,
    NgZone,
    ViewChild,
    computed,
    effect,
    inject,
    input,
    numberAttribute,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Params, Router } from '@angular/router';
import type { ArcAccessibility, ArcSwitch } from '@arc-web/components';
import type { UserPreferences } from '@arc-web/components/src/components/accessibility/ArcAccessibility';
import '@arc-web/components/src/components/container/arc-container';
import '@arc-web/components/src/components/ph-icon/question/ph-icon-question';
import '@arc-web/components/src/components/switch/arc-switch';
import { DetailsPanelComponent } from '@components/details-panel/details-panel.component';
import { DownloadWarningComponent } from '@components/download-warning/download-warning.component';
import { FlagModalComponent, FlagModalData, FlagModalResult } from '@components/flag-modal/flag.modal.component';
import { InformationComponent } from '@components/information/information.component';
import { LoadingScreenComponent } from '@components/loading-screen/loading-screen.component';
import { MapComponent } from '@components/map/map.component';
import { MinimapComponent } from '@components/minimap/minimap.component';
import { RemoveFlagModalComponent, RemoveFlagModalData, RemoveFlagModalResult } from '@components/remove-flag-modal/remove-flag-modal.component';
import { MainFiltersComponent } from '@containers/main-filters/main-filters.component';
import { ResultsPanelComponent } from '@containers/results-panel/results-panel.component';
import { AdvancedFiltersFormModel, FilterKeys, FilterProps } from '@core/models/advanced-filters.model';
import { BuildingMap, BuildingModel } from '@core/models/building.model';
import { DownloadDataWarningData, DownloadDataWarningResponse } from '@core/models/download-data-warning.model';
import { MinimapData } from '@core/models/minimap-data.model';
import { URLStateModel } from '@core/models/url-state.model';
import { DataDownloadService } from '@core/services/data-download.service';
import { DataService } from '@core/services/data.service';
import { FilterService } from '@core/services/filter.service';
import { MapService } from '@core/services/map.service';
import { SETTINGS, SettingsService } from '@core/services/settings.service';
import { SpatialQueryService } from '@core/services/spatial-query.service';
import { UtilService } from '@core/services/utils.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { FeatureCollection, GeoJsonProperties, Geometry, Polygon } from 'geojson';
import { EMPTY, Observable, combineLatest, filter, first, forkJoin, map, switchMap, take } from 'rxjs';

@Component({
    selector: 'c477-shell',
    imports: [
        CommonModule,
        DetailsPanelComponent,
        LoadingScreenComponent,
        MainFiltersComponent,
        MapComponent,
        MinimapComponent,
        ResultsPanelComponent,
        AsyncPipe,
    ],
    templateUrl: './shell.component.html',
    styleUrl: './shell.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ShellComponent implements AfterViewInit {
    readonly #breakpointObserver = inject(BreakpointObserver);
    readonly #dataDownloadService = inject(DataDownloadService);
    readonly #dataService = inject(DataService);
    readonly #dialog = inject(MatDialog);
    readonly #document = inject(DOCUMENT);
    readonly #filterService = inject(FilterService);
    readonly #mapService = inject(MapService);
    readonly #router = inject(Router);
    readonly #runtimeConfig = inject(RUNTIME_CONFIGURATION);
    readonly #settings = inject(SettingsService);
    readonly #spatialQueryService = inject(SpatialQueryService);
    readonly #utilService = inject(UtilService);
    readonly #zone = inject(NgZone);

    public contextData$: Observable<FeatureCollection<Geometry, GeoJsonProperties>[]>;
    public filterProps?: FilterProps;
    public mapConfig!: URLStateModel;
    public minimapData?: MinimapData;
    public resultsPanelCollapsed: boolean = false;
    public showMinimap: boolean = true;
    public spatialFilterEnabled = this.#spatialQueryService.spatialFilterEnabled;
    public title = 'IRIS';

    // get map state from route query params
    public bearing: InputSignal<number> = input<number, number>(0, { transform: numberAttribute });
    public lat: InputSignal<number> = input<number, number>(0, { transform: numberAttribute });
    public lng: InputSignal<number> = input<number, number>(0, { transform: numberAttribute });
    public pitch: InputSignal<number> = input<number, number>(0, { transform: numberAttribute });
    public zoom: InputSignal<number> = input<number, number>(0, { transform: numberAttribute });

    // get filters from route query params
    @Input() set filter(filter: string) {
        if (filter) {
            this.filterProps = this.#filterService.parseFilterString(filter);
            this.#utilService.setFilters(this.filterProps);
        } else {
            this.#utilService.setFilters({});
            this.closeResults();
        }
    }

    @ViewChild('accessibility') public accessibility?: ElementRef<ArcAccessibility>;
    @ViewChild('colorBlindSwitch') public colorBlindSwitch?: ElementRef<ArcSwitch>;

    public loading = computed(() => this.#dataService.loading());

    public companyLogoSrc = computed(() => {
        const theme = this.#settings.get(SETTINGS.Theme);

        if (!theme()) {
            return '';
        }

        const imageSrc = this.#runtimeConfig.companyLogo[theme()];
        return imageSrc || '';
    });

    constructor() {
        this.contextData$ = combineLatest([this.#dataService.contextData$, toObservable(this.#dataService.buildings)]).pipe(
            map(([contextData, buildingData]) => {
                if (!buildingData) {
                    return [];
                }
                return this.aggregateEPC(contextData, buildingData);
            }),
        );

        // close minimap by default on smaller screens
        if (window.innerWidth < 1280) {
            this.showMinimap = false;
        }

        effect(() => {
            const bearing = this.bearing();
            const pitch = this.pitch();
            const zoom = this.zoom();
            const lat = this.lat();
            const lng = this.lng();
            this.mapConfig = { bearing, pitch, zoom, center: [lat, lng] };

            const loading = this.loading();

            if (loading) {
                return;
            }

            this.#mapService.mapLoaded$
                .pipe(
                    take(1),
                    map(() => this.updateBuildingLayerColour()),
                )
                .subscribe();
        });
    }

    public ngAfterViewInit(): void {
        const colorBlindMode = this.#settings.get(SETTINGS.ColorBlindMode);
        this.setColorBlindMode(colorBlindMode());
        if (this.colorBlindSwitch) {
            this.colorBlindSwitch.nativeElement.checked = colorBlindMode();
        }
    }

    public handleShowAccessibility(event: Event): void {
        event.preventDefault();
        this.accessibility?.nativeElement.show();
    }

    public handleColorBlindSwitchChange(event: Event): void {
        const colorBlindMode = (event.target as HTMLInputElement).checked;
        this.setColorBlindMode(colorBlindMode);
        this.#settings.set(SETTINGS.ColorBlindMode, colorBlindMode);
    }

    public handleAccessibilityChange(event: Event): void {
        type IEvent = CustomEvent<{ preferences: UserPreferences }>;
        let { theme } = (event as IEvent).detail.preferences;
        if (theme === 'auto') {
            const { matches } = window.matchMedia('(prefers-color-scheme: dark)');
            theme = matches ? 'dark' : 'light';
        }
        this.#document?.body?.setAttribute('theme', theme);
        this.#settings.set(SETTINGS.Theme, theme);
    }

    private setColorBlindMode(colorBlindMode: boolean): void {
        this.#document?.body?.setAttribute('color-blind-mode', colorBlindMode.toString());
    }

    private updateBuildingLayerColour(): void {
        if (this.mapConfig?.zoom && this.mapConfig?.zoom >= 15) {
            this.#utilService.createBuildingColourFilter();
        }
    }

    public setSearchArea(searchArea: GeoJSON.Feature<Polygon>): void {
        this.#utilService.setSpatialFilter(searchArea);
        /**
         * need to run this in zone otherwise change detection
         * isn't triggered and results panel won't open
         * Only run when buildings are visible
         */
        if (this.mapConfig?.zoom && this.mapConfig?.zoom >= 15) {
            this.#zone.run(() => {
                this.#utilService.createBuildingColourFilter();
            });
        }
    }

    /**
     * (Map) building click handler
     * @param TOID TOID of building selected on the map
     */
    public setSelectedBuildingTOID(TOID: string | null): void {
        const currentTOID = this.#spatialQueryService.selectedBuildingTOID();
        if (TOID && currentTOID !== TOID) {
            const buildings = this.#utilService.getBuildings(TOID);
            if (buildings.length === 1) {
                this.#utilService.singleDwellingSelectedOnMap(TOID, buildings[0].UPRN);
            } else if (buildings.length > 1) {
                this.#zone.run(() => this.#utilService.multipleDwellingSelectedOnMap(TOID));
            }
        } else if (this.#utilService.multiDwelling() === undefined) {
            this.#utilService.singleDwellingDeselected();
        } else {
            this.#utilService.multiDwellingDeselected();
        }
    }

    public closeDetails(): void {
        this.#utilService.closeDetailsButtonClick();
    }

    public downloadData(format: string): void {
        switch (format) {
            case 'xlsx':
                this.#dataDownloadService.downloadXlsxData([this.#dataService.selectedBuilding()!]);
                break;
            case 'csv':
                this.#dataDownloadService.downloadCSVData([this.#dataService.selectedBuilding()!]);
                break;
        }
    }

    /**
     * Bulk download addresses within a user drawn polygon
     */
    public downloadAddresses(): void {
        const buildingData = this.#dataService.buildings();

        const searchGeom = this.#spatialQueryService.spatialFilterGeom();

        if (!buildingData || !searchGeom) {
            return;
        }

        const buildingsToDownload = this.#spatialQueryService.getAddressesInPolygon(buildingData, searchGeom);
        let addresses: string[] = [];
        let addressCount = undefined;

        if (buildingsToDownload.length <= 10) {
            buildingsToDownload.map((building: BuildingModel) => addresses.push(building.FullAddress));
        } else {
            addressCount = buildingsToDownload.length;
        }

        this.#dialog
            .open<DownloadWarningComponent, DownloadDataWarningData, DownloadDataWarningResponse>(DownloadWarningComponent, {
                panelClass: 'data-download',
                data: {
                    addresses,
                    addressCount,
                },
            })
            .afterClosed()
            .pipe(
                filter((download) => !!download),
                map((download) => {
                    switch (download) {
                        case 'xlsx':
                            this.#dataDownloadService.downloadXlsxData(buildingsToDownload);
                            break;
                        case 'csv':
                            this.#dataDownloadService.downloadCSVData(buildingsToDownload);
                            break;
                    }
                    addresses = [];
                    addressCount = undefined;
                }),
            )
            .subscribe();
    }

    private closeResults(): void {
        /** if there is no spatial filter close results panel */
        if (!this.spatialFilterEnabled()) {
            this.#utilService.closeResultsPanel();
        }
    }

    public resetMapView(): void {
        this.#mapService.mapInstance.easeTo({
            center: this.#runtimeConfig.map.center,
            zoom: this.#runtimeConfig.map.zoom,
            pitch: this.#runtimeConfig.map.pitch,
            bearing: this.#runtimeConfig.map.bearing,
            duration: 1500,
        });
    }

    public resetNorth(): void {
        this.#mapService.mapInstance.easeTo({ bearing: 0 });
    }

    public tilt2D(twoDimensions: boolean): void {
        const maxPitch = twoDimensions ? 0 : 85;
        const pitch = twoDimensions ? 0 : this.#runtimeConfig.map.pitch;
        this.#mapService.mapInstance.easeTo({ pitch });
        this.#mapService.mapInstance.setMaxPitch(maxPitch);
    }

    public zoomIn(): void {
        this.#mapService.mapInstance.zoomIn();
    }

    public zoomOut(): void {
        this.#mapService.mapInstance.zoomOut();
    }

    public deleteSpatialFilter(): void {
        this.#utilService.deleteSpatialFilter();
        this.updateBuildingLayerColour();
    }

    public setAdvancedFilters(filter: AdvancedFiltersFormModel): void {
        for (const [key, value] of Object.entries(filter)) {
            if (value === null) {
                delete filter[key as keyof AdvancedFiltersFormModel];
            }
        }
        const queryParams = this.createQueryParams(filter as unknown as { [key: string]: string[] });
        this.navigate(queryParams);
    }

    public setFilterParams(filter: { [key: string]: string[] }): void {
        const queryParams = this.createQueryParams(filter);
        this.navigate(queryParams);
    }

    public setRouteMapParams(params: URLStateModel): void {
        const { bearing, center, pitch, zoom } = params;
        /** deselect building if buildings no longer visible */
        if (zoom < 15) {
            this.setSelectedBuildingTOID(null);
        }
        const queryParams = {
            bearing,
            lat: center[1],
            lng: center[0],
            pitch,
            zoom,
        };
        this.navigate(queryParams);
    }

    public onFlag(buildings: BuildingModel[]): void {
        /* filter out buildings that are already flagged */
        const toFlag = buildings.filter((b) => typeof b.Flagged === 'undefined');
        this.openFlagModal<FlagModalComponent, FlagModalData, FlagModalResult>(FlagModalComponent, toFlag)
            .pipe(
                switchMap((modal) => modal.afterClosed()),
                switchMap((flag) => (flag !== undefined && flag === true ? forkJoin(...toFlag.map((b) => this.#dataService.flagToInvestigate(b))) : EMPTY)),
            )
            .subscribe();
    }

    public onRemoveFlag(building: BuildingModel): void {
        this.openFlagModal<RemoveFlagModalComponent, RemoveFlagModalData, RemoveFlagModalResult>(RemoveFlagModalComponent, building)
            .pipe(
                switchMap((modal) => modal.afterClosed()),
                switchMap((reason) => (reason !== undefined ? this.#dataService.invalidateFlag(building, reason) : EMPTY)),
            )
            .subscribe();
    }

    /**
     * Open Flag Modal.
     *
     * Opens a material dialog with a given component flag modal component
     * and data. The modal is opened in fullscreen on mobile devices and
     * cannot be closed by clicking outside of the modal.
     */
    private openFlagModal<C, D, R>(template: ComponentType<C>, data: D): Observable<MatDialogRef<C, R>> {
        return this.#breakpointObserver.observe(Breakpoints.Handset).pipe(
            first(),
            map(({ matches }) =>
                this.#dialog.open<C, D, R>(template, {
                    data: data,
                    disableClose: true,
                    ...(matches
                        ? {
                              width: '100%',
                              height: '100%',
                              maxWidth: '100vw',
                              maxHeight: '100vh',
                          }
                        : {
                              width: 'auto',
                              height: 'auto',
                              minWidth: '400px',
                          }),
                }),
            ),
        );
    }

    private createQueryParams(filter: { [key: string]: string[] }): Record<'filter', string | undefined> {
        Object.keys(filter).forEach((key: string) => {
            if (this.filterProps?.[key as FilterKeys]) {
                delete this.filterProps[key as FilterKeys];
            }
        });
        const filterString = this.#filterService.createFilterString(filter, this.filterProps);
        const queryParams = {
            filter: filterString !== '' ? filterString : undefined,
        };
        return queryParams;
    }

    public clearAllFilters(): void {
        if (this.filterProps && Object.keys(this.filterProps).length > 0) {
            const params = this.createQueryParams({
                EPC: [],
                PropertyType: [],
                PostCode: [],
                BuildForm: [],
                WindowGlazing: [],
                WallConstruction: [],
                WallInsulation: [],
                FloorConstruction: [],
                FloorInsulation: [],
                RoofConstruction: [],
                RoofInsulationLocation: [],
                RoofInsulationThickness: [],
                YearOfAssessment: [],
                Flagged: [],
                EPCExpiry: [],
            });
            this.navigate(params);
            /** delete spatial filter if it exists */
            if (this.spatialFilterEnabled()) {
                this.#utilService.deleteSpatialFilter();
            }
        }
        /** if there is only a spatial filter, delete and redraw map */
        if (!this.filterProps || (Object.keys(this.filterProps).length === 0 && this.spatialFilterEnabled())) {
            this.#utilService.deleteSpatialFilter();
            this.updateBuildingLayerColour();
        }
    }

    private navigate(queryParams: Params): void {
        this.#zone.run(() => {
            this.#router.navigate(['/'], {
                queryParams,
                queryParamsHandling: 'merge',
            });
        });
    }

    private aggregateEPC(
        contextData: FeatureCollection<Geometry, GeoJsonProperties>[],
        buildings: BuildingMap,
    ): FeatureCollection<Geometry, GeoJsonProperties>[] {
        const aggregateData = this.#utilService.createAddressPoints(Object.values(buildings).flat(), contextData);
        return aggregateData;
    }

    public showInfo(): void {
        this.#dialog.open<InformationComponent>(InformationComponent, {
            panelClass: 'information',
        });
    }
}
