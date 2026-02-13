import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaFilter } from '@core/models/area-filter.model';
import { BackendBuildingsByDeprivationDimensionResponse, DashboardService } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { Data, PlotData } from 'plotly.js-dist-min';
import { of } from 'rxjs';
import { getPlotlyModuleProviders } from '../plotly.mock';
import { DeprivationDimensionChartComponent } from './deprivation-dimension-chart.component';

const mockRuntimeConfig = {};

const mockApiResponse: BackendBuildingsByDeprivationDimensionResponse = {
    dep_0_pct: 52.3,
    dep_1_pct: 27.4,
    dep_2_pct: 12.8,
    dep_3_pct: 5.6,
    dep_4_pct: 1.9,
};

const mockFilteredApiResponse: BackendBuildingsByDeprivationDimensionResponse = {
    dep_0_pct: 48.4,
    dep_1_pct: 30.2,
    dep_2_pct: 13.5,
    dep_3_pct: 6.0,
    dep_4_pct: 1.9,
};

describe('DeprivationDimensionChartComponent', () => {
    let component: DeprivationDimensionChartComponent;
    let fixture: ComponentFixture<DeprivationDimensionChartComponent>;
    let dashboardService: DashboardService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DeprivationDimensionChartComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                ...getPlotlyModuleProviders(),
                { provide: RUNTIME_CONFIGURATION, useValue: mockRuntimeConfig },
            ],
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
        expect(component.chartData()).toEqual([]);
    });

    it('should load deprivation data', () => {
        jest.spyOn(dashboardService, 'getBuildingsByDeprivationDimension').mockReturnValue(of(mockApiResponse));

        fixture.detectChanges();

        expect(dashboardService.getBuildingsByDeprivationDimension).toHaveBeenCalledWith();
        expect(component.loading()).toBe(false);
    });

    it('should load national and filtered data when areaFilter is provided', () => {
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

        const spy = jest.spyOn(dashboardService, 'getBuildingsByDeprivationDimension').mockImplementation((filter?: AreaFilter) => {
            return of(filter ? mockFilteredApiResponse : mockApiResponse);
        });

        fixture.componentRef.setInput('areaFilter', mockAreaFilter);
        fixture.detectChanges();

        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenNthCalledWith(1);
        expect(spy).toHaveBeenNthCalledWith(2, mockAreaFilter);
        expect(component.loading()).toBe(false);
    });

    describe('chart data transformation', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getBuildingsByDeprivationDimension').mockReturnValue(of(mockApiResponse));
            fixture.detectChanges();
        });

        it('should create one bar series', () => {
            const chartData: Data[] = component.chartData();
            expect(chartData.length).toBe(1);
            expect(chartData[0].type).toBe('bar');
        });

        it('should map data to deprivation dimension labels in order', () => {
            const chartData: Data[] = component.chartData();
            const plotData: PlotData = chartData[0] as PlotData;

            expect(plotData.x).toEqual(['0D', '1D', '2D', '3D', '4D']);
            expect(plotData.y).toEqual([52.3, 27.4, 12.8, 5.6, 1.9]);
        });

        it('should format hover as percentage', () => {
            const chartData: Data[] = component.chartData();
            const plotData: PlotData = chartData[0] as PlotData;
            expect(plotData.hovertemplate).toBe('%{y:.1f}%<extra></extra>');
        });
    });

    it('should create comparison mode chart in area/polygon view', () => {
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

        jest.spyOn(dashboardService, 'getBuildingsByDeprivationDimension').mockImplementation((filter?: AreaFilter) => {
            return of(filter ? mockFilteredApiResponse : mockApiResponse);
        });

        fixture.componentRef.setInput('areaFilter', mockAreaFilter);
        fixture.detectChanges();

        const chartData: Data[] = component.chartData();
        expect(chartData.length).toBe(2);
        expect(chartData[0].name).toBe('Area average');
        expect(chartData[1].name).toBe('National average');

        const filteredPlotData: PlotData = chartData[0] as PlotData;
        const nationalPlotData: PlotData = chartData[1] as PlotData;
        expect(filteredPlotData.y).toEqual([48.4, 30.2, 13.5, 6.0, 1.9]);
        expect(nationalPlotData.y).toEqual([52.3, 27.4, 12.8, 5.6, 1.9]);
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
