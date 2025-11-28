import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaFilter } from '@core/models/area-filter.model';
import { DashboardService, BackendFuelTypesByBuildingTypeResponse } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import type { PlotData } from 'plotly.js-dist-min';
import { of } from 'rxjs';
import { getPlotlyModuleProviders } from '../plotly.mock';
import { BuildingFuelChartComponent } from './building-fuel-chart.component';

const mockRuntimeConfig = {
    epcColours: {},
};

const mockApiResponse: BackendFuelTypesByBuildingTypeResponse[] = [
    { building_type: 'House', fuel_type: 'NaturalFuelGas', count: 100 },
    { building_type: 'House', fuel_type: 'Electricity', count: 50 },
    { building_type: 'Flat', fuel_type: 'NaturalFuelGas', count: 75 },
    { building_type: 'Flat', fuel_type: 'Oil', count: 25 },
];

describe('BuildingFuelChartComponent', () => {
    let component: BuildingFuelChartComponent;
    let fixture: ComponentFixture<BuildingFuelChartComponent>;
    let dashboardService: DashboardService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BuildingFuelChartComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                ...getPlotlyModuleProviders(),
                { provide: RUNTIME_CONFIGURATION, useValue: mockRuntimeConfig },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BuildingFuelChartComponent);
        component = fixture.componentInstance;
        dashboardService = TestBed.inject(DashboardService);
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
        expect(component.loading()).toBe(true);
        expect(component.chartData()).toEqual([]);
        expect(component.availableBuildingTypes()).toEqual([]);
        expect(component.selectedBuildingType()).toBeNull();
    });

    describe('loadData', () => {
        it('should load fuel types data and set House as default building type', () => {
            jest.spyOn(dashboardService, 'getFuelTypesByBuildingType').mockReturnValue(of(mockApiResponse));

            fixture.detectChanges();

            expect(dashboardService.getFuelTypesByBuildingType).toHaveBeenCalledWith(undefined);
            expect(component.availableBuildingTypes()).toEqual(['Flat', 'House']);
            expect(component.selectedBuildingType()).toBe('House');
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

            jest.spyOn(dashboardService, 'getFuelTypesByBuildingType').mockReturnValue(of(mockApiResponse));

            fixture.componentRef.setInput('areaFilter', mockAreaFilter);
            fixture.detectChanges();

            expect(dashboardService.getFuelTypesByBuildingType).toHaveBeenCalledWith(mockAreaFilter);
        });

        it('should handle empty response', () => {
            jest.spyOn(dashboardService, 'getFuelTypesByBuildingType').mockReturnValue(of([]));

            fixture.detectChanges();

            expect(component.availableBuildingTypes()).toEqual([]);
            expect(component.selectedBuildingType()).toBeNull();
        });
    });

    describe('fuel type label formatting', () => {
        it('should format known fuel types correctly in chart labels', () => {
            jest.spyOn(dashboardService, 'getFuelTypesByBuildingType').mockReturnValue(
                of([{ building_type: 'House', fuel_type: 'NaturalFuelGas', count: 100 }]),
            );
            fixture.detectChanges();

            const chartData = component.chartData();
            const barData = chartData[0] as PlotData;
            expect(barData.y).toContain('Natural Gas');
        });

        it('should format unknown fuel types with spaces in chart labels', () => {
            jest.spyOn(dashboardService, 'getFuelTypesByBuildingType').mockReturnValue(
                of([{ building_type: 'House', fuel_type: 'SomeUnknownFuelType', count: 50 }]),
            );
            fixture.detectChanges();

            const chartData = component.chartData();
            const barData = chartData[0] as PlotData;
            expect(barData.y).toContain('Some Unknown Fuel Type');
        });
    });

    describe('data filtering by building type', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getFuelTypesByBuildingType').mockReturnValue(of(mockApiResponse));
            fixture.detectChanges();
        });

        it('should not update chart when no building type selected', () => {
            component.selectedBuildingType.set('House');
            fixture.detectChanges();
            const chartDataWithSelection = component.chartData();

            component.selectedBuildingType.set(null);
            fixture.detectChanges();

            expect(component.chartData()).toEqual(chartDataWithSelection);
        });

        it('should filter chart data by selected building type', () => {
            component.selectedBuildingType.set('House');
            fixture.detectChanges();

            const chartData = component.chartData();
            expect(chartData.length).toBeGreaterThan(0);
            const barData = chartData[0] as PlotData;
            expect(barData.type).toBe('bar');
            expect(barData.orientation).toBe('h');
            expect(barData.y).toContain('Natural Gas');
            expect(barData.y).toContain('Electricity');
            expect(barData.customdata).toContain(100);
            expect(barData.customdata).toContain(50);
        });

        it('should update chart when switching building types', () => {
            component.selectedBuildingType.set('House');
            fixture.detectChanges();

            const houseData = component.chartData();

            component.selectedBuildingType.set('Flat');
            fixture.detectChanges();

            const flatData = component.chartData();
            expect(flatData).not.toEqual(houseData);
        });
    });

    describe('fuel type ordering', () => {
        it('should not have duplicate labels due to Fuel and Other both mapping to "Other"', () => {
            const realWorldData: BackendFuelTypesByBuildingTypeResponse[] = [
                { building_type: 'House', fuel_type: 'NaturalFuelGas', count: 16674 },
                { building_type: 'House', fuel_type: 'Oil', count: 1658 },
                { building_type: 'House', fuel_type: 'Electricity', count: 1252 },
                { building_type: 'House', fuel_type: 'LPG', count: 428 },
                { building_type: 'House', fuel_type: 'Other', count: 70 },
                { building_type: 'House', fuel_type: 'WoodLogs', count: 38 },
                { building_type: 'House', fuel_type: 'Coal', count: 18 },
                { building_type: 'House', fuel_type: 'Biomass', count: 16 },
                { building_type: 'House', fuel_type: 'WoodPellets', count: 5 },
                { building_type: 'House', fuel_type: 'Anthracite', count: 4 },
                { building_type: 'House', fuel_type: 'WoodChips', count: 3 },
                { building_type: 'House', fuel_type: 'SmokelessCoal', count: 3 },
                { building_type: 'House', fuel_type: 'Fuel', count: 3 },
            ];

            jest.spyOn(dashboardService, 'getFuelTypesByBuildingType').mockReturnValue(of(realWorldData));
            fixture.detectChanges();

            const chartData = component.chartData();
            const barData = chartData[0] as PlotData;
            const yLabels = barData.y as string[];

            const uniqueLabels = new Set(yLabels);
            expect(uniqueLabels.size).toBe(yLabels.length);
        });

        it('should aggregate counts when multiple fuel types map to the same label', () => {
            // Both "Fuel" and "Other" map to label "Other" - counts should be summed
            const dataWithDuplicateLabels: BackendFuelTypesByBuildingTypeResponse[] = [
                { building_type: 'House', fuel_type: 'Other', count: 70 },
                { building_type: 'House', fuel_type: 'Fuel', count: 3 },
                { building_type: 'House', fuel_type: 'NaturalFuelGas', count: 100 },
            ];

            jest.spyOn(dashboardService, 'getFuelTypesByBuildingType').mockReturnValue(of(dataWithDuplicateLabels));
            fixture.detectChanges();

            const chartData = component.chartData();
            const barData = chartData[0] as PlotData;
            const yLabels = barData.y as string[];
            const customdata = barData.customdata as number[];

            // Should only have 2 labels: "Other" (aggregated) and "Natural Gas"
            expect(yLabels.length).toBe(2);

            // "Other" should have aggregated count of 70 + 3 = 73
            const otherIndex = yLabels.indexOf('Other');
            expect(customdata[otherIndex]).toBe(73);
        });
    });
});
