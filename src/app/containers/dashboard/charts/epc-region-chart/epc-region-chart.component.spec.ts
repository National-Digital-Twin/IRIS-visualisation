import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardService, EPCRegionData } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { Polygon } from 'geojson';
import type { PlotData } from 'plotly.js-dist-min';
import { of } from 'rxjs';
import { getPlotlyModuleProviders } from '../plotly.mock';
import { EpcRegionChartComponent } from './epc-region-chart.component';

const mockRuntimeConfig = {
    epcColours: {
        A: '#008054',
        B: '#19b459',
        C: '#ffcc00',
        D: '#ff9900',
        E: '#ff6600',
        F: '#ff0000',
        G: '#990000',
    },
};

const mockApiResponse: EPCRegionData[] = [
    {
        region_name: 'North West',
        epc_a: 100,
        epc_b: 200,
        epc_c: 300,
        epc_d: 400,
        epc_e: 500,
        epc_f: 600,
        epc_g: 700,
        total: 2800,
    },
    {
        region_name: 'London',
        epc_a: 150,
        epc_b: 250,
        epc_c: 350,
        epc_d: 450,
        epc_e: 550,
        epc_f: 650,
        epc_g: 750,
        total: 3150,
    },
    {
        region_name: 'South East',
        epc_a: 120,
        epc_b: 220,
        epc_c: 320,
        epc_d: 420,
        epc_e: 520,
        epc_f: 620,
        epc_g: 720,
        total: 2940,
    },
    {
        region_name: 'Yorkshire',
        epc_a: 80,
        epc_b: 180,
        epc_c: 280,
        epc_d: 380,
        epc_e: 480,
        epc_f: 580,
        epc_g: 680,
        total: 2660,
    },
    {
        region_name: 'East Midlands',
        epc_a: 90,
        epc_b: 190,
        epc_c: 290,
        epc_d: 390,
        epc_e: 490,
        epc_f: 590,
        epc_g: 690,
        total: 2730,
    },
];

