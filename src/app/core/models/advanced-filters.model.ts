import {
    BuiltForm,
    FloorConstruction,
    FloorInsulation,
    RoofConstruction,
    RoofInsulationLocation,
    RoofInsulationThickness,
    WallConstruction,
    WallInsulation,
    WindowGlazing,
    YearOfAssessment,
} from '@core/enums';
import { Moment } from 'moment/moment';

export type EPCExpiry = 'EPC Expired' | 'EPC In Date';

export type AdvancedFilter =
    | typeof BuiltForm
    | typeof FloorConstruction
    | typeof FloorInsulation
    | typeof RoofConstruction
    | typeof RoofInsulationLocation
    | typeof RoofInsulationThickness
    | typeof WindowGlazing
    | typeof WallConstruction
    | typeof WallInsulation
    | typeof YearOfAssessment;

export interface DateFormModel {
    singleYear: Moment | null;
    startYear: Moment | null;
    endYear: Moment | null;
}
export interface AdvancedFiltersFormModel {
    PostCode: string[] | null;
    BuiltForm: BuiltForm[] | null;
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
    FuelType: string[] | null;
    RoofMaterial: string[] | null;
    RoofHasSolarPanels: string[] | null;
    RoofAspectAreaDirection: string[] | null;
}

export interface MultiButtonFilterOption {
    title: string;
    data: string[];
    formControlName: keyof AdvancedFiltersFormModel;
    selectedValues?: string[];
    validOptions?: string[];
}

export interface FilterProps {
    BuiltForm?: string[];
    EPC?: string[];
    FloorConstruction?: string[];
    FloorInsulation?: string[];
    WindowGlazing?: string[];
    PostCode?: string[];
    StructureUnitType?: string[];
    RoofConstruction?: string[];
    RoofInsulationLocation?: string[];
    RoofInsulationThickness?: string[];
    WallConstruction?: string[];
    WallInsulation?: string[];
    YearOfAssessment?: string[];
    EPCExpiry?: string[];
    FuelType?: string[];
    RoofMaterial?: string[];
    RoofHasSolarPanels?: string[];
    RoofAspectAreaDirection?: string[];
}

export type FilterKeys =
    | 'BuiltForm'
    | 'EPC'
    | 'FloorConstruction'
    | 'FloorInsulation'
    | 'WindowGlazing'
    | 'PostCode'
    | 'StructureUnitType'
    | 'RoofConstruction'
    | 'RoofInsulationLocation'
    | 'RoofInsulationThickness'
    | 'WallConstruction'
    | 'WallInsulation'
    | 'YearOfAssessment'
    | 'FuelType'
    | 'RoofMaterial'
    | 'RoofHasSolarPanels'
    | 'RoofAspectAreaDirection';

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
