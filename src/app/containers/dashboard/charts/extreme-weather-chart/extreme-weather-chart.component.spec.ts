import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackendBuildingsAffectedByExtremeWeatherResponse, DashboardService } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { Data, PlotData } from 'plotly.js-dist-min';
import { of } from 'rxjs';
import { getPlotlyModuleProviders } from '../plotly.mock';
import { ExtremeWeatherChartComponent } from './extreme-weather-chart.component';

const mockRuntimeConfig = {};

const mockApiResponse: BackendBuildingsAffectedByExtremeWeatherResponse[] = [
    { number_of_buildings: 429445, affected_by_icing_days: undefined, affected_by_hsds: undefined, affected_by_wdr: true },
    { number_of_buildings: 28029, affected_by_icing_days: true, affected_by_hsds: undefined, affected_by_wdr: true },
    { number_of_buildings: 6367, affected_by_icing_days: true, affected_by_hsds: true, affected_by_wdr: undefined },
    { number_of_buildings: 1914, affected_by_icing_days: undefined, affected_by_hsds: true, affected_by_wdr: true },
    { number_of_buildings: 172020, affected_by_icing_days: undefined, affected_by_hsds: true, affected_by_wdr: undefined },
    { number_of_buildings: 177, affected_by_icing_days: true, affected_by_hsds: true, affected_by_wdr: true },
    { number_of_buildings: 2146, affected_by_icing_days: true, affected_by_hsds: undefined, affected_by_wdr: undefined },
];

describe('ExtremeWeatherChartComponent', () => {
    let component: ExtremeWeatherChartComponent;
    let fixture: ComponentFixture<ExtremeWeatherChartComponent>;
    let dashboardService: DashboardService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExtremeWeatherChartComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                ...getPlotlyModuleProviders(),
                { provide: RUNTIME_CONFIGURATION, useValue: mockRuntimeConfig },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ExtremeWeatherChartComponent);
        component = fixture.componentInstance;
        dashboardService = TestBed.inject(DashboardService);
    });

    it('should create component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
        expect(component.loading()).toBe(true);
        expect(component.chartData()).toEqual([]);
    });

    describe('loadData', () => {
        it('should load buildings affected by extreme weather data', () => {
            jest.spyOn(dashboardService, 'getBuildingsAffectedByExtremeWeather').mockReturnValue(of(mockApiResponse));

            fixture.detectChanges();

            expect(dashboardService.getBuildingsAffectedByExtremeWeather).toHaveBeenCalled();
            expect(component.loading()).toBe(false);
        });
    });

    describe('chart data transformation', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getBuildingsAffectedByExtremeWeather').mockReturnValue(of(mockApiResponse));
            fixture.detectChanges();
        });

        it('should create a bar chart with the correct structure', () => {
            const chartData: Data[] = component.chartData();
            expect(chartData.length).toBe(1);
            expect(chartData[0].type).toBe('bar');
        });

        it('should format extreme weather instances properly', () => {
            const chartData: Data[] = component.chartData();
            const plotData: PlotData = chartData[0] as PlotData;
            expect(plotData.x).toEqual([
                'WDR',
                'HSD',
                'Icing<br>days',
                'WDR +<br>HSD',
                'WDR +<br>icing<br>days',
                'HSD +<br>icing<br>days',
                'WDR,<br>HSD +<br>icing<br>days',
            ]);
        });

        it('should map number of buildings correctly', () => {
            const chartData: Data[] = component.chartData();
            const plotData: PlotData = chartData[0] as PlotData;

            expect(plotData.y).toEqual([429445, 172020, 2146, 1914, 28029, 6367, 177]);
        });

        it('should include the number of buildings in the hover template', () => {
            const chartData: Data[] = component.chartData();
            const plotData: PlotData = chartData[0] as PlotData;

            expect(plotData.hovertemplate).toContain('{y:,}<extra></extra>');
        });
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attdibuted to the Department for Business and Trade (UK) as the governing entity.
