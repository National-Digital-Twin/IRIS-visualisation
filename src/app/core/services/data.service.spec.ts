import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BuildingModel } from '@core/models/building.model';
import { BACKEND_API_ENDPOINT } from '@core/tokens/backend-endpoint.token';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { SEARCH_ENDPOINT } from '@core/tokens/search-endpoint.token';
import { DataService } from './data.service';

const runtimeConfig = {
    cache: { epc: '', sap: '', nonEpc: '' },
    contextLayers: [],
};

describe('DataService', () => {
    let service: DataService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                DataService,
                { provide: SEARCH_ENDPOINT, useValue: '' },
                { provide: BACKEND_API_ENDPOINT, useValue: '' },
                { provide: RUNTIME_CONFIGURATION, useValue: runtimeConfig },
            ],
        });

        service = TestBed.inject(DataService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('setSelectedBuilding', () => {
        it('should update the selected building signal', () => {
            const mockBuilding = { UPRN: '1', FullAddress: 'Test Address' } as BuildingModel;
            service.setSelectedBuilding(mockBuilding);
            expect(service.selectedBuilding()).toEqual(mockBuilding);
        });
    });
});
