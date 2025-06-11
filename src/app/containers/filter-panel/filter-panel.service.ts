import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BoundingBox } from '@core/models';
import { map, Observable } from 'rxjs';

export const panelNames = ['General', 'Glazing', 'Wall', 'Floor', 'Roof'] as const;

export const filterKeys = [
    'postcode',
    'built_form',
    'inspection_year',
    'energy_rating',
    'fuel_type',
    'window_glazing',
    'wall_construction',
    'wall_insulation',
    'floor_construction',
    'floor_insulation',
    'roof_construction',
    'roof_insulation_location',
    'roof_insulation_thickness',
] as const;

export const filterNames = [
    'PostCode',
    'BuiltForm',
    'YearOfAssessment',
    'EPCExpiry',
    'FuelType',
    'WindowGlazing',
    'WallConstruction',
    'WallInsulation',
    'FloorConstruction',
    'FloorInsulation',
    'RoofConstruction',
    'RoofInsulationLocation',
    'RoofInsulationThickness',
    'Flagged',
    'StructureUnitType',
] as const;

export type PanelName = (typeof panelNames)[number];
export type FilterName = (typeof filterNames)[number];
export type FilterKey = (typeof filterKeys)[number];

export type FilterMeta = {
    key: FilterKey;
    name: FilterName;
    label: string;
    values: string[];
    selected: string[];
};

export type FilterPanel = {
    title: PanelName;
    keys: FilterKey[];
    filters: FilterMeta[];
};

@Injectable({ providedIn: 'root' })
export class FilterPanelService {
    #http = inject(HttpClient);

    public static PANELS: FilterPanel[] = [
        { title: 'General', keys: ['postcode', 'built_form', 'inspection_year', 'energy_rating', 'fuel_type'], filters: [] },
        { title: 'Glazing', keys: ['window_glazing'], filters: [] },
        { title: 'Wall', keys: ['wall_construction', 'wall_insulation'], filters: [] },
        { title: 'Floor', keys: ['floor_construction', 'floor_insulation'], filters: [] },
        { title: 'Roof', keys: ['roof_construction', 'roof_insulation_location', 'roof_insulation_thickness'], filters: [] },
    ];

    public static FILTERS: FilterMeta[] = [
        { key: 'postcode', name: 'PostCode', label: 'Post Code', values: [], selected: [] },
        { key: 'built_form', name: 'BuiltForm', label: 'Build Form', values: [], selected: [] },
        { key: 'inspection_year', name: 'YearOfAssessment', label: 'Year of Inspection', values: [], selected: [] },
        { key: 'energy_rating', name: 'EPCExpiry', label: 'EPC Expiry', values: [], selected: [] },
        { key: 'fuel_type', name: 'FuelType', label: 'Fuel Type', values: [], selected: [] },
        { key: 'window_glazing', name: 'WindowGlazing', label: 'Multiple Glazing Type', values: [], selected: [] },
        { key: 'wall_construction', name: 'WallConstruction', label: 'Wall Construction', values: [], selected: [] },
        { key: 'wall_insulation', name: 'WallInsulation', label: 'Wall Insulation', values: [], selected: [] },
        { key: 'floor_construction', name: 'FloorConstruction', label: 'Floor Construction', values: [], selected: [] },
        { key: 'floor_insulation', name: 'FloorInsulation', label: 'Floor Insulation', values: [], selected: [] },
        { key: 'roof_construction', name: 'RoofConstruction', label: 'Roof Construction', values: [], selected: [] },
        { key: 'roof_insulation_location', name: 'RoofInsulationLocation', label: 'Roof Insulation Location', values: [], selected: [] },
        { key: 'roof_insulation_thickness', name: 'RoofInsulationThickness', label: 'Roof Insulation Thickness', values: [], selected: [] },
    ];

    public retrieveFilterPanels(boundingBox: BoundingBox, selection?: Record<string, string[]>): Observable<FilterPanel[]> {
        let params = new HttpParams();
        params = params.set('min_lat', boundingBox.minX);
        params = params.set('max_lat', boundingBox.maxX);
        params = params.set('min_long', boundingBox.minY);
        params = params.set('max_long', boundingBox.maxY);

        return this.#http.get<Record<string, string[]>>('/api/filter-summary', { params }).pipe(
            map((filterData) => {
                const filters = FilterPanelService.FILTERS;
                return filters.map((filter) => ({ ...filter, values: filterData[filter.key], selected: selection ? selection[filter.name] : [] }));
            }),
            map((mappedFilters) => {
                const panels = FilterPanelService.PANELS;
                return panels.map((panel) => ({ ...panel, filters: mappedFilters.filter((filter) => panel.keys.includes(filter.key)) }));
            }),
        );
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
