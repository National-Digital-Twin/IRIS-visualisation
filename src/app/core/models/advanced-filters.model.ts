import {
    BuildForm,
    FloorConstruction,
    FloorInsulation,
    PostCode,
    RoofConstruction,
    RoofInsulationLocation,
    RoofInsulationThickness,
    WallConstruction,
    WallInsulation,
    WindowGlazing,
    YearOfAssessment,
    FuelType,
} from '@core/enums';
import { Moment } from 'moment/moment';

export type EPCExpiry = 'EPC Expired' | 'EPC In Date';

export type AdvancedFilter =
    | typeof BuildForm
    | typeof FloorConstruction
    | typeof FloorInsulation
    | typeof PostCode
    | typeof RoofConstruction
    | typeof RoofInsulationLocation
    | typeof RoofInsulationThickness
    | typeof WindowGlazing
    | typeof WallConstruction
    | typeof WallInsulation
    | typeof YearOfAssessment
    | typeof FuelType;

export interface DateFormModel {
    singleYear: Moment | null;
    startYear: Moment | null;
    endYear: Moment | null;
}
export interface AdvancedFiltersFormModel {
    PostCode: PostCode[] | null;
    BuildForm: BuildForm[] | null;
    WindowGlazing: WindowGlazing[] | null;
    WallConstruction: WallConstruction[] | null;
    WallInsulation: WallInsulation[] | null;
    FloorConstruction: FloorConstruction[] | null;
    FloorInsulation: FloorInsulation[] | null;
    RoofConstruction: RoofConstruction[] | null;
    RoofInsulationLocation: RoofInsulationLocation[] | null;
    RoofInsulationThickness: RoofInsulationThickness[] | null;
    YearOfAssessment: YearOfAssessment[] | null;
    EPCExpiry: EPCExpiry[] | null;
    FuelType: FuelType[] | null;
}

export interface MultiButtonFilterOption {
    title: string;
    data: string[];
    formControlName: keyof AdvancedFiltersFormModel;
    selectedValues?: string[];
    validOptions?: string[];
}

export interface FilterProps {
    BuildForm?: string[];
    EPC?: string[];
    Flagged?: string[];
    FloorConstruction?: string[];
    FloorInsulation?: string[];
    WindowGlazing?: string[];
    PostCode?: string[];
    PropertyType?: string[];
    RoofConstruction?: string[];
    RoofInsulationLocation?: string[];
    RoofInsulationThickness?: string[];
    WallConstruction?: string[];
    WallInsulation?: string[];
    YearOfAssessment?: string[];
    EPCExpiry?: string[];
    FuelType?: string[];
}

export type FilterKeys =
    | 'BuildForm'
    | 'EPC'
    | 'FloorConstruction'
    | 'FloorInsulation'
    | 'Flagged'
    | 'WindowGlazing'
    | 'PostCode'
    | 'PropertyType'
    | 'RoofConstruction'
    | 'RoofInsulationLocation'
    | 'RoofInsulationThickness'
    | 'WallConstruction'
    | 'WallInsulation'
    | 'YearOfAssessment'
    | 'FuelType';

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
