import { BuildForm, EPCRating, FuelType, PostCode, PropertyType } from '@core/enums';

export type BuildingModel = {
    UPRN: string;
    TOID?: string;
    ParentTOID?: string;
    FullAddress: string;
    PostCode?: PostCode;
    PropertyType?: PropertyType;
    BuildForm?: BuildForm;
    FuelType?: FuelType;
    InspectionDate?: string;
    YearOfAssessment?: string;
    EPC?: EPCRating;
    SAPPoints?: string;
    FloorConstruction?: string;
    FloorInsulation?: string;
    RoofConstruction?: string;
    RoofInsulationLocation?: string;
    RoofInsulationThickness?: string;
    WallConstruction?: string;
    WallInsulation?: string;
    WindowGlazing?: string;
    Flagged?: string;
    longitude?: string;
    latitude?: string;
};

export interface BuildingMap {
    [key: string]: BuildingModel[];
}

export type BuildingParts = {
    FloorConstruction: string;
    FloorInsulation: string;
    RoofConstruction: string;
    RoofInsulationLocation: string;
    RoofInsulationThickness: string;
    WallConstruction: string;
    WallInsulation: string;
    WindowGlazing: string;
};

export interface BuildingPart {
    PartType: string;
    PartSuperType: string;
    PartInsulationType: string;
    PartInsulationThickness: string;
    InsulationThickness: string;
    InsulationThicknessLowerBound: string;
}

export interface BuildingPartMap {
    [key: string]: BuildingPart;
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
