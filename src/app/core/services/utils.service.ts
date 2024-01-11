import { Injectable, inject, signal, computed, NgZone } from '@angular/core';
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

import { BuildingMap, BuildingModel } from '@core/models/building.model';
import { FilterProps } from '@core/models/advanced-filters.model';

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
  filterProps = signal<FilterProps>({});
  private zone = inject(NgZone);
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

  setFilters(filters: FilterProps) {
    this.filterProps.set(filters);
  }

  /**
   * Create an array of building TOIDS and colours from buildings
   * @param addresses filtered addresses within map bounds
   * @returns MapboxGLJS expression
   */
  createBuildingColourFilter() {
    let buildings = this.dataService.buildings();
    if (!buildings || !Object.keys(buildings).length) {
      return;
    }
    buildings = this.filterBuildings(buildings);

    const spatialFilter = this.spatialQueryService.spatialFilterBounds();
    const filteredBuildings = this.filterBuildingsWithinBounds(
      buildings!,
      spatialFilter
    );

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
      const buildings: BuildingModel[] = filteredBuildings[toid];

      if (buildings.length === 0) {
        /** No UPRNs for a TOID */

        addTooExpression('fill-extrusion-color', toid, defaultColor);
      } else if (buildings.length === 1) {
        /* One UPRN for a TOID */

        const { EPC } = buildings[0];
        addTooExpression(
          'fill-extrusion-color',
          toid,
          EPC ? this.getEPCColour(EPC) : defaultPattern
        );
      } else if (buildings.length > 1) {
        /* Multiple UPRNs for a TOID */

        const buildingEPCs: string[] = [];
        buildings.forEach(({ EPC }) => {
          if (EPC) {
            buildingEPCs.push(EPC);
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

    /** apply the expression to update map layers */
    this.setCurrentMapExpression(expressions);

    /**
     * if there are filters set filtered buildings to
     * display results
     */
    if (Object.keys(this.filterProps()).length || spatialFilter) {
      this.dataService.setSelectedBuildings(
        Object.values(filteredBuildings).flat()
      );
    }
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
    /** get all features within current map bounds */
    const currentMapFeatures = this.mapService.queryFeatures();

    // check if there is a user drawn spatial filter
    const spatialFilter = spatialQueryBounds
      ? this.spatialQueryService.spatialFilterGeom()
      : undefined;
    const filteredToids: BuildingMap = {};
    currentMapFeatures
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
      .sort((a, b) => (a.properties!.TOID < b.properties!.TOID ? -1 : 1))
      .forEach(feature => {
        const building = buildings[feature.properties!.TOID];
        if (building) {
          filteredToids[feature.properties!.TOID] = building;
        }
      });
    return filteredToids;
  }

  /**
   * This filters the building data by the user selected
   * filters
   * @param buildings all buildings data
   * @returns BuildingMap of filtered buildings
   */
  filterBuildings(buildings: BuildingMap): BuildingMap {
    const filterProps = this.filterProps();
    if (Object.keys(filterProps).length === 0) return buildings;

    // convert building object to array to ease filtering
    const buildingsArray = Array.from(Object.values(buildings).flat());
    const filterKeys = Object.keys(filterProps);
    // filter buildings
    const filtered = buildingsArray.filter((building: BuildingModel) =>
      filterKeys.every(key => {
        if (!filterProps[key as keyof FilterProps]?.length) return true;

        return filterProps[key as keyof FilterProps]?.includes(
          // eslint-disable-next-line
          // @ts-ignore
          building[key as keyof BuildingModel]
        );
      })
    );
    // convert filtered array of buildings back to object
    const filteredBuildings: BuildingMap =
      this.dataService.mapBuildings(filtered);
    return filteredBuildings;
  }

  /**
   * Find buildings based on TOID
   * @param toid toid of building
   * @returns array of buildings associated with toid
   */
  getBuildings(toid: string): BuildingModel[] {
    const allBuildings = this.dataService.buildings();
    if (!allBuildings) {
      return [];
    }
    const buildings = allBuildings[toid];
    if (buildings) {
      return buildings.flat();
    }
    return [];
  }

  /**
   * Splits a full address and returns part
   * of the address
   * @param address full address string
   * @param index index of address part to return after
   * address is split
   * @returns address part
   */
  splitAddress(index: number, fullAddress?: string) {
    if (!fullAddress) return;
    return fullAddress.split(',')[index];
  }

  /**
   * Handle selecting of results card in results list
   * @param TOID
   * @param UPRN
   */
  resultsCardSelected(TOID: string, UPRN: number) {
    this.selectResultsCard(UPRN);
    /** if its not multi dwelling select on map */
    if (this.multiDwelling() === '') {
      this.selectSingleDwellingOnMap(TOID);
    }
  }

  /**
   * Handle deselecting results card in results list
   */
  resultsCardDeselected() {
    /**
     * if multi-dwelling don't deselect
     * building on map
     */
    if (this.multiDwelling() !== '') {
      this.deselectResultsCard();
      this.closeBuildingDetails();
    } else {
      this.deselectResultsCard();
      this.closeBuildingDetails();
      this.deselectSingleDwellingOnMap();
    }
  }

  /**
   * Handle clicking 'View Details' button
   * @param TOID
   * @param UPRN
   * @param mapCenter
   */
  viewDetailsButtonClick(TOID: string, UPRN: number, mapCenter: number[]) {
    /** if its not viewing details for a multi dwelling select on map */
    if (this.multiDwelling() === '') {
      this.selectSingleDwellingOnMap(TOID);
    }
    this.selectResultsCard(UPRN);
    this.viewBuildingDetails(UPRN);
    /** if filtered data also zoom map */
    const filterProps = this.filterProps();
    if (Object.keys(filterProps).length) {
      this.mapService.zoomToCoords(mapCenter);
    }
  }

  /**
   * Handle 'View Details' close button click
   */
  closeDetailsButtonClick() {
    this.closeBuildingDetails();
    /** if not filtered data or spatial selection also clear map */
    const filterProps = this.filterProps();
    const spatialFilter = this.spatialQueryService.spatialFilterEnabled();
    if (
      !spatialFilter &&
      !Object.keys(filterProps).length &&
      this.multiDwelling() === ''
    ) {
      this.deselectSingleDwellingOnMap();
    }
  }

  /**
   * Handle clicking a single dwelling building on the map
   * @param TOID
   * @param UPRN
   */
  selectedUPRN = signal<number | undefined>(undefined);
  singleDwellingSelectedOnMap(TOID: string, UPRN: number) {
    this.selectedUPRN.set(UPRN);
    this.selectSingleDwellingOnMap(TOID);
    this.viewBuildingDetails(UPRN);
    /** if filtered data then results panel open so select card */
    const filterProps = this.filterProps();
    const spatialFilter = this.spatialQueryService.spatialFilterEnabled();
    if (spatialFilter || Object.keys(filterProps).length) {
      this.selectResultsCard(UPRN);
    }
  }

  /**
   * Handle deselecting a single dwelling building on the map
   */
  singleDwellingDeselected() {
    this.selectedUPRN.set(undefined);
    this.deselectSingleDwellingOnMap();
    this.closeBuildingDetails();
    /** if filtered data then results panel open so deselect card*/
    const spatialFilter = this.spatialQueryService.spatialFilterEnabled();
    const filterProps = this.filterProps();
    if (spatialFilter || Object.keys(filterProps).length) {
      this.deselectResultsCard();
    }
  }

  /**
   * Handle selecting a multi-dwelling building on the map
   * @param TOID
   */
  multipleDwellingSelectedOnMap(TOID: string) {
    this.selectMultiDwellingOnMap(TOID);
  }

  /**
   * Handle deselecting a multi-dwelling building on the map
   */
  multiDwellingDeselected() {
    this.deselectMultiDwellingOnMap();
    this.deselectResultsCard();
    this.multiDwelling.set('');
  }

  setSpatialFilter(searchArea: GeoJSON.Feature<Polygon>) {
    this.dataService.setSelectedUPRN(undefined);
    this.dataService.setSelectedBuilding(undefined);
    this.spatialQueryService.setSelectedTOID('');

    /** clear building layer selections */
    this.spatialQueryService.selectBuilding('', true);
    this.spatialQueryService.selectBuilding('', false);
    this.spatialQueryService.setSpatialGeom(searchArea);
  }

  /**
   * Handle deleting spatial filter
   */
  deleteSpatialFilter() {
    this.singleDwellingDeselected();
    this.multiDwellingDeselected();
    this.spatialQueryService.setSpatialFilter(false);
    this.spatialQueryService.setSpatialFilterBounds(undefined);
    this.zone.run(() => this.closeResultsPanel());
  }

  /**
   * Handle closing of results panel
   */
  closeResultsPanel() {
    this.dataService.setSelectedBuildings(undefined);
  }

  selectedCardUPRN = signal<number | undefined>(undefined);
  multiDwelling = signal<string>('');

  /**
   * HELPER METHODS - DON'T CALL THESE DIRECTLY
   */

  /** set the UPRN of the selected results card */
  private selectResultsCard(UPRN: number) {
    this.selectedCardUPRN.set(UPRN);
  }

  private deselectResultsCard() {
    this.selectedCardUPRN.set(undefined);
    this.closeBuildingDetails();
  }

  private viewBuildingDetails(UPRN: number) {
    this.dataService.setSelectedUPRN(UPRN);
  }

  private closeBuildingDetails() {
    this.dataService.setSelectedUPRN(undefined);
    this.dataService.setSelectedBuilding(undefined);
  }

  private selectSingleDwellingOnMap(TOID: string) {
    this.spatialQueryService.setSelectedTOID(TOID);
    /** single dwelling building */
    this.spatialQueryService.selectBuilding(TOID, false);
    this.spatialQueryService.selectBuilding('', true);
  }

  private selectMultiDwellingOnMap(TOID: string) {
    this.multiDwelling.set(TOID);
    this.spatialQueryService.setSelectedTOID(TOID);
    /** multi-dwelling building */
    this.spatialQueryService.selectBuilding('', false);
    this.spatialQueryService.selectBuilding(TOID, true);

    /** only open results panel if there are no filters */
    const filterProps = this.filterProps();
    const spatialFilter = this.spatialQueryService.spatialFilterEnabled();
    if (!spatialFilter && !Object.keys(filterProps).length) {
      const buildings = this.getBuildings(TOID);
      this.openResultsPanel(buildings);
    }
    //TODO - handle multi dwelling building selection for filtered data
  }

  private deselectSingleDwellingOnMap() {
    this.spatialQueryService.setSelectedTOID('');
    /** single-dwelling building */
    this.spatialQueryService.selectBuilding('', false);
  }

  private deselectMultiDwellingOnMap() {
    /** if filtered data then results panel open */
    const filterProps = this.filterProps();
    const spatialFilter = this.spatialQueryService.spatialFilterEnabled();
    if (!spatialFilter && !Object.keys(filterProps).length) {
      this.closeBuildingDetails();
      this.zone.run(() => this.closeResultsPanel());
    }
    this.spatialQueryService.setSelectedTOID('');
    /** multi-dwelling building */
    this.spatialQueryService.selectBuilding('', true);
  }

  private openResultsPanel(buildings: BuildingModel[]) {
    this.dataService.setSelectedBuildings(buildings);
  }
}
