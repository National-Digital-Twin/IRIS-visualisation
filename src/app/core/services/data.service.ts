import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { BuiltForm, EPCRating, StructureUnitType } from '@core/enums';
import { parseEPCRating } from '@core/helpers';
import { BuildingMap, BuildingModel } from '@core/models/building.model';
import { BuildingWeatherDataModel } from '@core/models/building.weather.data.model';
import { MinimalBuildingData, MinimalBuildingMap } from '@core/models/minimal-building-data.model';
import { Observable, catchError, first, map, of } from 'rxjs';

export type Building = {
    uprn: string;
    energy_rating?: string;
    toid?: string;
    first_line_of_address?: string;
    latitude: string;
    longitude: string;
    structure_unit_type?: string;
};

interface BuildingDetailAPIResponse extends Record<string, unknown> {
    uprn?: string;
    post_code: string;
    sap_rating: string;
    lodgement_date?: string;
    built_form?: string;
    structure_unit_type?: string;
    floor_construction?: string;
    floor_insulation?: string;
    roof_construction?: string;
    roof_insulation_location?: string;
    roof_insulation_thickness?: string;
    wall_construction?: string;
    wall_insulation?: string;
    window_glazing?: string;
    fueltype?: string;
    roof_material?: string;
    solar_panel_presence?: string;
    roof_shape?: string;
    roof_aspect_area_facing_north_m2?: string;
    roof_aspect_area_facing_north_east_m2?: string;
    roof_aspect_area_facing_east_m2?: string;
    roof_aspect_area_facing_south_east_m2?: string;
    roof_aspect_area_facing_south_m2?: string;
    roof_aspect_area_facing_south_west_m2?: string;
    roof_aspect_area_facing_west_m2?: string;
    roof_aspect_area_facing_north_west_m2?: string;
    roof_aspect_area_indeterminable_m2?: string;
}

@Injectable({ providedIn: 'root' })
export class DataService {
    readonly #http: HttpClient = inject(HttpClient);

    public uiReady = signal<boolean>(true);

    public viewportBuildingsLoading = signal<boolean>(false);
    public minimalBuildings = signal<MinimalBuildingMap>({});

    public buildingsSelection = signal<BuildingModel[][] | undefined>(undefined);

    public loading = computed(() => {
        // Loading set to false after initial load
        return !this.uiReady();
    });

    public selectedBuilding = signal<BuildingModel | undefined>(undefined);
    public selectedUPRN = signal<string | undefined>(undefined);
    public selectedBuildingWeatherData = signal<BuildingWeatherDataModel | undefined>(undefined);

    private readonly _buildingsCache = new Map<string, MinimalBuildingData>();
    private readonly _buildingCacheOrder: string[] = []; // FIFO tracking
    private readonly MAX_CACHED_BUILDINGS = 10000; // Number of properties

    private _selectedBuildingsCache = new Map<string, BuildingModel>();
    private readonly _selectedBuildingsWeatherDetailsCache = new Map<string, BuildingWeatherDataModel>();

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
                } as BuildingModel;
            });
        });

        return buildingMap;
    });

    public setSelectedUPRN(uprn?: string): void {
        this.selectedUPRN.set(uprn);
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

        if (building.UPRN) {
            if (!hasDetailedData) {
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
    }

    /**
     * Set multiple buildings
     * @param building buildings
     */
    public setSelectedBuildings(buildings?: BuildingModel[][]): void {
        this.buildingsSelection.set(buildings);
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
    private mapViewportAPIResponse(results: Building[]): MinimalBuildingData[] {
        return results.map((row) => {
            const building: MinimalBuildingData = {
                UPRN: row.uprn,
                EPC: parseEPCRating(row.energy_rating),
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
            .get<BuildingDetailAPIResponse>(`/api/buildings/${uprn}`, {
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
    private mapBuildingDetailResponse(response: BuildingDetailAPIResponse, uprn: string): BuildingModel {
        const existingData = this.getBuildingByUPRN(uprn);

        const detailedBuilding: BuildingModel = {
            ...existingData,
            UPRN: response.uprn ?? uprn,
            PostCode: response.post_code,
            SAPPoints: response.sap_rating,
            LodgementDate: response.lodgement_date,
            BuiltForm: response.built_form as BuiltForm | undefined,
            YearOfAssessment: response.lodgement_date ? new Date(response.lodgement_date).getFullYear().toString() : '',
            StructureUnitType: response.structure_unit_type as StructureUnitType | undefined,
            FloorConstruction: response.floor_construction,
            FloorInsulation: response.floor_insulation,
            RoofConstruction: response.roof_construction,
            RoofInsulationLocation: response.roof_insulation_location,
            RoofInsulationThickness: response.roof_insulation_thickness,
            WallConstruction: response.wall_construction,
            WallInsulation: response.wall_insulation,
            WindowGlazing: response.window_glazing,
            FuelType: response.fueltype,
            // OS NGD Buildings attributes
            RoofMaterial: response.roof_material,
            SolarPanelPresence: response.solar_panel_presence,
            RoofShape: response.roof_shape,
            RoofAspectAreaNorth: response.roof_aspect_area_facing_north_m2,
            RoofAspectAreaNortheast: response.roof_aspect_area_facing_north_east_m2,
            RoofAspectAreaEast: response.roof_aspect_area_facing_east_m2,
            RoofAspectAreaSoutheast: response.roof_aspect_area_facing_south_east_m2,
            RoofAspectAreaSouth: response.roof_aspect_area_facing_south_m2,
            RoofAspectAreaSouthwest: response.roof_aspect_area_facing_south_west_m2,
            RoofAspectAreaWest: response.roof_aspect_area_facing_west_m2,
            RoofAspectAreaNorthwest: response.roof_aspect_area_facing_north_west_m2,
            RoofAspectAreaIndeterminable: response.roof_aspect_area_indeterminable_m2,
        };

        // Cache the detailed data for future use
        this.updateBuildingCache(detailedBuilding);

        return detailedBuilding;
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

    public setSelectedBuildingWeatherData(buildingWeatherData: BuildingWeatherDataModel): void {
        if (!(buildingWeatherData.uprn in this._selectedBuildingsWeatherDetailsCache.keys())) {
            // if all weather data is provided then cache the weather details for the building
            if (
                buildingWeatherData.buildingWindDrivenRainDataModel &&
                buildingWeatherData.buildingIcingDaysDataModel &&
                buildingWeatherData.buildingHotSummerDaysDataModel &&
                buildingWeatherData.buildingSunlightHoursDataModel
            ) {
                this._selectedBuildingsWeatherDetailsCache.set(buildingWeatherData.uprn, buildingWeatherData);
            }
        }
        this.selectedBuildingWeatherData.set(buildingWeatherData);
    }

    public getBuildingWeatherDetailsByUprn(uprn: string): BuildingWeatherDataModel | undefined {
        return this._selectedBuildingsWeatherDetailsCache.get(uprn);
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
