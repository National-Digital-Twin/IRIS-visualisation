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

import { EPCRating } from '@core/enums';

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
  buildingsSelection = signal<BuildingModel[] | undefined>(undefined);

  buildingsEPC$ = this.selectTable(this.queries.getEPCData());
  buildingsNoEPC$ = this.selectTable(this.queries.getNoEPCData()).pipe();

  /**
   * Get all building data
   * @returns Observable<BuildingMap>
   */
  allData$ = forkJoin([this.buildingsEPC$, this.buildingsNoEPC$]).pipe(
    map(([epc, noEPC]) => {
      const epcBuildings = epc as unknown as BuildingModel[];
      const noEPCBuildings = noEPC as unknown as BuildingModel[];
      console.log('no epc ', noEPCBuildings.length);
      return epcBuildings.concat(noEPCBuildings);
    }),
    map(allRawData => this.mapBuildings(allRawData))
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
    tap(uprn => console.log('getting details for uprn ', uprn)),
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
      if (selectedBuilding.EPC === EPCRating.none) return EMPTY;
      return this.getBuildingParts(selectedBuilding!.parts.split(';')).pipe(
        map(p => this.mapBuildingParts(p as unknown as BuildingPart[])),
        catchError(() => of({} as BuildingPartMap))
      );
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
  setSelectedBuildings(buildings: BuildingModel[] | undefined) {
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
   * An object where UPRNs are keys, and values is the epc
   * and addresses of a building or dwelling
   * @param buildings array of epcs, toids, uprns and addresses
   * @returns an object with uprn as key, and object with epc,
   * address etc
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
   * Maps part types to parts details
   *
   * @param parts building parts
   * @returns object with key as part name
   * and details as value
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
    return building!.EPC;
  }
}
