import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { EPCRating, FloorConstruction, RoofConstruction, WallConstruction, WindowGlazing } from '@core/enums';
import { InvalidateFlagReason } from '@core/enums/invalidate-flag-reason';
import { BuildingMap, BuildingModel, BuildingParts } from '@core/models/building.model';
import { MapLayerConfig } from '@core/models/map-layer-config.model';
import { MinimalBuildingData, MinimalBuildingMap } from '@core/models/minimal-building-data.model';
import { BACKEND_API_ENDPOINT } from '@core/tokens/backend-endpoint.token';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { EPCBuildingResponseModel } from '@core/types/building-response';
import { FlagHistory } from '@core/types/flag-history';
import { FlagMap, FlagResponse } from '@core/types/flag-response';
import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { EMPTY, Observable, catchError, first, forkJoin, map, of, switchMap, tap } from 'rxjs';

type Loading<T> = T | 'loading';

export type Building = {
    uprn: string;
    energy_rating?: string;
    toid?: string;
    first_line_of_address?: string;
    lattitude: string;
    longitude: string;
    structure_unit_type?: string;
};

@Injectable({ providedIn: 'root' })
export class DataService {
    readonly #http: HttpClient = inject(HttpClient);
    readonly #backendApiEndpoint = inject(BACKEND_API_ENDPOINT);
    readonly #runtimeConfig = inject(RUNTIME_CONFIGURATION);

    public uiReady = signal<boolean>(true);

    public viewportBuildingsLoading = signal<boolean>(false);
    public minimalBuildings = signal<MinimalBuildingMap>({});

    public activeFlag = signal<Loading<FlagHistory> | undefined>(undefined);
    public buildingsSelection = signal<BuildingModel[][] | undefined>(undefined);
    public contextData$ = this.loadContextData();
    public flagHistory = signal<Loading<FlagHistory[]>>([]);

    public loading = computed(() => {
        // Loading set to false after initial load
        return !this.uiReady();
    });

    public selectedBuilding = signal<BuildingModel | undefined>(undefined);
    public selectedUPRN = signal<string | undefined>(undefined);

    private readonly buildingsFlagged = signal<FlagMap>({});
    private readonly buildingsFlagged$ = toObservable(this.buildingsFlagged);

    private readonly _buildingsCache = new Map<string, MinimalBuildingData>();
    private readonly _buildingCacheOrder: string[] = []; // FIFO tracking
    private readonly MAX_CACHED_BUILDINGS = 10000; // Number of properties

    private _selectedBuildingsCache = new Map<string, BuildingModel>();

