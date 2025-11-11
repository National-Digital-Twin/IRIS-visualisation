import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaFilter } from '@core/models/area-filter.model';
import { DashboardService, TimelineAvgSAPDataPoint, SAPTimelineResponse } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import type { PlotData } from 'plotly.js-dist-min';
import { of } from 'rxjs';
import { ChartService } from '../../chart.service';
import { getPlotlyModuleProviders } from '../plotly.mock';
import { SapTimelineChartComponent } from './sap-timeline-chart.component';

const mockRuntimeConfig = {
    epcColours: {},
};

const mockTimelineWithFiltered: TimelineAvgSAPDataPoint[] = [
    { date: new Date('2020-01-01'), national_avg_sap_rating: 60, filtered_avg_sap_rating: 65 },
    { date: new Date('2021-01-01'), national_avg_sap_rating: 62, filtered_avg_sap_rating: 67 },
    { date: new Date('2022-01-01'), national_avg_sap_rating: 64, filtered_avg_sap_rating: 69 },
];

const mockTimelineWithoutFiltered: TimelineAvgSAPDataPoint[] = [
    { date: new Date('2020-01-01'), national_avg_sap_rating: 60, filtered_avg_sap_rating: null },
    { date: new Date('2021-01-01'), national_avg_sap_rating: 62, filtered_avg_sap_rating: null },
    { date: new Date('2022-01-01'), national_avg_sap_rating: 64, filtered_avg_sap_rating: null },
];

const mockTimelineMixed: TimelineAvgSAPDataPoint[] = [
    { date: new Date('2020-01-01'), national_avg_sap_rating: 60, filtered_avg_sap_rating: 65 },
    { date: new Date('2021-01-01'), national_avg_sap_rating: 62, filtered_avg_sap_rating: null },
    { date: new Date('2022-01-01'), national_avg_sap_rating: 64, filtered_avg_sap_rating: 69 },
];