describe('EpcRegionChartComponent', () => {
    let component: EpcRegionChartComponent;
    let fixture: ComponentFixture<EpcRegionChartComponent>;
    let dashboardService: DashboardService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EpcRegionChartComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                ...getPlotlyModuleProviders(),
                { provide: RUNTIME_CONFIGURATION, useValue: mockRuntimeConfig },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EpcRegionChartComponent);
        component = fixture.componentInstance;
        dashboardService = TestBed.inject(DashboardService);
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
        expect(component.loading()).toBe(true);
        expect(component.chartData()).toEqual([]);
        expect(component.availableRegions()).toEqual([]);
        expect(component.selectedRegions()).toEqual([]);
    });

    describe('loadData', () => {
        it('should load region data and set all regions as selected', () => {
            jest.spyOn(dashboardService, 'getEPCByRegion').mockReturnValue(of(mockApiResponse));

            fixture.detectChanges();

            expect(dashboardService.getEPCByRegion).toHaveBeenCalledWith(undefined);
            expect(component.availableRegions()).toEqual(['North West', 'London', 'South East', 'Yorkshire', 'East Midlands']);
            expect(component.selectedRegions()).toEqual(['North West', 'London', 'South East', 'Yorkshire', 'East Midlands']);
            expect(component.loading()).toBe(false);
        });

        it('should select all regions when fewer than 4 available', () => {
            const twoRegions = mockApiResponse.slice(0, 2);
            jest.spyOn(dashboardService, 'getEPCByRegion').mockReturnValue(of(twoRegions));

            fixture.detectChanges();

            expect(component.availableRegions()).toEqual(['North West', 'London']);
            expect(component.selectedRegions()).toEqual(['North West', 'London']);
        });

        it('should pass polygon to service when selectedArea is provided', () => {
            const mockPolygon: GeoJSON.Feature<Polygon> = {
                type: 'Feature',
                geometry: {
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
                properties: {},
            };

            jest.spyOn(dashboardService, 'getEPCByRegion').mockReturnValue(of(mockApiResponse));

            fixture.componentRef.setInput('selectedArea', mockPolygon);
            fixture.detectChanges();

            expect(dashboardService.getEPCByRegion).toHaveBeenCalledWith(mockPolygon.geometry);
        });

        it('should handle empty response', () => {
            jest.spyOn(dashboardService, 'getEPCByRegion').mockReturnValue(of([]));

            fixture.detectChanges();

            expect(component.availableRegions()).toEqual([]);
            expect(component.selectedRegions()).toEqual([]);
        });

        it('should handle zero EPC rating values correctly', () => {
            const dataWithZeros: EPCRegionData[] = [
                {
                    region_name: 'Test Region',
                    epc_a: 100,
                    epc_b: 0,
                    epc_c: 0,
                    epc_d: 200,
                    epc_e: 0,
                    epc_f: 0,
                    epc_g: 0,
                    total: 300,
                },
            ];

            jest.spyOn(dashboardService, 'getEPCByRegion').mockReturnValue(of(dataWithZeros));
            fixture.detectChanges();

            component.selectedRegions.set(['Test Region']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const cTrace = chartData.find((trace) => (trace as PlotData).name === 'C') as PlotData;
            expect(cTrace.y).toEqual([0]);
        });
    });

    describe('chart data transformation', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getEPCByRegion').mockReturnValue(of(mockApiResponse));
            fixture.detectChanges();
        });

        it('should create stacked bar chart with correct structure', () => {
            const chartData = component.chartData();
            expect(chartData.length).toBe(7);
            expect(chartData.every((trace) => trace.type === 'bar')).toBe(true);
        });

        it('should create one trace per EPC rating', () => {
            const chartData = component.chartData();
            const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            chartData.forEach((trace, index) => {
                const plotData = trace as PlotData;
                expect(plotData.name).toBe(ratings[index]);
            });
        });

        it('should filter chart data by selected regions', () => {
            component.selectedRegions.set(['London', 'South East']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const firstTrace = chartData[0] as PlotData;
            expect(firstTrace.x).toEqual(['London', 'South<br>East']);
        });

        it('should sort regions alphabetically in chart', () => {
            component.selectedRegions.set(['Yorkshire', 'North West', 'London']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const firstTrace = chartData[0] as PlotData;
            expect(firstTrace.x).toEqual(['London', 'North<br>West', 'Yorkshire']);
        });

        it('should format region names with line breaks for spaces', () => {
            component.selectedRegions.set(['North West', 'South East']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const firstTrace = chartData[0] as PlotData;
            expect(firstTrace.x).toEqual(['North<br>West', 'South<br>East']);
        });

        it('should map EPC rating values correctly', () => {
            component.selectedRegions.set(['London']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const aTrace = chartData.find((trace) => (trace as PlotData).name === 'A') as PlotData;
            const gTrace = chartData.find((trace) => (trace as PlotData).name === 'G') as PlotData;

            expect(aTrace.y).toEqual([150]);
            expect(gTrace.y).toEqual([750]);
        });

        it('should use EPC colors from configuration', () => {
            const chartData = component.chartData();
            const aTrace = chartData.find((trace) => (trace as PlotData).name === 'A') as PlotData;
            const gTrace = chartData.find((trace) => (trace as PlotData).name === 'G') as PlotData;

            expect(aTrace.marker?.color).toBe(mockRuntimeConfig.epcColours.A);
            expect(gTrace.marker?.color).toBe(mockRuntimeConfig.epcColours.G);
        });

        it('should include EPC rating and percentages in hovertemplate', () => {
            component.selectedRegions.set(['London']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const aTrace = chartData.find((trace) => (trace as PlotData).name === 'A') as PlotData;
            const gTrace = chartData.find((trace) => (trace as PlotData).name === 'G') as PlotData;

            expect(aTrace.hovertemplate).toContain('%{fullData.name}');
            expect(aTrace.hovertemplate).toContain('%{customdata}%');
            expect(gTrace.hovertemplate).toContain('%{fullData.name}');
            expect(gTrace.hovertemplate).toContain('%{customdata}%');
            expect(aTrace.customdata).toBeDefined();
            expect(gTrace.customdata).toBeDefined();
        });

        it('should calculate percentages correctly', () => {
            component.selectedRegions.set(['London']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const aTrace = chartData.find((trace) => (trace as PlotData).name === 'A') as PlotData;

            expect(aTrace.customdata).toEqual(['4.8']);
        });
    });

    describe('region selection updates', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getEPCByRegion').mockReturnValue(of(mockApiResponse));
            fixture.detectChanges();
        });

        it('should update chart when selected regions change', () => {
            const initialData = component.chartData();

            component.selectedRegions.set(['London']);
            fixture.detectChanges();

            const updatedData = component.chartData();
            expect(updatedData).not.toEqual(initialData);

            const firstTrace = updatedData[0] as PlotData;
            expect(firstTrace.x).toEqual(['London']);

            component.selectedRegions.set(['London', 'South East']);
            fixture.detectChanges();

            const updatedData2 = component.chartData();
            expect(updatedData2).not.toEqual(updatedData);

            const firstTrace2 = updatedData2[0] as PlotData;
            expect(firstTrace2.x).toEqual(['London', 'South<br>East']);
        });
    });
});
