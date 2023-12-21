import { Moment } from 'moment/moment';
import {
  BuildForm,
  DwellingSize,
  Floor,
  FloorInsulation,
  PostCode,
  Roof,
  RoofInsulation,
  RoofInsulationThickness,
  WindowGlazing,
  Wall,
  WallInsulation,
} from '@core/enums';

export interface DateFormModel {
  singleYear: Moment | null;
  startYear: Moment | null;
  endYear: Moment | null;
}
export interface AdvancedFiltersFormModel {
  postCode: PostCode[] | null;
  builtForm: BuildForm[] | null;
  yearOfAssessment: DateFormModel | null;
  dwellingSize: DwellingSize[] | null;
  multipleGlazingType: WindowGlazing[] | null;
  wallConstruction: Wall[] | null;
  wallInsulation: WallInsulation[] | null;
  floorConstruction: Floor[] | null;
  floorInsulation: FloorInsulation[] | null;
  roofConstruction: Roof[] | null;
  roofInsulationLocation: RoofInsulation[] | null;
  roofInsulationThickness: RoofInsulationThickness[] | null;
}
