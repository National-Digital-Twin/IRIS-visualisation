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

export type AdvancedFilter =
  | typeof BuildForm
  | typeof DwellingSize
  | typeof Floor
  | typeof FloorInsulation
  | typeof PostCode
  | typeof Roof
  | typeof RoofInsulation
  | typeof RoofInsulationThickness
  | typeof WindowGlazing
  | typeof Wall
  | typeof WallInsulation;

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

export interface MultiButtonFilterOption {
  title: string;
  data: AdvancedFilter;
  formControlName: keyof AdvancedFiltersFormModel;
  selectedValues?: string[];
}

export interface FilterProps {
  BuildForm?: string[];
  DwellingSize?: string[];
  EPC?: string[];
  Floor?: string[];
  FloorInsulation?: string[];
  PostCode?: string[];
  PropertyType?: string[];
  Roof?: string[];
  RoofInsulation?: string[];
  RoofInsulationThickness?: string[];
  Wall?: string[];
  WallInsulation?: string[];
  WindowGlazing?: string[];
}

export type FilterKeys =
  | 'BuildForm'
  | 'DwellingSize'
  | 'EPC'
  | 'Floor'
  | 'FloorInsulation'
  | 'PostCode'
  | 'PropertyType'
  | 'Roof'
  | 'RoofInsulation'
  | 'RoofInsulationThickness'
  | 'Wall'
  | 'WallInsulation'
  | 'WindowGlazing';
