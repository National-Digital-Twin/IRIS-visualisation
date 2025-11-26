import { HttpErrorResponse } from '@angular/common/http';
import { Directive, Input, OnChanges, OnDestroy, OnInit, signal, SimpleChanges, inject } from '@angular/core';
import { DashboardService } from '@core/services/dashboard.service';
import type { Config } from 'plotly.js-dist-min';
import { Observable, Subscription } from 'rxjs';
import { AreaFilter } from '../../../core/models/area-filter.model';
import { ChartService } from '../chart.service';

@Directive()
export abstract class BaseChartComponent implements OnInit, OnChanges, OnDestroy {
    @Input() public areaFilter?: AreaFilter;

    protected readonly dashboardService = inject(DashboardService);
    protected readonly chartService = inject(ChartService);
    protected readonly subscriptions = new Subscription();

    public readonly loading = signal(true);
    public readonly error = signal<HttpErrorResponse | null>(null);

    public readonly chartConfig: Partial<Config> = {
        responsive: true,
        displayModeBar: false,
        displaylogo: false,
    };

    public ngOnInit(): void {
        this.loadData();
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['areaFilter'] && !changes['areaFilter'].firstChange) {
            this.loadData();
        }
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    public retry(): void {
        this.loadData();
    }

    protected abstract loadData(): void;

    /** Subscribe to an observable with automatic loading/error state management */
    protected subscribe<T>(source$: Observable<T>, onNext: (data: T) => void): void {
        this.loading.set(true);
        this.error.set(null);

        const sub = source$.subscribe({
            next: (data) => {
                onNext(data);
                this.loading.set(false);
            },
            error: (err: HttpErrorResponse) => {
                console.error('Chart data load failed:', this.constructor.name, err);
                this.error.set(err);
                this.loading.set(false);
            },
        });

        this.subscriptions.add(sub);
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
