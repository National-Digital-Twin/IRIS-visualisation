import { AdvancedFiltersFormModel } from './advanced-filters.model';
import { EPCRating, PropertyType } from '@core/enums';

export interface MainFiltersFormModel {
  epc: EPCRating[] | null;
  propertyType: PropertyType[] | null;
}

export interface AllFilters
  extends MainFiltersFormModel,
    AdvancedFiltersFormModel {}
