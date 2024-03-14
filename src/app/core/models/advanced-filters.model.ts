import { Moment } from 'moment/moment';
import {
  BuildForm,
  FloorConstruction,
  FloorInsulation,
  PostCode,
  RoofConstruction,
  RoofInsulationLocation,
  RoofInsulationThickness,
  WindowGlazing,
  WallConstruction,
  WallInsulation,
  YearOfAssessment,
} from '@core/enums';

export type AdvancedFilter =
  | typeof BuildForm
  | typeof FloorConstruction
  | typeof FloorInsulation
  | typeof PostCode
  | typeof RoofConstruction
  | typeof RoofInsulationLocation
  | typeof RoofInsulationThickness
  | typeof WindowGlazing
  | typeof WallConstruction
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
  WindowGlazing: WindowGlazing[] | null;
  WallConstruction: WallConstruction[] | null;
  WallInsulation: WallInsulation[] | null;
  FloorConstruction: FloorConstruction[] | null;
  FloorInsulation: FloorInsulation[] | null;
  RoofConstruction: RoofConstruction[] | null;
  RoofInsulationLocation: RoofInsulationLocation[] | null;
  RoofInsulationThickness: RoofInsulationThickness[] | null;
  YearOfAssessment: YearOfAssessment[] | null;
}

export interface MultiButtonFilterOption {
  title: string;
  data: AdvancedFilter;
  formControlName: keyof AdvancedFiltersFormModel;
  selectedValues?: string[];
  validOptions?: string[];
}

export interface FilterProps {
  BuildForm?: string[];
  EPC?: string[];
  Flagged?: string[];
  FloorConstruction?: string[];
  FloorInsulation?: string[];
  WindowGlazing?: string[];
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
  | 'Flagged'
  | 'WindowGlazing'
  | 'PostCode'
  | 'PropertyType'
  | 'RoofConstruction'
  | 'RoofInsulationLocation'
  | 'RoofInsulationThickness'
  | 'WallConstruction'
  | 'WallInsulation'
  | 'YearOfAssessment';
