import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { BuiltForm } from '@core/enums';
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
            PostCode: this.parsePostcode(filterableBuilding.postcode),
            BuiltForm: this.parseBuiltForm(filterableBuilding.built_form),
            FuelType: filterableBuilding.fuel_type,
            FloorConstruction: filterableBuilding.floor_construction,
            FloorInsulation: filterableBuilding.floor_insulation,
            RoofConstruction: filterableBuilding.roof_construction,
            RoofInsulationLocation: filterableBuilding.roof_insulation_location,
            RoofInsulationThickness: filterableBuilding.roof_insulation_thickness,
            WallConstruction: filterableBuilding.wall_construction,
            WallInsulation: filterableBuilding.wall_insulation,
            WindowGlazing: filterableBuilding.window_glazing,
            Flagged: false,
        };
        return buildingModel;
    }

    private parsePostcode(postcode: string): string {
        const postcodePartMatch = /^[A-Z0-9]{3,4}/.exec(postcode);
        if (postcodePartMatch?.[0]) {
            return postcodePartMatch[0];
        }

        return '';
    }

    private parseBuiltForm(builtForm: string | undefined): string | undefined {
        if (builtForm) {
            const parsedBuiltForm = BuiltForm[builtForm as keyof typeof BuiltForm];
            return parsedBuiltForm.replaceAll(' ', '');
        }

        return undefined;
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
