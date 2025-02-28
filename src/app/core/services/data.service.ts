import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EPCRating, FloorConstruction, RoofConstruction, WallConstruction, WindowGlazing } from '@core/enums';
import { InvalidateFlagReason } from '@core/enums/invalidate-flag-reason';
import { BuildingMap, BuildingModel, BuildingParts } from '@core/models/building.model';
import { MapLayerConfig } from '@core/models/map-layer-config.model';
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
import { EMPTY, Observable, Subscriber, combineLatest, first, forkJoin, map, switchMap, tap } from 'rxjs';
import { Queries } from './Queries';

type Loading<T> = T | 'loading';

@Injectable({
    providedIn: 'root',
})
export class DataService {
    readonly #http: HttpClient = inject(HttpClient);
    readonly #searchEndpoint: string = inject(SEARCH_ENDPOINT);
    readonly #writeBackEndpoint = inject(WRITE_BACK_ENDPOINT);
    readonly #runtimeConfig = inject(RUNTIME_CONFIGURATION);

    public activeFlag = signal<Loading<FlagHistory> | undefined>(undefined);
    public buildingsSelection = signal<BuildingModel[][] | undefined>(undefined);
    public contextData$ = this.loadContextData();
    public flagHistory = signal<Loading<FlagHistory[]>>([]);
    public loading = signal<boolean>(true);
    public selectedBuilding = signal<BuildingModel | undefined>(undefined);
    public selectedUPRN = signal<string | undefined>(undefined);

    private readonly buildingsFlagged = signal<FlagMap>({});
    private readonly buildingsFlagged$ = toObservable(this.buildingsFlagged);
    private readonly queries = new Queries();

    private readonly flags$ = this.selectTable(this.queries.getAllFlaggedBuildings()).pipe(
        map((res) => {
            const currentFlags = this.getCurrentFlags(res as unknown as FlagResponse[]);
            const flagMap = this.mapFlagsToToids(currentFlags);
            return flagMap;
        }),
    );

    private readonly sapPoints$ = this.selectTable(this.queries.getSAPPoints(), inject(SAP_DATA_FILE_NAME)).pipe(
        map((points) => this.mapSAPPointsToToids(points as unknown as SAPPoint[])),
    );

    private readonly buildingsEPC$ = forkJoin([this.flags$, this.sapPoints$, this.selectTable(this.queries.getEPCData(), inject(EPC_DATA_FILE_NAME))]).pipe(
        map(([flagMap, points, epc]) => {
            this.buildingsFlagged.set(flagMap);
            return this.mapEPCBuildings(epc as unknown as EPCBuildingResponseModel[], points);
        }),
    );

    private readonly buildingsNoEPC$ = this.selectTable(this.queries.getNoEPCData(), inject(NON_EPC_DATA_FILE_NAME)).pipe(
        map((noEPC) => this.mapNonEPCBuildings(noEPC as unknown as NoEPCBuildingResponseModel[])),
    );

    private readonly allData$ = combineLatest([this.buildingsEPC$, this.buildingsNoEPC$, this.buildingsFlagged$]).pipe(
        map(([epc, noEPC, flagged]) => this.combineBuildingData(epc, noEPC, flagged)),
        tap(() => {
            this.loading.set(false);
        }),
    );

    private readonly buildingData = toSignal(this.allData$, { initialValue: undefined });
    public buildings = computed(() => this.buildingData());

    public setSelectedUPRN(uprn?: string): void {
        this.selectedUPRN.set(uprn);
    }

    /**
     * Set individual building
     * @param building individual building
     */
    public setSelectedBuilding(building?: BuildingModel): void {
        this.selectedBuilding.set(building);
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
     * Create an object where TOIDS are keys, and values are the building(s)
     * data, and joins SAP Ratings with each building
     * @param buildings array of buildings with EPC data
     * @param sapPoints array of UPRNs and SAP Points
     * @returns an object with TOID as key, and an array of building
     * objects with epc and sap points
     */
    private mapEPCBuildings(buildings: EPCBuildingResponseModel[], sapPoints: SAPPointMap): BuildingMap {
        const buildingMap: BuildingMap = {};

        buildings.forEach((row: EPCBuildingResponseModel) => {
            const toid = row.TOID ? row.TOID : row.ParentTOID;

            /** if there is no TOID the building cannot be visualised */
            if (!toid) {
                return;
            }

            const sapPoint = sapPoints[toid]?.find((p) => p.UPRN === row.UPRN) || { SAPPoint: undefined, latitude: undefined, longitude: undefined };

            /** add 'none' for buildings with no EPC rating */
            const epc = row.EPC ? row.EPC : EPCRating.none;
            const yearOfAssessment = row.InspectionDate ? new Date(row.InspectionDate).getFullYear().toString() : '';
            /** get building parts */
            const parts = this.parseBuildingParts(row);

            const building: BuildingModel = {
                UPRN: row.UPRN,
                TOID: toid,
                ParentTOID: row.ParentTOID,
                FullAddress: row.FullAddress,
                PostCode: row.PostCode,
                PropertyType: row.PropertyType,
                BuildForm: row.BuildForm,
                InspectionDate: row.InspectionDate,
                YearOfAssessment: yearOfAssessment,
                EPC: epc,
                SAPPoints: sapPoint.SAPPoint,
                FloorConstruction: parts.FloorConstruction,
                FloorInsulation: parts.FloorInsulation,
                RoofConstruction: parts.RoofConstruction,
                RoofInsulationLocation: parts.RoofInsulationLocation,
                RoofInsulationThickness: parts.RoofInsulationThickness,
                WallConstruction: parts.WallConstruction,
                WallInsulation: parts.WallInsulation,
                WindowGlazing: parts.WindowGlazing,
                Flagged: undefined,
                latitude: sapPoint.latitude,
                longitude: sapPoint.longitude,
            };
            if (buildingMap[toid]) {
                buildingMap[toid].push(building);
            } else {
                buildingMap[toid] = [building];
            }
        });

        return buildingMap;
    }

    /**
     * An object where TOIDS are keys, and are is the building details
     * @param buildings array of building data with no EPC ratings
     * @returns an object with TOID as key, and object with an
     * array of building data
     */
    private mapNonEPCBuildings(buildings: NoEPCBuildingResponseModel[]): BuildingMap {
        const buildingMap: BuildingMap = {};
        buildings.forEach((responseRow: NoEPCBuildingResponseModel) => {
            const building: BuildingModel = {
                ...responseRow,
                BuildForm: undefined,
                EPC: EPCRating.none,
                FloorConstruction: undefined,
                FloorInsulation: undefined,
                InspectionDate: undefined,
                PropertyType: undefined,
                RoofConstruction: undefined,
                RoofInsulationLocation: undefined,
                RoofInsulationThickness: undefined,
                SAPPoints: undefined,
                WallConstruction: undefined,
                WallInsulation: undefined,
                WindowGlazing: undefined,
                YearOfAssessment: undefined,
            };
            /** if there is no TOID the building cannot be visualised */
            const toid = building.TOID ? building.TOID : building.ParentTOID;
            if (!toid) return;
            if (buildingMap[toid]) {
                buildingMap[toid].push(building);
            } else {
                buildingMap[toid] = [building];
            }
        });
        return buildingMap;
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

    /**
     * Return flag history for an individual building
     * @param query Query string to request data from IA
     * @returns
     */
    private getBuildingFlagHistory(uprn: string): Observable<FlagHistory[]> {
        return this.selectTable(this.queries.getFlagHistory(uprn)) as Observable<FlagHistory[]>;
    }

    public getBuildingByUPRN(uprn: string): BuildingModel {
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
