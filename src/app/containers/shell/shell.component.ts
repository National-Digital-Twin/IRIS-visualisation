import { AsyncPipe, CommonModule, DOCUMENT } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, InputSignal, NgZone, computed, effect, inject, input, numberAttribute } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Params, Router } from '@angular/router';
import { DetailsPanelComponent } from '@components/details-panel/details-panel.component';
import { DownloadWarningComponent } from '@components/download-warning/download-warning.component';
import { FlagModalComponent, FlagModalData, FlagModalResult } from '@components/flag-modal/flag.modal.component';
import { InformationComponent } from '@components/information/information.component';
import { MapComponent } from '@components/map/map.component';
import { MinimapComponent } from '@components/minimap/minimap.component';
import { RemoveFlagModalComponent, RemoveFlagModalData, RemoveFlagModalResult } from '@components/remove-flag-modal/remove-flag-modal.component';
import { MainFiltersComponent } from '@containers/main-filters/main-filters.component';
import { ResultsPanelComponent } from '@containers/results-panel/results-panel.component';
import { AdvancedFiltersFormModel, FilterKeys, FilterProps } from '@core/models/advanced-filters.model';
import { BuildingModel } from '@core/models/building.model';
import { DownloadDataWarningData, DownloadDataWarningResponse } from '@core/models/download-data-warning.model';
import { EPCData } from '@core/models/epc-data.model';
import { MinimapData } from '@core/models/minimap-data.model';
import { URLStateModel } from '@core/models/url-state.model';
import { DataDownloadService } from '@core/services/data-download.service';
import { DataService } from '@core/services/data.service';
import { FilterService } from '@core/services/filter.service';
import { MapService } from '@core/services/map.service';
import { SETTINGS, SettingsService } from '@core/services/settings.service';
import { SignoutService } from '@core/services/signout.service';
import { SpatialQueryService } from '@core/services/spatial-query.service';
import { UserDetailsService } from '@core/services/user-details.service';
import { UtilService } from '@core/services/utils.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { FeatureCollection, GeoJsonProperties, Geometry, Polygon } from 'geojson';
import { EMPTY, Observable, filter, forkJoin, map, of, switchMap, take, tap } from 'rxjs';

