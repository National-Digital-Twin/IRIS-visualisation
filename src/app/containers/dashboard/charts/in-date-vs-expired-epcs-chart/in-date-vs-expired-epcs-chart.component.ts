import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { BackendNumberOfInDateAndExpiredEpcsResponse } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import { Data, Layout } from 'plotly.js-dist-min';
import { BaseChartComponent } from '../base-chart.component';
import { ChartPlaceholderComponent } from '../shared/chart-placeholder.component';

@Component({
    selector: 'c477-in-date-vs-expired-epcs-chart',
    imports: [CommonModule, PlotlyModule, ChartPlaceholderComponent],
    templateUrl: './in-date-vs-expired-epcs-chart.component.html',
    styleUrl: './in-date-vs-expired-epcs-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InDateVsExpiredEpcsComponent extends BaseChartComponent {
    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});

    public numberOfInDateAndExpiredEpcs = signal<BackendNumberOfInDateAndExpiredEpcsResponse[] | null>(null);

    constructor() {
        super();
        effect(() => {
            const numberOfInDateAndExpiredEpcs = this.numberOfInDateAndExpiredEpcs();
            if (!numberOfInDateAndExpiredEpcs) {
                return;
            }

            const built = this.buildChart(numberOfInDateAndExpiredEpcs);
            this.chartData.set(built.data);
            this.chartLayout.set(built.layout);
        });
    }

    protected override loadData(): void {
        this.subscribe(this.dashboardService.getNumberOfInDateAndExpiredEpcs(this.areaFilter), (data) => {
            this.numberOfInDateAndExpiredEpcs.set(data);
        });
    }

    private buildChart(numberOfInDateAndExpiredEpcs: BackendNumberOfInDateAndExpiredEpcsResponse[]): { data: Data[]; layout: Partial<Layout> } {
        const years = numberOfInDateAndExpiredEpcs.map((element) => element.year);

        const mode = years.length > 1 ? 'lines' : 'markers';
        const data: Data[] = [
            {
                type: 'scatter',
                name: 'In date',
                mode,
                x: years,
                y: numberOfInDateAndExpiredEpcs.map((element) => element.active),
                line: { color: '#3670b3', width: 2 },
                hovertemplate: '<b>%{x}</b><br>%{y:,}<extra></extra>',
            },
            {
                type: 'scatter',
                name: 'Expired',
                mode,
                x: years,
                y: numberOfInDateAndExpiredEpcs.map((element) => element.expired),
                line: { color: '#002244', width: 2 },
                hovertemplate: '<b>%{x}</b><br>%{y:,}<extra></extra>',
            },
        ];

        const maxValue = Math.max(...numberOfInDateAndExpiredEpcs.map((element) => element.active));
        const layout: Partial<Layout> = {
            margin: { l: 20, r: 40, t: 20, b: 40 },
            xaxis: {
                title: { text: '' },
                type: 'date',
                tickmode: 'array',
                tickvals: years,
                tickformat: '%Y',
                automargin: true,
                showgrid: false,
                tickfont: { size: 11, color: '#999' },
                linewidth: 0,
            },
            yaxis: {
                title: { text: '' },
                // don't format si for smaller values, its buggy
                tickformat: maxValue >= 1000 ? 's' : undefined,
                showgrid: true,
                gridcolor: '#e0e0e0',
                side: 'right',
                zerolinecolor: '#e0e0e0',
                tickfont: { size: 11, color: '#999' },
                linewidth: 0,
            },
            font: this.chartService.commonFont,
            height: 250,
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            showlegend: true,
            legend: { x: 0, xref: 'container', y: 0, yref: 'container', orientation: 'h' },
        };

        return { data, layout };
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attdibuted to the Department for Business and Trade (UK) as the governing entity.
