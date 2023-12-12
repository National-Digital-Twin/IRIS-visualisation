import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  Subscriber,
  catchError,
  map,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { Papa } from 'ngx-papaparse';

import { LngLat, LngLatBounds } from 'mapbox-gl';

import { SEARCH_ENDPOINT } from '@core/tokens/search-endpoint.token';
import { SPARQLReturn, TableRow } from '@core/models/rdf-data.model';
import { BuildingModel } from '@core/models/building.model';
import { ToidCSVRow, ToidMap } from '@core/models/toid.model';
import { EPCMap } from '@core/models/epc.model';

import { Queries } from './Queries';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly searchEndpoint: string = inject(SEARCH_ENDPOINT);
  private papa = inject(Papa);

  private queries = new Queries();

  private toidsData = signal<ToidMap | undefined>(undefined);
  private toids$ = this.http
    // TODO remove when using real API
    .get('assets/data/toids.csv', {
      responseType: 'text',
    })
    .pipe(
      map(res => this.csvToArray(res)),
      map(arr => this.mapTOIDS(arr.data)),
      tap(toids => this.setToidsData(toids)),
      catchError(this.handleError)
    );
  private toidsResults = toSignal(this.toids$, { initialValue: undefined });
  toids = computed(() => this.toidsResults());

  // single uprn
  selectedUPRN = signal<number | undefined>(undefined);
  selectedBuilding = signal<TableRow | undefined>(undefined);
  // multiple uprns
  buildingUPRNs = signal<number[]>([]);
  buildingsSelection = signal<TableRow[] | undefined>(undefined);
  private epcsData = signal<EPCMap | undefined>(undefined);
  /**
   * Get UPRNs, EPC ratings, addresses
   * @returns
   */
  epcs$ = this.selectTable(this.queries.getAllData()).pipe(
    map(rawData => this.mapBuildingEPCs(rawData, 'uprn_id'))
  );
  private epcResults = toSignal(this.epcs$, { initialValue: undefined });
  epcs = computed(() => this.epcResults());

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
          console.log(details);
          this.setSelectedBuilding(details);
        }),
        catchError(() => of([] as TableRow[]))
      )
    )
  );
  readOnlyBuildingDetails = toSignal(this.buildingDetails$, {
    initialValue: [] as TableRow[],
  });

  private getBuildingsList$ = toObservable(this.buildingUPRNs).pipe(
    switchMap(uprns =>
      this.getBuildingListDetails(uprns!).pipe(
        tap(buildings => {
          console.log(buildings);
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

  setSelectedBuilding(building: TableRow[] | undefined) {
    this.selectedBuilding.set(building ? building[0] : undefined);
  }

  setSelectedUPRNs(uprns: number[] | undefined) {
    this.buildingUPRNs.set(uprns ? uprns : []);
  }

  setSelectedBuildings(buildings: TableRow[] | undefined) {
    this.buildingsSelection.set(buildings ? buildings : undefined);
  }

  getBuildingUPRNs(toid: string): number[] {
    const toids = this.toids();
    const uprns = toids![toid];
    if (uprns) {
      return uprns;
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
    console.log('get details ', uprn);
    const selectString = this.queries.getBuildingDetails(uprn);
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

  setToidsData(toids: ToidMap) {
    this.toidsData.set(toids);
  }

  setEPCData(epc: EPCMap) {
    this.epcsData.set(epc);
  }

  filterAddresses(addresses: BuildingModel[], bounds: LngLatBounds) {
    const addressesInBounds = addresses.filter(address =>
      bounds.contains(new LngLat(+address.Longitude, +address.Latitude))
    );
    return addressesInBounds;
  }

  /**
   * Convert csv file into an array of objects
   * @param csv csv file
   * @returns Array csv rows
   */
  csvToArray(csv: string) {
    return this.papa.parse(csv, {
      quoteChar: '"',
      header: true,
      dynamicTyping: true,
    });
  }

  /**
   * Create an object where TOIDs are keys
   * and values are an array of UPRNS
   * @param toids array of toids & uprns
   * @returns an object with toid as id, and
   * array of uprns
   */
  mapTOIDS(toids: ToidCSVRow[]) {
    const toidMap: ToidMap = {};
    toids.forEach((row: ToidCSVRow) => {
      if (Object.hasOwn(toidMap, row.TOID)) {
        toidMap[row.TOID].push(row.UPRN);
      } else {
        toidMap[row.TOID] = [row.UPRN];
      }
    });
    return toidMap;
  }

  /**
   * An object where UPRNs are keys, and values is the epc
   * and addresses of a building or dwelling
   * @param epcs array of epcs, toids, uprns and addresses
   * @param keyField field to use as key in return object
   * @returns an object with uprn as key, and object with epc,
   * address
   */
  mapBuildingEPCs(epcs: TableRow[], keyField: string) {
    const epcMap: EPCMap = epcs.reduce(
      (acc: { [key: string]: TableRow }, item: TableRow) => {
        const key = item[keyField] as string;
        acc[key] = item;
        return acc;
      },
      {}
    );
    return epcMap;
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
