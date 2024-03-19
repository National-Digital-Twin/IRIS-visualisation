import { Injectable, inject, signal, NgZone } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { tap, combineLatest } from 'rxjs';

import { MapLayerFilter } from '@core/models/layer-filter.model';
import { Expression } from 'mapbox-gl';
import booleanWithin from '@turf/boolean-within';
import { Polygon } from 'geojson';

import { SettingsService, SETTINGS } from '@core/services/settings.service';
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
  private readonly settings = inject(SettingsService);
  private readonly colorBlindMode = this.settings.get(SETTINGS.ColorBlindMode);

  private dataService = inject(DataService);
  private mapService = inject(MapService);
  private spatialQueryService = inject(SpatialQueryService);
  private runtimeConfig = inject(RUNTIME_CONFIGURATION);

  private epcColours = this.runtimeConfig.epcColours;
  private readonly colorBlindEpcColors = this.runtimeConfig.epcColoursCD;

  currentMapViewExpressions = signal<CurrentExpressions | undefined>(undefined);
  filteredBuildings = signal<BuildingMap | undefined>(undefined);

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
    const unfilteredBuildings = this.dataService.buildings();
    if (!unfilteredBuildings || !Object.keys(unfilteredBuildings).length) {
      return;
    }
    const filterProps = this.filterProps();
    const buildings = this.filterBuildings(unfilteredBuildings, filterProps);

    const spatialFilter = this.spatialQueryService.spatialFilterBounds();
    const filteredBuildings = this.filterBuildingsWithinBounds(
      buildings!,
      spatialFilter
    );

    // set the filtered buildings so that the filters can search it
    this.filteredBuildings.set(filteredBuildings);

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
     * Add a toid to an expression. The toid is only added
     * to the corresponding layer filter if it doesn't
     * already exist.
     */
    function addToidExpression(
      expressionKey: keyof CurrentExpressions,
      toid: string,
      value: string
    ): void {
      expressions[expressionKey].expression.push(toid, value);
      !expressions[expressionKey].mapLayerFilter.expression[2].includes(toid)
        ? expressions[expressionKey].mapLayerFilter.expression[2].push(toid)
        : null;
    }

    const flaggedTOIDS: string[] = [];
    /** TOIDS to exclude from the default layer */
    const excludeFromDefault: string[] = [];

    /** Iterate through the filtered toids */
    Object.keys(filteredBuildings).forEach(toid => {
      /** Get the buildings UPRN's for a TOID */
      const dwellings: BuildingModel[] = filteredBuildings[toid];

      if (dwellings.length === 0) {
        /** No UPRNs for a TOID */

        addToidExpression('fill-extrusion-color', toid, defaultColor);
      } else if (dwellings.length === 1) {
        /* One UPRN for a TOID */

        const { EPC, Flagged } = dwellings[0];
        const color = EPC ? this.getEPCColour(EPC) : defaultPattern;

        /* Add toid to flagged array if flagged */
        if (Flagged) flaggedTOIDS.push(toid);
        /** Add toid to default layer array */
        excludeFromDefault.push(toid);

        /* if the building was originally a multi dwelling building
         * before filtering then set an epc pattern over epc color */
        const multiDwelling = unfilteredBuildings![toid].length > 1;
        if (multiDwelling) {
          const pattern = EPC ? this.getEPCPattern([EPC]) : defaultPattern;
          addToidExpression('fill-extrusion-pattern', toid, pattern);
        } else {
          addToidExpression('fill-extrusion-color', toid, color);
        }
      } else if (dwellings.length > 1) {
        /* Multiple UPRNs for a TOID */

        const epcs: string[] = [];
        const Flagged = dwellings.some(({ Flagged }) => Flagged);
        dwellings.forEach(({ EPC }) => {
          if (EPC) epcs.push(EPC);
        });
        const pattern =
          epcs.length === 0 ? defaultPattern : this.getEPCPattern(epcs);

        /* Add toid to flagged array if flagged */
        if (Flagged) flaggedTOIDS.push(toid);
        /** Add toid to default layer array */
        excludeFromDefault.push(toid);

        addToidExpression('fill-extrusion-pattern', toid, pattern);
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
     * If there is a building currently selected, check if it's in the
     * filtered buildings data and if not deselect it
     */
    if (this.dataService.selectedUPRN()) {
      const exists = this.uprnInFilteredBuildings(
        this.dataService.selectedUPRN()!,
        filteredBuildings
      );
      if (!exists) this.singleDwellingDeselected();
    }

    /**
     * if there are filters set filtered buildings to
     * display results
     */
    if (Object.keys(this.filterProps()).length || spatialFilter) {
      this.dataService.setSelectedBuildings(Object.values(filteredBuildings));
    }

    /* Apply the flagged filter */
    this.mapService.filterMapLayer({
      layerId: 'OS/TopographicArea_2/Building/1_3D-Dwelling-Flagged',
      expression: [
        'all',
        ['==', '_symbol', 4],
        ['in', 'TOID', ...flaggedTOIDS],
      ],
    });
    /** Remove from toids from default layer so they're not rendered */
    this.mapService.filterMapLayer({
      layerId: 'OS/TopographicArea_2/Building/1_3D',
      expression: [
        'all',
        ['==', '_symbol', 4],
        ['!in', 'TOID', ...excludeFromDefault],
      ],
    });
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
    // remove EPC none from the epcs to average
    const epcsToAverage = epcRatings.filter(rating => rating !== 'none');
    if (epcsToAverage.length > 0) {
      // get the weighting for each epc value
      epcsToAverage.forEach(val => scores.push(weightings[val]));
      const sum = scores.reduce((a, c) => a + c, 0);
      const mean = sum / scores.length;
      Object.keys(weightings).forEach((epc: string) => {
        // find the corresponding weighting for the mean
        if (Math.round(mean) === weightings[epc]) {
          meanEPC = epc;
        }
      });
      return meanEPC;
    } else {
      return 'none';
    }
  }

  getEPCColour(epcRating: string): string {
    const colorBlindMode = this.colorBlindMode();
    return this[colorBlindMode ? 'colorBlindEpcColors' : 'epcColours'][
      epcRating ? epcRating : 'default'
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
  filterBuildings(
    buildings: BuildingMap,
    filterProps: FilterProps
  ): BuildingMap {
    if (Object.keys(filterProps).length === 0) return buildings;

    // convert building object to array to ease filtering
    const buildingsArray = Array.from(Object.values(buildings).flat());
    const filterKeys = Object.keys(filterProps);
    // filter buildings
    const filtered = buildingsArray.filter((building: BuildingModel) =>
      filterKeys.every(key => {
        if (!filterProps[key as keyof FilterProps]?.length) return true;
        // remove additional quotes for year filter
        const removeQuotes = filterProps[key as keyof FilterProps]?.map(k =>
          k.replace(/['"]+/g, '')
        );
        /** if flagged filter exists return the building if it has a flag */
        if (key === 'Flagged' && building.Flagged !== undefined) {
          return true;
        } else {
          return removeQuotes?.includes(
            // eslint-disable-next-line
            // @ts-ignore
            building[key as keyof BuildingModel]
          );
        }
      })
    );
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

  uprnInFilteredBuildings(uprn: string, buildings: BuildingMap): boolean {
    return Object.values(buildings)
      .flat()
      .some(b => b.UPRN === uprn);
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
  resultsCardSelected(TOID: string, UPRN: string) {
    /** select single dwelling on map */
    if (UPRN !== '' && TOID !== '') {
      this.selectResultsCard(UPRN);
      this.selectSingleDwellingOnMap(TOID);
    }
    /** select multi-dwelling on map */
    if (UPRN === '' && TOID !== '') {
      this.selectMultiDwellingOnMap(TOID);
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
    if (this.multiDwelling() !== undefined) {
      this.deselectResultsCard();
      this.closeBuildingDetails();
      this.multiDwelling.set(undefined);
      this.deselectMultiDwellingOnMap();
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
  viewDetailsButtonClick(TOID: string, UPRN: string, mapCenter: number[]) {
    /** if its not viewing details for a multi dwelling select on map */
    if (this.multiDwelling() === undefined) {
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
      this.multiDwelling() === undefined
    ) {
      this.deselectSingleDwellingOnMap();
    }
  }

  /**
   * Handle clicking a single dwelling building on the map
   * @param TOID
   * @param UPRN
   */
  selectedUPRN = signal<string | undefined>(undefined);
  singleDwellingSelectedOnMap(TOID: string, UPRN: string) {
    this.selectedUPRN.set(UPRN);
    this.multiDwellingDeselected();
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
   * Handle clicking a multi-dwelling building on the map
   * @param TOID
   */
  multipleDwellingSelectedOnMap(TOID: string) {
    this.singleDwellingDeselected();
    this.selectMultiDwellingOnMap(TOID);
  }

  /**
   * Handle deselecting a multi-dwelling building on the map
   */
  multiDwellingDeselected() {
    this.multiDwelling.set(undefined);
    this.deselectMultiDwellingOnMap();
    this.deselectResultsCard();
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

  selectedCardUPRN = signal<string | undefined>(undefined);
  multiDwelling = signal<string | undefined>(undefined);

  /** set the UPRN of the selected results card */
  private selectResultsCard(UPRN: string) {
    this.selectedCardUPRN.set(UPRN);
  }

  private deselectResultsCard() {
    this.selectedCardUPRN.set(undefined);
    this.closeBuildingDetails();
  }

  private viewBuildingDetails(UPRN: string) {
    this.dataService.setSelectedUPRN(UPRN);
    const building = this.dataService.getBuildingByUPRN(UPRN.toString());
    this.dataService.setSelectedBuilding(building);
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
    this.dataService.setSelectedBuildings([buildings]);
  }

  getValidFilters(filters: FilterProps) {
    const advancedFilterKeys = Object.keys(filters);
    const filterCopy = { ...filters };
    // remove advanced filters without a value
    Object.keys(filterCopy).forEach(key => {
      const filterKey = key as keyof FilterProps;
      if (filterCopy[filterKey] === null) {
        delete filterCopy[filterKey];
      }
    });

    // identify main filter props
    const mainFilterProps = { ...this.filterProps() };
    Object.keys(mainFilterProps).forEach(key => {
      const filterKey = key as keyof FilterProps;
      if (advancedFilterKeys.includes(key)) {
        delete mainFilterProps[filterKey];
      }
    });
    // merge filters to create new potential filter
    const newFilter = { ...mainFilterProps, ...filterCopy };

    const unfilteredBuildings = this.dataService.buildings();
    // filter buildings based on potential filter
    const potentiallyFilteredBuildings = this.filterBuildings(
      unfilteredBuildings!,
      newFilter
    );

    // get unique set of valid options for each advanced filter
    const flattenedBuildings = Object.values(
      potentiallyFilteredBuildings
    ).flat();

    return this.getUniqueOptions(advancedFilterKeys, flattenedBuildings);
  }

  getAllUniqueFilterOptions(filters: FilterProps) {
    const unfilteredBuildings = this.dataService.buildings();
    const flattenedBuildings = Object.values(unfilteredBuildings!).flat();
    const options = this.getUniqueOptions(
      Object.keys(filters),
      flattenedBuildings
    );
    return options;
  }

  getUniqueOptions(filterKeys: string[], flattenedBuildings: BuildingModel[]) {
    const availableValues: FilterProps = {};
    filterKeys.forEach(key => {
      const keyProp = key as keyof BuildingModel;
      const options = [
        ...new Set(
          flattenedBuildings.map(b => {
            return b[keyProp] ?? '';
          })
        ),
      ].sort();
      if (options.includes('NoData')) {
        options.push(options.splice(options.indexOf('NoData'), 1)[0]);
      }
      if (options.includes('')) {
        options.splice(options.indexOf(''), 1);
      }
      availableValues[key as keyof FilterProps] = options;
    });
    return availableValues;
  }
}