    private readonly flags$ = this.#http.get<FlagResponse[]>('/api/flagged-buildings', { withCredentials: true }).pipe(
        map((flags: FlagResponse[]) => this.getCurrentFlags(flags)),
        map((currentFlags) => this.mapFlagsToToids(currentFlags)),
    );

    public buildings = computed(() => {
        // Convert minimalBuildings to BuildingMap format
        const minimalBuildingsMap = this.minimalBuildings();

        const buildingMap: BuildingMap = {};

        Object.entries(minimalBuildingsMap).forEach(([toid, buildings]) => {
            buildingMap[toid] = buildings.map((minimalBuilding) => {
                // Convert MinimalBuildingData to BuildingModel with minimal data
                return {
                    UPRN: minimalBuilding.UPRN,
                    TOID: minimalBuilding.TOID,
                    ParentTOID: minimalBuilding.ParentTOID,
                    FullAddress: minimalBuilding.fullAddress,
                    EPC: minimalBuilding.EPC,
                    latitude: minimalBuilding.latitude,
                    longitude: minimalBuilding.longitude,
                    StructureUnitType: minimalBuilding.StructureUnitType,
                    // Set other fields to undefined until detailed data is loaded
                    PostCode: undefined,
                    BuiltForm: undefined,
                    LodgementDate: undefined,
                    YearOfAssessment: undefined,
                    SAPPoints: undefined,
                    FloorConstruction: undefined,
                    FloorInsulation: undefined,
                    RoofConstruction: undefined,
                    RoofInsulationLocation: undefined,
                    RoofInsulationThickness: undefined,
                    WallConstruction: undefined,
                    WallInsulation: undefined,
                    WindowGlazing: undefined,
                    Flagged: undefined,
                } as BuildingModel;
            });
        });

        // Apply flags if available
        this.applyFlagsToBuildings(buildingMap);

        return buildingMap;
    });

    /**
     * Apply flags to building data
     */
    private applyFlagsToBuildings(buildingMap: BuildingMap): void {
        const flaggedBuildings = this.buildingsFlagged();

        Object.entries(flaggedBuildings).forEach(([toid, flaggedList]) => {
            if (buildingMap[toid]) {
                flaggedList.forEach(({ UPRN, Flagged }) => {
                    const building = buildingMap[toid].find((b) => b.UPRN === UPRN);
                    if (building) {
                        building.Flagged = Flagged;
                    }
                });
            }
        });
    }

    public setSelectedUPRN(uprn?: string): void {
        this.selectedUPRN.set(uprn);
    }

    /**
     * Initialise the data service
     */
    public initialise(): void {
        this.loadFlags().subscribe();
    }

    /**
     * Load flags separately
     */
    private loadFlags(): Observable<void> {
        return this.#http.get<FlagResponse[]>('/api/flagged-buildings', { withCredentials: true }).pipe(
            map((flags: FlagResponse[]) => this.getCurrentFlags(flags)),
            map((currentFlags) => this.mapFlagsToToids(currentFlags)),
            tap((flagMap) => {
                this.buildingsFlagged.set(flagMap);
                // Update viewport loading signal
                this.viewportBuildingsLoading.set(false);
            }),
            map(() => void 0),
        );
    }

    /**
     * Return flag history for an individual building
     * @param query Query string to request data from IA
     * @returns
     */
    private getBuildingFlagHistory(uprn: string): Observable<FlagHistory[]> {
        return this.#http.get<FlagHistory[]>(`/api/buildings/${uprn}/flag-history`, { withCredentials: true });
    }

    /** get the flag history for selected building and update the signals */
    public updateFlagHistory(uprn: BuildingModel['UPRN']): Observable<FlagHistory[]> {
        this.flagHistory.set('loading');
        this.activeFlag.set('loading');
        return this.getBuildingFlagHistory(uprn).pipe(
            first(),
            tap((flagHistory) => {
                const flags = flagHistory.filter((f) => f.Flagged && f.AssessmentReason);
                this.flagHistory.set(flags);
                const flag = flagHistory.find((f) => f.Flagged && !f.AssessmentReason);
                this.activeFlag.set(flag);
            }),
        );
    }

    /**
     * Set individual building and load detailed data if not already available
     * @param building individual building
     */
    public setSelectedBuilding(building?: BuildingModel): void {
        if (!building) {
            this.selectedBuilding.set(undefined);
            return;
        }

        this.selectedBuilding.set(building);

        const hasDetailedData = building.StructureUnitType !== undefined && building.BuiltForm !== undefined;

        if (!hasDetailedData && building.UPRN) {
            this.loadBuildingDetails(building.UPRN)
                .pipe(first())
                .subscribe({
                    next: (detailedBuilding) => {
                        // Update the selected building with detailed data
                        this.selectedBuilding.set(detailedBuilding);
                    },
                    error: (error) => {
                        console.error(`Failed to load details for building ${building.UPRN}:`, error);
                    },
                });
        }
    }

    /**
     * Set multiple buildings
     * @param building buildings
     */
    public setSelectedBuildings(buildings?: BuildingModel[][]): void {
        this.buildingsSelection.set(buildings);
    }

    /**
     * Loads all spatial context data
     * @returns FeatureCollection[] Array of geojson
     */
    private loadContextData(): Observable<FeatureCollection[]> {
        const requests = this.#runtimeConfig.contextLayers.map((mapLayerConfig: MapLayerConfig) =>
            this.#http.get<FeatureCollection>(`assets/data/${mapLayerConfig.filename}`),
        );
        return forkJoin(requests).pipe(map((data: FeatureCollection[]) => data));
    }

    /**
     * An object where TOIDS are keys, and values are an array of buildings
     * @param buildings array of buildings data
     * @returns an object with TOID as key, and array of buildings as values
     */
    public mapBuildings(buildings: BuildingModel[]): BuildingMap {
        const buildingMap: BuildingMap = {};
        buildings.forEach((row: BuildingModel) => {
            /** add 'none' for buildings with no EPC rating */
            row.EPC ??= EPCRating.none;
            const toid = row.TOID ?? row.ParentTOID;
            if (!toid) {
                return;
            }
            if (toid && buildingMap[toid]) {
                buildingMap[toid].push(row);
            } else {
                buildingMap[toid] = [row];
            }
        });
        return buildingMap;
    }

    /**
     * Query buildings within the current viewport
     * @param viewport The current map viewport bounds
     * @param page Page number for pagination
     * @param pageSize Number of results per page
     * @returns Observable of minimal building data
     */
    public queryBuildingsInViewport(viewport: { minLat: number; maxLat: number; minLng: number; maxLng: number }): Observable<MinimalBuildingData[]> {
        const params = new HttpParams()
            .set('min_long', viewport.minLng.toString())
            .set('min_lat', viewport.minLat.toString())
            .set('max_long', viewport.maxLng.toString())
            .set('max_lat', viewport.maxLat.toString());

        return this.#http
            .get<Building[]>('/api/buildings', {
                params,
                withCredentials: true,
            })
            .pipe(
                map((results) => this.mapViewportAPIResponse(results)),
                catchError((error) => {
                    console.error('Error fetching buildings:', error);
                    this.viewportBuildingsLoading.set(false);
                    return of([]);
                }),
            );
    }

    /**
     * Map API response to MinimalBuildingData objects
     * @param results API response
     * @returns Array of minimal building data objects
     */
    private mapViewportAPIResponse(results: any[]): MinimalBuildingData[] {
        return results.map((row) => {
            const building: MinimalBuildingData = {
                UPRN: row.uprn,
                EPC: row.energy_rating ? this.parseEPCRating(row.energy_rating) : EPCRating.none,
                fullAddress: row.first_line_of_address ?? undefined,
                latitude: row.latitude ? parseFloat(row.latitude) : undefined,
                longitude: row.longitude ? parseFloat(row.longitude) : undefined,
                TOID: row.toid ?? undefined,
                StructureUnitType: row.structure_unit_type ?? undefined,
            };

            return building;
        });
    }

    /**
     * Parse EPC rating from string to enum
     */
    private parseEPCRating(epcValue: string): EPCRating {
        if (!epcValue) return EPCRating.none;

        if (/^[A-G]$/i.test(epcValue)) {
            const rating = epcValue.toUpperCase() as keyof typeof EPCRating;
            return EPCRating[rating] || EPCRating.none;
        }

        return EPCRating.none;
    }

    /**
     * Load buildings for the current viewport and update the minimal building data
     * Uses the cache when possible and updates with API data
     * @param viewport The current map viewport bounds
     * @returns Observable of the loaded minimal building map
     */
    public loadBuildingsForViewport(viewport: { minLat: number; maxLat: number; minLng: number; maxLng: number }): Observable<MinimalBuildingMap> {
        this.viewportBuildingsLoading.set(true);

        const cachedBuildingsInViewport = this.getBuildingsFromCacheInViewport(viewport);

        if (cachedBuildingsInViewport.length > 0) {
            // Update the UI with cached buildings
            this.updateMinimalBuildingsWithViewportData(cachedBuildingsInViewport);
        }

        const cachedUPRNs = new Set(cachedBuildingsInViewport.map((b) => b.UPRN));

        return this.queryBuildingsInViewport(viewport).pipe(
            map((apiBuildingData) => {
                // Find buildings from API that aren't in the cache
                const newBuildings = apiBuildingData.filter((b) => !cachedUPRNs.has(b.UPRN));

                newBuildings.forEach((building) => {
                    this.addBuildingToCache(building);
                });

                // Update the UI with all buildings
                this.updateMinimalBuildingsWithViewportData(apiBuildingData);
                this.viewportBuildingsLoading.set(false);

                return this.minimalBuildings();
            }),
            catchError((error) => {
                console.error('Error fetching buildings:', error);
                this.viewportBuildingsLoading.set(false);
                return of(this.minimalBuildings());
            }),
        );
    }

    /**
     * Update the minimal buildings data with newly loaded viewport data
     * @param newBuildings Buildings loaded from viewport query
     */
    private updateMinimalBuildingsWithViewportData(newBuildings: MinimalBuildingData[]): void {
        const buildingMap: MinimalBuildingMap = {};

        newBuildings.forEach((building) => {
            const toid = building.TOID ?? building.ParentTOID;

            if (!toid) return;

            if (buildingMap[toid]) {
                buildingMap[toid].push(building);
            } else {
                buildingMap[toid] = [building];
            }
        });

        this.minimalBuildings.update((currentMap) => {
            const mergedMap: MinimalBuildingMap = { ...currentMap };

            Object.entries(buildingMap).forEach(([toid, buildings]) => {
                if (!mergedMap[toid]) {
                    mergedMap[toid] = buildings;
                } else {
                    // If this TOID exists, need to merge buildings, deduplicating by UPRN
                    const existingUPRNs = new Set(mergedMap[toid].map((b) => b.UPRN));

                    // Add only buildings with UPRNs that don't already exist for this TOID
                    buildings.forEach((building) => {
                        if (!existingUPRNs.has(building.UPRN)) {
                            mergedMap[toid].push(building);
                        }
                    });
                }
            });

            return mergedMap;
        });
    }

    /**
     * Gets buildings from cache that are within the current viewport
     * @param viewport The current viewport bounds
     * @returns Array of buildings from cache in the viewport
     */
    private getBuildingsFromCacheInViewport(viewport: { minLat: number; maxLat: number; minLng: number; maxLng: number }): MinimalBuildingData[] {
        const buildingsInViewport: MinimalBuildingData[] = [];

        this._buildingsCache.forEach((building) => {
            if (this.isInViewport(building, viewport)) {
                buildingsInViewport.push(building);
            }
        });

        return buildingsInViewport;
    }

    /**
     * Determines if a building is within the current viewport
     * @param building The building to check
     * @param viewport The current viewport bounds
     * @returns True if building is in viewport
     */
    private isInViewport(building: MinimalBuildingData, viewport: { minLat: number; maxLat: number; minLng: number; maxLng: number }): boolean {
        if (!building.latitude || !building.longitude) return false;

        return (
            building.latitude >= viewport.minLat &&
            building.latitude <= viewport.maxLat &&
            building.longitude >= viewport.minLng &&
            building.longitude <= viewport.maxLng
        );
    }

    /**
     * Adds a building to the cache, maintaining FIFO order
     * @param building The building to add to the cache
     */
    private addBuildingToCache(building: MinimalBuildingData): void {
        if (!building.UPRN) return;

        // If building is already in cache, update it and move it to the end of the order
        if (this._buildingsCache.has(building.UPRN)) {
            const index = this._buildingCacheOrder.indexOf(building.UPRN);
            if (index !== -1) {
                this._buildingCacheOrder.splice(index, 1);
            }
        }

        this._buildingsCache.set(building.UPRN, building);
        this._buildingCacheOrder.push(building.UPRN);

        while (this._buildingCacheOrder.length > this.MAX_CACHED_BUILDINGS) {
            const oldestUPRN = this._buildingCacheOrder.shift();
            if (oldestUPRN) {
                this._buildingsCache.delete(oldestUPRN);
            }
        }
    }

    /**
     * Clears the buildings cache
     */
    public clearBuildingsCache(): void {
        this._buildingsCache.clear();
        this._buildingCacheOrder.length = 0;
    }

    /**
     * Load detailed data for a building by UPRN
     * @param uprn Building UPRN
     * @returns Observable of detailed BuildingModel
     */
    public loadBuildingDetails(uprn: string): Observable<BuildingModel> {
        if (!uprn) {
            return of({} as BuildingModel);
        }

        return this.#http
            .get<any>(`/api/buildings/${uprn}`, {
                withCredentials: true,
            })
            .pipe(
                map((response) => this.mapBuildingDetailResponse(response, uprn)),
                catchError((error) => {
                    console.error(`Error loading details for building ${uprn}:`, error);
                    return of(this.getBuildingByUPRN(uprn));
                }),
            );
    }

    /**
     * Map building detail API response to BuildingModel
     */
    private mapBuildingDetailResponse(response: any, uprn: string): BuildingModel {
        const existingData = this.getBuildingByUPRN(uprn);

        const detailedBuilding: BuildingModel = {
            ...existingData,
            UPRN: this.getPropertyValue(response, 'uprn'),
            FullAddress: existingData.FullAddress,
            LodgementDate: this.getPropertyValue(response, 'lodgement_date'),
            BuiltForm: this.getPropertyValue(response, 'built_form'),
            YearOfAssessment: this.getPropertyValue(response, 'lodgement_date')
                ? new Date(this.getPropertyValue(response, 'lodgement_date')).getFullYear().toString()
                : '',
            StructureUnitType: this.getPropertyValue(response, 'structure_unit_type'),
            FloorConstruction: this.getPropertyValue(response, 'floor_construction'),
            FloorInsulation: this.getPropertyValue(response, 'floor_insulation'),
            RoofConstruction: this.getPropertyValue(response, 'roof_construction'),
            RoofInsulationLocation: this.getPropertyValue(response, 'roof_insulation_location'),
            RoofInsulationThickness: this.getPropertyValue(response, 'roof_insulation_thickness'),
            WallConstruction: this.getPropertyValue(response, 'wall_construction'),
            WallInsulation: this.getPropertyValue(response, 'wall_insulation'),
            WindowGlazing: this.getPropertyValue(response, 'window_glazing'),
        };

        // Cache the detailed data for future use
        this.updateBuildingCache(detailedBuilding);

        return detailedBuilding;
    }

    /**
     * Helper method to get property value from building details response
     */
    private getPropertyValue(response: any, propertyName: string): any {
        if (response && response[propertyName] !== undefined) {
            return response[propertyName];
        }

        return undefined;
    }

    /**
     * Update the building cache with detailed data
     */
    private updateBuildingCache(building: BuildingModel): void {
        if (!building.UPRN || !building.TOID) return;

        // Create a private cache
        if (!this._selectedBuildingsCache) {
            this._selectedBuildingsCache = new Map<string, BuildingModel>();
        }

        this._selectedBuildingsCache.set(building.UPRN, building);
    }

    public getBuildingByUPRN(uprn: string): BuildingModel {
        if (this._selectedBuildingsCache?.has(uprn)) {
            return this._selectedBuildingsCache.get(uprn)!;
        }
        const buildings = this.buildings();

        if (!buildings) {
            return {} as BuildingModel;
        }

        const flatBuildings: BuildingModel[] = Object.values(buildings).flat();
        const building = flatBuildings.find((building) => building.UPRN === uprn);

        return building ?? ({} as BuildingModel);
    }

    private isWallKey(value: string): value is keyof typeof WallConstruction {
        return Object.keys(WallConstruction).includes(value as WallConstruction);
    }

    private isWindowKey(value: string): value is keyof typeof WindowGlazing {
        return Object.keys(WindowGlazing).includes(value as WindowGlazing);
    }

    private isRoofKey(value: string): value is keyof typeof RoofConstruction {
        return Object.keys(RoofConstruction).includes(value as RoofConstruction);
    }

    private isFloorKey(value: string): value is keyof typeof FloorConstruction {
        return Object.keys(FloorConstruction).includes(value as FloorConstruction);
    }

    /**
     * Building parts are returned from the IA in the format
     * PartTypes: "CavityWall; DoubleGlazedBefore2002Window; SolidFloor; FlatRoof",
     * InsulationTypes: "NoData; NoData; NoData; AssumedLimitedInsulation",
     * InsulationThickness: "NoData; NoData; NoData; NoData",
     * InsulationThicknessLowerBound: "NoData; NoData; NoData; NoData"
     *
     * This function:
     * 1. Splits the PartTypes string and for each part identifies if it's a Wall,
     * Window, Roof or Floor.
     * 2. Using the index of the part, it then finds the corresponding insulation type
     * and thicknesses
     * @param row EPCBuildingResponseModel
     * @returns object of parts and insulation types and thicknesses
     */
    private parseBuildingParts(row: EPCBuildingResponseModel): BuildingParts {
        const parts: BuildingParts = {
            FloorConstruction: 'NoData',
            FloorInsulation: 'NoData',
            RoofConstruction: 'NoData',
            RoofInsulationLocation: 'NoData',
            RoofInsulationThickness: 'NoData',
            WallConstruction: 'NoData',
            WallInsulation: 'NoData',
            WindowGlazing: 'NoData',
        };

        const partTypes = row.PartTypes.replaceAll(' ', '').split(';');
        const insulationTypes = row.InsulationTypes.replaceAll(' ', '').split(';');
        const insulationThickness = row.InsulationThickness.replaceAll(' ', '').split(';');
        const insulationThicknessLowerBounds = row.InsulationThicknessLowerBound.replaceAll(' ', '').split(';');

        partTypes.forEach((part, i) => {
            if (this.isWallKey(part)) {
                parts['WallConstruction'] = part;
                parts['WallInsulation'] = insulationTypes[i];
            } else if (this.isFloorKey(part)) {
                parts['FloorConstruction'] = part;
                parts['FloorInsulation'] = insulationTypes[i];
            } else if (this.isRoofKey(part)) {
                parts['RoofConstruction'] = part;
                parts['RoofInsulationLocation'] = insulationTypes[i];
                /** check thickness types */
                let roofInsulationThickness = 'NoData';
                const thickness = insulationThickness[i];
                const thicknessLB = insulationThicknessLowerBounds[i];
                if (thickness !== 'NoData' && thicknessLB === 'NoData') {
                    roofInsulationThickness = `${thickness.split('.')[0]}mm`;
                } else if (thickness === 'NoData' && thicknessLB !== 'NoData') {
                    roofInsulationThickness = `${thicknessLB.split('.')[0]}+mm`;
                }
                parts['RoofInsulationThickness'] = roofInsulationThickness;
            } else if (this.isWindowKey(part)) {
                parts['WindowGlazing'] = part;
            }
        });
        return parts;
    }

    public flagToInvestigate(building: BuildingModel): Observable<FlagHistory[]> {
        const lodgementDate = building.LodgementDate ? `_${building.LodgementDate.replaceAll('-', '')}` : '';
        return this.#http
            .post<NonNullable<BuildingModel['Flagged']>>(
                `${this.#backendApiEndpoint}/flag-to-investigate`,
                {
                    uri: `http://ndtp.co.uk/data#StructureUnitState_${building.UPRN}${lodgementDate}`,
                },
                { withCredentials: true },
            )
            .pipe(
                switchMap((flagUri) => {
                    const toid = building.TOID ?? building.ParentTOID;
                    if (!toid) throw new Error(`Building ${building.UPRN} has no TOID`);
                    building.Flagged = flagUri;
                    const flag: FlagResponse = {
                        UPRN: building.UPRN,
                        TOID: building.TOID,
                        Flagged: flagUri,
                    };
                    this.buildingsFlagged.update((f) => ({
                        ...f,
                        [toid]: f[toid] ? [...f[toid], flag] : [flag],
                    }));

                    /* if invalidaing flag for selected building, update the flag history */
                    const { UPRN } = building;
                    const selectedBuilding = this.selectedBuilding();
                    if (selectedBuilding?.UPRN === UPRN) {
                        return this.updateFlagHistory(UPRN);
                    }
                    return EMPTY;
                }),
            );
    }

    public invalidateFlag(building: BuildingModel, reason: InvalidateFlagReason): Observable<FlagHistory[]> {
        /* If building has no flag, throw error */
        const activeFlag = this.activeFlag();
        if (activeFlag === undefined || activeFlag === 'loading' || !activeFlag) throw new Error(`Building ${building.UPRN} has no flag`);

        /* convert reason string to enum key */
        const keys = Object.keys(InvalidateFlagReason) as Array<keyof typeof InvalidateFlagReason>;
        const key = keys.find((k) => InvalidateFlagReason[k] === reason);

        return this.#http
            .post<NonNullable<BuildingModel['Flagged']>>(
                `${this.#backendApiEndpoint}/invalidate-flag`,
                {
                    flagUri: activeFlag.Flagged,
                    assessmentTypeOverride: `http://ndtp.co.uk/ontology#${key}`,
                },
                { withCredentials: true },
            )
            .pipe(
                switchMap(() => {
                    const toid = building.TOID ?? building.ParentTOID;
                    if (!toid) throw new Error(`Building ${building.UPRN} has no TOID`);
                    /* set flagged property to undefined */
                    building.Flagged = undefined;
                    this.buildingsFlagged.update((b) => {
                        /* remove building from flagged buildings */
                        const index = b[toid].findIndex((b) => b.UPRN === building.UPRN);
                        b[toid].splice(index, 1);
                        return { ...b };
                    });

                    /* if invalidaing flag for selected building, update the flag history */
                    const { UPRN } = building;
                    const selectedBuilding = this.selectedBuilding();
                    if (selectedBuilding?.UPRN === UPRN) {
                        return this.updateFlagHistory(UPRN);
                    }
                    return EMPTY;
                }),
            );
    }

    /**
     * Takes an array of flags and returns an array
     * of the most current unique flags
     * @param flags
     * @returns current flags
     */
    private getCurrentFlags(flags: FlagResponse[]): FlagResponse[] {
        const result = Object.values(
            flags.reduce((acc: Record<string, FlagResponse>, { UPRN, Flagged, TOID }) => {
                acc[UPRN] = { UPRN, Flagged, TOID };
                return acc;
            }, {}),
        );
        return result;
    }

    private mapFlagsToToids(flags: FlagResponse[]): FlagMap {
        const flagMap: FlagMap = {};
        flags.forEach((flag) => {
            const toid = flag.TOID;
            if (!toid) throw new Error(`Flag ${flag.UPRN} has no TOID`);
            if (flagMap[toid]) {
                flagMap[toid].push(flag);
            } else {
                flagMap[toid] = [flag];
            }
        });
        return flagMap;
    }

    // Private cache for ward EPC data
    private _wardEPCDataCache: any = null;

    /**
     * Fetch ward-level EPC data from API
     * @returns Observable of ward data with EPC information
     */
    public fetchWardEPCData(): Observable<FeatureCollection<Geometry, GeoJsonProperties>> {
        if (this._wardEPCDataCache !== null) {
            return of(this._wardEPCDataCache);
        }

        return this.#http
            .get<FeatureCollection<Geometry, GeoJsonProperties>>('/api/epc-statistics/wards', {
                withCredentials: true,
            })
            .pipe(
                tap((data) => {
                    this._wardEPCDataCache = data;
                }),
                catchError((error) => {
                    console.error('Error fetching ward EPC data:', error);
                    const emptyCollection: FeatureCollection<Geometry, GeoJsonProperties> = {
                        type: 'FeatureCollection',
                        features: [],
                    };
                    return of(emptyCollection);
                }),
            );
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
