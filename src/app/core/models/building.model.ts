import { BuildForm, EPCRating, PostCode, PropertyType } from '@core/enums';
// import { BuildingResponseModel } from './building-response.model';

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
  Flagged?: string;
  YearOfAssessment: string;
  PartTypes: string;
  InsulationTypes: string;
  InsulationThickness: string;
  InsulationThicknessLowerBound: string;
  FloorConstruction: string;
  FloorInsulation: string;
  RoofConstruction: string;
  RoofInsulationThickness: string;
  RoofInsulationLocation: string;
  WallConstruction: string;
  WallInsulation: string;
  WindowGlazing: string;
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
  // RoofInsulationThickness: string;
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

// export class B implements BuildingModel {
//   BuildForm: BuildForm;
//   EPC: EPCRating;
//   Flagged?: string;
//   FullAddress: string;
//   InspectionDate: string;
//   ParentTOID?: string | undefined;
//   PostCode: PostCode;
//   PropertyType: PropertyType;
//   TOID?: string | undefined;
//   UPRN: string;
//   YearOfAssessment: string;

//   constructor(buildingResponse: BuildingResponseModel) {
//     this.BuildForm = buildingResponse.BuildForm;
//     this.EPC = buildingResponse.EPC ? buildingResponse.EPC : EPCRating.none;
//     this.FullAddress = buildingResponse.FullAddress;
//     this.InspectionDate = buildingResponse.InspectionDate;
//     this.ParentTOID = buildingResponse.ParentTOID;
//     this.PostCode = buildingResponse.PostCode;
//   }
// }