@Component({
    selector: 'c477-shell',
    imports: [
        CommonModule,
        DetailsPanelComponent,
        MainFiltersComponent,
        MapComponent,
        MinimapComponent,
        ResultsPanelComponent,
        AsyncPipe,
        MatSidenavModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatRadioModule,
        MatSlideToggleModule,
        MatMenuModule,
        MatDividerModule,
    ],
    templateUrl: './shell.component.html',
    styleUrl: './shell.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ShellComponent {
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
    readonly #userDetailsService = inject(UserDetailsService);
    readonly #signoutService = inject(SignoutService);
    readonly #zone = inject(NgZone);

    public contextData$: Observable<FeatureCollection<Geometry, GeoJsonProperties>[]>;
    public filterProps: FilterProps = {};
    public mapConfig!: URLStateModel;
    public minimapData?: MinimapData;
    public resultsPanelCollapsed: boolean = false;
    public showMinimap: boolean = true;
    public spatialFilterEnabled = this.#spatialQueryService.spatialFilterEnabled;
    public title = 'IRIS';
    public userEmail = 'loading...';
    public menuOpened = false;

    private _enhancedWardDataCache: FeatureCollection<Geometry, GeoJsonProperties>[] | null = null;

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

    public loading = computed(() => this.#dataService.loading());

    constructor() {
        this.contextData$ = this.#dataService.contextData$.pipe(
            switchMap((contextData) => {
                if (this._enhancedWardDataCache) {
                    return of(this._enhancedWardDataCache);
                }

                const wardBoundaries = contextData[0];

                return this.loadWardEPCData().pipe(
                    map((wardEPCData) => {
                        const epcDataArray = this.transformToEPCData(wardEPCData);
                        const enhancedData = this.processWardData(wardBoundaries, epcDataArray);

                        // Cache the processed data
                        this._enhancedWardDataCache = enhancedData;

                        return enhancedData;
                    }),
                );
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

        this.#userDetailsService.get().subscribe(
            (userDetails) => {
                this.userEmail = userDetails.email;
            },
            (error) => {
                console.error(`An error has occured: ${error}`);
                this.userEmail = 'Loading...';
            },
        );
    }

    public handleFontSizeSwitchChange(event: MatRadioChange): void {
        this.setFontSize(event.value);
    }

    private setFontSize(fontSize: string): void {
        const fontSizeClass = `font-size-${fontSize}`;
        const allFontSizeClasses = ['font-size-medium', 'font-size-large', 'font-size-xlarge'];

        this.replaceGlobalClasses(fontSizeClass, allFontSizeClasses);
    }

    public handleLineHeightSwitchChange(event: MatRadioChange): void {
        this.setLineHeight(event.value);
    }

    private setLineHeight(fontSize: string): void {
        const lineHeightClass = `line-height-${fontSize}`;
        const allLineHeightClasses = ['line-height-dense', 'line-height-normal', 'line-height-loose'];

        this.replaceGlobalClasses(lineHeightClass, allLineHeightClasses);
    }

    public handleLetterSpacingSwitchChange(event: MatRadioChange): void {
        this.setLetterSpacing(event.value);
    }

    private setLetterSpacing(letterSpacing: string): void {
        const letterSpacingClass = `letter-spacing-${letterSpacing}`;
        const allLetterSpacingClasses = ['letter-spacing-dense', 'letter-spacing-normal', 'letter-spacing-loose'];

        this.replaceGlobalClasses(letterSpacingClass, allLetterSpacingClasses);
    }

    private replaceGlobalClasses(classToAdd: string, classesToRemove: string[]): void {
        classesToRemove.forEach((classToRemove) => {
            if (this.#document?.body?.classList?.contains(classToRemove)) {
                this.#document?.body?.classList?.remove(classToRemove);
            }
        });

        this.#document?.body?.classList.add(classToAdd);
    }

    public handleColourBlindSwitchChange(event: MatSlideToggleChange): void {
        const colourBlindMode = event.checked;
        this.setColourBlindMode(colourBlindMode);
        this.#settings.set(SETTINGS.ColourBlindMode, colourBlindMode);
    }

    private setColourBlindMode(colourBlindMode: boolean): void {
        this.#document?.body?.setAttribute('colour-blind-mode', colourBlindMode.toString());
    }

    public handleMenuOpened(): void {
        this.menuOpened = true;
    }

    public handleMenuClosed(): void {
        this.menuOpened = false;
    }

    public handleSignout(): void {
        this.#signoutService.voidSession();
        window.location.href = this.#signoutService.signoutLinks?.signoutLink?.href ?? '/';
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
                panelClass: 'download-modal',
                width: '90%',
                maxWidth: '50rem',
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
        const queryParams = this.createQueryParams(filter as unknown as Record<string, string[]>);
        this.navigate(queryParams);
    }

    public setFilterParams(filter: Record<string, string[]>): void {
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
        const toFlag = buildings.filter((b) => typeof b.Flagged === 'undefined');

        this.#dialog
            .open<FlagModalComponent, FlagModalData, FlagModalResult>(FlagModalComponent, {
                width: '90%',
                maxWidth: '40rem',
                data: toFlag,
            })
            .afterClosed()
            .pipe(switchMap((flag) => (flag !== undefined && flag === true ? forkJoin(...toFlag.map((b) => this.#dataService.flagToInvestigate(b))) : EMPTY)))
            .subscribe();
    }

    public onRemoveFlag(building: BuildingModel): void {
        this.#dialog
            .open<RemoveFlagModalComponent, RemoveFlagModalData, RemoveFlagModalResult>(RemoveFlagModalComponent, {
                panelClass: 'download-modal',
                width: '90%',
                maxWidth: '50rem',
                data: building,
            })
            .afterClosed()
            .pipe(switchMap((reason) => (reason !== undefined ? this.#dataService.invalidateFlag(building, reason) : EMPTY)))
            .subscribe();
    }

    private createQueryParams(filter: Record<string, string[]>): Record<'filter', string | undefined> {
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
                StructureUnitType: [],
                PostCode: [],
                BuiltForm: [],
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

    /**
     * Load ward EPC data from API
     * @returns Observable of ward data with EPC information
     */
    private loadWardEPCData(): Observable<FeatureCollection<Geometry, GeoJsonProperties>> {
        return this.#dataService.fetchWardEPCData().pipe(
            tap({
                next: () => {
                    console.log('Loaded ward EPC data from API');
                },
                error: (error) => {
                    console.error('Error loading ward EPC data:', error);
                },
            }),
        );
    }

    private transformToEPCData(featureCollection: FeatureCollection<Geometry, GeoJsonProperties>): EPCData[] {
        if (!featureCollection.features) {
            return [];
        }

        return featureCollection.features.map((feature) => {
            const properties = feature.properties || {};
            return {
                name: properties.WD23NM || '',
                a_rating: properties.a_rating || 0,
                b_rating: properties.b_rating || 0,
                c_rating: properties.c_rating || 0,
                d_rating: properties.d_rating || 0,
                e_rating: properties.e_rating || 0,
                f_rating: properties.f_rating || 0,
                g_rating: properties.g_rating || 0,
                no_rating: properties.no_rating || 0,
            };
        });
    }

    /**
     * Process ward data with EPC information
     */
    private processWardData(
        wardBoundaries: FeatureCollection<Geometry, GeoJsonProperties>,
        wardEPCData: EPCData[],
    ): FeatureCollection<Geometry, GeoJsonProperties>[] {
        const epcByWard = new Map<string, EPCData>();

        if (Array.isArray(wardEPCData)) {
            wardEPCData.forEach((ward: EPCData) => {
                if (ward?.name) {
                    epcByWard.set(ward.name, ward);
                }
            });
        }

        const enhancedWardData = JSON.parse(JSON.stringify(wardBoundaries)) as FeatureCollection<Geometry, GeoJsonProperties>;

        // Merge EPC data into each feature's properties
        if (enhancedWardData.features) {
            enhancedWardData.features = enhancedWardData.features.map((feature) => {
                const wardName = feature.properties?.WD23NM ?? '';

                const epcData = epcByWard.get(wardName);

                if (epcData) {
                    const modalRating = this.#utilService.calculateModalRating(epcData);

                    feature.properties = {
                        ...feature.properties,
                        a_rating: epcData.a_rating ?? 0,
                        b_rating: epcData.b_rating ?? 0,
                        c_rating: epcData.c_rating ?? 0,
                        d_rating: epcData.d_rating ?? 0,
                        e_rating: epcData.e_rating ?? 0,
                        f_rating: epcData.f_rating ?? 0,
                        g_rating: epcData.g_rating ?? 0,
                        no_rating: epcData.no_rating ?? 0,
                        modal_rating: modalRating,
                        aggEPC: modalRating,
                        color: this.#utilService.getEPCColour(modalRating),
                    };
                }

                return feature;
            });
        }

        return [enhancedWardData];
    }

    public showInfo(): void {
        this.#dialog.open<InformationComponent>(InformationComponent, {
            panelClass: 'information',
        });
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
