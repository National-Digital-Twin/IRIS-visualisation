import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaFilter } from '@core/models/area-filter.model';
import { BackendBuildingsByDeprivationDimensionResponse, DashboardService } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { of } from 'rxjs';
import { DeprivationDimensionChartComponent } from './deprivation-dimension-chart.component';

const mockRuntimeConfig = {};

const mockApiResponse: BackendBuildingsByDeprivationDimensionResponse = {
    dep_3_pct: null,
    dep_4_pct: null,
    dep_3_count: 1632876,
    dep_4_count: 603221,
    unfiltered_dep_3_pct: 8.21,
    unfiltered_dep_4_pct: 3.28,
    min_dep_3_pct: 0.0,
    max_dep_3_pct: 27.64,
    min_dep_4_pct: 0.0,
    max_dep_4_pct: 18.92,
};

const mockFilteredApiResponse: BackendBuildingsByDeprivationDimensionResponse = {
    dep_3_pct: 9.47,
    dep_4_pct: 4.03,
    dep_3_count: 128442,
    dep_4_count: 54631,
    unfiltered_dep_3_pct: 8.21,
    unfiltered_dep_4_pct: 3.28,
    min_dep_3_pct: 1.12,
    max_dep_3_pct: 22.85,
    min_dep_4_pct: 0.24,
    max_dep_4_pct: 14.73,
};

describe('DeprivationDimensionChartComponent', () => {
    let component: DeprivationDimensionChartComponent;
    let fixture: ComponentFixture<DeprivationDimensionChartComponent>;
    let dashboardService: DashboardService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DeprivationDimensionChartComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), { provide: RUNTIME_CONFIGURATION, useValue: mockRuntimeConfig }],
        }).compileComponents();

        fixture = TestBed.createComponent(DeprivationDimensionChartComponent);
        component = fixture.componentInstance;
        dashboardService = TestBed.inject(DashboardService);
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
        expect(component.loading()).toBe(true);
        expect(component.histogramRows()).toEqual([]);
    });

    it('should load deprivation data', () => {
        jest.spyOn(dashboardService, 'getBuildingsByDeprivationDimension').mockReturnValue(of(mockApiResponse));

        fixture.detectChanges();

        expect(dashboardService.getBuildingsByDeprivationDimension).toHaveBeenCalledWith(undefined);
        expect(component.loading()).toBe(false);
    });

    it('should load filtered data with a single API call when areaFilter is provided', () => {
        const mockAreaFilter: AreaFilter = {
            mode: 'polygon',
            polygon: {
                type: 'Polygon',
                coordinates: [
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ],
            },
        };

        const spy = jest.spyOn(dashboardService, 'getBuildingsByDeprivationDimension').mockReturnValue(of(mockFilteredApiResponse));

        fixture.componentRef.setInput('areaFilter', mockAreaFilter);
        fixture.detectChanges();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(mockAreaFilter);
        expect(component.loading()).toBe(false);
    });

    it('should use unfiltered values in national mode when dep values are null', () => {
        jest.spyOn(dashboardService, 'getBuildingsByDeprivationDimension').mockReturnValue(of(mockApiResponse));
        fixture.detectChanges();

        expect(component.histogramRows()).toEqual([
            {
                key: 'dep4',
                count: 603221,
                value: 3.28,
                statement: 'highly deprived',
                context: '(deprived in four dimensions)',
                min: 0,
                max: 18.92,
                nationalAverage: undefined,
            },
            {
                key: 'dep3',
                count: 1632876,
                value: 8.21,
                statement: 'deprived in three dimensions',
                min: 0,
                max: 27.64,
                nationalAverage: undefined,
            },
        ]);
        expect(component.isNationalView()).toBe(true);
    });

    it('should include national averages in area/polygon mode histogram rows', () => {
        const mockAreaFilter: AreaFilter = {
            mode: 'polygon',
            polygon: {
                type: 'Polygon',
                coordinates: [
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ],
            },
        };

        jest.spyOn(dashboardService, 'getBuildingsByDeprivationDimension').mockReturnValue(of(mockFilteredApiResponse));
        fixture.componentRef.setInput('areaFilter', mockAreaFilter);
        fixture.detectChanges();

        expect(component.histogramRows()).toEqual([
            {
                key: 'dep4',
                count: 54631,
                value: 4.03,
                statement: 'highly deprived',
                context: '(deprived in four dimensions)',
                min: 0.24,
                max: 14.73,
                nationalAverage: 3.28,
            },
            {
                key: 'dep3',
                count: 128442,
                value: 9.47,
                statement: 'deprived in three dimensions',
                min: 1.12,
                max: 22.85,
                nationalAverage: 8.21,
            },
        ]);
        expect(component.isNationalView()).toBe(false);
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
