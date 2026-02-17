import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { parsePostcode, parseBuiltForm } from '@core/helpers';
import { FilterableBuildingModel } from '@core/models/filterable-building.model';
import { catchError, map, Observable, of } from 'rxjs';

export type FilterableBuilding = {
    uprn: string;
    postcode: string;
    lodgement_date: string;
    built_form?: string;
    fuel_type?: string;
    floor_construction?: string;
    floor_insulation?: string;
    roof_construction?: string;
    roof_insulation_location?: string;
    roof_insulation_thickness?: string;
    wall_construction?: string;
    wall_insulation?: string;
    window_glazing?: string;
    roof_material?: string;
    has_roof_solar_panels: boolean;
    roof_aspect_area_facing_north?: number;
    roof_aspect_area_facing_north_east?: number;
    roof_aspect_area_facing_east?: number;
    roof_aspect_area_facing_south_east?: number;
    roof_aspect_area_facing_south?: number;
    roof_aspect_area_facing_south_west?: number;
    roof_aspect_area_facing_west?: number;
    roof_aspect_area_facing_north_west?: number;
};

@Injectable({ providedIn: 'root' })
export class FilterableBuildingService {
    readonly #http = inject(HttpClient);
    readonly #filterableBuildings = signal<FilterableBuilding[]>([]);

    public FilterableBuildingModels = computed(() => {
        return this.#filterableBuildings().map((filterableBuilding) => this.mapToBuildingModel(filterableBuilding));
    });

    public loadFilterableBuildingModelsInViewport(viewport: {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
    }): Observable<FilterableBuilding[]> {
        return this.queryFilterableBuildingsInViewport(viewport).pipe(
            map((filterableBuildings) => {
                this.#filterableBuildings.set(filterableBuildings);
                return filterableBuildings;
            }),
        );
    }

    private queryFilterableBuildingsInViewport(viewport: { minLat: number; maxLat: number; minLng: number; maxLng: number }): Observable<FilterableBuilding[]> {
        let params = new HttpParams();
        params = params.set('max_lat', viewport.maxLat);
        params = params.set('min_lat', viewport.minLat);
        params = params.set('min_long', viewport.minLng);
        params = params.set('max_long', viewport.maxLng);

        return this.#http.get<FilterableBuilding[]>('/api/filterable-buildings', { params }).pipe(
            catchError((error) => {
                console.error(`Error fetching filterable buildings: ${error}`);
                return of([]);
            }),
        );
    }

    private mapToBuildingModel(filterableBuilding: FilterableBuilding): FilterableBuildingModel {
        const buildingModel: FilterableBuildingModel = {
            UPRN: filterableBuilding.uprn,
            LodgementDate: filterableBuilding.lodgement_date,
            YearOfAssessment: new Date(filterableBuilding.lodgement_date).getFullYear().toString(),
            PostCode: parsePostcode(filterableBuilding.postcode),
            BuiltForm: parseBuiltForm(filterableBuilding.built_form),
            FuelType: filterableBuilding.fuel_type,
            FloorConstruction: filterableBuilding.floor_construction,
            FloorInsulation: filterableBuilding.floor_insulation,
            RoofConstruction: filterableBuilding.roof_construction,
            RoofInsulationLocation: filterableBuilding.roof_insulation_location,
            RoofInsulationThickness: filterableBuilding.roof_insulation_thickness,
            WallConstruction: filterableBuilding.wall_construction,
            WallInsulation: filterableBuilding.wall_insulation,
            WindowGlazing: filterableBuilding.window_glazing,
            RoofMaterial: filterableBuilding.roof_material,
            HasRoofSolarPanels: filterableBuilding.has_roof_solar_panels,
            RoofAspectAreaFacingNorth: filterableBuilding.roof_aspect_area_facing_north,
            RoofAspectAreaFacingNorthEast: filterableBuilding.roof_aspect_area_facing_north_east,
            RoofAspectAreaFacingEast: filterableBuilding.roof_aspect_area_facing_east,
            RoofAspectAreaFacingSouthEast: filterableBuilding.roof_aspect_area_facing_south_east,
            RoofAspectAreaFacingSouth: filterableBuilding.roof_aspect_area_facing_south,
            RoofAspectAreaFacingSouthWest: filterableBuilding.roof_aspect_area_facing_south_west,
            RoofAspectAreaFacingWest: filterableBuilding.roof_aspect_area_facing_west,
            RoofAspectAreaFacingNorthWest: filterableBuilding.roof_aspect_area_facing_north_west,
        };
        return buildingModel;
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
