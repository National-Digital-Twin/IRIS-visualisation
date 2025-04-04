import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EPCRating, FloorConstruction, RoofConstruction, WallConstruction, WindowGlazing } from '@core/enums';
import { InvalidateFlagReason } from '@core/enums/invalidate-flag-reason';
import { BuildingMap, BuildingModel, BuildingParts } from '@core/models/building.model';
import { MapLayerConfig } from '@core/models/map-layer-config.model';
import { MinimalBuildingData, MinimalBuildingMap } from '@core/models/minimal-building-data.model';
import { SPARQLReturn, TableRow } from '@core/models/rdf-data.model';
import { EPC_DATA_FILE_NAME, NON_EPC_DATA_FILE_NAME, SAP_DATA_FILE_NAME } from '@core/tokens/cache.token';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { SEARCH_ENDPOINT } from '@core/tokens/search-endpoint.token';
import { WRITE_BACK_ENDPOINT } from '@core/tokens/write-back-endpoint.token';
import { EPCBuildingResponseModel, NoEPCBuildingResponseModel } from '@core/types/building-response';
import { FlagHistory } from '@core/types/flag-history';
import { FlagMap, FlagResponse } from '@core/types/flag-response';
import { SAPPoint, SAPPointMap } from '@core/types/sap-point';
import { FeatureCollection } from 'geojson';
import { EMPTY, Observable, Subscriber, catchError, combineLatest, first, forkJoin, map, of, switchMap, tap } from 'rxjs';

type Loading<T> = T | 'loading';

@Injectable({ providedIn: 'root' })
export class DataService {
    readonly #http: HttpClient = inject(HttpClient);
    readonly #searchEndpoint: string = inject(SEARCH_ENDPOINT);
    readonly #writeBackEndpoint = inject(WRITE_BACK_ENDPOINT);
    readonly #runtimeConfig = inject(RUNTIME_CONFIGURATION);

    public viewportBuildingsLoading = signal<boolean>(false);
    public minimalBuildings = signal<MinimalBuildingMap>({});

    public activeFlag = signal<Loading<FlagHistory> | undefined>(undefined);
    public buildingsSelection = signal<BuildingModel[][] | undefined>(undefined);
    public contextData$ = this.loadContextData();
    public flagHistory = signal<Loading<FlagHistory[]>>([]);

    public loading = computed(() => {
        // Loading is either the initial loading state or based on viewport building loading
        return this.viewportBuildingsLoading();
    });

    public selectedBuilding = signal<BuildingModel | undefined>(undefined);
    public selectedUPRN = signal<string | undefined>(undefined);

    private readonly buildingsFlagged = signal<FlagMap>({});
    private readonly buildingsFlagged$ = toObservable(this.buildingsFlagged);

    private _detailedBuildingsCache = new Map<string, BuildingModel>();

