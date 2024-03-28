import { BuildForm, EPCRating, PostCode, PropertyType } from '@core/enums';

export type BuildingModel = {
  UPRN: string;
  TOID?: string;
  ParentTOID?: string;
  FullAddress: string;
  PostCode: PostCode | undefined;
  PropertyType: PropertyType | undefined;
  BuildForm: BuildForm | undefined;
  InspectionDate: string | undefined;
  YearOfAssessment: string | undefined;
  EPC: EPCRating | undefined;
  SAPPoints: string | undefined;
  FloorConstruction: string | undefined;
  FloorInsulation: string | undefined;
  RoofConstruction: string | undefined;
  RoofInsulationLocation: string | undefined;
  RoofInsulationThickness: string | undefined;
  WallConstruction: string | undefined;
  WallInsulation: string | undefined;
  WindowGlazing: string | undefined;
  Flagged?: string | undefined;
  longitude: string | undefined;
  latitude: string | undefined;
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
