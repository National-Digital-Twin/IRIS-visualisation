import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { EPCRatingOvertimeDataPoint } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import type { Data, Layout } from 'plotly.js-dist-min';
import { BaseChartComponent } from '../base-chart.component';
import { ChartPlaceholderComponent } from '../shared/chart-placeholder.component';

@Component({
    selector: 'c477-epc-ratings-overtime-chart',
    imports: [CommonModule, PlotlyModule, ChartPlaceholderComponent],
    templateUrl: './epc-ratings-overtime-chart.component.html',
    styleUrl: './epc-ratings-overtime-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpcRatingsOvertimeChartComponent extends BaseChartComponent {
    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});

    protected loadData(): void {
        this.subscribe(this.dashboardService.getEPCRatingsOvertime(this.areaFilter), (response) => {
            const { data, layout } = this.buildChart(response);
            this.chartData.set(data);
            this.chartLayout.set(layout);
        });
    }

    private buildChart(data: EPCRatingOvertimeDataPoint[]): { data: Data[]; layout: Partial<Layout> } {
        const traces: Data[] = [];
        const years: number[] = [];
        const ratingData: Record<string, number[]> = {
            A: [],
            B: [],
            C: [],
            D: [],
            E: [],
            F: [],
            G: [],
        };

        let maxValue = 0;
        for (const item of data) {
            years.push(item.date.getFullYear());
            ratingData.A.push(item.epc_a);
            ratingData.B.push(item.epc_b);
            ratingData.C.push(item.epc_c);
            ratingData.D.push(item.epc_d);
            ratingData.E.push(item.epc_e);
            ratingData.F.push(item.epc_f);
            ratingData.G.push(item.epc_g);
            maxValue = Math.max(maxValue, item.epc_a, item.epc_b, item.epc_c, item.epc_d, item.epc_e, item.epc_f, item.epc_g);
        }

        const mode = years.length > 1 ? 'lines' : 'markers';
        const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        for (const rating of ratings) {
            traces.push({
                type: 'scatter',
                mode,
                name: rating,
                x: years,
                y: ratingData[rating],
                line: { color: this.chartService.epcColors[rating] },
                hovertemplate: '<b>%{x}</b><br>%{y:,}<extra></extra>',
            });
        }

        const layout: Partial<Layout> = {
            margin: { l: 20, r: 40, t: 10, b: 10 },
            xaxis: {
                automargin: true,
                showgrid: false,
                tickfont: { size: 11, color: '#999' },
                // spacing off Y axis 0 label
                linecolor: 'white',
                linewidth: 6,
            },
            yaxis: {
                range: [0, maxValue * 1.1],
                side: 'right',
                zerolinecolor: '#e0e0e0',
                showgrid: true,
                gridcolor: '#e0e0e0',
                tickfont: { size: 11, color: '#999' },
                automargin: true,
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
