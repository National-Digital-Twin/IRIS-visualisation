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
import { SapTimelineByPropertyTypeChartComponent } from './sap-timeline-by-property-type-chart.component';

const mockRuntimeConfig = {
    epcColours: {},
};

const mockPolygon: GeoJSON.Polygon = {
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
};

const mockTimelineData: SAPRatingTimelineDataPoint[] = [
    { date: new Date('2020-01-01'), name: 'House', avg_sap_rating: 65 },
    { date: new Date('2021-01-01'), name: 'House', avg_sap_rating: 67 },
    { date: new Date('2020-01-01'), name: 'Flat', avg_sap_rating: 58 },
    { date: new Date('2021-01-01'), name: 'Flat', avg_sap_rating: 61 },
];

const mockLayout = {
    margin: { l: 40, r: 15, t: 10, b: 0 },
    xaxis: { title: { text: '' } },
    yaxis: { title: { text: 'SAP score' } },
};

describe('SapTimelineByPropertyTypeChartComponent', () => {
    let component: SapTimelineByPropertyTypeChartComponent;
    let fixture: ComponentFixture<SapTimelineByPropertyTypeChartComponent>;
    let dashboardService: DashboardService;
    let chartServiceMock: jest.Mocked<ChartService>;

    beforeEach(async () => {
        chartServiceMock = {
            getSAPTimelineLayout: jest.fn().mockReturnValue(mockLayout),
        } as unknown as jest.Mocked<ChartService>;

        await TestBed.configureTestingModule({
            imports: [SapTimelineByPropertyTypeChartComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                ...getPlotlyModuleProviders(),
                { provide: RUNTIME_CONFIGURATION, useValue: mockRuntimeConfig },
                { provide: ChartService, useValue: chartServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SapTimelineByPropertyTypeChartComponent);
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
        it('should not load data when areaFilter mode is not polygon', () => {
            const mockAreaFilter: AreaFilter = {
                mode: 'named-areas',
                level: 'region',
                names: ['North West'],
            };
            jest.spyOn(dashboardService, 'getSAPTimelineByPropertyType');

            fixture.componentRef.setInput('areaFilter', mockAreaFilter);
            fixture.detectChanges();

            expect(dashboardService.getSAPTimelineByPropertyType).not.toHaveBeenCalled();
        });

        it('should call service with polygon when mode is polygon', () => {
            const mockAreaFilter: AreaFilter = {
                mode: 'polygon',
                polygon: mockPolygon,
            };
            jest.spyOn(dashboardService, 'getSAPTimelineByPropertyType').mockReturnValue(of(mockTimelineData));

            fixture.componentRef.setInput('areaFilter', mockAreaFilter);
            fixture.detectChanges();

            expect(dashboardService.getSAPTimelineByPropertyType).toHaveBeenCalledWith(mockPolygon);
        });
    });

    describe('chart data transformation', () => {
        beforeEach(() => {
            const mockAreaFilter: AreaFilter = {
                mode: 'polygon',
                polygon: mockPolygon,
            };
            jest.spyOn(dashboardService, 'getSAPTimelineByPropertyType').mockReturnValue(of(mockTimelineData));
            fixture.componentRef.setInput('areaFilter', mockAreaFilter);
            fixture.detectChanges();
        });

        it('should create one trace per property type', () => {
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
            const houseTrace = chartData.find((t) => (t as PlotData).name === 'House') as PlotData;
            const flatTrace = chartData.find((t) => (t as PlotData).name === 'Flat') as PlotData;

            expect(houseTrace.y).toEqual([65, 67]);
            expect(flatTrace.y).toEqual([58, 61]);
        });

        it('should include hovertemplate in traces', () => {
            const chartData = component.chartData();
            const trace = chartData[0] as PlotData;

            expect(trace.hovertemplate).toBe('<b>%{fullData.name}</b><br>%{x}<br>%{y:.1f}<extra></extra>');
        });

        it('should use property type as trace name', () => {
            const chartData = component.chartData();
            const traceNames = chartData.map((t) => (t as PlotData).name);

            expect(traceNames).toContain('House');
            expect(traceNames).toContain('Flat');
        });
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
