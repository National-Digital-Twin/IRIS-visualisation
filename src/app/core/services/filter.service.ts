import { Injectable, signal } from '@angular/core';

import { FilterKeys, FilterProps } from '@core/models/advanced-filters.model';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  filters = signal<FilterProps>({});
  /**
   *
   * @param filter 'EPC-C-G:BuildForm-SemiDetached-EndTerrace:PropertyType-Bungalow'
   */
  parseFilter(filter: string) {
    const filterProps: FilterProps = {};
    // split filter string by filter type
    filter.split(':').forEach((val: string) => {
      // split filter type to individual filter values
      const k = val.split('-');
      // get first value as filter name
      const key = k[0] as FilterKeys;
      // remove filter name to get values
      let values = k.slice(1);
      // add prefix to EPC ratings
      if (key === 'EPC') {
        values = this.addEPCPrefix(values);
      }
      if (filterProps[key]) {
        values.forEach((v: string) => filterProps[key]!.push(v));
      } else {
        filterProps[key] = [...values];
      }
    });
    console.log(filterProps);
    this.filters.set(filterProps);
  }

  addEPCPrefix(epcRatings?: string[]) {
    return epcRatings
      ? epcRatings.map(r => `BuildingWithEnergyRatingOf${r}`)
      : [];
  }
}
