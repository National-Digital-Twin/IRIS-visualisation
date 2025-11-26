import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartScrollbarComponent } from './chart-scrollbar.component';
import { ScrollMetrics } from './scrollable-chart.component';

describe('ChartScrollbarComponent', () => {
    let component: ChartScrollbarComponent;
    let fixture: ComponentFixture<ChartScrollbarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ChartScrollbarComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ChartScrollbarComponent);
        component = fixture.componentInstance;
    });

    describe('thumb visibility', () => {
        it('should hide thumb when scrolling is not needed', () => {
            const metrics: ScrollMetrics = { totalItems: 5, visibleItems: 10, needsScroll: false, maxScroll: 0 };
            fixture.componentRef.setInput('position', 0);
            fixture.componentRef.setInput('metrics', metrics);
            fixture.detectChanges();

            expect(component.thumbStyle()).toEqual({ display: 'none' });
        });

        it('should show thumb when scrolling is needed', () => {
            const metrics: ScrollMetrics = { totalItems: 20, visibleItems: 10, needsScroll: true, maxScroll: 10 };
            fixture.componentRef.setInput('position', 0);
            fixture.componentRef.setInput('metrics', metrics);
            fixture.detectChanges();

            const style = component.thumbStyle();
            expect(style).toHaveProperty('height');
            expect(style).toHaveProperty('top');
        });
    });

    describe('thumb size', () => {
        it('should have larger thumb when fewer items to scroll', () => {
            const fewItems: ScrollMetrics = { totalItems: 12, visibleItems: 10, needsScroll: true, maxScroll: 2 };
            const manyItems: ScrollMetrics = { totalItems: 50, visibleItems: 10, needsScroll: true, maxScroll: 40 };

            fixture.componentRef.setInput('position', 0);
            fixture.componentRef.setInput('metrics', fewItems);
            fixture.detectChanges();
            const fewItemsHeight = parseFloat((component.thumbStyle() as { height: string }).height);

            fixture.componentRef.setInput('metrics', manyItems);
            fixture.detectChanges();
            const manyItemsHeight = parseFloat((component.thumbStyle() as { height: string }).height);

            expect(fewItemsHeight).toBeGreaterThan(manyItemsHeight);
        });

        it('should have minimum thumb height of 10%', () => {
            const metrics: ScrollMetrics = { totalItems: 1000, visibleItems: 10, needsScroll: true, maxScroll: 990 };
            fixture.componentRef.setInput('position', 0);
            fixture.componentRef.setInput('metrics', metrics);
            fixture.detectChanges();

            const height = parseFloat((component.thumbStyle() as { height: string }).height);
            expect(height).toBeGreaterThanOrEqual(10);
        });
    });

    describe('thumb position', () => {
        it('should position thumb at top when at max scroll (showing highest values)', () => {
            const metrics: ScrollMetrics = { totalItems: 20, visibleItems: 10, needsScroll: true, maxScroll: 10 };
            fixture.componentRef.setInput('position', 10); // max scroll
            fixture.componentRef.setInput('metrics', metrics);
            fixture.detectChanges();

            const top = parseFloat((component.thumbStyle() as { top: string }).top);
            expect(top).toBe(0);
        });

        it('should position thumb at bottom when at position 0 (showing lowest values)', () => {
            const metrics: ScrollMetrics = { totalItems: 20, visibleItems: 10, needsScroll: true, maxScroll: 10 };
            fixture.componentRef.setInput('position', 0);
            fixture.componentRef.setInput('metrics', metrics);
            fixture.detectChanges();

            const style = component.thumbStyle() as { top: string; height: string };
            const top = parseFloat(style.top);
            const height = parseFloat(style.height);
            // Thumb should be at bottom: top + height ≈ 100%
            expect(top + height).toBeCloseTo(100, 0);
        });
    });

    describe('position change events', () => {
        it('should emit position change on track click', () => {
            const metrics: ScrollMetrics = { totalItems: 20, visibleItems: 10, needsScroll: true, maxScroll: 10 };
            fixture.componentRef.setInput('position', 5);
            fixture.componentRef.setInput('metrics', metrics);
            fixture.detectChanges();

            const emittedPositions: number[] = [];
            component.positionChange.subscribe((pos) => emittedPositions.push(pos));

            const track = fixture.nativeElement.querySelector('.scrollbar-track');

            // Mock getBoundingClientRect since JSDOM returns 0s
            jest.spyOn(track, 'getBoundingClientRect').mockReturnValue({
                top: 0,
                left: 0,
                bottom: 100,
                right: 10,
                width: 10,
                height: 100,
                x: 0,
                y: 0,
                toJSON: () => ({}),
            });

            // Simulate click at top of track (clientY = 0)
            const clickEvent = new MouseEvent('mousedown', {
                clientX: 5,
                clientY: 0,
                bubbles: true,
            });
            track.dispatchEvent(clickEvent);

            expect(emittedPositions.length).toBeGreaterThan(0);
            // Click at top should give max scroll position
            expect(emittedPositions[0]).toBe(10);
        });
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
