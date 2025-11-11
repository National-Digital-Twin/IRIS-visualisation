import { Directive, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject } from '@angular/core';
import { DashboardService } from '@core/services/dashboard.service';
import type { Config } from 'plotly.js-dist-min';
import { Subscription } from 'rxjs';
import { AreaFilter } from '../../../core/models/area-filter.model';
import { ChartService } from '../chart.service';

@Directive()
export abstract class BaseChartComponent implements OnInit, OnChanges, OnDestroy {
    @Input() public areaFilter?: AreaFilter;

    protected readonly dashboardService = inject(DashboardService);
    protected readonly chartService = inject(ChartService);
    protected readonly subscriptions = new Subscription();

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

    protected abstract loadData(): void;
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
