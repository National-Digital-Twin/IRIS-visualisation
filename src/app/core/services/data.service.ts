import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SEARCH_ENDPOINT } from '@core/tokens/search-endpoint.token';
import { SPARQLReturn } from '@core/models/rdf-data.model';

interface TableRow {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly searchEndpoint: string = inject(SEARCH_ENDPOINT);

  getUPRNs() {
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
        ?state ies:isStateOf ?building .
        ?state a ?current_energy_rating .
      }
    `;
    return this.selectTable(selectString);
  }

  /**
   * Query Telicent IA
   * @param query SPARQL query
   * @returns observable of parsed data
   */
  private selectTable(query: string) {
    let newTable: Array<object>;
    const uri = encodeURIComponent(query);
    const httpOptions = {
      withCredentials: true,
    };

    const tableObservable = new Observable(observer => {
      this.http
        .get<SPARQLReturn>(`${this.searchEndpoint}?query=${uri}`, httpOptions)
        .subscribe((data: SPARQLReturn) => {
          newTable = this.buildTable(data);
          observer.next(newTable);
          observer.complete();
        });
    });
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
}
