import { BuildForm, EPCRating, PostCode, PropertyType } from '@core/enums';

export type BuildingModel = {
  BuildForm: BuildForm | undefined;
  EPC: EPCRating | undefined;
  FullAddress: string;
  InspectionDate: string | undefined;
  ParentTOID?: string;
  PostCode: PostCode | undefined;
  PropertyType: PropertyType | undefined;
  TOID?: string;
  UPRN: string;
  Flagged?: string | undefined;
  YearOfAssessment: string | undefined;
  FloorConstruction: string | undefined;
  FloorInsulation: string | undefined;
  RoofConstruction: string | undefined;
  RoofInsulationThickness: string | undefined;
  RoofInsulationLocation: string | undefined;
  SAPPoints: string | undefined;
  WallConstruction: string | undefined;
  WallInsulation: string | undefined;
  WindowGlazing: string | undefined;
};

export interface BuildingMap {
  [key: string]: BuildingModel[];
}

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
