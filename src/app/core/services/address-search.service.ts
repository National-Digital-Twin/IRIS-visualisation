import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AddressSearchData, AddressSearchResponse } from '@core/models/address-search-results.model';
import { OSNamesSearchResponse } from '@core/models/os-names-search-results.model';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import proj4 from 'proj4';
import { Observable, map } from 'rxjs';
import { MapService } from './map.service';

/**
 * Address search service using the OS Places API
 * For further info on how to configure the search query and options
 * see https://osdatahub.os.uk/docs/places/technicalSpecification
 */
@Injectable({
    providedIn: 'root',
})
export class AddressSearchService {
    readonly #http: HttpClient = inject(HttpClient);
    readonly #mapService = inject(MapService);
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
        const url: string = `${this.#runtimeConfiguration.addressSearch.placesAPIURL}/find?query=${encodeURIComponent(
            queryString,
        )}&maxresults=${this.#runtimeConfiguration.addressSearch.maxResults}&FQ=LOCAL_CUSTODIAN_CODE:${this.#runtimeConfiguration.addressSearch.localCustodianCode}&output_srs=EPSG:4326`;
        const transformedUrl: string = this.#mapService.transformUrlForProxy(url, 'api.os.uk', 'os', 'key');

        return this.#http
            .get<AddressSearchResponse>(transformedUrl)
            .pipe(map((res: AddressSearchResponse) => (res.results?.length ? res.results.map((r) => r.DPA) : [])));
    }

    private convertNamesToAddresses(searchResults: OSNamesSearchResponse): AddressSearchData[] {
        const results: AddressSearchData[] = [];
        if (searchResults.results.length) {
            searchResults.results
                .filter((name) => name.GAZETTEER_ENTRY.COUNTY_UNITARY === 'Isle of Wight')
                .forEach((name) => {
                    /**
                     * Convert OSGB National Grid to WGS84
                     */
                    const coords = proj4('EPSG:27700', 'EPSG:4326', [name.GAZETTEER_ENTRY.GEOMETRY_X, name.GAZETTEER_ENTRY.GEOMETRY_Y]);
                    const address: AddressSearchData = {
                        ADDRESS: '',
                        BLPU_STATE_CODE: '',
                        BLPU_STATE_CODE_DESCRIPTION: '',
                        BLPU_STATE_DATE: '',
                        BUILDING_NUMBER: '',
                        CLASSIFICATION_CODE: '',
                        CLASSIFICATION_CODE_DESCRIPTION: '',
                        COUNTRY_CODE: '',
                        COUNTRY_CODE_DESCRIPTION: name.GAZETTEER_ENTRY.COUNTRY,
                        DELIVERY_POINT_SUFFIX: '',
                        ENTRY_DATE: '',
                        LANGUAGE: '',
                        LAST_UPDATE_DATE: '',
                        LAT: coords[1],
                        LNG: coords[0],
                        LOCAL_CUSTODIAN_CODE: this.#runtimeConfiguration.addressSearch.localCustodianCode,
                        LOCAL_CUSTODIAN_CODE_DESCRIPTION: '',
                        LOGICAL_STATUS_CODE: '',
                        MATCH: 0,
                        MATCH_DESCRIPTION: '',
                        POST_TOWN: name.GAZETTEER_ENTRY.POPULATED_PLACE,
                        POSTAL_ADDRESS_CODE: '',
                        POSTAL_ADDRESS_CODE_DESCRIPTION: '',
                        POSTCODE: name.GAZETTEER_ENTRY.NAME1, // this would change if we weren't restricting search to postcodes,
                        RPC: '',
                        STATUS: '',
                        THOROUGHFARE_NAME: '',
                        TOPOGRAPHY_LAYER_TOID: '',
                        UDPRN: '',
                        UPRN: '',
                        X_COORDINATE: name.GAZETTEER_ENTRY.GEOMETRY_X,
                        Y_COORDINATE: name.GAZETTEER_ENTRY.GEOMETRY_Y,
                    };
                    results.push(address);
                });
        }
        return results;
    }
}
