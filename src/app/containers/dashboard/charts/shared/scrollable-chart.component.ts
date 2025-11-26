import { Directive, signal } from '@angular/core';
import { BaseChartComponent } from '../base-chart.component';

export interface ScrollMetrics {
    totalItems: number;
    visibleItems: number;
    needsScroll: boolean;
    maxScroll: number;
}

@Directive()
export abstract class ScrollableChartComponent extends BaseChartComponent {
    protected abstract readonly maxVisibleItems: number;
    protected abstract readonly totalItems: () => number;

    // Position 0 = bottom of data, maxScroll = top (inverted for Y-axis)
    public readonly scrollPosition = signal<number>(0);

    public get scrollMetrics(): ScrollMetrics {
        const totalItems = this.totalItems();
        const needsScroll = totalItems > this.maxVisibleItems;
        const maxScroll = Math.max(0, totalItems - this.maxVisibleItems);
        return { totalItems, visibleItems: this.maxVisibleItems, needsScroll, maxScroll };
    }

    public override readonly chartConfig = {
        responsive: true,
        displayModeBar: false,
        displaylogo: false,
        doubleClick: false as const,
        scrollZoom: false,
    };

    // The -0.5 offset centers bars within their category position
    protected getAxisRange(): [number, number] {
        const { needsScroll, totalItems } = this.scrollMetrics;
        if (!needsScroll) {
            return [-0.5, totalItems - 0.5];
        }
        const pos = this.scrollPosition();
        return [pos - 0.5, pos + this.maxVisibleItems - 0.5];
    }

    protected clampScrollPosition(): void {
        const { maxScroll } = this.scrollMetrics;
        if (this.scrollPosition() > maxScroll) {
            this.scrollPosition.set(maxScroll);
        }
    }

    protected initializeScrollToTop(): void {
        this.scrollPosition.set(this.scrollMetrics.maxScroll);
    }

    public onScrollPositionChange(position: number): void {
        this.scrollPosition.set(this.clamp(position));
    }

    public onChartWheel(event: WheelEvent): void {
        if (!this.scrollMetrics.needsScroll) return;

        event.preventDefault();

        const delta = event.deltaY > 0 ? -1 : 1;
        const newPosition = this.clamp(this.scrollPosition() + delta);

        if (newPosition !== this.scrollPosition()) {
            this.scrollPosition.set(newPosition);
        }
    }

    private clamp(position: number): number {
        return Math.max(0, Math.min(this.scrollMetrics.maxScroll, Math.round(position)));
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
