import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  AddressSearchData,
  AddressSearchResponse,
} from '@core/models/address-search-results.model';

@Injectable({
  providedIn: 'root',
})
export class AddressSearchService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly runtimeConfiguration = inject(RUNTIME_CONFIGURATION);

  constructor() {}

  getAddresses(queryString: string): Observable<AddressSearchData[]> {
    return this.http
      .get<AddressSearchResponse>(
        `${
          this.runtimeConfiguration.placesAPIURL
        }/find?query=${encodeURIComponent(
          queryString
        )}&maxresults=10&output_srs=EPSG:4326&key=${environment.os.apiKey}`
      )
      .pipe(map((res: AddressSearchResponse) => res.results.map(r => r.DPA)));
  }
}
