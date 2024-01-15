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
  WallConstruction: string | undefined;
  WallInsulation: string | undefined;
  WindowGlazing: string | undefined;
};

export interface BuildingDetailsModel extends BuildingModel {
  SAPPoints: string;
  parts: string;
}

export interface DownloadDataModel extends BuildingDetailsModel {
  FloorPartType: string;
  FloorPartSuperType: string;
  FloorPartInsulationType: string;
  FloorPartInsulationThickness: string;
  FloorInsulationThickness: string;
  FloorInsulationThicknessLowerBound: string;
  RoofPartType: string;
  RoofPartSuperType: string;
  RoofPartInsulationType: string;
  RoofPartInsulationThickness: string;
  RoofInsulationThicknessLowerBound: string;
  WallPartType: string;
  WallPartSuperType: string;
  WallPartInsulationType: string;
  WallPartInsulationThickness: string;
  WallInsulationThickness: string;
  WallInsulationThicknessLowerBound: string;
  WindowPartType: string;
  WindowPartSuperType: string;
  WindowPartInsulationType: string;
  WindowPartInsulationThickness: string;
  WindowInsulationThickness: string;
  WindowInsulationThicknessLowerBound: string;
}

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
