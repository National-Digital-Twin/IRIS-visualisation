import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackendNumberOfInDateAndExpiredEpcsResponse, DashboardService } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { Data, PlotData } from 'plotly.js-dist-min';
import { of } from 'rxjs';
import { getPlotlyModuleProviders } from '../plotly.mock';
import { InDateVsExpiredEpcsComponent } from './in-date-vs-expired-epcs-chart.component';

const mockRuntimeConfig = {};

const mockApiResponse: BackendNumberOfInDateAndExpiredEpcsResponse[] = [
    { year: new Date('2015-11-03'), expired: 0, active: 0 },
    { year: new Date('2016-11-03'), expired: 0, active: 0 },
    { year: new Date('2017-11-03'), expired: 0, active: 4125 },
    { year: new Date('2018-11-03'), expired: 4125, active: 36540 },
    { year: new Date('2019-11-03'), expired: 36540, active: 35653 },
    { year: new Date('2020-11-03'), expired: 35653, active: 34895 },
    { year: new Date('2021-11-03'), expired: 34895, active: 37771 },
    { year: new Date('2022-11-03'), expired: 37771, active: 59578 },
    { year: new Date('2023-11-03'), expired: 59578, active: 94139 },
    { year: new Date('2024-11-03'), expired: 94139, active: 82430 },
    { year: new Date('2025-11-03'), expired: 82430, active: 614869 },
];

describe('InDateVsExpiredChartComponent', () => {
    let component: InDateVsExpiredEpcsComponent;
    let fixture: ComponentFixture<InDateVsExpiredEpcsComponent>;
    let dashboardService: DashboardService;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [InDateVsExpiredEpcsComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                ...getPlotlyModuleProviders(),
                { provide: RUNTIME_CONFIGURATION, useValue: mockRuntimeConfig },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(InDateVsExpiredEpcsComponent);
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

    describe('loadData', () => {
        it('should load number of in date vs expired epcs', () => {
            jest.spyOn(dashboardService, 'getNumberOfInDateAndExpiredEpcs').mockReturnValue(of(mockApiResponse));

            fixture.detectChanges();

            expect(dashboardService.getNumberOfInDateAndExpiredEpcs).toHaveBeenCalled();
            expect(component.loading()).toBe(false);
        });
    });

    describe('chart data transformations', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getNumberOfInDateAndExpiredEpcs').mockReturnValue(of(mockApiResponse));
            fixture.detectChanges();
        });

        it('should create two scatter graphs with the correct structure', () => {
            const chartData: Data[] = component.chartData();
            expect(chartData.length).toBe(2);
            expect(chartData[0].type).toBe('scatter');
            expect(chartData[0].name).toBe('In date');

            const firstPlotData: PlotData = chartData[0] as PlotData;
            expect(firstPlotData.mode).toBe('lines');

            expect(chartData[1].type).toBe('scatter');
            expect(chartData[1].name).toBe('Expired');

            const secondPlotData: PlotData = chartData[1] as PlotData;
            expect(secondPlotData.mode).toBe('lines');
        });

        it('should map years properly', () => {
            const chartData: Data[] = component.chartData();
            const firstPlotData: PlotData = chartData[0] as PlotData;
            const secondPlotData: PlotData = chartData[1] as PlotData;

            expect(firstPlotData.x).toEqual([
                new Date('2015-11-03'),
                new Date('2016-11-03'),
                new Date('2017-11-03'),
                new Date('2018-11-03'),
                new Date('2019-11-03'),
                new Date('2020-11-03'),
                new Date('2021-11-03'),
                new Date('2022-11-03'),
                new Date('2023-11-03'),
                new Date('2024-11-03'),
                new Date('2025-11-03'),
            ]);
            expect(secondPlotData.x).toBe(firstPlotData.x);
        });

        it('should map the number of in date epcs properly', () => {
            const chartData: Data[] = component.chartData();
            const plotData: PlotData = chartData[0] as PlotData;

            expect(plotData.y).toEqual([0, 0, 4125, 36540, 35653, 34895, 37771, 59578, 94139, 82430, 614869]);
        });

        it('should map the number of expired epcs properly', () => {
            const chartData: Data[] = component.chartData();
            const plotData: PlotData = chartData[1] as PlotData;

            expect(plotData.y).toEqual([0, 0, 0, 4125, 36540, 35653, 34895, 37771, 59578, 94139, 82430]);
        });

        it('should include the number of in date epcs in the hover template', () => {
            const chartData: Data[] = component.chartData();
            const plotData: PlotData = chartData[0] as PlotData;

            expect(plotData.hovertemplate).toContain('{y:,}<extra></extra>');
        });

        it('should include the number of expired epcs in the hover template', () => {
            const chartData: Data[] = component.chartData();
            const plotData: PlotData = chartData[1] as PlotData;

            expect(plotData.hovertemplate).toContain('{y:,}<extra></extra>');
        });
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attdibuted to the Department for Business and Trade (UK) as the governing entity.
