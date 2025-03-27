import { HttpParams, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { getTestBed, TestBed } from '@angular/core/testing';
import { AddressResponseHeader, AddressSearchData, AddressSearchResponse } from '@core/models/address-search-results.model';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { map } from 'rxjs';
import { AddressSearchService } from './address-search.service';

const runtimeConfig = {
    addressSearch: {
        maxResults: 10,
        localCustodianCode: 'en-GB',
    },
};

describe('AddressSearchService', () => {
    let service: AddressSearchService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting(), AddressSearchService, { provide: RUNTIME_CONFIGURATION, useValue: runtimeConfig }],
        });

        const injector = getTestBed();
        service = TestBed.inject(AddressSearchService);
        httpMock = injector.get(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should not error when response contains missing / invalid data', (done) => {
        const expectedResult = {};

        service
            .getAddresses('POSTCODE')
            .pipe(map((result) => expect(result).toEqual([])))
            .subscribe(() => done());

        const params = new HttpParams().set('query', 'POSTCODE').set('maxresults', '10').set('FQ', 'LOCAL_CUSTODIAN_CODE:en-GB').set('output_srs', 'EPSG:4326');

        const req = httpMock.expectOne(`/transparent-proxy/os/search/places/v1/find?${params.toString()}`);
        expect(req.request.method).toBe('GET');
        req.flush(expectedResult);
    });

    it('should return addresses correctly', (done) => {
        const expectedResult: AddressSearchResponse = {
            header: {} as AddressResponseHeader,
            results: [
                { DPA: { UPRN: '1' } as AddressSearchData },
                { DPA: { UPRN: '2' } as AddressSearchData },
                { DPA: { UPRN: '3' } as AddressSearchData },
                { DPA: { UPRN: '4' } as AddressSearchData },
                { DPA: { UPRN: '5' } as AddressSearchData },
            ],
        };

        service
            .getAddresses('POSTCODE')
            .pipe(map((result) => expect(result).toEqual([{ UPRN: '1' }, { UPRN: '2' }, { UPRN: '3' }, { UPRN: '4' }, { UPRN: '5' }])))
            .subscribe(() => done());

        const params = new HttpParams().set('query', 'POSTCODE').set('maxresults', '10').set('FQ', 'LOCAL_CUSTODIAN_CODE:en-GB').set('output_srs', 'EPSG:4326');

        const req = httpMock.expectOne(`/transparent-proxy/os/search/places/v1/find?${params.toString()}`);
        expect(req.request.method).toBe('GET');
        req.flush(expectedResult);
    });
});
