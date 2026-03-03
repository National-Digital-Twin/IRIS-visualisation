import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaFilter } from '@core/models/area-filter.model';
import { SunlightHoursRegionData, DashboardService } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import type { PlotData } from 'plotly.js-dist-min';
import { of } from 'rxjs';
import { getPlotlyModuleProviders } from '../plotly.mock';
import { SunlightHoursByAreaChartComponent } from './sunlight-hours-by-area-chart.component';

describe('SunlightHoursByAreaChartComponent', () => {
    let component: SunlightHoursByAreaChartComponent;
    let fixture: ComponentFixture<SunlightHoursByAreaChartComponent>;
    let dashboardService: DashboardService;

    const mockRegionData: SunlightHoursRegionData[] = [
        {
            area_name: 'North West',
            average_daily_sunlight_hours: 5.2,
        },
        {
            area_name: 'London',
            average_daily_sunlight_hours: 4.8,
        },
        {
            area_name: 'South East',
            average_daily_sunlight_hours: 5.5,
        },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SunlightHoursByAreaChartComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(), ...getPlotlyModuleProviders(), { provide: RUNTIME_CONFIGURATION, useValue: {} }],
        }).compileComponents();

        fixture = TestBed.createComponent(SunlightHoursByAreaChartComponent);
        component = fixture.componentInstance;
        dashboardService = TestBed.inject(DashboardService);
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('Data loading inputs', () => {
        it('should request national data grouped by region when there is no area filter', () => {
            const spy = jest.spyOn(dashboardService, 'getAverageDailySunlightHoursPerArea').mockReturnValue(of(mockRegionData));

            fixture.detectChanges();

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith('region', undefined);
        });

        it('should request next-level grouped data for a single named area', () => {
            const singleAreaFilter: AreaFilter = { mode: 'named-areas', level: 'region', names: ['North West'] };
            const spy = jest.spyOn(dashboardService, 'getAverageDailySunlightHoursPerArea').mockReturnValue(of(mockRegionData));

            fixture.componentRef.setInput('areaFilter', singleAreaFilter);
            fixture.detectChanges();

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith('county', singleAreaFilter);
        });

        it('should request data with polygon filter and hide the area selector in polygon mode', () => {
            const polygonFilter: AreaFilter = {
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

            const spy = jest.spyOn(dashboardService, 'getAverageDailySunlightHoursPerArea').mockReturnValue(of(mockRegionData));

            fixture.componentRef.setInput('areaFilter', polygonFilter);
            fixture.detectChanges();

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith('region', polygonFilter);
            expect(component.chartTitle()).toBe('Average daily hours of sunlight');
            expect(component.isPolygonView).toBe(true);
            expect(fixture.nativeElement.querySelector('c477-area-selector')).toBeNull();
        });
    });

    describe('Chart data transformation', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getAverageDailySunlightHoursPerArea').mockReturnValue(of(mockRegionData));
            fixture.detectChanges();
        });

        it('should create horizontal bar chart with correct structure', () => {
            const chartData = component.chartData();
            expect(chartData.length).toBe(1);
            expect(chartData[0].type).toBe('bar');
            expect((chartData[0] as PlotData).orientation).toBe('h');
        });

        it('should sort areas by average sunlight hours (ascending)', () => {
            const chartData = component.chartData();
            const firstTrace = chartData[0] as PlotData;

            expect(firstTrace.y).toEqual(['London', 'North West', 'South East']);
        });

        it('should filter chart data by selected areas', () => {
            component.selectedAreas.set(['London', 'South East']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const firstTrace = chartData[0] as PlotData;
            expect(firstTrace.y).toEqual(['London', 'South East']);
        });

        it('should map sunlight hours values correctly', () => {
            component.selectedAreas.set(['London']);
            fixture.detectChanges();

            const chartData = component.chartData();
            const trace = chartData[0] as PlotData;

            expect(trace.x).toEqual([4.8]);
        });

        it('should colour the "National average" bar dark blue (#002244)', () => {
            const dataWithNationalAverage: SunlightHoursRegionData[] = [
                { area_name: 'Area average', average_daily_sunlight_hours: 4.8 },
                { area_name: 'National average', average_daily_sunlight_hours: 5.0 },
            ];

            component['sunlightHoursAreaData'].set(dataWithNationalAverage);

            component.selectedAreas.set(dataWithNationalAverage.map((d) => d.area_name));

            fixture.detectChanges();

            const chartData = component.chartData();
            const trace = chartData[0] as PlotData;

            const yValues = trace.y as string[];
            const colors = trace.marker?.color as string[];

            const nationalIndex = yValues.indexOf('National average');

            expect(nationalIndex).toBeGreaterThan(-1);
            expect(colors[nationalIndex]).toBe('#002244');
        });
    });
});
