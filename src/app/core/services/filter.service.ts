import { Injectable } from '@angular/core';
import { BuildingMap } from '@core/models/building.model';
import { TableRow } from '@core/models/rdf-data.model';
// import { BuildingMap } from '@core/models/building.model';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private filterProps: { [key: string]: string[] } = {};
  /**
   *
   * @param filter 'epc-C:epc-G:building_type-SemiDetached:property_type-Bungalow'
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
  }

  applyFilters(buildings: BuildingMap) {
    if (Object.keys(this.filterProps).length === 0) return buildings;
    const filterKeys = Object.keys(this.filterProps);
    const filteredBuildings: BuildingMap = {};
    // iterate through buildings object
    Object.keys(buildings).forEach((toid: string) => {
      // iterate the buildings associated with a toid.
      // could be one or many
      buildings[toid].forEach((building: TableRow) => {
        // check if filter keus
        filterKeys.every((key: string) => {
          //ignore empty filter
          if (!this.filterProps[key].length) return;
          // check if building matches filter
          const keepBuilding = this.filterProps[key].find(
            filter => filter.toUpperCase() === building[key]
          );
          if (keepBuilding) {
            if (filteredBuildings[toid]) {
              filteredBuildings[toid].push(building);
            } else {
              filteredBuildings[toid] = [building];
            }
          }
        });
      });
    });
    return filteredBuildings;
  }
}
