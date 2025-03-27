import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AddressSearchData, AddressSearchResponse } from '@core/models/address-search-results.model';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { environment } from '@environment';
import proj4 from 'proj4';
import { Observable, map } from 'rxjs';

/**
 * Address search service using the OS Places API
 * For further info on how to configure the search query and options
 * see https://osdatahub.os.uk/docs/places/technicalSpecification
 */
@Injectable({ providedIn: 'root' })
export class AddressSearchService {
    readonly #http: HttpClient = inject(HttpClient);
    readonly #runtimeConfiguration = inject(RUNTIME_CONFIGURATION);

    constructor() {
        proj4.defs(
            'EPSG:27700',
            '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs',
        );
    }

    /**
     * Free text address search
     * @param queryString address search query
     * @returns suggested address matches
     */
    public getAddresses(queryString: string): Observable<AddressSearchData[]> {
        const params = new HttpParams()
            .set('query', queryString)
            .set('maxresults', this.#runtimeConfiguration.addressSearch.maxResults)
            .set('FQ', `LOCAL_CUSTODIAN_CODE:${this.#runtimeConfiguration.addressSearch.localCustodianCode}`)
            .set('output_srs', 'EPSG:4326');

        const url: string = `${environment.transparent_proxy.url}/os/search/places/v1/find`;

        return this.#http
            .get<AddressSearchResponse>(url, { params })
            .pipe(map((res: AddressSearchResponse) => (res.results?.length ? res.results.map((r) => r.DPA) : [])));
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
