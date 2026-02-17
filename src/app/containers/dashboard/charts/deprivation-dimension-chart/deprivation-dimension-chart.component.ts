import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { BackendBuildingsByDeprivationDimensionResponse } from '@core/services/dashboard.service';
import { BaseChartComponent } from '../base-chart.component';
import { ChartPlaceholderComponent } from '../shared/chart-placeholder.component';

@Component({
    selector: 'c477-deprivation-dimension-chart',
    imports: [CommonModule, ChartPlaceholderComponent],
    templateUrl: './deprivation-dimension-chart.component.html',
    styleUrl: './deprivation-dimension-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeprivationDimensionChartComponent extends BaseChartComponent {
    public readonly histogramColors = ['#CDE594', '#80C6A3', '#1F9EB7', '#186290', '#080C54'];

    private readonly deprivationDimensionData = signal<BackendBuildingsByDeprivationDimensionResponse | null>(null);
    public readonly isNationalView = computed(() => !this.areaFilter);
    public readonly histogramRows = computed(() => {
        const response = this.deprivationDimensionData();
        if (!response) {
            return [];
        }

        const resolveValue = (value: number | null, fallback: number): number => (typeof value === 'number' ? value : fallback);
        const isFilteredMode = !this.isNationalView();

        return [
            {
                key: 'dep4',
                count: response.dep_4_count,
                value: resolveValue(response.dep_4_pct, response.unfiltered_dep_4_pct),
                statement: 'are highly deprived',
                context: '(deprived in four dimensions)',
                nationalAverage: isFilteredMode ? response.unfiltered_dep_4_pct : undefined,
                min: response.min_dep_4_pct,
                max: response.max_dep_4_pct,
            },
            {
                key: 'dep3',
                count: response.dep_3_count,
                value: resolveValue(response.dep_3_pct, response.unfiltered_dep_3_pct),
                statement: 'are deprived in three dimensions',
                nationalAverage: isFilteredMode ? response.unfiltered_dep_3_pct : undefined,
                min: response.min_dep_3_pct,
                max: response.max_dep_3_pct,
            },
        ];
    });

    protected override loadData(): void {
        this.subscribe(this.dashboardService.getBuildingsByDeprivationDimension(this.areaFilter), (data) => {
            this.deprivationDimensionData.set(data);
        });
    }

    public getMarkerPosition(value: number, min: number, max: number): number {
        if (max <= min) {
            return 0;
        }

        const percentage = ((value - min) / (max - min)) * 100;
        return Math.max(0, Math.min(100, percentage));
    }

    public getStageStops(min: number, max: number): number[] {
        const stops = [0, 0.2, 0.4, 0.6, 0.8, 1];
        return stops.map((stop) => min + (max - min) * stop);
    }

    public formatPercentage(value: number): string {
        return `${value.toFixed(1)}%`;
    }

    public formatCount(value: number): string {
        return value.toLocaleString('en-GB');
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
