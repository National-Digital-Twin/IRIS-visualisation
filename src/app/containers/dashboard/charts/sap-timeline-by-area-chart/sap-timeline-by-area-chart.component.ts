import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { AreaLevel } from '@core/models/area-filter.model';
import { SAPRatingTimelineDataPoint } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import type { Data, Layout } from 'plotly.js-dist-min';
import { BaseChartComponent } from '../base-chart.component';
import { ChartPlaceholderComponent } from '../shared/chart-placeholder.component';

@Component({
    selector: 'c477-sap-timeline-by-area-chart',
    imports: [CommonModule, PlotlyModule, ChartPlaceholderComponent],
    templateUrl: './sap-timeline-by-area-chart.component.html',
    styleUrl: './sap-timeline-by-area-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SapTimelineByAreaChartComponent extends BaseChartComponent {
    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});

    protected loadData(): void {
        const filter = this.areaFilter;
        if (filter?.mode !== 'named-areas') {
            return;
        }

        const groupBy = filter.names.length === 1 ? this.getNextLevelDown(filter.level) : filter.level;
        this.subscribe(this.dashboardService.getSAPTimelineByArea(groupBy, filter.level, filter.names), (response) => {
            const { data, layout } = this.buildChart(response);
            this.chartData.set(data);
            this.chartLayout.set(layout);
        });
    }

    private buildChart(dataPoints: SAPRatingTimelineDataPoint[]): { data: Data[]; layout: Partial<Layout> } {
        const byArea = new Map<string, { years: number[]; ratings: number[] }>();
        let maxScore = 0;
        for (const point of dataPoints) {
            if (!byArea.has(point.name)) {
                byArea.set(point.name, { years: [], ratings: [] });
            }
            const areaData = byArea.get(point.name)!;
            areaData.years.push(point.date.getFullYear());
            areaData.ratings.push(point.avg_sap_rating);
            maxScore = Math.max(maxScore, point.avg_sap_rating);
        }

        const traces: Data[] = [];
        for (const [areaName, areaData] of byArea) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: areaName,
                x: areaData.years,
                y: areaData.ratings,
                hovertemplate: '<b>%{fullData.name}</b><br>%{x}<br>%{y:.1f}<extra></extra>',
            });
        }

        const layout = this.chartService.getSAPTimelineLayout(maxScore);

        return { data: traces, layout };
    }

    private getNextLevelDown(level: AreaLevel): AreaLevel {
        const hierarchy: Record<AreaLevel, AreaLevel> = {
            region: 'county',
            county: 'district',
            district: 'ward',
            ward: 'ward',
        };
        return hierarchy[level];
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
