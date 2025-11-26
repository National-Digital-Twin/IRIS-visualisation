import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild, signal } from '@angular/core';
import { OverallEPCResponse } from '@core/services/dashboard.service';
import { PlotlyModule, PlotlyComponent } from 'angular-plotly.js';
import type { Data, Layout } from 'plotly.js-dist-min';
import * as Plotly from 'plotly.js-dist-min';
import { BaseChartComponent } from '../base-chart.component';
import { ChartPlaceholderComponent } from '../shared/chart-placeholder.component';

@Component({
    selector: 'c477-overall-epc-chart',
    imports: [CommonModule, PlotlyModule, ChartPlaceholderComponent],
    templateUrl: './overall-epc-chart.component.html',
    styleUrl: './overall-epc-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverallEpcChartComponent extends BaseChartComponent {
    @ViewChild('barPlot') public barPlot?: PlotlyComponent;

    public donutChartData = signal<Data[]>([]);
    public donutChartLayout = signal<Partial<Layout>>({});

    public barChartData = signal<Data[]>([]);
    public barChartLayout = signal<Partial<Layout>>({});

    #hiddenRatings: Record<string, boolean> = {};
    #overallEPCResponse?: OverallEPCResponse;

    public onBarChartInitialized(): void {
        if (this.barPlot?.plotlyInstance) {
            this.barPlot.plotlyInstance.on('plotly_click', (data: Plotly.PlotMouseEvent) => {
                this.onBarChartClick(data);
            });
        }
    }

    public onBarChartClick(event: Plotly.PlotMouseEvent): void {
        if (!event?.points?.length || !this.#overallEPCResponse) {
            return;
        }

        const point = event.points[0];
        const clickedRating = point.y as string;

        this.#hiddenRatings[clickedRating] = !this.#hiddenRatings[clickedRating];

        const { data: donutData, layout: donutLayout } = this.buildDonutChart(this.#overallEPCResponse, this.#hiddenRatings);
        const { data: barData, layout: barLayout } = this.buildBarChart(this.#overallEPCResponse, this.#hiddenRatings);

        this.donutChartData.set(donutData);
        this.donutChartLayout.set(donutLayout);
        this.barChartData.set(barData);
        this.barChartLayout.set(barLayout);
    }

    protected loadData(): void {
        this.subscribe(this.dashboardService.getOverallEPC(this.areaFilter), (response) => {
            this.#overallEPCResponse = response;
            const { data: donutData, layout: donutLayout } = this.buildDonutChart(response);
            const { data: barData, layout: barLayout } = this.buildBarChart(response);

            this.donutChartData.set(donutData);
            this.donutChartLayout.set(donutLayout);
            this.barChartData.set(barData);
            this.barChartLayout.set(barLayout);
        });
    }

    private buildDonutChart(response: OverallEPCResponse, hiddenRatings: Record<string, boolean> = {}): { data: Data[]; layout: Partial<Layout> } {
        const visibleTotal = response.ratings.filter((r) => !hiddenRatings[r.rating]).reduce((sum, r) => sum + r.count, 0);

        const data: Data[] = [
            {
                type: 'pie',
                values: response.ratings.map((r) => (hiddenRatings[r.rating] ? 0 : r.count)),
                labels: response.ratings.map((r) => r.rating),
                hole: 0.9,
                marker: {
                    colors: response.ratings.map((r) => this.chartService.epcColors[r.rating]),
                    line: { color: 'white', width: 2 },
                },
                textinfo: 'none',
                hovertemplate: '<b>%{label}</b><br>%{value:,}<br>%{percent}<extra></extra>',
                hoverlabel: this.chartService.commonHoverStyle,
                sort: false,
                direction: 'clockwise',
            },
        ];

        const layout: Partial<Layout> = {
            margin: { l: 30, r: 30, t: 30, b: 30 },
            height: 280,
            showlegend: false,
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            font: this.chartService.commonFont,
            annotations: [
                {
                    text: `<b>${visibleTotal.toLocaleString()}</b><br><span style="font-size: 14px;">EPC ratings</span>`,
                    x: 0.5,
                    y: 0.5,
                    xref: 'paper',
                    yref: 'paper',
                    showarrow: false,
                    font: { size: 28, color: '#333' },
                },
            ],
        };

        return { data, layout };
    }

    private buildBarChart(response: OverallEPCResponse, hiddenRatings: Record<string, boolean> = {}): { data: Data[]; layout: Partial<Layout> } {
        const sortedRatings = [...response.ratings].sort((a, b) => a.rating.localeCompare(b.rating));

        const backgroundBars: Data = {
            type: 'bar',
            x: sortedRatings.map(() => response.total),
            y: sortedRatings.map((r) => r.rating),
            orientation: 'h',
            marker: { color: '#EFEFEF' },
            hoverinfo: 'none',
            showlegend: false,
            width: 0.25,
        };

        const dataBars: Data = {
            type: 'bar',
            x: sortedRatings.map((r) => r.count),
            y: sortedRatings.map((r) => r.rating),
            orientation: 'h',
            marker: {
                color: sortedRatings.map((r) => (hiddenRatings[r.rating] ? '#D3D3D3' : this.chartService.epcColors[r.rating])),
            },
            customdata: sortedRatings.map((r) => ((r.count / response.total) * 100).toFixed(1)),
            hovertemplate: '<b>%{y}</b><br>%{x:,} (%{customdata}%)<extra></extra>',
            hoverlabel: this.chartService.commonHoverStyle,
            showlegend: false,
            width: 0.25,
        };

        const data: Data[] = [backgroundBars, dataBars];
        const annotations = sortedRatings.flatMap((rating) => [
            {
                x: 0,
                y: rating.rating,
                xref: 'x',
                yref: 'y',
                text: rating.rating,
                showarrow: false,
                xanchor: 'left',
                yanchor: 'bottom',
                yshift: 14,
                font: { size: 11, color: hiddenRatings[rating.rating] ? '#999' : '#333', family: 'Roboto, sans-serif' },
            },
            {
                x: response.total,
                y: rating.rating,
                xref: 'x',
                yref: 'y',
                text: ((rating.count / response.total) * 100).toFixed(1) + '%',
                showarrow: false,
                xanchor: 'right',
                yanchor: 'bottom',
                yshift: 14,
                font: { size: 11, color: hiddenRatings[rating.rating] ? '#999' : '#333', family: 'Roboto, sans-serif' },
            },
        ]);

        const layout: Partial<Layout> = {
            margin: { l: 5, r: 5, t: 20, b: 5 },
            height: 360,
            barmode: 'overlay',
            xaxis: {
                showgrid: false,
                showticklabels: false,
                showline: false,
                zeroline: false,
                range: [0, response.total * 1.01],
                fixedrange: true,
            },
            yaxis: {
                showgrid: false,
                showticklabels: false,
                showline: false,
                zeroline: false,
                automargin: false,
                categoryorder: 'array',
                categoryarray: ['G', 'F', 'E', 'D', 'C', 'B', 'A'],
                fixedrange: true,
            },
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            font: this.chartService.commonFont,
            showlegend: false,
            annotations: annotations as Partial<Layout>['annotations'],
        };

        return { data, layout };
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
