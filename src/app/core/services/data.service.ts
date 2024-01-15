import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  EMPTY,
  Observable,
  Subscriber,
  catchError,
  filter,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { SEARCH_ENDPOINT } from '@core/tokens/search-endpoint.token';
import { SPARQLReturn, TableRow } from '@core/models/rdf-data.model';
import {
  BuildingDetailsModel,
  BuildingMap,
  BuildingModel,
  BuildingPart,
  BuildingPartMap,
} from '@core/models/building.model';

import { Queries } from './Queries';

import {
  EPCRating,
  FloorConstruction,
  RoofConstruction,
  WallConstruction,
  WindowGlazing,
} from '@core/enums';
import {
  EPCBuildingResponseModel,
  NoEPCBuildingResponseModel,
} from '@core/models/building-response.model';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly searchEndpoint: string = inject(SEARCH_ENDPOINT);

  private queries = new Queries();

  // single uprn
  selectedUPRN = signal<number | undefined>(undefined);
  selectedBuilding = signal<BuildingDetailsModel | undefined>(undefined);
  // multiple buildings
  buildingsSelection = signal<BuildingModel[][] | undefined>(undefined);

  buildingsEPC$ = this.selectTable(this.queries.getEPCData()).pipe(
    map(epc =>
      this.mapEPCBuildings(epc as unknown as EPCBuildingResponseModel[])
    )
  );
  buildingsNoEPC$ = this.selectTable(this.queries.getNoEPCData()).pipe(
    map(noEPC =>
      this.mapNonEPCBuildings(noEPC as unknown as NoEPCBuildingResponseModel[])
    )
  );

  /**
   * Get all building data
   * @returns Observable<BuildingMap>
   */
  allData$ = forkJoin([this.buildingsEPC$, this.buildingsNoEPC$]).pipe(
    map(([epc, noEPC]) => this.combineBuildingData(epc, noEPC))
  );

  private buildingResults = toSignal(this.allData$, {
    initialValue: undefined,
  });
  buildings = computed(() => this.buildingResults());

  /**
   * Create observable from selectedUPRN signal
   * React to emissions, piping the UPRN through an observable
   * pipeline.
   * Use switchmap to get the data
   * Use toSignal to automatically subscribe & unsubscribe
   */
  private buildingDetails$ = toObservable(this.selectedUPRN).pipe(
    filter(Boolean),
    map(uprn => {
      const epc = this.getEPCByUPRN(uprn);
      if (epc === EPCRating.none) {
        return this.queries.getNoEPCBuildingDetails(+uprn);
      } else {
        return this.queries.getBuildingDetails(+uprn);
      }
    }),
    switchMap(query =>
      this.getBuildingDetails(query).pipe(
        map(details => details[0] as unknown as BuildingDetailsModel),
        tap(details => {
          this.setSelectedBuilding(details);
        }),
        catchError(() => of({} as BuildingDetailsModel))
      )
    )
  );
  readOnlyBuildingDetails = toSignal(this.buildingDetails$, {
    initialValue: undefined,
  });

  /**
   * Get the related building parts for the selected building
   */
  private buildingParts$ = toObservable(this.selectedBuilding).pipe(
    filter(Boolean),
    switchMap(selectedBuilding => {
      /** buildings with no EPC don't have building parts */
      if (!selectedBuilding.EPC) {
        return EMPTY;
      } else {
        return this.getBuildingParts(selectedBuilding!.parts.split(';')).pipe(
          map(p => this.mapBuildingParts(p as unknown as BuildingPart[])),
          catchError(() => of({} as BuildingPartMap))
        );
      }
    })
  );

  private buildingParts = toSignal(this.buildingParts$);
  parts = computed(() => this.buildingParts());

  setSelectedUPRN(uprn: number | undefined) {
    this.selectedUPRN.set(uprn);
  }

  /**
   * Set individual building
   * @param building individual building
   */
  setSelectedBuilding(building: BuildingDetailsModel | undefined) {
    this.selectedBuilding.set(building ? building : undefined);
  }

  /**
   * Set multiple buildings
   * @param building buildings
   */
  setSelectedBuildings(buildings: BuildingModel[][] | undefined) {
    this.buildingsSelection.set(buildings ? buildings : undefined);
  }

  /**
   * Return building details for an individual building
   * @param query Query string to request data from IA
   * @returns
   */
  getBuildingDetails(query: string) {
    return this.selectTable(query);
  }

  /**
   * Return building parts
   * @param partURIs Building part URIs
   * @returns
   */
  getBuildingParts(partURIs: string[]) {
    const selectString = this.queries.getBuildingParts(partURIs);
    return this.selectTable(selectString);
  }

  /**
   * Query Telicent IA
   * @param query SPARQL query
   * @returns observable of parsed data
   */
  selectTable(query: string) {
    let newTable: Array<TableRow>;
    const uri = encodeURIComponent(query);
    const httpOptions = {
      withCredentials: true,
    };

    const tableObservable = new Observable(
      (observer: Subscriber<TableRow[]>) => {
        this.http
          .get<SPARQLReturn>(`${this.searchEndpoint}?query=${uri}`, httpOptions)
          .subscribe((data: SPARQLReturn) => {
            newTable = this.buildTable(data);
            observer.next(newTable);
            observer.complete();
          });
      }
    );
    return tableObservable;
  }

  /**
   * Converts a query result from the Telicent IA to an
   * array of objects
   * @param SPARQLReturn Query result from Telicent IA
   * @returns Array of parsed data
   */
  private buildTable(SPARQLReturn: SPARQLReturn) {
    const heads = SPARQLReturn.head.vars;
    const data = SPARQLReturn.results.bindings;
    const table: Array<TableRow> = [];

    // build empty table
    for (let row = 0; row < data.length; row++) {
      const rows: TableRow = {};
      for (let head = 0; head < heads.length; head++) {
        const colname: string = heads[head];
        const cellEntry = '';
        rows[colname] = cellEntry;
      }
      table.push(rows);
    }
    // fill table with data
    for (const rowNumber in data) {
      for (const colName in data[rowNumber]) {
        table[rowNumber][colName] = data[rowNumber][colName].value;
      }
    }
    return table;
  }

  /**
   * An object where TOIDS are keys, and values are an array of buildings
   * @param buildings array of buildings data
   * @returns an object with TOID as key, and array of buildings as values
   */
  mapBuildings(buildings: BuildingModel[]) {
    const buildingMap: BuildingMap = {};
    buildings.forEach((row: BuildingModel) => {
      /** add 'none' for buildings with no EPC rating */
      if (row.EPC === undefined) {
        row.EPC = EPCRating.none;
      }
      const toid = row.TOID ? row.TOID : row.ParentTOID;
      if (!toid) {
        return;
      }
      if (toid && buildingMap[toid]) {
        buildingMap[toid].push(row);
      } else {
        buildingMap[toid!] = [row];
      }
    });
    return buildingMap;
  }

  /**
   * An object where TOIDS are keys, and values are the building(s)
   * data
   * @param buildings array of buildings with EPC data
   * @returns an object with TOID as key, and an array of building
   * objects with epc
   */
  mapEPCBuildings(buildings: EPCBuildingResponseModel[]) {
    const buildingMap: BuildingMap = {};
    buildings.forEach((row: EPCBuildingResponseModel) => {
      const toid = row.TOID ? row.TOID : row.ParentTOID;
      /** if there is no TOID the building cannot be visualised */
      if (!toid) return;

      /** add 'none' for buildings with no EPC rating */
      const epc = row.EPC ? row.EPC : EPCRating.none;
      const yearOfAssessment = row.InspectionDate
        ? new Date(row.InspectionDate).getFullYear().toString()
        : '';
      /** get building parts */
      const parts = this.parseBuildingParts(row);

      const building: BuildingModel = {
        BuildForm: row.BuildForm,
        EPC: epc,
        FullAddress: row.FullAddress,
        InspectionDate: row.InspectionDate,
        PostCode: row.PostCode,
        PropertyType: row.PropertyType,
        UPRN: row.UPRN,
        YearOfAssessment: yearOfAssessment,
        ParentTOID: row.ParentTOID,
        TOID: toid,
        FloorConstruction: parts.FloorConstruction,
        FloorInsulation: parts.FloorInsulation,
        RoofConstruction: parts.RoofConstruction,
        RoofInsulationLocation: parts.RoofInsulationLocation,
        RoofInsulationThickness: parts.RoofInsulationThickness,
        WallConstruction: parts.WallConstruction,
        WallInsulation: parts.WallInsulation,
        WindowGlazing: parts.WindowGlazing,
      };
      if (buildingMap[toid]) {
        buildingMap[toid].push(building);
      } else {
        buildingMap[toid!] = [building];
      }
    });
    return buildingMap;
  }

  /**
   * An object where TOIDS are keys, and are is the building details
   * @param buildings array of building data with no EPC ratings
   * @returns an object with TOID as key, and object with an
   * array of building data
   */
  mapNonEPCBuildings(buildings: NoEPCBuildingResponseModel[]) {
    const buildingMap: BuildingMap = {};
    buildings.forEach((responseRow: NoEPCBuildingResponseModel) => {
      const building: BuildingModel = {
        ...responseRow,
        BuildForm: undefined,
        EPC: EPCRating.none,
        FloorConstruction: undefined,
        FloorInsulation: undefined,
        InspectionDate: undefined,
        PropertyType: undefined,
        RoofConstruction: undefined,
        RoofInsulationLocation: undefined,
        RoofInsulationThickness: undefined,
        WallConstruction: undefined,
        WallInsulation: undefined,
        WindowGlazing: undefined,
        YearOfAssessment: undefined,
      };
      /** if there is no TOID the building cannot be visualised */
      const toid = building.TOID ? building.TOID : building.ParentTOID;
      if (!toid) return;
      if (buildingMap[toid]) {
        buildingMap[toid].push(building as BuildingModel);
      } else {
        buildingMap[toid!] = [building as BuildingModel];
      }
    });
    return buildingMap;
  }

  /**
   * Combine the two building datasets
   * @param epcBuildings
   * @param nonEPCBuildings
   * @returns BuildingMap of all buildings
   */
  combineBuildingData(epcBuildings: BuildingMap, nonEPCBuildings: BuildingMap) {
    const allBuildings: BuildingMap = { ...epcBuildings };
    Object.keys(nonEPCBuildings).forEach((toid: string) => {
      if (allBuildings[toid]) {
        allBuildings[toid].concat(nonEPCBuildings[toid]);
      } else {
        allBuildings[toid] = nonEPCBuildings[toid];
      }
    });
    return allBuildings;
  }

  /**
   * Maps part types to parts details
   *
   * @param parts building parts
   * @returns object with key as part name
   * and details as value for use in details panel
   */
  mapBuildingParts(parts: BuildingPart[]) {
    const buildingPartMap: BuildingPartMap = {};
    parts.forEach((part: BuildingPart) => {
      /**
       * if PartSuperType === 'PartOfBuiling'
       * the source data value is 'Other'
       */
      const key =
        part.PartSuperType === 'PartOfBuilding'
          ? part.PartType
          : part.PartSuperType;
      buildingPartMap[key] = part;
    });
    return buildingPartMap;
  }

  getEPCByUPRN(uprn: number): string {
    const allBuildings = this.buildings();
    const flatBuildings: BuildingModel[] = Object.values(allBuildings!).flat();

    const building = flatBuildings.find(building => +building.UPRN === uprn);
    return building!.EPC!;
  }

  private isWallKey(value: string): value is keyof typeof WallConstruction {
    return Object.keys(WallConstruction).includes(
      value as unknown as WallConstruction
    );
  }

  private isWindowKey(value: string): value is keyof typeof WindowGlazing {
    return Object.keys(WindowGlazing).includes(
      value as unknown as WindowGlazing
    );
  }

  private isRoofKey(value: string): value is keyof typeof RoofConstruction {
    return Object.keys(RoofConstruction).includes(
      value as unknown as RoofConstruction
    );
  }

  private isFloorKey(value: string): value is keyof typeof FloorConstruction {
    return Object.keys(FloorConstruction).includes(
      value as unknown as FloorConstruction
    );
  }

  /**
   * Building parts are returned from the IA in the format
   * PartTypes: "CavityWall; DoubleGlazedBefore2002Window; SolidFloor; FlatRoof",
   * InsulationTypes: "NA; NA; NA; AssumedLimitedInsulation",
   * InsulationThickness: "NA; NA; NA; NA",
   * InsulationThicknessLowerBound: "NA; NA; NA; NA"
   *
   * This function:
   * 1. Splits the PartTypes string and for each part identifies if it's a Wall,
   * Window, Roof or Floor.
   * 2. Using the index of the part, it then finds the corresponding insulation type
   * and thicknesses
   * @param row EPCBuildingResponseModel
   * @returns object of parts and insulation types and thicknesses
   */
  private parseBuildingParts(row: EPCBuildingResponseModel) {
    const parts = {
      FloorConstruction: 'NA',
      FloorInsulation: 'NA',
      RoofConstruction: 'NA',
      RoofInsulationLocation: 'NA',
      RoofInsulationThickness: 'NA',
      WallConstruction: 'NA',
      WallInsulation: 'NA',
      WindowGlazing: 'NA',
    };

    const partTypes = row.PartTypes.replaceAll(' ', '').split(';');
    const insulationTypes = row.InsulationTypes.replaceAll(' ', '').split(';');
    const insulationThickness = row.InsulationThickness.replaceAll(
      ' ',
      ''
    ).split(';');
    const insulationThicknessLowerBounds =
      row.InsulationThicknessLowerBound.replaceAll(' ', '');

    partTypes.forEach((part, i) => {
      if (this.isWallKey(part)) {
        parts['WallConstruction'] = part;
        parts['WallInsulation'] = insulationTypes[i];
      } else if (this.isFloorKey(part)) {
        parts['FloorConstruction'] = part;
        parts['FloorInsulation'] = insulationTypes[i];
      } else if (this.isRoofKey(part)) {
        parts['RoofConstruction'] = part;
        parts['RoofInsulationLocation'] = insulationTypes[i];
        /** check thickness types */
        const thickness = insulationThickness[i];
        const thicknessLB = insulationThicknessLowerBounds[i];
        parts['RoofInsulationThickness'] =
          thickness !== 'NA'
            ? `${thickness.split('.')[0]}mm`
            : `${thicknessLB.split('.')[0]}+mm`;
      } else if (this.isWindowKey(part)) {
        parts['WindowGlazing'] = part;
      }
    });
    return parts;
  }
}
