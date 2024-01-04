import { BuildForm, EPCRating, PropertyType } from '@core/enums';

export interface BuildingModel {
  UPRN: string;
  TOID: string;
  ParentTOID?: string;
  EPC: EPCRating;
  PropertyType: PropertyType;
}

export interface BuildingDetailsModel extends BuildingModel {
  BuildForm: BuildForm;
  SAPPoints: string;
  FullAddress: string;
  InspectionDate: string;
  parts: string;
}

export interface BuildingListModel extends BuildingModel {
  FullAddress: string;
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
