import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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

    describe('Chart data transformation', () => {
        beforeEach(() => {
            jest.spyOn(dashboardService, 'getAverageDailySunlightHoursPerRegion').mockReturnValue(of(mockRegionData));
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
    });
});
