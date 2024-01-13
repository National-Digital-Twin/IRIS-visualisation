import { BuildForm, EPCRating, PostCode, PropertyType } from '@core/enums';

export interface BuildingModel {
  BuildForm: BuildForm;
  EPC: EPCRating;
  FullAddress: string;
  InspectionDate: string;
  ParentTOID?: string;
  PostCode: PostCode;
  PropertyType: PropertyType;
  TOID?: string;
  UPRN: string;
  YearOfAssessment: string;
  Flagged?: string;
}

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
  RoofInsulationThickness: string;
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