describe('SapTimelineChartComponent', () => {
    let component: SapTimelineChartComponent;
    let fixture: ComponentFixture<SapTimelineChartComponent>;
    let dashboardService: DashboardService;
    let chartServiceMock: jest.Mocked<ChartService>;

    beforeEach(async () => {
        chartServiceMock = {
            commonFont: { family: 'Roboto, sans-serif' },
        } as jest.Mocked<ChartService>;

        await TestBed.configureTestingModule({
            imports: [SapTimelineChartComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                ...getPlotlyModuleProviders(),
                { provide: RUNTIME_CONFIGURATION, useValue: mockRuntimeConfig },
                { provide: ChartService, useValue: chartServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SapTimelineChartComponent);
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
        it('should load timeline data without polygon', () => {
            const mockResponse: SAPTimelineResponse = { timeline: mockTimelineWithFiltered };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            expect(dashboardService.getSAPTimeline).toHaveBeenCalledWith(undefined);
            expect(component.loading()).toBe(false);
            expect(component.chartData().length).toBeGreaterThan(0);
        });

        it('should pass areaFilter to service when areaFilter is provided', () => {
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

            const mockResponse: SAPTimelineResponse = { timeline: mockTimelineWithFiltered };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.componentRef.setInput('areaFilter', mockAreaFilter);
            fixture.detectChanges();

            expect(dashboardService.getSAPTimeline).toHaveBeenCalledWith(mockAreaFilter);
        });

        it('should handle empty timeline response', () => {
            const mockResponse: SAPTimelineResponse = { timeline: [] };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            expect(component.loading()).toBe(false);
            expect(component.chartData().length).toBe(1);
            const trace = component.chartData()[0] as PlotData;
            expect(trace.name).toBe('Average SAP score');
        });

        it('should set loading to false after data is loaded', () => {
            const mockResponse: SAPTimelineResponse = { timeline: mockTimelineWithFiltered };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            expect(component.loading()).toBe(true);

            fixture.detectChanges();

            expect(component.loading()).toBe(false);
        });
    });

    describe('chart data transformation', () => {
        it('should create two traces when filtered ratings exist', () => {
            const mockResponse: SAPTimelineResponse = { timeline: mockTimelineWithFiltered };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            expect(chartData.length).toBe(2);

            const filteredTrace = chartData[0] as PlotData;
            const nationalTrace = chartData[1] as PlotData;

            expect(filteredTrace.name).toBe('Average SAP score');
            expect(filteredTrace.type).toBe('scatter');
            expect(filteredTrace.mode).toBe('lines');
            expect(filteredTrace.y).toEqual([65, 67, 69]);

            expect(nationalTrace.name).toBe('National average');
            expect(nationalTrace.type).toBe('scatter');
            expect(nationalTrace.mode).toBe('lines');
            expect(nationalTrace.y).toEqual([60, 62, 64]);
        });

        it('should create one trace when no filtered ratings exist', () => {
            const mockResponse: SAPTimelineResponse = { timeline: mockTimelineWithoutFiltered };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            expect(chartData.length).toBe(1);

            const trace = chartData[0] as PlotData;
            expect(trace.name).toBe('Average SAP score');
            expect(trace.type).toBe('scatter');
            expect(trace.mode).toBe('lines');
            expect(trace.y).toEqual([60, 62, 64]);
        });

        it('should extract years from dates for x-axis', () => {
            const mockResponse: SAPTimelineResponse = { timeline: mockTimelineWithFiltered };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            const trace = chartData[0] as PlotData;
            expect(trace.x).toEqual([2020, 2021, 2022]);
        });

        it('should create two traces when some filtered ratings exist', () => {
            const mockResponse: SAPTimelineResponse = { timeline: mockTimelineMixed };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            expect(chartData.length).toBe(2);

            const filteredTrace = chartData[0] as PlotData;
            expect(filteredTrace.y).toEqual([65, 69]);
            expect(filteredTrace.x).toEqual([2020, 2022]);

            const nationalTrace = chartData[1] as PlotData;
            expect(nationalTrace.y).toEqual([60, 62, 64]);
            expect(nationalTrace.x).toEqual([2020, 2021, 2022]);
        });

        it('should include hovertemplate in traces', () => {
            const mockResponse: SAPTimelineResponse = { timeline: mockTimelineWithFiltered };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            const trace = chartData[0] as PlotData;
            expect(trace.hovertemplate).toBe('<b>%{x}</b><br>%{y:.1f}<extra></extra>');
        });

        it('should map data correctly for x and y axes', () => {
            const mockResponse: SAPTimelineResponse = { timeline: mockTimelineWithFiltered };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            const filteredTrace = chartData[0] as PlotData;
            const nationalTrace = chartData[1] as PlotData;

            expect(filteredTrace.x).toEqual([2020, 2021, 2022]);
            expect(filteredTrace.y).toEqual([65, 67, 69]);
            expect(nationalTrace.x).toEqual([2020, 2021, 2022]);
            expect(nationalTrace.y).toEqual([60, 62, 64]);
        });

        it('should name national trace "National average" when filtered ratings exist', () => {
            const mockResponse: SAPTimelineResponse = { timeline: mockTimelineWithFiltered };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            const nationalTrace = chartData[1] as PlotData;
            expect(nationalTrace.name).toBe('National average');
        });

        it('should name national trace "Average SAP score" when no filtered ratings exist', () => {
            const mockResponse: SAPTimelineResponse = { timeline: mockTimelineWithoutFiltered };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            const trace = chartData[0] as PlotData;
            expect(trace.name).toBe('Average SAP score');
        });
    });

    describe('chart layout', () => {
        beforeEach(() => {
            const mockResponse: SAPTimelineResponse = { timeline: mockTimelineWithFiltered };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));
            fixture.detectChanges();
        });

        it('should set y-axis title to "SAP score"', () => {
            const layout = component.chartLayout();
            expect(layout.yaxis?.title?.text).toBe('SAP score');
        });

        it('should create layout structure', () => {
            const layout = component.chartLayout();
            expect(layout.xaxis).toBeDefined();
            expect(layout.yaxis).toBeDefined();
            expect(layout.showlegend).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle empty timeline array', () => {
            const mockResponse: SAPTimelineResponse = { timeline: [] };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            expect(component.loading()).toBe(false);
            const chartData = component.chartData();
            expect(chartData.length).toBe(1);
            const trace = chartData[0] as PlotData;
            expect(trace.name).toBe('Average SAP score');
            expect(trace.x).toEqual([]);
            expect(trace.y).toEqual([]);
        });

        it('should handle single data point', () => {
            const singlePoint: TimelineAvgSAPDataPoint[] = [{ date: new Date('2020-01-01'), national_avg_sap_rating: 60, filtered_avg_sap_rating: 65 }];
            const mockResponse: SAPTimelineResponse = { timeline: singlePoint };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            expect(chartData.length).toBe(2);
            const filteredTrace = chartData[0] as PlotData;
            expect(filteredTrace.x).toEqual([2020]);
            expect(filteredTrace.y).toEqual([65]);
        });

        it('should handle all filtered ratings as null', () => {
            const mockResponse: SAPTimelineResponse = { timeline: mockTimelineWithoutFiltered };
            jest.spyOn(dashboardService, 'getSAPTimeline').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            expect(chartData.length).toBe(1);
            const trace = chartData[0] as PlotData;
            expect(trace.name).toBe('Average SAP score');
            expect(trace.y).toEqual([60, 62, 64]);
        });
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
