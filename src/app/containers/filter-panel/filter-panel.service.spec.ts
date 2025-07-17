import { HttpParams, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { getTestBed, TestBed } from '@angular/core/testing';
import { BACKEND_API_ENDPOINT } from '@core/tokens/backend-endpoint.token';
import { SEARCH_ENDPOINT } from '@core/tokens/search-endpoint.token';
import { map } from 'rxjs';
import { FilterPanelService, panelNames } from './filter-panel.service';

const filterData = {
    postcode: ['PO11', 'PO12', 'PO13', 'PO14', 'PO15', 'PO16', 'PO17', 'PO18'],
    built_form: ['Brick', 'Wood'],
    inspection_year: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
    energy_rating: ['EPC In Date', 'EPC Expired'],
    window_glazing: ['Single', 'Double'],
    wall_construction: ['Brick', 'Timber', 'Cavity', 'Plaster'],
    wall_insulation: ['10mm', '20mm', '30mm', '40mm', '50mm'],
    floor_construction: ['Carpet', 'Tiles'],
    floor_insulation: ['Suspended', 'Concrete'],
    roof_construction: ['Tiles', 'Straw'],
    roof_insulation_location: ['Frame', 'Ceiling'],
    roof_insulation_thickness: ['10mm', '20mm', '30mm', '40mm', '50mm'],
};

describe('DataService', () => {
    let service: FilterPanelService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                FilterPanelService,
                { provide: SEARCH_ENDPOINT, useValue: '' },
                { provide: BACKEND_API_ENDPOINT, useValue: '' },
            ],
        });

        const injector = getTestBed();
        service = TestBed.inject(FilterPanelService);
        httpMock = injector.get(HttpTestingController);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('retrieveFilterPanels', () => {
        it('should create and return the list of panels with its filters', (done) => {
            service
                .retrieveFilterPanels({ minX: 1, maxX: 2, minY: 3, maxY: 4 })
                .pipe(
                    map((result) => {
                        expect(result).toHaveLength(5);
                        panelNames.map((name, idx) => expect(result.at(idx)?.title).toEqual(name));
                        [4, 1, 2, 2, 3].map((size, idx) => expect(result.at(idx)?.filters).toHaveLength(size));
                    }),
                )
                .subscribe({
                    next: () => done(),
                    error: (err) => done(err),
                });

            const params = new HttpParams().set('min_lat', '1').set('max_lat', '2').set('min_long', '3').set('max_long', '4');

            const req = httpMock.expectOne(`/api/filters/buildings?${params.toString()}`);
            expect(req.request.method).toBe('GET');
            req.flush(filterData);
        });
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
