import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  Subscriber,
  catchError,
  filter,
  map,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { LngLatBounds } from 'mapbox-gl';

import { SEARCH_ENDPOINT } from '@core/tokens/search-endpoint.token';
import { SPARQLReturn, TableRow } from '@core/models/rdf-data.model';
import {
  BuildingMap,
  BuildingPart,
  BuildingPartMap,
} from '@core/models/building.model';

import { Queries } from './Queries';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly searchEndpoint: string = inject(SEARCH_ENDPOINT);

  private queries = new Queries();

  // single uprn
  selectedUPRN = signal<number | undefined>(undefined);
  selectedBuilding = signal<TableRow | undefined>(undefined);
  // multiple uprns
  buildingUPRNs = signal<number[]>([]);
  buildingsSelection = signal<TableRow[] | undefined>(undefined);
  private buildingData = signal<BuildingMap | undefined>(undefined);
  /**
   * Get UPRNs, EPC ratings, addresses
   * @returns
   */
  buildings$ = this.selectTable(this.queries.getAllData()).pipe(
    map(rawData => this.mapBuildings(rawData))
  );
  private buildingResults = toSignal(this.buildings$, {
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
    switchMap(uprn =>
      this.getBuildingDetails(uprn!).pipe(
        tap(details => {
          this.setSelectedBuilding(details);
        }),
        catchError(() => of([] as TableRow[]))
      )
    )
  );
  readOnlyBuildingDetails = toSignal(this.buildingDetails$, {
    initialValue: [] as TableRow[],
  });

  /**
   * Get the related building parts for the selected building
   */
  private buildingParts$ = toObservable(this.selectedBuilding).pipe(
    filter(selectedBuilding => selectedBuilding !== undefined),
    switchMap(selectedBuilding =>
      this.getBuildingParts(selectedBuilding!.parts.split(';')).pipe(
        map(p => this.mapBuildingParts(p as unknown as BuildingPart[])),
        catchError(() => of({} as BuildingPartMap))
      )
    )
  );

  private buildingParts = toSignal(this.buildingParts$);
  parts = computed(() => this.buildingParts());

  private getBuildingsList$ = toObservable(this.buildingUPRNs).pipe(
    switchMap(uprns =>
      this.getBuildingListDetails(uprns!).pipe(
        tap(buildings => {
          this.setSelectedBuildings(buildings);
        }),
        catchError(() => of([] as TableRow[]))
      )
    )
  );

  readOnlyBuildingsList = toSignal(this.getBuildingsList$, {
    initialValue: [] as TableRow[],
  });

  setSelectedUPRN(uprn: number | undefined) {
    this.selectedUPRN.set(uprn);
  }

  /**
   * Set individual building
   * @param building individual building
   */
  setSelectedBuilding(building: TableRow[] | undefined) {
    this.selectedBuilding.set(building ? building[0] : undefined);
  }

  /**
   * Set multiple buildings
   * @param building buildings
   */
  setSelectedBuildings(buildings: TableRow[] | undefined) {
    this.buildingsSelection.set(buildings ? buildings : undefined);
  }

  setSelectedUPRNs(uprns: number[] | undefined) {
    this.buildingUPRNs.set(uprns ? uprns : []);
  }

  setBuildingData(buildings: BuildingMap) {
    this.buildingData.set(buildings);
  }

  /**
   * Find building UPRNs based on TOID
   * @param toid toid of building
   * @returns array of uprns for the building
   */
  getBuildingUPRNs(toid: string): number[] {
    const allBuildings = this.buildings();
    const buildings = allBuildings![toid];
    if (buildings) {
      return buildings.map(building => +building.uprnId);
    }
    return [];
  }

  /**
   * Get building EPC values within map bounds
   * @param bounds map bounds
   * @returns
   */
  getEPCWithinBounds$(bounds: LngLatBounds) {
    const selectString = this.queries.getEPCWithinBounds(bounds);
    return this.selectTable(selectString);
  }

  /**
   * Return building details for an individual building
   * @param uprn UPRN of building to get details
   * @returns
   */
  getBuildingDetails(uprn: number) {
    const selectString = this.queries.getBuildingDetails(uprn);
    return this.selectTable(selectString);
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
   * Return an array of building details to use in filter
   * results list
   * @param uprns array of uprns to get details for
   * @returns
   */
  getBuildingListDetails(uprns: number[]) {
    const selectString = this.queries.getBuildingListDetails(uprns);
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
  mapBuildings(buildings: TableRow[]) {
    const buildingMap: BuildingMap = {};
    buildings.forEach((row: TableRow) => {
      const toid = row.toid ? row.toid : row.parentToid;
      if (toid && buildingMap[toid]) {
        buildingMap[toid].push(row);
      } else {
        buildingMap[toid] = [row];
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
      buildingPartMap[part.PartSuperType] = part;
    });
    return buildingPartMap;
  }

  /**
   * Error handler
   * @param err Http error response
   * @returns error
   */
  private handleError(err: HttpErrorResponse): Observable<never> {
    let errorMessage = '';
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      errorMessage = `Server returned code: ${err.status}, error message is: ${err.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
