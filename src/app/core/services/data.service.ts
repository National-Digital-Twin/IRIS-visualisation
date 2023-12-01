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

  constructor(private papa: Papa) {}

  getUPRNs$() {
    const selectString = `
      PREFIX data: <http://nationaldigitaltwin.gov.uk/data#>
      PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
      PREFIX qudt: <http://qudt.org/2.1/schema/qudt/>
      PREFIX ndt: <http://nationaldigitaltwin.gov.uk/ontology#>
      PREFIX iesuncertainty: <http://ies.data.gov.uk/ontology/ies_uncertainty_proposal/v2.0#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT ?uprn_id ?current_energy_rating ?lat_literal ?lon_literal
      WHERE {
        ?building a ndt:House .
        ?building ies:isIdentifiedBy/ies:representationValue ?uprn_id .
        ?state ies:isStateOf ?building .
        ?state a ?current_energy_rating .
        ?building ies:inLocation ?geopoint .
        ?geopoint rdf:type ies:GeoPoint .
        ?geopoint ies:isIdentifiedBy ?lat .
        ?lat rdf:type ies:Latitude .
        ?lat ies:representationValue ?lat_literal .
        ?geopoint ies:isIdentifiedBy ?lon .
        ?lon rdf:type ies:Longitude .
        ?lon ies:representationValue ?lon_literal .
      }
    `;
    return this.selectTable(selectString);
  }

  getEPCWithinBounds$(bounds: LngLatBounds) {
    // _sw.lat <= building.lat && building.lat <= _ne.lat && _sw.lng <= building.lng && building.lng <= _ne.lng
    console.log(bounds);
    const { _ne, _sw } = bounds;
    const selectString = `
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX ies: <http://ies.data.gov.uk/ontology/ies4#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT ?uprn_id ?current_energy_rating (GROUP_CONCAT(DISTINCT ?type; SEPARATOR="; ") AS ?types)
    WHERE {
      ?building a ?type .
      ?building ies:isIdentifiedBy/ies:representationValue ?uprn_id .
      ?building ies:inLocation ?geopoint .

      ?state ies:isStateOf ?building .
      ?state a ?current_energy_rating .

      ?geopoint rdf:type ies:GeoPoint .
      ?geopoint ies:isIdentifiedBy ?lat .
      ?lat rdf:type ies:Latitude .
      ?lat ies:representationValue ?lat_literal .
      ?geopoint ies:isIdentifiedBy ?lon .
      ?lon rdf:type ies:Longitude .
      ?lon ies:representationValue ?lon_literal .

      FILTER (${_sw.lat} <= xsd:float(?lat_literal) && xsd:float(?lat_literal) <= ${_ne.lat} && ${_sw.lng} <= xsd:float(?lon_literal) && xsd:float(?lon_literal) <= ${_ne.lng}) .
    }
    GROUP BY
      ?uprn_id
      ?current_energy_rating
    `;
    return this.selectTable(selectString);
  }

  getBuildingDetails(uprn: string) {
    console.log(uprn);
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
