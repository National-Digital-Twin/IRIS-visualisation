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

    public numberOfInDateAndExpiredEpcs = signal<BackendNumberOfInDateAndExpiredEpcsResponse | null>(null);

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

    private getNumberInDate(year: number): keyof BackendNumberOfInDateAndExpiredEpcsResponse {
        const currentYear = new Date().getFullYear();
        return (year === currentYear ? 'number_of_active_now' : `number_of_active_${currentYear - year}y`) as keyof BackendNumberOfInDateAndExpiredEpcsResponse;
    }

    private getNumberExpired(year: number): keyof BackendNumberOfInDateAndExpiredEpcsResponse {
        const currentYear = new Date().getFullYear();
        return (
            year === currentYear ? 'number_of_expired_now' : `number_of_expired_${currentYear - year}y`
        ) as keyof BackendNumberOfInDateAndExpiredEpcsResponse;
    }

    private buildChart(numberOfInDateAndExpiredEpcs: BackendNumberOfInDateAndExpiredEpcsResponse): { data: Data[]; layout: Partial<Layout> } {
        const years: number[] = Array.from(Array(11).keys())
            .reverse()
            .map((element) => new Date().getFullYear() - element);

        const data: Data[] = [
            {
                type: 'scatter',
                name: 'In date',
                mode: 'lines',
                x: years,
                y: years.map((year) => numberOfInDateAndExpiredEpcs[this.getNumberInDate(year)]),
                line: { color: '#3670b3', width: 2 },
                hovertemplate: '<b>%{x}</b><br>%{y:,}<extra></extra>',
            },
            {
                type: 'scatter',
                name: 'Expired',
                mode: 'lines',
                x: years,
                y: years.map((year) => numberOfInDateAndExpiredEpcs[this.getNumberExpired(year)]),
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
