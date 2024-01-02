import { TableRow } from './rdf-data.model';

export interface BuildingModel {
  uprnId: string;
  toid?: string;
  fullAddress: string;
  epc: string;
}

export interface BuildingDetailsModel extends BuildingModel {
  buildForm: string;
  propertyType: string;
  sapPoints: string;
  inspectionDate: string;
  parts: string;
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
  [key: string]: TableRow[];
}

export interface BuildingPart {
  PartType: string;
  PartSuperType: string;
  PartInsulationType: string;
  PartInsulationThickness: string;
  InsulationThickness: string;
  InsulationThicknessLowerBound: string;
}
