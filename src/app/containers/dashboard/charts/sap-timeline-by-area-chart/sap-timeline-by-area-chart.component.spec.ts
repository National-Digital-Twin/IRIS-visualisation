import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaFilter } from '@core/models/area-filter.model';
import { DashboardService, SAPRatingTimelineDataPoint } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import type { PlotData } from 'plotly.js-dist-min';
import { of } from 'rxjs';
import { ChartService } from '../../chart.service';
import { getPlotlyModuleProviders } from '../plotly.mock';
import { SapTimelineByAreaChartComponent } from './sap-timeline-by-area-chart.component';

const mockRuntimeConfig = {
    epcColours: {},
};

const mockTimelineData: SAPRatingTimelineDataPoint[] = [
    { date: new Date('2020-01-01'), name: 'County A', avg_sap_rating: 60 },
    { date: new Date('2021-01-01'), name: 'County A', avg_sap_rating: 62 },
    { date: new Date('2020-01-01'), name: 'County B', avg_sap_rating: 55 },
    { date: new Date('2021-01-01'), name: 'County B', avg_sap_rating: 58 },
];

const mockLayout = {
    margin: { l: 40, r: 15, t: 10, b: 0 },
    xaxis: { title: { text: '' } },
    yaxis: { title: { text: 'SAP score' } },
};

describe('SapTimelineByAreaChartComponent', () => {
    let component: SapTimelineByAreaChartComponent;
    let fixture: ComponentFixture<SapTimelineByAreaChartComponent>;
    let dashboardService: DashboardService;
    let chartServiceMock: jest.Mocked<ChartService>;

    beforeEach(async () => {
        chartServiceMock = {
            getSAPTimelineLayout: jest.fn().mockReturnValue(mockLayout),
        } as unknown as jest.Mocked<ChartService>;

        await TestBed.configureTestingModule({
            imports: [SapTimelineByAreaChartComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                ...getPlotlyModuleProviders(),
                { provide: RUNTIME_CONFIGURATION, useValue: mockRuntimeConfig },
                { provide: ChartService, useValue: chartServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SapTimelineByAreaChartComponent);
        component = fixture.componentInstance;
        dashboardService = TestBed.inject(DashboardService);
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
        expect(component.loading()).toBe(true);
        expect(component.chartData()).toEqual([]);
        expect(component.chartLayout()).toEqual({});
    });

    describe('loadData', () => {
        it('should not load data when areaFilter mode is not named-areas', () => {
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
            jest.spyOn(dashboardService, 'getSAPTimelineByArea');

            fixture.componentRef.setInput('areaFilter', mockAreaFilter);
            fixture.detectChanges();

            expect(dashboardService.getSAPTimelineByArea).not.toHaveBeenCalled();
        });

        it('should drill down one level when single area is selected', () => {
            const mockAreaFilter: AreaFilter = {
                mode: 'named-areas',
                level: 'region',
                names: ['North West'],
            };
            jest.spyOn(dashboardService, 'getSAPTimelineByArea').mockReturnValue(of(mockTimelineData));

            fixture.componentRef.setInput('areaFilter', mockAreaFilter);
            fixture.detectChanges();

            expect(dashboardService.getSAPTimelineByArea).toHaveBeenCalledWith('county', 'region', ['North West']);
        });

        it('should not drill down when multiple areas are selected', () => {
            const mockAreaFilter: AreaFilter = {
                mode: 'named-areas',
                level: 'county',
                names: ['County A', 'County B'],
            };
            jest.spyOn(dashboardService, 'getSAPTimelineByArea').mockReturnValue(of(mockTimelineData));

            fixture.componentRef.setInput('areaFilter', mockAreaFilter);
            fixture.detectChanges();

            expect(dashboardService.getSAPTimelineByArea).toHaveBeenCalledWith('county', 'county', ['County A', 'County B']);
        });
    });

    describe('chart data transformation', () => {
        beforeEach(() => {
            const mockAreaFilter: AreaFilter = {
                mode: 'named-areas',
                level: 'region',
                names: ['North West'],
            };
            jest.spyOn(dashboardService, 'getSAPTimelineByArea').mockReturnValue(of(mockTimelineData));
            fixture.componentRef.setInput('areaFilter', mockAreaFilter);
            fixture.detectChanges();
        });

        it('should create one trace per area', () => {
            const chartData = component.chartData();
            expect(chartData.length).toBe(2);
        });

        it('should set correct trace properties', () => {
            const chartData = component.chartData();
            const trace = chartData[0] as PlotData;

            expect(trace.type).toBe('scatter');
            expect(trace.mode).toBe('lines');
        });

        it('should extract years from dates for x-axis', () => {
            const chartData = component.chartData();
            const trace = chartData[0] as PlotData;

            expect(trace.x).toEqual([2020, 2021]);
        });

        it('should map avg_sap_rating to y-axis', () => {
            const chartData = component.chartData();
            const countyATrace = chartData.find((t) => (t as PlotData).name === 'County A') as PlotData;
            const countyBTrace = chartData.find((t) => (t as PlotData).name === 'County B') as PlotData;

            expect(countyATrace.y).toEqual([60, 62]);
            expect(countyBTrace.y).toEqual([55, 58]);
        });

        it('should include hovertemplate in traces', () => {
            const chartData = component.chartData();
            const trace = chartData[0] as PlotData;

            expect(trace.hovertemplate).toBe('<b>%{fullData.name}</b><br>%{x}<br>%{y:.1f}<extra></extra>');
        });

        it('should use area name as trace name', () => {
            const chartData = component.chartData();
            const traceNames = chartData.map((t) => (t as PlotData).name);

            expect(traceNames).toContain('County A');
            expect(traceNames).toContain('County B');
        });
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
