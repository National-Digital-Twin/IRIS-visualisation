import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaFilter } from '@core/models/area-filter.model';
import { DashboardService, EPCRatingOvertimeDataPoint } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import type { PlotData } from 'plotly.js-dist-min';
import { of } from 'rxjs';
import { ChartService } from '../../chart.service';
import { getPlotlyModuleProviders } from '../plotly.mock';
import { EpcRatingsOvertimeChartComponent } from './epc-ratings-overtime-chart.component';

const mockRuntimeConfig = {
    epcColours: {
        A: '#3D4E3B',
        B: '#4BA046',
        C: '#A3EB9F',
        D: '#FFD10A',
        E: '#FFCC99',
        F: '#E66E23',
        G: '#B60007',
    },
};

const mockDataPoints: EPCRatingOvertimeDataPoint[] = [
    { date: new Date('2020-12-31'), epc_a: 100, epc_b: 200, epc_c: 300, epc_d: 400, epc_e: 500, epc_f: 600, epc_g: 700 },
    { date: new Date('2021-12-31'), epc_a: 110, epc_b: 210, epc_c: 310, epc_d: 410, epc_e: 510, epc_f: 610, epc_g: 710 },
    { date: new Date('2022-12-31'), epc_a: 120, epc_b: 220, epc_c: 320, epc_d: 420, epc_e: 520, epc_f: 620, epc_g: 720 },
];

const mockEmptyDataPoints: EPCRatingOvertimeDataPoint[] = [];

describe('EpcRatingsOvertimeChartComponent', () => {
    let component: EpcRatingsOvertimeChartComponent;
    let fixture: ComponentFixture<EpcRatingsOvertimeChartComponent>;
    let dashboardService: DashboardService;
    let chartServiceMock: Partial<ChartService>;

    beforeEach(async () => {
        chartServiceMock = {
            commonFont: { family: 'Roboto, sans-serif' },
            commonHoverStyle: { bgcolor: '#000', font: { color: 'white', family: 'Roboto, sans-serif' } },
            epcColors: mockRuntimeConfig.epcColours,
            colorway: ['#3670B3', '#002244', '#FFCF06', '#E02720', '#62BA5A'],
            sortRegionsAlphabetically: jest.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [EpcRatingsOvertimeChartComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                ...getPlotlyModuleProviders(),
                { provide: RUNTIME_CONFIGURATION, useValue: mockRuntimeConfig },
                { provide: ChartService, useValue: chartServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EpcRatingsOvertimeChartComponent);
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
        it('should load EPC ratings data without area filter', () => {
            const mockResponse: EPCRatingOvertimeDataPoint[] = mockDataPoints;
            jest.spyOn(dashboardService, 'getEPCRatingsOvertime').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            expect(dashboardService.getEPCRatingsOvertime).toHaveBeenCalledWith(undefined);
            expect(component.loading()).toBe(false);
            expect(component.chartData().length).toBe(7);
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

            const mockResponse: EPCRatingOvertimeDataPoint[] = mockDataPoints;
            jest.spyOn(dashboardService, 'getEPCRatingsOvertime').mockReturnValue(of(mockResponse));

            fixture.componentRef.setInput('areaFilter', mockAreaFilter);
            fixture.detectChanges();

            expect(dashboardService.getEPCRatingsOvertime).toHaveBeenCalledWith(mockAreaFilter);
        });

        it('should handle empty response', () => {
            const mockResponse: EPCRatingOvertimeDataPoint[] = mockEmptyDataPoints;
            jest.spyOn(dashboardService, 'getEPCRatingsOvertime').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            expect(component.loading()).toBe(false);
            expect(component.chartData().length).toBe(7);
            const traceA = component.chartData()[0] as PlotData;
            expect(traceA.name).toBe('A');
            expect(traceA.y).toEqual([]);
        });

        it('should set loading to false after data is loaded', () => {
            const mockResponse: EPCRatingOvertimeDataPoint[] = mockDataPoints;
            jest.spyOn(dashboardService, 'getEPCRatingsOvertime').mockReturnValue(of(mockResponse));

            expect(component.loading()).toBe(true);

            fixture.detectChanges();

            expect(component.loading()).toBe(false);
        });
    });

    describe('chart data transformation', () => {
        it('should create 7 traces for all EPC ratings', () => {
            const mockResponse: EPCRatingOvertimeDataPoint[] = mockDataPoints;
            jest.spyOn(dashboardService, 'getEPCRatingsOvertime').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            expect(chartData.length).toBe(7);

            const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            ratings.forEach((rating, index) => {
                const trace = chartData[index] as PlotData;
                expect(trace.name).toBe(rating);
                expect(trace.type).toBe('scatter');
                expect(trace.mode).toBe('lines');
            });
        });

        it('should extract years from dates for x-axis', () => {
            const mockResponse: EPCRatingOvertimeDataPoint[] = mockDataPoints;
            jest.spyOn(dashboardService, 'getEPCRatingsOvertime').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            const trace = chartData[0] as PlotData;
            expect(trace.x).toEqual([2020, 2021, 2022]);
        });

        it('should map EPC rating A data correctly', () => {
            const mockResponse: EPCRatingOvertimeDataPoint[] = mockDataPoints;
            jest.spyOn(dashboardService, 'getEPCRatingsOvertime').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            const traceA = chartData[0] as PlotData;
            expect(traceA.name).toBe('A');
            expect(traceA.y).toEqual([100, 110, 120]);
        });

        it('should map EPC rating G data correctly', () => {
            const mockResponse: EPCRatingOvertimeDataPoint[] = mockDataPoints;
            jest.spyOn(dashboardService, 'getEPCRatingsOvertime').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            const traceG = chartData[6] as PlotData;
            expect(traceG.name).toBe('G');
            expect(traceG.y).toEqual([700, 710, 720]);
        });

        it('should use correct EPC colors for each rating', () => {
            const mockResponse: EPCRatingOvertimeDataPoint[] = mockDataPoints;
            jest.spyOn(dashboardService, 'getEPCRatingsOvertime').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            const traceA = chartData[0] as PlotData;
            expect(traceA.line).toEqual({ color: '#3D4E3B' });

            const traceG = chartData[6] as PlotData;
            expect(traceG.line).toEqual({ color: '#B60007' });
        });

        it('should include hovertemplate with comma formatting in traces', () => {
            const mockResponse: EPCRatingOvertimeDataPoint[] = mockDataPoints;
            jest.spyOn(dashboardService, 'getEPCRatingsOvertime').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            const trace = chartData[0] as PlotData;
            expect(trace.hovertemplate).toBe('<b>%{x}</b><br>%{y:,}<extra></extra>');
        });

        it('should map all ratings data correctly', () => {
            const mockResponse: EPCRatingOvertimeDataPoint[] = mockDataPoints;
            jest.spyOn(dashboardService, 'getEPCRatingsOvertime').mockReturnValue(of(mockResponse));

            fixture.detectChanges();

            const chartData = component.chartData();
            const expectedData = [
                [100, 110, 120], // A
                [200, 210, 220], // B
                [300, 310, 320], // C
                [400, 410, 420], // D
                [500, 510, 520], // E
                [600, 610, 620], // F
                [700, 710, 720], // G
            ];

            expectedData.forEach((expected, index) => {
                const trace = chartData[index] as PlotData;
                expect(trace.y).toEqual(expected);
            });
        });
    });
});