    private readonly flags$ = this.#http.get<FlagResponse[]>('/api/flagged-buildings', { withCredentials: true }).pipe(
        map((flags: FlagResponse[]) => this.getCurrentFlags(flags)),
        map((currentFlags) => this.mapFlagsToToids(currentFlags)),
    );

    constructor() {
        this.initialize();
    }

    public buildings = computed(() => {
        // Convert minimalBuildings to BuildingMap format
        const minimalBuildingsMap = this.minimalBuildings();

        const buildingMap: BuildingMap = {};

        Object.entries(minimalBuildingsMap).forEach(([toid, buildings]) => {
            buildingMap[toid] = buildings.map(minimalBuilding => {
                // Convert MinimalBuildingData to BuildingModel with minimal data
                return {
                UPRN: minimalBuilding.UPRN,
                TOID: minimalBuilding.TOID,
                ParentTOID: minimalBuilding.ParentTOID,
                FullAddress: minimalBuilding.addressText || '',
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
                Flagged: undefined
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
     * Initialize the data service with lazy loading
     * This replaces the eager loading approach and sets up just the necessary data
     */
    public initialize(): void {
        // Load flags since they're needed regardless of viewport
        this.loadFlags().subscribe();
    }

    /**
     * Load flags separately
     */
    private loadFlags(): Observable<void> {
        return this.#http.get<FlagResponse[]>('/api/flagged-buildings', { withCredentials: true }).pipe(
          map((flags: FlagResponse[]) => this.getCurrentFlags(flags)),
          map((currentFlags) => this.mapFlagsToToids(currentFlags)),
          tap(flagMap => {
            this.buildingsFlagged.set(flagMap);
            // Update viewport loading signal
            this.viewportBuildingsLoading.set(false);
          }),
          map(() => void 0)
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

        const hasDetailedData = building.StructureUnitType !== undefined && 
                                building.BuiltForm !== undefined;

        if (!hasDetailedData && building.UPRN) {
            console.log(`Loading missing details for building ${building.UPRN}`);
            this.loadBuildingDetails(building.UPRN).pipe(
            first()
            ).subscribe({
            next: (detailedBuilding) => {
                // Update the selected building with detailed data
                this.selectedBuilding.set(detailedBuilding);
            },
            error: (error) => {
                console.error(`Failed to load details for building ${building.UPRN}:`, error);
            }
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
     * Query Integration Architecture via SPARQL
     * @param query SPARQL query
     * @returns observable of parsed data
     */
    private selectTable(query: string, cacheUrl?: string): Observable<TableRow[]> {
        const url = cacheUrl ?? `${this.#searchEndpoint}?query=${encodeURIComponent(query)}`;
        const httpOptions = { withCredentials: true };

        const tableObservable = new Observable((observer: Subscriber<TableRow[]>) => {
            this.#http.get<SPARQLReturn>(url, httpOptions).subscribe((data: SPARQLReturn) => {
                const newTable: Array<TableRow> = this.buildTable(data);
                observer.next(newTable);
                observer.complete();
            });
        });

        return tableObservable;
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
     * Converts a query result from the Integration Architecture to an
     * array of objects
     * @param SPARQLReturn Query result from Integration Architecture
     * @returns Array of parsed data
     */
    private buildTable(SPARQLReturn: SPARQLReturn): TableRow[] {
        const heads = SPARQLReturn.head.vars;
        const data = SPARQLReturn.results.bindings;

        const table = data.map(() => {
            return heads.reduce((row, colname) => {
                row[colname] = '';
                return row;
            }, {} as TableRow);
        });

        data.forEach((rowData, rowIndex) => {
            for (const [colName, { value }] of Object.entries(rowData)) {
                table[rowIndex][colName] = value;
            }
        });

        return table;
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
            if (row.EPC === undefined) {
                row.EPC = EPCRating.none;
            }
            const toid = row.TOID ? row.TOID : row.ParentTOID;
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
    public queryBuildingsInViewport(
        viewport: { minLat: number, maxLat: number, minLng: number, maxLng: number },
    ): Observable<MinimalBuildingData[]> {
        console.log('Querying viewport:', viewport); // Debug logging

        const params = new HttpParams()
            .set('min_lat', viewport.minLat.toString())
            .set('max_lat', viewport.maxLat.toString())
            .set('min_lng', viewport.minLng.toString())
            .set('max_lng', viewport.maxLng.toString());

        return this.#http.get<any[]>('/api/buildings/viewport', { 
            params, 
            withCredentials: true 
        }).pipe(
            tap(response => console.log('API response:', response)), // Debug logging
            map(results => this.mapViewportAPIResponse(results)),
            catchError(error => {
                console.error('Error fetching buildings:', error);
                this.viewportBuildingsLoading.set(false);
                return of([]);
            })
        );
    }

    /**
     * Map API response to MinimalBuildingData objects
     * @param results API response
     * @returns Array of minimal building data objects
     */
    private mapViewportAPIResponse(results: any[]): MinimalBuildingData[] {
        // Use a Map to deduplicate by UPRN
        const buildingsMap = new Map<string, MinimalBuildingData>();

        results.forEach(row => {
            if (!row.UPRN) return;

            // If we already have this UPRN, merge new data with existing
            if (buildingsMap.has(row.UPRN)) {
                const existing = buildingsMap.get(row.UPRN)!;

                const merged: MinimalBuildingData = {
                    ...existing,
                    TOID: existing.TOID || row.TOID,
                    ParentTOID: existing.ParentTOID || row.ParentTOID,
                    addressText: existing.addressText || row.addressText,
                    StructureUnitType: existing.StructureUnitType || row.StructureUnitType
                };

                buildingsMap.set(row.UPRN, merged);
            } else {
                const building: MinimalBuildingData = {
                    UPRN: row.UPRN,
                    EPC: row.EPCRating ? this.parseEPCRating(row.EPCRating) : EPCRating.none,
                    latitude: row.latitude ? parseFloat(row.latitude) : undefined,
                    longitude: row.longitude ? parseFloat(row.longitude) : undefined,
                    addressText: row.addressText || undefined,
                    TOID: row.TOID || undefined,
                    ParentTOID: row.ParentTOID || undefined,
                    StructureUnitType: row.StructureUnitType || undefined
                };

                buildingsMap.set(row.UPRN, building);
            }
        });

        // Convert Map back to array
        return Array.from(buildingsMap.values());
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
     * @param viewport The current map viewport bounds
     * @returns Observable of the loaded minimal building map
     */
    public loadBuildingsForViewport(
        viewport: { minLat: number, maxLat: number, minLng: number, maxLng: number }
    ): Observable<MinimalBuildingMap> {
        this.viewportBuildingsLoading.set(true);
    
        return this.queryBuildingsInViewport(viewport).pipe(
            tap(buildings => {
                // Update minimal buildings data with new viewport data
                this.updateMinimalBuildingsWithViewportData(buildings);
                this.viewportBuildingsLoading.set(false);
            }),
            map(() => this.minimalBuildings())
        );
    }

    /**
     * Update the minimal buildings data with newly loaded viewport data
     * @param newBuildings Buildings loaded from viewport query
     */
    private updateMinimalBuildingsWithViewportData(newBuildings: MinimalBuildingData[]): void {
        const buildingMap: MinimalBuildingMap = {};
        
        newBuildings.forEach(building => {
            const toid = building.TOID ? building.TOID : building.ParentTOID;

            if (!toid) return;

            if (buildingMap[toid]) {
                buildingMap[toid].push(building);
            } else {
                buildingMap[toid] = [building];
            }
        });

        this.minimalBuildings.update(currentMap => {
            const mergedMap: MinimalBuildingMap = { ...currentMap };

            Object.entries(buildingMap).forEach(([toid, buildings]) => {
                if (!mergedMap[toid]) {
                    mergedMap[toid] = buildings;
                } else {
                    // If this TOID exists, need to merge buildings, deduplicating by UPRN
                    const existingUPRNs = new Set(mergedMap[toid].map(b => b.UPRN));

                    // Add only buildings with UPRNs that don't already exist for this TOID
                    buildings.forEach(building => {
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
     * Load detailed data for a building by UPRN
     * @param uprn Building UPRN
     * @returns Observable of detailed BuildingModel
     */
    public loadBuildingDetails(uprn: string): Observable<BuildingModel> {
        if (!uprn) {
            return of({} as BuildingModel);
        }

        console.log(`Loading detailed data for building ${uprn}`);

        return this.#http.get<any>(`/api/buildings/${uprn}`, { 
            withCredentials: true 
        }).pipe(
            tap(response => console.log('Building detail response:', response)),
            map(response => this.mapBuildingDetailResponse(response, uprn)),
            catchError(error => {
                console.error(`Error loading details for building ${uprn}:`, error);
                return of(this.getBuildingByUPRN(uprn));
            })
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
            LodgementDate: this.getPropertyValue(response, 'lodgement_date'),
            BuiltForm: this.getPropertyValue(response, 'built_form'), 
            YearOfAssessment: this.getPropertyValue(response, 'lodgement_date') ? 
                new Date(this.getPropertyValue(response, 'lodgement_date')).getFullYear().toString() : '',
            StructureUnitType: this.getPropertyValue(response, 'structure_unit_type'),
            FloorConstruction: this.getPropertyValue(response, 'floor_construction'),
            FloorInsulation: this.getPropertyValue(response, 'floor_insulation'),
            RoofConstruction: this.getPropertyValue(response, 'roof_construction'),
            RoofInsulationLocation: this.getPropertyValue(response, 'roof_insulation_location'),
            RoofInsulationThickness: this.getPropertyValue(response, 'roof_insulation_thickness'),
            WallConstruction: this.getPropertyValue(response, 'wall_construction'),
            WallInsulation: this.getPropertyValue(response, 'wall_insulation'),
            WindowGlazing: this.getPropertyValue(response, 'window_glazing')
        };

        // Cache the detailed data for future use
        this.updateBuildingCache(detailedBuilding);

        console.log(detailedBuilding)
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
        if (!this._detailedBuildingsCache) {
            this._detailedBuildingsCache = new Map<string, BuildingModel>();
        }

        this._detailedBuildingsCache.set(building.UPRN, building);
    }

    /**
     * Combine the two building datasets
     * @param epcBuildings
     * @param nonEPCBuildings
     * @returns BuildingMap of all buildings
     */
    private combineBuildingData(epcBuildings: BuildingMap, nonEPCBuildings: BuildingMap, flaggedBuildings: FlagMap): BuildingMap {
        const allBuildings: BuildingMap = { ...epcBuildings };

        Object.entries(nonEPCBuildings).forEach(([toid, building]) => {
            if (allBuildings[toid]) {
                allBuildings[toid] = allBuildings[toid].concat(building);
            } else {
                allBuildings[toid] = building;
            }
        });

        Object.entries(flaggedBuildings).forEach(([toid, flaggedList]) => {
            if (allBuildings[toid]) {
                flaggedList.forEach(({ UPRN, Flagged }) => {
                    const building = allBuildings[toid].find((b) => b.UPRN === UPRN);
                    if (building) {
                        building.Flagged = Flagged;
                    }
                });
            }
        });

        return allBuildings;
    }

    public getBuildingByUPRN(uprn: string): BuildingModel {
        if (this._detailedBuildingsCache?.has(uprn)) {
            return this._detailedBuildingsCache.get(uprn)!;
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
        return this.#http
            .post<NonNullable<BuildingModel['Flagged']>>(
                `${this.#writeBackEndpoint}/flag-to-investigate`,
                {
                    uri: `http://nationaldigitaltwin.gov.uk/data#building_${building.UPRN}`,
                },
                { withCredentials: true },
            )
            .pipe(
                switchMap((flagUri) => {
                    const toid = building.TOID ? building.TOID : building.ParentTOID;
                    if (!toid) throw new Error(`Building ${building.UPRN} has no TOID`);
                    building.Flagged = flagUri;
                    const flag: FlagResponse = {
                        UPRN: building.UPRN,
                        TOID: building.TOID,
                        ParentTOID: building.ParentTOID,
                        Flagged: flagUri,
                        FlagDate: new Date().toISOString(),
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
        if (building.Flagged === undefined) throw new Error(`Building ${building.UPRN} has no flag`);

        /* convert reason string to enum key */
        const keys = Object.keys(InvalidateFlagReason) as Array<keyof typeof InvalidateFlagReason>;
        const key = keys.find((k) => InvalidateFlagReason[k] === reason);

        return this.#http
            .post<NonNullable<BuildingModel['Flagged']>>(
                `${this.#writeBackEndpoint}/invalidate-flag`,
                {
                    flagUri: building.Flagged,
                    assessmentTypeOverride: `http://nationaldigitaltwin.gov.uk/ontology#${key}`,
                },
                { withCredentials: true },
            )
            .pipe(
                switchMap(() => {
                    const toid = building.TOID ? building.TOID : building.ParentTOID;
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
            flags.reduce((acc: Record<string, FlagResponse>, { UPRN, FlagDate, Flagged, ParentTOID, TOID }) => {
                if (!acc[UPRN] || Date.parse(acc[UPRN].FlagDate) < Date.parse(FlagDate)) acc[UPRN] = { UPRN, FlagDate, Flagged, ParentTOID, TOID };
                return acc;
            }, {}),
        );
        return result;
    }

    private mapFlagsToToids(flags: FlagResponse[]): FlagMap {
        const flagMap: FlagMap = {};
        flags.forEach((flag) => {
            const toid = flag.TOID ? flag.TOID : flag.ParentTOID;
            if (!toid) throw new Error(`Flag ${flag.UPRN} has no TOID`);
            if (flagMap[toid]) {
                flagMap[toid].push(flag);
            } else {
                flagMap[toid] = [flag];
            }
        });
        return flagMap;
    }

    private mapSAPPointsToToids(data: SAPPoint[]): SAPPointMap {
        const map: SAPPointMap = {};
        data.forEach((d) => {
            const toid = d.TOID ? d.TOID : d.ParentTOID;
            if (!toid) return;
            if (map[toid]) {
                map[toid].push(d);
            } else {
                map[toid] = [d];
            }
        });
        return map;
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
