import { BuiltForm, EPCRating, PostCode, StructureUnitType } from '@core/enums';

export type BuildingModel = {
    UPRN: string;
    TOID?: string;
    ParentTOID?: string;
    FullAddress: string;
    PostCode?: PostCode;
    StructureUnitType?: StructureUnitType;
    BuiltForm?: BuiltForm;
    LodgementDate?: string;
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
    longitude?: string;
    latitude?: string;
    FuelType?: string;
    // OS NGD Buildings attributes
    RoofMaterial?: string;
    SolarPanelPresence?: string;
    RoofShape?: string;
    RoofAspectAreaNorth?: string;
    RoofAspectAreaNortheast?: string;
    RoofAspectAreaEast?: string;
    RoofAspectAreaSoutheast?: string;
    RoofAspectAreaSouth?: string;
    RoofAspectAreaSouthwest?: string;
    RoofAspectAreaWest?: string;
    RoofAspectAreaNorthwest?: string;
    RoofAspectAreaIndeterminable?: string;
};

export interface BuildingMap {
    [key: string]: BuildingModel[];
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
