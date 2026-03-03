import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaFilter } from '@core/models/area-filter.model';
import { DashboardService, EPCAreaData } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import type { PlotData } from 'plotly.js-dist-min';
import { of } from 'rxjs';
import { getPlotlyModuleProviders } from '../plotly.mock';
import { EpcByAreaChartComponent } from './epc-by-area-chart.component';

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

const mockRegionData: EPCAreaData[] = [
    {
        name: 'North West',
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
        name: 'London',
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
        name: 'South East',
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

const mockCountyData: EPCAreaData[] = [
    {
        name: 'Greater Manchester',
        epc_a: 50,
        epc_b: 100,
        epc_c: 150,
        epc_d: 200,
        epc_e: 250,
        epc_f: 300,
        epc_g: 350,
        total: 1400,
    },
    {
        name: 'Lancashire',
        epc_a: 30,
        epc_b: 60,
        epc_c: 90,
        epc_d: 120,
        epc_e: 150,
        epc_f: 180,
        epc_g: 210,
        total: 840,
    },
];

describe('EpcByAreaChartComponent', () => {
    let component: EpcByAreaChartComponent;
    let fixture: ComponentFixture<EpcByAreaChartComponent>;
    let dashboardService: DashboardService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EpcByAreaChartComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                ...getPlotlyModuleProviders(),
                { provide: RUNTIME_CONFIGURATION, useValue: mockRuntimeConfig },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EpcByAreaChartComponent);
        component = fixture.componentInstance;
        dashboardService = TestBed.inject(DashboardService);
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
        expect(component.loading()).toBe(true);
        expect(component.chartData()).toEqual([]);
        expect(component.availableAreas()).toEqual([]);
        expect(component.selectedAreas()).toEqual([]);
    });

    describe('National mode (no areaFilter)', () => {
        it('should load region data grouped by region with no filter', () => {
            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(mockRegionData));

            fixture.detectChanges();

            expect(dashboardService.getEPCByAreaLevel).toHaveBeenCalledWith('region', undefined, undefined);
            expect(component.availableAreas()).toEqual(['North West', 'London', 'South East']);
            expect(component.selectedAreas()).toEqual(['North West', 'London', 'South East']);
            expect(component.loading()).toBe(false);
        });

        it('should have correct title and selector label for national mode', () => {
            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(mockRegionData));

            fixture.detectChanges();

            expect(component.chartTitle()).toBe('EPC ratings by');
            expect(component.selectorLabel()).toBe('region');
            expect(component.titleSuffix()).toBe('');
        });
    });

    describe('Multiple areas selected', () => {
        it('should group by same level when multiple regions selected', () => {
            const areaFilter: AreaFilter = {
                mode: 'named-areas',
                level: 'region',
                names: ['North West', 'London'],
            };

            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(mockRegionData.slice(0, 2)));

            fixture.componentRef.setInput('areaFilter', areaFilter);
            fixture.detectChanges();

            expect(dashboardService.getEPCByAreaLevel).toHaveBeenCalledWith('region', 'region', ['North West', 'London']);
            expect(component.chartTitle()).toBe('EPC ratings by');
            expect(component.selectorLabel()).toBe('region');
            expect(component.titleSuffix()).toBe('');
        });

        it('should group by same level when multiple counties selected', () => {
            const areaFilter: AreaFilter = {
                mode: 'named-areas',
                level: 'county',
                names: ['Greater Manchester', 'Lancashire'],
            };

            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(mockCountyData));

            fixture.componentRef.setInput('areaFilter', areaFilter);
            fixture.detectChanges();

            expect(dashboardService.getEPCByAreaLevel).toHaveBeenCalledWith('county', 'county', ['Greater Manchester', 'Lancashire']);
            expect(component.chartTitle()).toBe('EPC ratings by');
            expect(component.selectorLabel()).toBe('county');
        });
    });

    describe('Single area selected (drill-down)', () => {
        it('should group by counties when single region selected', () => {
            const areaFilter: AreaFilter = {
                mode: 'named-areas',
                level: 'region',
                names: ['North West'],
            };

            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(mockCountyData));

            fixture.componentRef.setInput('areaFilter', areaFilter);
            fixture.detectChanges();

            expect(dashboardService.getEPCByAreaLevel).toHaveBeenCalledWith('county', 'region', ['North West']);
            expect(component.chartTitle()).toBe('EPC ratings of');
            expect(component.selectorLabel()).toBe('county');
            expect(component.titleSuffix()).toBe(' in North West');
        });

        it('should group by districts when single county selected', () => {
            const areaFilter: AreaFilter = {
                mode: 'named-areas',
                level: 'county',
                names: ['Greater Manchester'],
            };

            const mockDistrictData: EPCAreaData[] = [
                { name: 'Manchester', epc_a: 10, epc_b: 20, epc_c: 30, epc_d: 40, epc_e: 50, epc_f: 60, epc_g: 70, total: 280 },
                { name: 'Salford', epc_a: 15, epc_b: 25, epc_c: 35, epc_d: 45, epc_e: 55, epc_f: 65, epc_g: 75, total: 315 },
            ];

            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(mockDistrictData));

            fixture.componentRef.setInput('areaFilter', areaFilter);
            fixture.detectChanges();

            expect(dashboardService.getEPCByAreaLevel).toHaveBeenCalledWith('district', 'county', ['Greater Manchester']);
            expect(component.selectorLabel()).toBe('district');
            expect(component.titleSuffix()).toBe(' in Greater Manchester');
        });

        it('should group by wards when single district selected', () => {
            const areaFilter: AreaFilter = {
                mode: 'named-areas',
                level: 'district',
                names: ['Manchester'],
            };

            const mockWardData: EPCAreaData[] = [
                { name: 'Ancoats', epc_a: 5, epc_b: 10, epc_c: 15, epc_d: 20, epc_e: 25, epc_f: 30, epc_g: 35, total: 140 },
                { name: 'Deansgate', epc_a: 8, epc_b: 12, epc_c: 18, epc_d: 24, epc_e: 30, epc_f: 36, epc_g: 42, total: 170 },
            ];

            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(mockWardData));

            fixture.componentRef.setInput('areaFilter', areaFilter);
            fixture.detectChanges();

            expect(dashboardService.getEPCByAreaLevel).toHaveBeenCalledWith('ward', 'district', ['Manchester']);
            expect(component.selectorLabel()).toBe('ward');
            expect(component.titleSuffix()).toBe(' in Manchester');
        });

        it('should stay at ward level when single ward selected', () => {
            const areaFilter: AreaFilter = {
                mode: 'named-areas',
                level: 'ward',
                names: ['Ancoats'],
            };

            const mockSingleWardData: EPCAreaData[] = [
                { name: 'Ancoats', epc_a: 5, epc_b: 10, epc_c: 15, epc_d: 20, epc_e: 25, epc_f: 30, epc_g: 35, total: 140 },
            ];

            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(mockSingleWardData));

            fixture.componentRef.setInput('areaFilter', areaFilter);
            fixture.detectChanges();

            expect(dashboardService.getEPCByAreaLevel).toHaveBeenCalledWith('ward', 'ward', ['Ancoats']);
            expect(component.selectorLabel()).toBe('ward');
            expect(component.titleSuffix()).toBe(' in Ancoats');
        });
    });

    describe('Chart data transformation', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(mockRegionData));
            fixture.detectChanges();
        });

        it('should create horizontal stacked bar chart with correct structure', () => {
            const chartData = component.chartData();
            expect(chartData.length).toBe(7);
            expect(chartData.every((trace) => trace.type === 'bar')).toBe(true);
            expect(chartData.every((trace) => (trace as PlotData).orientation === 'h')).toBe(true);
        });

        it('should create one trace per EPC rating', () => {
            const chartData = component.chartData();
            const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            chartData.forEach((trace, index) => {
                const plotData = trace as PlotData;
                expect(plotData.name).toBe(ratings[index]);
            });
        });

        it('should sort areas by total count (ascending)', () => {
            const chartData = component.chartData();
            const firstTrace = chartData[0] as PlotData;

            expect(firstTrace.y).toEqual(['North West', 'South East', 'London']);
        });

        it('should filter chart data by selected areas', () => {
            component.selectedAreas.set(['London', 'South East']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const firstTrace = chartData[0] as PlotData;
            expect(firstTrace.y).toEqual(['South East', 'London']);
        });

        it('should map EPC rating values correctly', () => {
            component.selectedAreas.set(['London']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const aTrace = chartData.find((trace) => (trace as PlotData).name === 'A') as PlotData;
            const gTrace = chartData.find((trace) => (trace as PlotData).name === 'G') as PlotData;

            expect(aTrace.x).toEqual([150]);
            expect(gTrace.x).toEqual([750]);
        });

        it('should use EPC colors from configuration', () => {
            const chartData = component.chartData();
            const aTrace = chartData.find((trace) => (trace as PlotData).name === 'A') as PlotData;
            const gTrace = chartData.find((trace) => (trace as PlotData).name === 'G') as PlotData;

            expect(aTrace.marker?.color).toBe(mockRuntimeConfig.epcColours.A);
            expect(gTrace.marker?.color).toBe(mockRuntimeConfig.epcColours.G);
        });

        it('should calculate percentages correctly', () => {
            component.selectedAreas.set(['London']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const aTrace = chartData.find((trace) => (trace as PlotData).name === 'A') as PlotData;

            // 150 / 3150 * 100 = 4.76...
            expect(aTrace.customdata).toEqual(['4.8']);
        });

        it('should handle zero EPC rating values correctly', () => {
            const dataWithZeros: EPCAreaData[] = [
                {
                    name: 'Test Area',
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

            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(dataWithZeros));

            // Create a fresh component for this test
            const newFixture = TestBed.createComponent(EpcByAreaChartComponent);
            const newComponent = newFixture.componentInstance;
            newFixture.detectChanges();

            newComponent.selectedAreas.set(['Test Area']);
            newFixture.detectChanges();

            const chartData = newComponent.chartData();
            const cTrace = chartData.find((trace) => (trace as PlotData).name === 'C') as PlotData;
            expect(cTrace.x).toEqual([0]);
        });
    });

    describe('Region selection updates', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(mockRegionData));
            fixture.detectChanges();
        });

        it('should update chart when selected areas change', () => {
            const initialData = component.chartData();

            component.selectedAreas.set(['London']);
            fixture.detectChanges();

            const updatedData = component.chartData();
            expect(updatedData).not.toEqual(initialData);

            const firstTrace = updatedData[0] as PlotData;
            expect(firstTrace.y).toEqual(['London']);
        });
    });

    describe('Empty data handling', () => {
        it('should handle empty response', () => {
            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of([]));

            fixture.detectChanges();

            expect(component.availableAreas()).toEqual([]);
            expect(component.selectedAreas()).toEqual([]);
        });
    });

    describe('Scrolling behavior', () => {
        const createManyAreas = (count: number): EPCAreaData[] => {
            return Array.from({ length: count }, (_, i) => ({
                name: `Area ${i + 1}`,
                epc_a: 10 * (i + 1),
                epc_b: 20 * (i + 1),
                epc_c: 30 * (i + 1),
                epc_d: 40 * (i + 1),
                epc_e: 50 * (i + 1),
                epc_f: 60 * (i + 1),
                epc_g: 70 * (i + 1),
                total: 280 * (i + 1),
            }));
        };

        it('should not need scrolling when items fit within maxVisibleItems', () => {
            const fewAreas = createManyAreas(5);
            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(fewAreas));

            fixture.detectChanges();

            expect(component.scrollMetrics.needsScroll).toBe(false);
        });

        it('should need scrolling when items exceed maxVisibleItems', () => {
            const manyAreas = createManyAreas(20);
            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(manyAreas));

            fixture.detectChanges();

            expect(component.scrollMetrics.needsScroll).toBe(true);
            expect(component.scrollMetrics.maxScroll).toBe(10); // 20 - 10 maxVisibleItems
        });

        it('should initialize scroll to show top (largest values first)', () => {
            const manyAreas = createManyAreas(20);
            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(manyAreas));

            fixture.detectChanges();

            // Should be at max scroll position
            expect(component.scrollPosition()).toBe(component.scrollMetrics.maxScroll);
        });

        it('should clamp scroll position when hiding areas reduces total below current position', () => {
            const manyAreas = createManyAreas(20);
            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(manyAreas));

            fixture.detectChanges();

            // Start at max scroll (10)
            expect(component.scrollPosition()).toBe(10);

            // Hide most areas, leaving only 5
            component.selectedAreas.set(manyAreas.slice(0, 5).map((a) => a.name));
            fixture.detectChanges();

            // Should clamp to 0 since 5 items don't need scroll
            expect(component.scrollPosition()).toBe(0);
        });

        it('should update scroll position via onScrollPositionChange', () => {
            const manyAreas = createManyAreas(20);
            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(manyAreas));

            fixture.detectChanges();

            component.onScrollPositionChange(5);

            expect(component.scrollPosition()).toBe(5);
        });

        it('should clamp scroll position to valid bounds', () => {
            const manyAreas = createManyAreas(20);
            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(manyAreas));

            fixture.detectChanges();

            // Try to scroll past max
            component.onScrollPositionChange(100);
            expect(component.scrollPosition()).toBe(10);

            // Try to scroll below 0
            component.onScrollPositionChange(-5);
            expect(component.scrollPosition()).toBe(0);
        });

        it('should handle wheel scroll events', () => {
            const manyAreas = createManyAreas(20);
            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(manyAreas));

            fixture.detectChanges();

            // Start at max (10)
            expect(component.scrollPosition()).toBe(10);

            // Scroll down (positive deltaY) should decrease position
            const scrollDownEvent = new WheelEvent('wheel', { deltaY: 100 });
            component.onChartWheel(scrollDownEvent);

            expect(component.scrollPosition()).toBe(9);
        });

        it('should not handle wheel events when scrolling not needed', () => {
            const fewAreas = createManyAreas(5);
            jest.spyOn(dashboardService, 'getEPCByAreaLevel').mockReturnValue(of(fewAreas));

            fixture.detectChanges();

            const initialPosition = component.scrollPosition();
            const scrollEvent = new WheelEvent('wheel', { deltaY: 100 });
            component.onChartWheel(scrollEvent);

            expect(component.scrollPosition()).toBe(initialPosition);
        });
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
