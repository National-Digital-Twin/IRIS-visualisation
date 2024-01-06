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
}

export interface BuildingDetailsModel extends BuildingModel {
  SAPPoints: string;
  parts: string;
}

export interface BuildingListModel extends BuildingModel {
  Flagged: string;
}

export interface BuildingSpecificationModel {
  floorConstruction: string;
  floorInsulation: string;
  roofConstruction: string;
  roofInsulationLocation: string;
  roofInsulationThickness: string;
  wallConstruction: string;
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
