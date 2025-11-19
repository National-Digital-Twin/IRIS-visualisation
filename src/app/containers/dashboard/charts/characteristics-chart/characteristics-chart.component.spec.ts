import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaFilter } from '@core/models/area-filter.model';
import { BackendBuildingAttributesResponse, DashboardService } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import type { PlotData } from 'plotly.js-dist-min';
import { of } from 'rxjs';
import { getPlotlyModuleProviders } from '../plotly.mock';
import { CharacteristicsChartComponent } from './characteristics-chart.component';

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

const mockApiResponse: BackendBuildingAttributesResponse[] = [
    {
        region_name: 'North West',
        attributes: [
            { label: 'Single glazing', value: 15.5 },
            { label: 'Double glazing', value: 75.2 },
            { label: 'Triple glazing', value: 9.3 },
            { label: 'Solar panels', value: 8.5 },
        ],
    },
    {
        region_name: 'London',
        attributes: [
            { label: 'Single glazing', value: 12.0 },
            { label: 'Double glazing', value: 80.0 },
            { label: 'Triple glazing', value: 8.0 },
            { label: 'Solar panels', value: 10.0 },
        ],
    },
    {
        region_name: 'South East',
        attributes: [
            { label: 'Single glazing', value: 18.0 },
            { label: 'Double glazing', value: 72.0 },
            { label: 'Triple glazing', value: 10.0 },
            { label: 'Solar panels', value: 7.5 },
        ],
    },
];

describe('CharacteristicsChartComponent', () => {
    let component: CharacteristicsChartComponent;
    let fixture: ComponentFixture<CharacteristicsChartComponent>;
    let dashboardService: DashboardService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CharacteristicsChartComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                ...getPlotlyModuleProviders(),
                { provide: RUNTIME_CONFIGURATION, useValue: mockRuntimeConfig },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacteristicsChartComponent);
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
        it('should load building attributes and set all regions as selected', () => {
            jest.spyOn(dashboardService, 'getAllBuildingAttributesPerRegion').mockReturnValue(of(mockApiResponse));

            fixture.detectChanges();

            expect(dashboardService.getAllBuildingAttributesPerRegion).toHaveBeenCalledWith(undefined);
            expect(component.availableRegions()).toEqual(['North West', 'London', 'South East']);
            expect(component.selectedRegions()).toEqual(['North West', 'London', 'South East']);
            expect(component.loading()).toBe(false);
        });

        it('should default to Solar panels characteristic if available', () => {
            jest.spyOn(dashboardService, 'getAllBuildingAttributesPerRegion').mockReturnValue(of(mockApiResponse));

            fixture.detectChanges();

            expect(component.selectedCharacteristic()).toBe('Solar panels');
        });

        it('should default to first characteristic if Solar panels not available', () => {
            const responseWithoutSolar: BackendBuildingAttributesResponse[] = [
                {
                    region_name: 'Test Region',
                    attributes: [
                        { label: 'Single glazing', value: 20.0 },
                        { label: 'Double glazing', value: 80.0 },
                    ],
                },
            ];
            jest.spyOn(dashboardService, 'getAllBuildingAttributesPerRegion').mockReturnValue(of(responseWithoutSolar));

            fixture.detectChanges();

            expect(component.selectedCharacteristic()).toBe('Single glazing');
        });

        it('should extract characteristic options from API response', () => {
            jest.spyOn(dashboardService, 'getAllBuildingAttributesPerRegion').mockReturnValue(of(mockApiResponse));

            fixture.detectChanges();

            expect(component.characteristicOptions()).toEqual(['Single glazing', 'Double glazing', 'Triple glazing', 'Solar panels']);
        });

        it('should pass areaFilter to service when provided', () => {
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

            jest.spyOn(dashboardService, 'getAllBuildingAttributesPerRegion').mockReturnValue(of(mockApiResponse));

            fixture.componentRef.setInput('areaFilter', mockAreaFilter);
            fixture.detectChanges();

            expect(dashboardService.getAllBuildingAttributesPerRegion).toHaveBeenCalledWith(mockAreaFilter);
        });

        it('should handle empty response', () => {
            jest.spyOn(dashboardService, 'getAllBuildingAttributesPerRegion').mockReturnValue(of([]));

            fixture.detectChanges();

            expect(component.availableRegions()).toEqual([]);
            expect(component.selectedRegions()).toEqual([]);
            expect(component.characteristicOptions()).toEqual([]);
        });
    });

    describe('chart data transformation', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getAllBuildingAttributesPerRegion').mockReturnValue(of(mockApiResponse));
            fixture.detectChanges();
        });

        it('should create bar chart with correct structure', () => {
            const chartData = component.chartData();
            expect(chartData.length).toBe(1);
            expect(chartData[0].type).toBe('bar');
        });

        it('should filter chart data by selected regions', () => {
            component.selectedRegions.set(['London', 'South East']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const plotData = chartData[0] as PlotData;
            expect(plotData.x).toEqual(['London', 'South<br>East']);
        });

        it('should sort regions by value descending in chart', () => {
            component.selectedRegions.set(['South East', 'London', 'North West']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const plotData = chartData[0] as PlotData;
            expect(plotData.x).toEqual(['London', 'North<br>West', 'South<br>East']);
            expect(plotData.y).toEqual([10.0, 8.5, 7.5]);
        });

        it('should display percentage values for selected characteristic', () => {
            component.selectedCharacteristic.set('Solar panels');
            fixture.detectChanges();

            const chartData = component.chartData();
            const plotData = chartData[0] as PlotData;
            expect(plotData.y).toEqual([10.0, 8.5, 7.5]);
        });

        it('should update chart and resort when selected characteristic changes', () => {
            component.selectedCharacteristic.set('Solar panels');
            fixture.detectChanges();
            const solarData = component.chartData();

            component.selectedCharacteristic.set('Single glazing');
            fixture.detectChanges();
            const glazingData = component.chartData();

            expect(solarData).not.toEqual(glazingData);
            expect((glazingData[0] as PlotData).x).toEqual(['South<br>East', 'North<br>West', 'London']);
            expect((glazingData[0] as PlotData).y).toEqual([18.0, 15.5, 12.0]);
        });
    });

    describe('missing attribute handling', () => {
        it('should handle missing attribute values with zero', () => {
            const responseWithMissing: BackendBuildingAttributesResponse[] = [
                {
                    region_name: 'Test Region',
                    attributes: [{ label: 'Single glazing', value: 20.0 }],
                },
            ];
            jest.spyOn(dashboardService, 'getAllBuildingAttributesPerRegion').mockReturnValue(of(responseWithMissing));
            fixture.detectChanges();

            component.selectedCharacteristic.set('Solar panels');
            fixture.detectChanges();

            const chartData = component.chartData();
            const plotData = chartData[0] as PlotData;
            expect(plotData.y).toEqual([0]);
        });
    });

    describe('region selection updates', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getAllBuildingAttributesPerRegion').mockReturnValue(of(mockApiResponse));
            fixture.detectChanges();
        });

        it('should update chart when selected regions change', () => {
            const initialData = component.chartData();

            component.selectedRegions.set(['London']);
            fixture.detectChanges();

            const updatedData = component.chartData();
            expect(updatedData).not.toEqual(initialData);

            const plotData = updatedData[0] as PlotData;
            expect(plotData.x).toEqual(['London']);
            expect(plotData.y).toEqual([10.0]);
        });
    });
});
