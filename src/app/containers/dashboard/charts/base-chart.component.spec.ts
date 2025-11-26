import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AreaFilter } from '@core/models/area-filter.model';
import { DashboardService } from '@core/services/dashboard.service';
import { Observable, Subject, of, throwError } from 'rxjs';
import { ChartService } from '../chart.service';
import { BaseChartComponent } from './base-chart.component';

@Component({
    template: '',
    standalone: true,
})
class TestChartComponent extends BaseChartComponent {
    public loadDataCallCount = 0;
    public lastReceivedData: unknown = null;

    protected loadData(): void {
        this.loadDataCallCount++;
    }

    /** Expose subscribe for testing */
    public testSubscribe<T>(source$: Observable<T>, onNext: (data: T) => void): void {
        this.subscribe(source$, onNext);
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

    it('should call loadData when retry is called', () => {
        fixture.detectChanges();
        expect(component.loadDataCallCount).toBe(1);

        component.retry();
        expect(component.loadDataCallCount).toBe(2);
    });

    describe('subscribe', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should set loading to true when subscribe is called', () => {
            const subject = new Subject<string>();
            component.loading.set(false);

            component.testSubscribe(subject, () => {});

            expect(component.loading()).toBe(true);
        });

        it('should clear error when subscribe is called', () => {
            const subject = new Subject<string>();
            const mockError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
            component.error.set(mockError);

            component.testSubscribe(subject, () => {});

            expect(component.error()).toBeNull();
        });

        it('should call onNext callback and set loading to false on success', () => {
            const testData = { value: 'test' };
            let receivedData: unknown = null;

            component.testSubscribe(of(testData), (data) => {
                receivedData = data;
            });

            expect(receivedData).toEqual(testData);
            expect(component.loading()).toBe(false);
            expect(component.error()).toBeNull();
        });

        it('should set error and loading to false on error', () => {
            const mockError = new HttpErrorResponse({ status: 504, statusText: 'Gateway Timeout' });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            component.testSubscribe(
                throwError(() => mockError),
                () => {},
            );

            expect(component.error()).toBe(mockError);
            expect(component.loading()).toBe(false);
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should add subscription to subscriptions for cleanup', () => {
            const subject = new Subject<string>();

            component.testSubscribe(subject, () => {});

            expect(subject.observed).toBe(true);

            fixture.destroy();

            expect(subject.observed).toBe(false);
        });

        it('should handle multiple sequential subscribes correctly', () => {
            const subject1 = new Subject<string>();
            const subject2 = new Subject<string>();
            let result1: string | null = null;
            let result2: string | null = null;

            component.testSubscribe(subject1, (data) => {
                result1 = data;
            });

            expect(component.loading()).toBe(true);

            subject1.next('first');
            expect(result1).toBe('first');
            expect(component.loading()).toBe(false);

            component.testSubscribe(subject2, (data) => {
                result2 = data;
            });

            expect(component.loading()).toBe(true);
            expect(component.error()).toBeNull();

            subject2.next('second');
            expect(result2).toBe('second');
            expect(component.loading()).toBe(false);
        });
    });
});
