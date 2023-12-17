import { Injectable, inject } from '@angular/core';

import { BuildingMap } from '@core/models/building.model';
import { TableRow } from '@core/models/rdf-data.model';

import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private dataService = inject(DataService);
  private filterProps: { [key: string]: string[] } = {};
  /**
   *
   * @param filter 'epc-C:epc-G:buildingType-SemiDetached:propertyType-Bungalow'
   */
  parseFilter(filter: string) {
    filter.split(':').forEach((val: string) => {
      const k = val.split('-');
      if (this.filterProps[k[0]]) {
        this.filterProps[k[0]].push(k[1]);
      } else {
        this.filterProps[k[0]] = [k[1]];
      }
    });
    console.log(this.filterProps);
  }

  applyFilters(buildings: BuildingMap) {
    // if there are no filters, do nothing and return
    if (Object.keys(this.filterProps).length === 0) return buildings;

    // convert building object to array to ease filtering
    const buildingsArray = Array.from(Object.values(buildings).flat());
    const filterKeys = Object.keys(this.filterProps);
    // filter buildings
    const filtered = buildingsArray.filter((building: TableRow) =>
      filterKeys.every((key: string) => {
        if (!this.filterProps[key].length) return true;
        return this.filterProps[key].includes(building[key]);
      })
    );
    // convert filtered array of buildings back to object
    const filteredBuildings: BuildingMap =
      this.dataService.mapBuildings(filtered);
    return filteredBuildings;
  }
}
