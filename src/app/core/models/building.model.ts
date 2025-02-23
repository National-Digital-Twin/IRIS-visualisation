import { BuildForm, EPCRating, PostCode, PropertyType } from '@core/enums';

export type BuildingModel = {
    UPRN: string;
    TOID?: string;
    ParentTOID?: string;
    FullAddress: string;
    PostCode?: PostCode;
    PropertyType?: PropertyType;
    BuildForm?: BuildForm;
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
