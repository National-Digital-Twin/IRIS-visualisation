import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  Subscriber,
  combineLatest,
  forkJoin,
  map,
  tap,
} from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { SEARCH_ENDPOINT } from '@core/tokens/search-endpoint.token';
import { WRITE_BACK_ENDPOINT } from '@core/tokens/write-back-endpoint.token';
import { SPARQLReturn, TableRow } from '@core/models/rdf-data.model';
import {
  BuildingMap,
  BuildingModel,
  SAPPoint,
} from '@core/models/building.model';

import { Queries } from './Queries';

import {
  EPCRating,
  FloorConstruction,
  RoofConstruction,
  WallConstruction,
  WindowGlazing,
} from '@core/enums';
import { InvalidateFlagReason } from '@core/enums/invalidate-flag-reason';
import {
  EPCBuildingResponseModel,
  NoEPCBuildingResponseModel,
} from '@core/models/building-response.model';

import { MockHttpClient } from '@core/services/mock-http-client.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly http: HttpClient = inject(MockHttpClient);
  private readonly searchEndpoint: string = inject(SEARCH_ENDPOINT);
  private readonly writeBackEndpoint = inject(WRITE_BACK_ENDPOINT);

  private queries = new Queries();

  // single uprn
  selectedUPRN = signal<string | undefined>(undefined);
  selectedBuilding = signal<BuildingModel | undefined>(undefined);
  // multiple buildings
  buildingsSelection = signal<BuildingModel[][] | undefined>(undefined);

  /** Building objects with a flagged uri */
  readonly buildingsFlagged = signal<BuildingMap>({});
  readonly buildingsFlagged$ = toObservable(this.buildingsFlagged);

  sapPoints$ = this.selectTable(this.queries.getSAPPoints());

  buildingsEPC$ = forkJoin([
    this.sapPoints$,
    this.selectTable(this.queries.getEPCData()),
  ]).pipe(
    map(([points, epc]) =>
      this.mapEPCBuildings(
        epc as unknown as EPCBuildingResponseModel[],
        points as unknown as SAPPoint[]
      )
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

  allData$ = combineLatest([
    this.buildingsEPC$,
    this.buildingsNoEPC$,
    this.buildingsFlagged$,
  ]).pipe(
    map(([epc, noEPC, flagged]) =>
      this.combineBuildingData(epc, noEPC, flagged)
    )
  );

  private buildingResults = toSignal(this.allData$, {
    initialValue: undefined,
  });
  buildings = computed(() => this.buildingResults());

  setSelectedUPRN(uprn: string | undefined) {
    this.selectedUPRN.set(uprn);
  }

  /**
   * Set individual building
   * @param building individual building
   */
  setSelectedBuilding(building: BuildingModel | undefined) {
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
   * Create an object where TOIDS are keys, and values are the building(s)
   * data, and joins SAP Ratings with each building
   * @param buildings array of buildings with EPC data
   * @param sapPoints array of UPRNs and SAP Points
   * @returns an object with TOID as key, and an array of building
   * objects with epc and sap points
   */
  mapEPCBuildings(
    buildings: EPCBuildingResponseModel[],
    sapPoints: SAPPoint[]
  ) {
    const buildingMap: BuildingMap = {};
    buildings.forEach((row: EPCBuildingResponseModel) => {
      const toid = row.TOID ? row.TOID : row.ParentTOID;
      /** if there is no TOID the building cannot be visualised */
      if (!toid) return;
      const sapPoint = sapPoints.find(p => p.UPRN === row.UPRN);
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
        SAPPoints: sapPoint?.SAPPoint ? sapPoint.SAPPoint : undefined,
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
        SAPPoints: undefined,
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
  combineBuildingData(
    epcBuildings: BuildingMap,
    nonEPCBuildings: BuildingMap,
    flaggedBuildings: BuildingMap
  ) {
    const allBuildings: BuildingMap = { ...epcBuildings };
    Object.keys(nonEPCBuildings).forEach((toid: string) => {
      if (allBuildings[toid]) {
        allBuildings[toid].concat(nonEPCBuildings[toid]);
      } else {
        allBuildings[toid] = nonEPCBuildings[toid];
      }
    });

    /* combine flagged buildings to all buildings */
    Object.keys(flaggedBuildings).forEach(toid => {
      if (allBuildings[toid]) {
        flaggedBuildings[toid].forEach(fb => {
          /* overwrite flagged property on building */
          const index = allBuildings[toid].findIndex(b => b.UPRN === fb.UPRN);
          allBuildings[toid][index].Flagged = fb.Flagged;
        });
      }
    });

    return allBuildings;
  }

  getEPCByUPRN(uprn: string): string {
    const allBuildings = this.buildings();
    const flatBuildings: BuildingModel[] = Object.values(allBuildings!).flat();

    const building = flatBuildings.find(building => building.UPRN === uprn);
    return building!.EPC!;
  }

  getBuildingByUPRN(uprn: string): BuildingModel {
    const allBuildings = this.buildings();
    const flatBuildings: BuildingModel[] = Object.values(allBuildings!).flat();
    const building = flatBuildings.find(building => building.UPRN === uprn);
    return building!;
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
      row.InsulationThicknessLowerBound.replaceAll(' ', '').split(';');

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
        let roofInsulationThickness = 'NA';
        const thickness = insulationThickness[i];
        const thicknessLB = insulationThicknessLowerBounds[i];
        if (thickness !== 'NA' && thicknessLB === 'NA') {
          roofInsulationThickness = `${thickness.split('.')[0]}mm`;
        } else if (thickness === 'NA' && thicknessLB !== 'NA') {
          roofInsulationThickness = `${thicknessLB.split('.')[0]}+mm`;
        }
        parts['RoofInsulationThickness'] = roofInsulationThickness;
      } else if (this.isWindowKey(part)) {
        parts['WindowGlazing'] = part;
      }
    });
    return parts;
  }

  public flagToInvestigate(
    building: BuildingModel
  ): Observable<NonNullable<BuildingModel['Flagged']>> {
    return this.http
      .post<NonNullable<BuildingModel['Flagged']>>(
        `${this.writeBackEndpoint}/flag-to-investigate`,
        {
          uri: `http://nationaldigitaltwin.gov.uk/data#building_${building.UPRN}`,
        },
        { withCredentials: true }
      )
      .pipe(
        tap(flagUri => {
          const toid = building.TOID ? building.TOID : building.ParentTOID;
          if (!toid) throw new Error(`Building ${building.UPRN} has no TOID`);
          building.Flagged = flagUri;
          this.buildingsFlagged.update(b => ({
            ...b,
            [toid]: b[toid] ? [...b[toid], building] : [building],
          }));
        })
      );
  }

  public invalidateFlag(
    building: BuildingModel,
    reason: InvalidateFlagReason
  ): Observable<NonNullable<BuildingModel['Flagged']>> {
    /* If building has no flag, throw error */
    if (building.Flagged === undefined)
      throw new Error(`Building ${building.UPRN} has no flag`);

    /* convert reason string to enum key */
    const keys = Object.keys(InvalidateFlagReason) as Array<
      keyof typeof InvalidateFlagReason
    >;
    const key = keys.find(k => InvalidateFlagReason[k] === reason);
    if (!key) throw new Error(`Invalid reason: ${reason}`);

    return this.http
      .post<NonNullable<BuildingModel['Flagged']>>(
        `${this.writeBackEndpoint}/invalidate-flag`,
        {
          flatUri: building.Flagged,
          assessmentTypeOverride: `ndt_ont:${key}`,
        },
        { withCredentials: true }
      )
      .pipe(
        tap(() => {
          const toid = building.TOID ? building.TOID : building.ParentTOID;
          if (!toid) throw new Error(`Building ${building.UPRN} has no TOID`);
          /* set flagged property to undefined */
          building.Flagged = undefined;
          this.buildingsFlagged.update(b => {
            /* remove building from flagged buildings */
            const index = b[toid].findIndex(b => b.UPRN === building.UPRN);
            b[toid].splice(index, 1);
            /* add building to buildings */
            b[toid].push(building);
            return { ...b };
          });
        })
      );
  }
}
