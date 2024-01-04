import { Injectable, inject, signal, computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { tap, combineLatest } from 'rxjs';

import { Expression } from 'mapbox-gl';
import booleanWithin from '@turf/boolean-within';
import { Polygon } from 'geojson';

import { SettingService } from './setting.service';
import { DataService } from './data.service';
import { MapService } from './map.service';
import { SpatialQueryService } from './spatial-query.service';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

import { BuildingMap, BuildingModel } from '@core/models/building.model';

@Injectable({
  providedIn: 'root',
})
export class UtilService {
  private readonly settingService = inject(SettingService);
  private readonly colorBlindMode = computed(
    () => this.settingService.settings()['colorBlindMode'] as boolean
  );

  private dataService = inject(DataService);
  private mapService = inject(MapService);
  private spatialQueryService = inject(SpatialQueryService);
  private runtimeConfig = inject(RUNTIME_CONFIGURATION);

  private epcColours = this.runtimeConfig.epcColours;
  private readonly colorBlindEpcColors = this.runtimeConfig.epcColoursCD;

  currentMapViewExpression = signal<Expression | undefined>(undefined);

  /**
   * Watch for when the buildings data is added to the buildings signal
   * as this indicates first app load.  Then create map layer filter
   * to colour buildings layer
   */
  private buildingData$ = combineLatest([
    toObservable(this.dataService.buildings),
    toObservable(this.colorBlindMode),
  ]).pipe(
    tap(([buildings]) => {
      if (buildings) {
        this.createBuildingColourFilter();
      }
    })
  );

  readOnlyBuildingData = toSignal(this.buildingData$, {} as BuildingMap);

  /**
   * Create an array of building TOIDS and colours from buildings
   * @param addresses filtered addresses within map bounds
   * @returns MapboxGLJS expression
   */
  createBuildingColourFilter() {
    const buildings = this.dataService.buildings();
    if (!buildings || !Object.keys(buildings).length) return;
    const spatialFilter = this.spatialQueryService.spatialFilterBounds();
    const filteredBuildings = this.filterBuildingsWithinBounds(
      buildings!,
      spatialFilter
    );
    // if there is a spatial filter get the UPRNs within the filter area
    // and set in signal to get data from IA to display in filter results
    if (spatialFilter) {
      const uprns = this.getUPRNsWithSpatialFilter(filteredBuildings);
      uprns.length === 1
        ? this.dataService.setSelectedUPRN(uprns[0])
        : this.dataService.setSelectedUPRNs(uprns);
    }
    const matchExpression: Expression = ['match', ['get', 'TOID']];
    // iterate through toid object and get toid (as key)
    Object.keys(filteredBuildings).forEach((key: string) => {
      const toid = key;
      // get the uprns for the corresponding toid
      const buildings: BuildingModel[] = filteredBuildings[key];
      /* One UPRN for a TOID */
      if (buildings.length === 1) {
        const epc = buildings[0].EPC;
        if (epc) {
          const colour = this.getEPCColour(epc);
          matchExpression.push(toid, colour);
        } else {
          matchExpression.push(toid, this.epcColours['default']);
        }
      } else if (buildings.length > 1) {
        /**
         * Multiple UPRNs for a single TOID.
         *
         * Get the EPC value for each
         * UPRN and add to array
         */
        const buildingEPCs: string[] = [];
        buildings.forEach(building => {
          const epc = building.EPC;
          if (epc) {
            buildingEPCs.push(epc);
          }
        });
        /**
         * If there are no EPCs for any of the
         * building UPRNs, add the default colour
         */
        if (buildingEPCs.length === 0) {
          matchExpression.push(toid, this.epcColours['default']);
        } else {
          /**
           * If there are mulitple EPCs, get the mean value
           */
          const meanEPC = this.getMeanEPCValue(buildingEPCs);

          const buildingColor = this.getEPCColour(meanEPC);
          matchExpression.push(toid, buildingColor);
        }
      }
    });
    matchExpression.push(this.epcColours['default']);
    this.setCurrentMapExpression(matchExpression);
  }

  setCurrentMapExpression(expression: Expression) {
    this.currentMapViewExpression.set(expression);
    this.updateMap();
  }

  updateMap() {
    this.mapService.setMapLayerPaint(
      'OS/TopographicArea_2/Building/1_3D',
      'fill-extrusion-color',
      this.currentMapViewExpression()!
    );
  }

  /**
   *
   * @param epcRatings Array of EPC ratings
   * @returns The mean EPC rating
   */
  getMeanEPCValue(epcRatings: string[]) {
    let meanEPC = '';
    // assign a weighting to the EPC ratings
    const weightings: { [key: string]: number } = {
      A: 1,
      B: 2,
      C: 3,
      D: 4,
      E: 5,
      F: 6,
      G: 7,
    };
    const scores: number[] = [];
    // get the weighting for each epc value
    epcRatings.forEach(val => scores.push(weightings[val]));
    const sum = scores.reduce((a, c) => a + c, 0);
    const mean = sum / scores.length;
    Object.keys(weightings).forEach((epc: string) => {
      // find the corresponding weighting for the mean
      if (Math.floor(mean) === weightings[epc]) {
        meanEPC = epc;
      }
    });
    return meanEPC;
  }

  getEPCColour(SAPBand: string): string {
    const colorBlindMode = this.colorBlindMode();
    return this[colorBlindMode ? 'colorBlindEpcColors' : 'epcColours'][
      SAPBand ? SAPBand : 'default'
    ];
  }

  filterBuildingsWithinBounds(
    buildings: BuildingMap,
    spatialQueryBounds?: number[]
  ) {
    // if there is a spatial filter get features
    // within it's bounding box, else get features
    // within map extent
    const currentFeatures = spatialQueryBounds
      ? this.mapService.queryFeaturesByGeom(spatialQueryBounds)
      : this.mapService.queryFeatures();

    // check if there is a user drawn spatial filter
    const spatialFilter = spatialQueryBounds
      ? this.spatialQueryService.spatialFilterGeom()
      : undefined;
    const filteredToids: BuildingMap = {};
    currentFeatures
      .filter(feature =>
        // if there is a spatial filter
        // remove any features outside of
        // the filter geometry
        spatialFilter
          ? booleanWithin(
              feature.geometry as Polygon,
              spatialFilter?.geometry as Polygon
            )
          : feature
      )
      .forEach(feature => {
        const building = buildings[feature.properties!.TOID];
        if (building) {
          filteredToids[feature.properties!.TOID] = building;
        }
      });
    return filteredToids;
  }

  /**
   * Get the UPRNs for the buildings within the spatial
   * filter
   * @param filteredToids toids with spatial filter area
   * @returns array of uprns
   */
  getUPRNsWithSpatialFilter(filteredToids: BuildingMap): number[] {
    let filteredUPRNs: number[] = [];
    Object.keys(filteredToids).forEach((toid: string) => {
      const uprns = this.dataService.getBuildingUPRNs(toid);
      filteredUPRNs = filteredUPRNs.concat(uprns);
    });
    return filteredUPRNs;
  }

  addEPCPrefix(epcRatings?: string[]) {
    return epcRatings
      ? epcRatings.map(r => `BuildingWithEnergyRatingOf${r}`)
      : [];
  }
}
