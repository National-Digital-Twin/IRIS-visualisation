import { Moment } from 'moment/moment';
import {
  BuildForm,
  Floor,
  FloorInsulation,
  PostCode,
  Roof,
  RoofInsulation,
  RoofInsulationThickness,
  WindowGlazing,
  Wall,
  WallInsulation,
  YearOfAssessment,
} from '@core/enums';

export type AdvancedFilter =
  | typeof BuildForm
  | typeof Floor
  | typeof FloorInsulation
  | typeof PostCode
  | typeof Roof
  | typeof RoofInsulation
  | typeof RoofInsulationThickness
  | typeof WindowGlazing
  | typeof Wall
  | typeof WallInsulation
  | typeof YearOfAssessment;

export interface DateFormModel {
  singleYear: Moment | null;
  startYear: Moment | null;
  endYear: Moment | null;
}
export interface AdvancedFiltersFormModel {
  PostCode: PostCode[] | null;
  BuildForm: BuildForm[] | null;
  MultipleGlazingType: WindowGlazing[] | null;
  WallConstruction: Wall[] | null;
  WallInsulation: WallInsulation[] | null;
  FloorConstruction: Floor[] | null;
  FloorInsulation: FloorInsulation[] | null;
  RoofConstruction: Roof[] | null;
  RoofInsulationLocation: RoofInsulation[] | null;
  RoofInsulationThickness: RoofInsulationThickness[] | null;
  YearOfAssessment: YearOfAssessment[] | null;
}

export interface MultiButtonFilterOption {
  title: string;
  data: AdvancedFilter;
  formControlName: keyof AdvancedFiltersFormModel;
  selectedValues?: string[];
}

export interface FilterProps {
  BuildForm?: string[];
  EPC?: string[];
  Flagged?: string[];
  FloorConstruction?: string[];
  FloorInsulation?: string[];
  MultipleGlazingType?: string[];
  PostCode?: string[];
  PropertyType?: string[];
  RoofConstruction?: string[];
  RoofInsulationLocation?: string[];
  RoofInsulationThickness?: string[];
  WallConstruction?: string[];
  WallInsulation?: string[];
  YearOfAssessment?: string[];
}

export type FilterKeys =
  | 'BuildForm'
  | 'EPC'
  | 'FloorConstruction'
  | 'FloorInsulation'
  | 'MultipleGlazingType'
  | 'PostCode'
  | 'PropertyType'
  | 'RoofConstruction'
  | 'RoofInsulationLocation'
  | 'RoofInsulationThickness'
  | 'WallConstruction'
  | 'WallInsulation'
  | 'YearOfAssessment';
