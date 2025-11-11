import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaFilter } from '@core/models/area-filter.model';
import { DashboardService } from '@core/services/dashboard.service';
import { Subject } from 'rxjs';
import { ChartService } from '../chart.service';
import { BaseChartComponent } from './base-chart.component';

@Component({
    template: '',
    standalone: true,
})
class TestChartComponent extends BaseChartComponent {
    public loadDataCallCount = 0;

    protected loadData(): void {
        this.loadDataCallCount++;
    }
}

describe('BaseChartComponent', () => {
    let component: TestChartComponent;
    let fixture: ComponentFixture<TestChartComponent>;
    let dashboardServiceMock: jest.Mocked<DashboardService>;
    let chartServiceMock: jest.Mocked<ChartService>;

    beforeEach(async () => {
        dashboardServiceMock = {} as jest.Mocked<DashboardService>;
        chartServiceMock = {} as jest.Mocked<ChartService>;

        await TestBed.configureTestingModule({
            imports: [TestChartComponent],
            providers: [
                { provide: DashboardService, useValue: dashboardServiceMock },
                { provide: ChartService, useValue: chartServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(TestChartComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should call loadData on ngOnInit', () => {
        fixture.detectChanges();
        expect(component.loadDataCallCount).toBe(1);
    });

    it('should call loadData when areaFilter changes', () => {
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

        fixture.detectChanges();
        expect(component.loadDataCallCount).toBe(1);

        component.areaFilter = undefined;
        fixture.detectChanges();
        expect(component.loadDataCallCount).toBe(1);

        component.areaFilter = mockAreaFilter;
        component.ngOnChanges({
            areaFilter: {
                currentValue: mockAreaFilter,
                previousValue: undefined,
                firstChange: false,
                isFirstChange: () => false,
            },
        });
        fixture.detectChanges();
        expect(component.loadDataCallCount).toBe(2);
    });

    it('should not call loadData on first change', () => {
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

        fixture.componentRef.setInput('areaFilter', mockAreaFilter);
        fixture.detectChanges();
        expect(component.loadDataCallCount).toBe(1);
    });

    it('should unsubscribe on destroy', () => {
        const subscription = new Subject();
        component['subscriptions'].add(subscription.subscribe());

        expect(subscription.observed).toBe(true);

        fixture.destroy();

        expect(subscription.observed).toBe(false);
    });
});
