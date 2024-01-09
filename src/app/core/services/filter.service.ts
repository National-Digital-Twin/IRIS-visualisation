import { Injectable } from '@angular/core';

import { FilterKeys, FilterProps } from '@core/models/advanced-filters.model';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  /**
   * Create a filter string from new and existing
   * filter objects
   * @param filter filter that is being set
   * @param currentFilters existing filters
   * @returns filter string URL param
   */
  createFilterString(
    filter: { [key: string]: string[] },
    currentFilters?: FilterProps
  ) {
    // format EPC rating
    if (currentFilters && currentFilters['EPC']) {
      currentFilters['EPC'] = currentFilters['EPC'].map(rating =>
        rating.slice(-1)
      );
    }
    const combinedFilters = [filter];
    if (currentFilters) {
      combinedFilters.push(currentFilters as { [key: string]: string[] });
    }
    // combine new filters with existing filters into a single object
    // of unique filters and filter values
    const keys = combinedFilters.map((o: object) => Object.keys(o)).flat();
    const merged = keys.reduce((result: { [key: string]: string[] }, key) => {
      const values = [
        ...new Set(combinedFilters.map(o => o[key]).flat()),
      ].filter((prop: string) => prop !== undefined);
      if (values.length) {
        result[key] = values;
      }
      return result;
    }, {});
    // convert the filter object into a string to apply
    // as a URL query param
    const filterString = this.filterObjToString(merged);
    return filterString;
  }

  /**
   *
   * @param filter 'EPC-C-G:BuildForm-SemiDetached-EndTerrace:PropertyType-Bungalow'
   */
  parseFilterString(filter: string) {
    const filterProps: FilterProps = {};
    // split filter string by filter type
    filter.split(':').forEach((val: string) => {
      // split filter type to individual filter values
      const k = val.split('-');
      // get first value as filter name
      const key = k[0] as FilterKeys;
      // remove filter name to get values
      const values = k.slice(1);
      if (filterProps[key]) {
        values.forEach((v: string) => filterProps[key]!.push(v));
      } else {
        filterProps[key] = [...values];
      }
    });
    return filterProps;
  }

  filterObjToString(filter: FilterProps) {
    return Object.keys(filter)
      .map(key => `${key}-${filter[key as FilterKeys]!.join('-')}`)
      .join(':');
  }
}
