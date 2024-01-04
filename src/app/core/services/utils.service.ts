import { Injectable, inject, signal, computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { tap, combineLatest } from 'rxjs';

import { MapLayerFilter } from '@core/models/layer-filter.model';
import { Expression } from 'mapbox-gl';
import booleanWithin from '@turf/boolean-within';
import { Polygon } from 'geojson';

import { SettingService } from './setting.service';
import { DataService } from './data.service';
import { MapService } from './map.service';
import { SpatialQueryService } from './spatial-query.service';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

import { BuildingMap } from '@core/models/building.model';
import { TableRow } from '@core/models/rdf-data.model';

import { MapLayerId } from '@core/types/map-layer-id';

type MapLayerPaintKeys = 'fill-extrusion-color' | 'fill-extrusion-pattern';

interface ExpressionAndMapLayerFilter {
  expression: Expression;
  mapLayerFilter: MapLayerFilter & { layerId: MapLayerId };
}

type CurrentExpressions = Record<
  MapLayerPaintKeys,
  ExpressionAndMapLayerFilter
>;

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

  currentMapViewExpressions = signal<CurrentExpressions | undefined>(undefined);

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

    /**
     * Get the default colors and patterns
     * for tolids.
     */
    const defaultColor = this.epcColours['default'];
    const defaultPattern = 'default-pattern';

    /**
     * Create a new expressions object.
     *
     * This object is used to set both a combined
     * expression and filter options to a map layer.
     *
     * For single dwelling buildings, we use a solid
     * epc colour.  For multi dwelling buildings, we
     * use a patterned epc colour.
     */
    const expressions: CurrentExpressions = {
      'fill-extrusion-color': {
        mapLayerFilter: {
          layerId: 'OS/TopographicArea_2/Building/1_3D-Single-Dwelling',
          expression: ['all', ['==', '_symbol', 4], ['in', 'TOID']],
        },
        expression: ['match', ['get', 'TOID']],
      },
      'fill-extrusion-pattern': {
        mapLayerFilter: {
          layerId: 'OS/TopographicArea_2/Building/1_3D-Multi-Dwelling',
          expression: ['all', ['==', '_symbol', 4], ['in', 'TOID']],
        },
        expression: ['match', ['get', 'TOID']],
      },
    };

    /**
     *  Add To Expression.
     *
     * Add a toid to an expression. The tolid is only added
     * to the correspondin layer filter if it doesn't
     * already exist.
     */
    function addTooExpression(
      expressionKey: keyof CurrentExpressions,
      toid: string,
      value: string
    ): void {
      expressions[expressionKey].expression.push(toid, value);
      !expressions[expressionKey].mapLayerFilter.expression[2].includes(toid)
        ? expressions[expressionKey].mapLayerFilter.expression[2].push(toid)
        : null;
    }

    /** Iterate through the filtered toids */
    Object.keys(filteredBuildings).forEach((toid: string) => {
      /** Get the buildings UPRN's for a TOID */
      const buildings: TableRow[] = filteredBuildings[toid];

      if (buildings.length === 0) {
        /** No UPRNs for a TOID */

        addTooExpression('fill-extrusion-color', toid, defaultColor);
      } else if (buildings.length === 1) {
        /* One UPRN for a TOID */

        const { epc } = buildings[0];
        addTooExpression(
          'fill-extrusion-color',
          toid,
          epc ? this.getEPCColour(epc) : defaultPattern
        );
      } else if (buildings.length > 1) {
        /* Multiple UPRNs for a TOID */

        const buildingEPCs: string[] = [];
        buildings.forEach(({ epc }) => {
          if (epc) {
            buildingEPCs.push(epc);
          }
        });

        addTooExpression(
          'fill-extrusion-pattern',
          toid,
          buildingEPCs.length === 0
            ? defaultPattern
            : this.getEPCPattern(buildingEPCs)
        );
      }
    });

    /**
     * Set the default color and pattern for all
     * other toids not covered by the expression
     * but are filtered in the layer.
     */
    expressions['fill-extrusion-color'].expression.push(defaultColor);
    expressions['fill-extrusion-pattern'].expression.push(defaultPattern);

    this.setCurrentMapExpression(expressions);
  }

  /**
   * Get the mean EPC pattern for a TOID.
   *
   * Determins the average EPC rating for a TOID
   * then returns the corresponding EPC pattern.
   */
  getEPCPattern(epcRatings: string[]) {
    const colorBlindMode = this.colorBlindMode();
    const meanEPC = this.getMeanEPCValue(epcRatings).toLowerCase();
    return colorBlindMode ? `cb-${meanEPC}-pattern` : `${meanEPC}-pattern`;
  }

  setCurrentMapExpression(expressions: CurrentExpressions) {
    this.currentMapViewExpressions.set(expressions);
    this.updateMap();
  }

  updateMap() {
    const currentExpressions = this.currentMapViewExpressions();
    if (currentExpressions === undefined) return;

    /*
     * For each of the expressions, set the
     * corresponding map layer filter and
     * expression for the layer.
     */
    Object.keys(currentExpressions).forEach(key => {
      const expressionKey = key as keyof CurrentExpressions;
      const { expression, mapLayerFilter } = currentExpressions[expressionKey];

      this.mapService.filterMapLayer(mapLayerFilter);
      this.mapService.setMapLayerPaint(mapLayerFilter.layerId, key, expression);
    });
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
