import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { BackendNumberOfInDateAndExpiredEpcsResponse } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import { Data, Layout } from 'plotly.js-dist-min';
import { BaseChartComponent } from '../base-chart.component';

@Component({
    selector: 'c477-in-date-vs-expired-epcs-chart',
    imports: [CommonModule, PlotlyModule],
    templateUrl: './in-date-vs-expired-epcs-chart.component.html',
    styleUrl: './in-date-vs-expired-epcs-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InDateVsExpiredEpcsComponent extends BaseChartComponent {
    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});
    public loading = signal<boolean>(true);

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
            this.loading.set(false);
        });
    }

    protected override loadData(): void {
        this.loading.set(true);

        const sub = this.dashboardService.getNumberOfInDateAndExpiredEpcs().subscribe((data) => this.numberOfInDateAndExpiredEpcs.set(data));

        this.subscriptions.add(sub);
    }

    private buildChart(numberOfInDateAndExpiredEpcs: BackendNumberOfInDateAndExpiredEpcsResponse[]): { data: Data[]; layout: Partial<Layout> } {
        const years = numberOfInDateAndExpiredEpcs.map((element) => element.year);

        const data: Data[] = [
            {
                type: 'scatter',
                name: 'In date',
                mode: 'lines',
                x: years,
                y: numberOfInDateAndExpiredEpcs.map((element) => element.active),
                line: { color: '#3670b3', width: 2 },
                hovertemplate: '<b>%{x}</b><br>%{y:,}<extra></extra>',
            },
            {
                type: 'scatter',
                name: 'Expired',
                mode: 'lines',
                x: years,
                y: numberOfInDateAndExpiredEpcs.map((element) => element.expired),
                line: { color: '#002244', width: 2 },
                hovertemplate: '<b>%{x}</b><br>%{y:,}<extra></extra>',
            },
        ];

        const maxValue = Math.max(...Object.values(this.numberOfInDateAndExpiredEpcs));

        const layout: Partial<Layout> = {
            margin: { l: 20, r: 40, t: 20, b: 80 },
            xaxis: {
                title: { text: '' },
                type: 'date',
                tickmode: 'array',
                tickvals: years,
                tickformat: '%Y',
                automargin: true,
                showgrid: false,
            },
            yaxis: {
                title: { text: '' },
                range: [0, maxValue],
                tickformat: '5s',
                showgrid: true,
                gridcolor: '#e0e0e0',
                side: 'right',
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
