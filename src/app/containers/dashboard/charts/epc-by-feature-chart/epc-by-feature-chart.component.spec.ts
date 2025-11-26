import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaFilter } from '@core/models/area-filter.model';
import { DashboardService, EPCRatingsByCategory } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import type { PlotData } from 'plotly.js-dist-min';
import { of } from 'rxjs';
import { getPlotlyModuleProviders } from '../plotly.mock';
import { EpcByFeatureChartComponent } from './epc-by-feature-chart.component';

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

const mockGlazingData: EPCRatingsByCategory[] = [
    {
        name: 'DoubleGlazing',
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
        name: 'SingleGlazing',
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
        name: 'TripleGlazing',
        epc_a: 120,
        epc_b: 220,
        epc_c: 320,
        epc_d: 420,
        epc_e: 520,
        epc_f: 620,
        epc_g: 720,
        total: 2940,
    },
];

const mockFuelData: EPCRatingsByCategory[] = [
    { name: 'MainsGas', epc_a: 80, epc_b: 180, epc_c: 280, epc_d: 380, epc_e: 480, epc_f: 580, epc_g: 680, total: 2660 },
    { name: 'Electricity', epc_a: 90, epc_b: 190, epc_c: 290, epc_d: 390, epc_e: 490, epc_f: 590, epc_g: 690, total: 2730 },
];

describe('EpcByFeatureChartComponent', () => {
    let component: EpcByFeatureChartComponent;
    let fixture: ComponentFixture<EpcByFeatureChartComponent>;
    let dashboardService: DashboardService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EpcByFeatureChartComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                ...getPlotlyModuleProviders(),
                { provide: RUNTIME_CONFIGURATION, useValue: mockRuntimeConfig },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EpcByFeatureChartComponent);
        component = fixture.componentInstance;
        dashboardService = TestBed.inject(DashboardService);
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
        expect(component.loading()).toBe(true);
        expect(component.chartData()).toEqual([]);
        expect(component.availableFeatures).toEqual([
            'Glazing types',
            'Fuel types',
            'Wall construction types',
            'Wall insulation types',
            'Floor construction types',
            'Floor insulation types',
            'Roof construction types',
            'Roof insulation location',
            'Roof insulation thickness',
            'Roof material',
            'Solar panels',
            'Roof aspect',
        ]);
        expect(component.selectedFeatureDisplay()).toBe('Glazing types');
    });

    describe('loadData', () => {
        it('should load glazing feature data by default', () => {
            jest.spyOn(dashboardService, 'getEPCByFeature').mockReturnValue(of(mockGlazingData));

            fixture.detectChanges();

            expect(dashboardService.getEPCByFeature).toHaveBeenCalledWith('glazing_types', undefined);
            expect(component.selectedFeatureDisplay()).toBe('Glazing types');
            expect(component.loading()).toBe(false);
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

            jest.spyOn(dashboardService, 'getEPCByFeature').mockReturnValue(of(mockGlazingData));

            fixture.componentRef.setInput('areaFilter', mockAreaFilter);
            fixture.detectChanges();

            expect(dashboardService.getEPCByFeature).toHaveBeenCalledWith('glazing_types', mockAreaFilter);
        });

        it('should handle empty response', () => {
            jest.spyOn(dashboardService, 'getEPCByFeature').mockReturnValue(of([]));

            fixture.detectChanges();

            expect(component.chartData()).toEqual([]);
        });

        it('should handle zero EPC rating values correctly', () => {
            const dataWithZeros: EPCRatingsByCategory[] = [
                {
                    name: 'TestValue',
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

            jest.spyOn(dashboardService, 'getEPCByFeature').mockReturnValue(of(dataWithZeros));
            fixture.detectChanges();

            const chartData = component.chartData();
            const cTrace = chartData.find((trace) => (trace as PlotData).name === 'C') as PlotData;
            expect(cTrace.y).toEqual([0]);
        });
    });

    describe('chart data transformation', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getEPCByFeature').mockReturnValue(of(mockGlazingData));
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

        it('should load new feature data when feature changes', () => {
            jest.spyOn(dashboardService, 'getEPCByFeature').mockReturnValue(of(mockFuelData));

            component.onFeatureChange('Fuel types');
            fixture.detectChanges();

            expect(dashboardService.getEPCByFeature).toHaveBeenCalledWith('fuel_types', undefined);
            const chartData = component.chartData();
            const firstTrace = chartData[0] as PlotData;
            expect(firstTrace.x).toEqual(['Electricity', 'Mains gas']);
        });

        it('should sort values by total count (descending) in chart', () => {
            const chartData = component.chartData();
            const firstTrace = chartData[0] as PlotData;
            expect(firstTrace.x).toEqual(['Single glazing', 'Triple glazing', 'Double glazing']);
        });

        it('should map EPC rating values correctly', () => {
            const chartData = component.chartData();
            const aTrace = chartData[0] as PlotData;
            expect(aTrace.y).toEqual([150, 120, 100]);
        });

        it('should apply EPC colors to traces', () => {
            const chartData = component.chartData();
            const aTrace = chartData[0] as PlotData;
            expect(aTrace.marker).toEqual({ color: '#008054' });

            const gTrace = chartData[6] as PlotData;
            expect(gTrace.marker).toEqual({ color: '#990000' });
        });

        it('should generate correct hover template', () => {
            const chartData = component.chartData();
            chartData.forEach((trace) => {
                const plotData = trace as PlotData;
                expect(plotData.hovertemplate).toBe('<b>%{fullData.name}</b><br>%{y:,}<br>%{customdata}%<extra></extra>');
            });
        });

        it('should calculate percentages for hover correctly', () => {
            const chartData = component.chartData();
            const aTrace = chartData[0] as PlotData;
            expect(aTrace.customdata).toEqual(['4.8', '4.1', '3.6']);
        });
    });

    describe('chart layout', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getEPCByFeature').mockReturnValue(of(mockGlazingData));
            fixture.detectChanges();
        });

        it('should configure stacked bar mode', () => {
            const layout = component.chartLayout();
            expect(layout.barmode).toBe('stack');
        });

        it('should set y-axis range to 110% of max value', () => {
            const layout = component.chartLayout();
            const maxTotal = 3150;
            expect(layout.yaxis?.range).toEqual([0, maxTotal * 1.1]);
        });
    });

    describe('feature selection', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getEPCByFeature').mockReturnValue(of(mockGlazingData));
            fixture.detectChanges();
        });

        it('should update chart when feature changes', () => {
            expect(component.selectedFeatureDisplay()).toBe('Glazing types');

            jest.spyOn(dashboardService, 'getEPCByFeature').mockReturnValue(of(mockFuelData));
            component.onFeatureChange('Fuel types');
            fixture.detectChanges();

            expect(component.selectedFeatureDisplay()).toBe('Fuel types');
            expect(dashboardService.getEPCByFeature).toHaveBeenCalledWith('fuel_types', undefined);
            const chartData = component.chartData();
            const firstTrace = chartData[0] as PlotData;
            expect((firstTrace.x as string[]).length).toBe(2);
        });
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
