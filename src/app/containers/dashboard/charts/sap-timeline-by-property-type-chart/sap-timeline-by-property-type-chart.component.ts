import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SAPRatingTimelineDataPoint } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import type { Data, Layout } from 'plotly.js-dist-min';
import { BaseChartComponent } from '../base-chart.component';
import { ChartPlaceholderComponent } from '../shared/chart-placeholder.component';

@Component({
    selector: 'c477-sap-timeline-by-property-type-chart',
    imports: [CommonModule, PlotlyModule, ChartPlaceholderComponent],
    templateUrl: './sap-timeline-by-property-type-chart.component.html',
    styleUrl: './sap-timeline-by-property-type-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SapTimelineByPropertyTypeChartComponent extends BaseChartComponent {
    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});

    protected loadData(): void {
        if (this.areaFilter?.mode !== 'polygon') {
            return;
        }

        this.subscribe(this.dashboardService.getSAPTimelineByPropertyType(this.areaFilter.polygon), (response) => {
            const { data, layout } = this.buildChart(response);
            this.chartData.set(data);
            this.chartLayout.set(layout);
        });
    }

    private buildChart(dataPoints: SAPRatingTimelineDataPoint[]): { data: Data[]; layout: Partial<Layout> } {
        const byPropertyType = new Map<string, { years: number[]; ratings: number[] }>();
        let maxScore = 0;
        for (const point of dataPoints) {
            if (!byPropertyType.has(point.name)) {
                byPropertyType.set(point.name, { years: [], ratings: [] });
            }
            const typeData = byPropertyType.get(point.name)!;
            typeData.years.push(point.date.getFullYear());
            typeData.ratings.push(point.avg_sap_rating);
            maxScore = Math.max(maxScore, point.avg_sap_rating);
        }

        const traces: Data[] = [];
        for (const [propertyType, typeData] of byPropertyType) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: propertyType,
                x: typeData.years,
                y: typeData.ratings,
                hovertemplate: '<b>%{fullData.name}</b><br>%{x}<br>%{y:.1f}<extra></extra>',
            });
        }

        const layout = this.chartService.getSAPTimelineLayout(maxScore);

        return { data: traces, layout };
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
