import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TimelineAvgSAPDataPoint } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import type { Data, Layout } from 'plotly.js-dist-min';
import { BaseChartComponent } from '../base-chart.component';

@Component({
    selector: 'c477-sap-timeline-chart',
    imports: [CommonModule, PlotlyModule],
    templateUrl: './sap-timeline-chart.component.html',
    styleUrl: './sap-timeline-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SapTimelineChartComponent extends BaseChartComponent {
    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});
    public loading = signal(true);

    protected loadData(): void {
        this.loading.set(true);

        const sub = this.dashboardService.getSAPTimeline(this.areaFilter).subscribe((response) => {
            const { data, layout } = this.buildChart(response.timeline);

            this.chartData.set(data);
            this.chartLayout.set(layout);
            this.loading.set(false);
        });

        this.subscriptions.add(sub);
    }

    private buildChart(timeline: TimelineAvgSAPDataPoint[]): { data: Data[]; layout: Partial<Layout> } {
        const traces: Data[] = [];
        const nationalRatings: number[] = [];
        const nationalYears: number[] = [];
        const filteredRatings: number[] = [];
        const filteredYears: number[] = [];

        for (const t of timeline) {
            nationalRatings.push(t.national_avg_sap_rating);
            if (t.filtered_avg_sap_rating) {
                filteredRatings.push(t.filtered_avg_sap_rating);
                filteredYears.push(t.date.getFullYear());
            }
            nationalYears.push(t.date.getFullYear());
        }
        const hasFilteredRatings = filteredRatings.length > 0;

        if (hasFilteredRatings) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'Average SAP score',
                x: filteredYears,
                y: filteredRatings,
                line: { color: '#3670b3' },
                hovertemplate: '<b>%{x}</b><br>%{y:.1f}<extra></extra>',
            });
        }

        traces.push({
            type: 'scatter',
            mode: 'lines',
            name: hasFilteredRatings ? 'National average' : 'Average SAP score',
            x: nationalYears,
            y: nationalRatings,
            line: { color: '#000000' },
            hovertemplate: '<b>%{x}</b><br>%{y:.1f}<extra></extra>',
        });

        const layout: Partial<Layout> = {
            margin: { l: 50, r: 15, t: 10, b: 40 },
            xaxis: {
                title: { text: '' },
                showgrid: false,
                tickfont: { size: 11, color: '#999' },
                linecolor: '#999',
            },
            yaxis: {
                title: { text: 'SAP score', font: { size: 11, color: '#999' } },
                showgrid: false,
                tickfont: { size: 11, color: '#999' },
                linecolor: '#999',
            },
            font: { ...this.chartService.commonFont, size: 10 },
            height: 300,
            showlegend: true,
            legend: {
                orientation: 'h',
                font: { size: 11 },
            },
        };

        return { data: traces, layout };
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
