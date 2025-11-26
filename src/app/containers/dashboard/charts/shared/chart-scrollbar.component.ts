import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, input, output, ViewChild } from '@angular/core';
import { ScrollMetrics } from './scrollable-chart.component';

@Component({
    selector: 'c477-chart-scrollbar',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div #track class="scrollbar-track" (mousedown)="onMouseDown($event)">
            <div class="scrollbar-thumb" [ngStyle]="thumbStyle()"></div>
        </div>
    `,
    styleUrl: './chart-scrollbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartScrollbarComponent {
    private readonly destroyRef = inject(DestroyRef);

    @ViewChild('track') private readonly track?: ElementRef<HTMLDivElement>;

    public readonly position = input.required<number>();
    public readonly metrics = input.required<ScrollMetrics>();
    public readonly positionChange = output<number>();

    public readonly thumbStyle = computed(() => {
        const { needsScroll, visibleItems, totalItems, maxScroll } = this.metrics();
        if (!needsScroll) {
            return { display: 'none' };
        }

        const heightPercent = Math.max((visibleItems / totalItems) * 100, 10);
        const topPercent = ((maxScroll - this.position()) / maxScroll) * (100 - heightPercent);

        return {
            height: `${heightPercent}%`,
            top: `${topPercent}%`,
        };
    });

    public onMouseDown(event: MouseEvent): void {
        event.preventDefault();

        const track = this.track?.nativeElement;
        if (!track) return;

        const { maxScroll } = this.metrics();

        const toScrollPosition = (e: MouseEvent): number => {
            const rect = track.getBoundingClientRect();
            const ratio = (e.clientY - rect.top) / rect.height;
            // Top of track = max scroll, bottom = 0 (inverted)
            const position = (1 - ratio) * maxScroll;
            return Math.max(0, Math.min(maxScroll, Math.round(position)));
        };

        this.positionChange.emit(toScrollPosition(event));

        const onMove = (e: MouseEvent): void => this.positionChange.emit(toScrollPosition(e));

        const cleanup = (): void => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', cleanup);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', cleanup);
        this.destroyRef.onDestroy(cleanup);
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
