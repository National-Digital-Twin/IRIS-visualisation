import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  Subject,
  Subscriber,
  catchError,
  tap,
  map,
  throwError,
} from 'rxjs';

import { Papa } from 'ngx-papaparse';

import { LngLat, LngLatBounds } from 'mapbox-gl';

import { SEARCH_ENDPOINT } from '@core/tokens/search-endpoint.token';
import { SPARQLReturn } from '@core/models/rdf-data.model';
import { BuildingModel } from '@core/models/building.model';
import { Queries } from './Queries';

export interface TableRow {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly searchEndpoint: string = inject(SEARCH_ENDPOINT);

  private addressesSubject = new Subject<BuildingModel[] | undefined>();
  addresses$ = this.addressesSubject.asObservable();

  private queries = new Queries();

  constructor(private papa: Papa) {}

  getAllData() {
    const selectString = this.queries.getAllData();
    return this.selectTable(selectString);
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
  getBuildingDetails(uprn: string) {
    const selectString = this.queries.getBuildingDetails(uprn);
    return this.selectTable(selectString);
  }

  /**
   * Return an array of building details to use in filter
   * results list
   * @param uprns array of uprns to get details for
   * @returns
   */
  getBuildingListDetails(uprns: string[]) {
    const selectString = this.queries.getBuildingListDetails(uprns);
    return this.selectTable(selectString);
  }

  /**
   * Query Telicent IA
   * @param query SPARQL query
   * @returns observable of parsed data
   */
  private selectTable(query: string) {
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

  loadAddressData() {
    return (
      this.http
        // TODO remove when using real API
        .get('assets/data/combined_address_profile_unique.csv', {
          responseType: 'text',
        })
        .pipe(
          map(res => this.csvToArray(res)),
          tap(addresses => this.setAddressData(addresses.data)),
          catchError(this.handleError)
        )
    );
  }

  setAddressData(addresses: BuildingModel[]) {
    this.addressesSubject.next(addresses);
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
