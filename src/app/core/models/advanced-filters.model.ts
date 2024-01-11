import { Moment } from 'moment/moment';
import {
  BuildForm,
  DwellingSize,
  Floor,
  FloorInsulation,
  InspectionDate,
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
  | typeof InspectionDate
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
  PostCode: PostCode[] | null;
  BuildForm: BuildForm[] | null;
  InspectionDate: InspectionDate[] | null;
  DwellingSize: DwellingSize[] | null;
  MultipleGlazingType: WindowGlazing[] | null;
  WallConstruction: Wall[] | null;
  WallInsulation: WallInsulation[] | null;
  FloorConstruction: Floor[] | null;
  FloorInsulation: FloorInsulation[] | null;
  RoofConstruction: Roof[] | null;
  RoofInsulationLocation: RoofInsulation[] | null;
  RoofInsulationThickness: RoofInsulationThickness[] | null;
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
  FloorConstruction?: string[];
  FloorInsulation?: string[];
  InspectionDate?: string[];
  MultipleGlazingType?: string[];
  PostCode?: string[];
  PropertyType?: string[];
  RoofConstruction?: string[];
  RoofInsulationLocation?: string[];
  RoofInsulationThickness?: string[];
  WallConstruction?: string[];
  WallInsulation?: string[];
}

export type FilterKeys =
  | 'BuildForm'
  | 'DwellingSize'
  | 'EPC'
  | 'FloorConstruction'
  | 'FloorInsulation'
  | 'InspectionDate'
  | 'MultipleGlazingType'
  | 'PostCode'
  | 'PropertyType'
  | 'RoofConstruction'
  | 'RoofInsulationLocation'
  | 'RoofInsulationThickness'
  | 'WallConstruction'
  | 'WallInsulation';
