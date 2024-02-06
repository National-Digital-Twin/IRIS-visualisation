import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  AddressSearchData,
  AddressSearchResponse,
} from '@core/models/address-search-results.model';

/**
 * Address search service using the OS Places API
 * For further info on how to configure the search query and options
 * see https://osdatahub.os.uk/docs/places/technicalSpecification
 */
@Injectable({
  providedIn: 'root',
})
export class AddressSearchService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly runtimeConfiguration = inject(RUNTIME_CONFIGURATION);

  constructor() {}

  getAddresses(queryString: string): Observable<AddressSearchData[]> {
    const maxResults = this.runtimeConfiguration.addressSearch.maxResults;
    const fq = `LOCAL_CUSTODIAN_CODE:${this.runtimeConfiguration.addressSearch.localCustodianCode}`;

    return this.http
      .get<AddressSearchResponse>(
        `${
          this.runtimeConfiguration.addressSearch.placesAPIURL
        }/find?query=${encodeURIComponent(
          queryString
        )}&maxresults=${maxResults}&FQ=${fq}&output_srs=EPSG:4326&key=${
          environment.os.apiKey
        }`
      )
      .pipe(map((res: AddressSearchResponse) => res.results.map(r => r.DPA)));
  }
}
