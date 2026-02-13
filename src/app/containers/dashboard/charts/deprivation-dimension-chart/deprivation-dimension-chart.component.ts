import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { BackendBuildingsByDeprivationDimensionResponse } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import { Data, Layout } from 'plotly.js-dist-min';
import { forkJoin } from 'rxjs';
import { BaseChartComponent } from '../base-chart.component';
import { ChartPlaceholderComponent } from '../shared/chart-placeholder.component';

@Component({
    selector: 'c477-deprivation-dimension-chart',
    imports: [CommonModule, PlotlyModule, ChartPlaceholderComponent],
    templateUrl: './deprivation-dimension-chart.component.html',
    styleUrl: './deprivation-dimension-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeprivationDimensionChartComponent extends BaseChartComponent {
    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});

    private readonly deprivationDimensionData = signal<{
        national: BackendBuildingsByDeprivationDimensionResponse;
        filtered?: BackendBuildingsByDeprivationDimensionResponse;
    } | null>(null);

    constructor() {
        super();
        effect(() => {
            const deprivationDimensionData = this.deprivationDimensionData();
            if (!deprivationDimensionData) {
                return;
            }

            const built = this.buildChart(deprivationDimensionData);
            this.chartData.set(built.data);
            this.chartLayout.set(built.layout);
        });
    }

    protected override loadData(): void {
        if (this.areaFilter) {
            this.subscribe(
                forkJoin({
                    national: this.dashboardService.getBuildingsByDeprivationDimension(),
                    filtered: this.dashboardService.getBuildingsByDeprivationDimension(this.areaFilter),
                }),
                (data) => {
                    this.deprivationDimensionData.set(data);
                },
            );
            return;
        }

        this.subscribe(this.dashboardService.getBuildingsByDeprivationDimension(), (data) => {
            this.deprivationDimensionData.set({ national: data });
        });
    }

    private buildChart(deprivationDimensionData: {
        national: BackendBuildingsByDeprivationDimensionResponse;
        filtered?: BackendBuildingsByDeprivationDimensionResponse;
    }): { data: Data[]; layout: Partial<Layout> } {
        const labels = ['0D', '1D', '2D', '3D', '4D'];
        const hasFilteredData = !!deprivationDimensionData.filtered;

        const mapValues = (values: BackendBuildingsByDeprivationDimensionResponse): number[] => [
            values.dep_0_pct,
            values.dep_1_pct,
            values.dep_2_pct,
            values.dep_3_pct,
            values.dep_4_pct,
        ];

        const data: Data[] = [];
        if (deprivationDimensionData.filtered) {
            data.push({
                type: 'bar',
                name: 'Area average',
                x: labels,
                y: mapValues(deprivationDimensionData.filtered),
                marker: { color: '#3670b3' },
                hoverlabel: this.chartService.commonHoverStyle,
                hovertemplate: '%{y:.1f}%<extra></extra>',
            });
        }

        data.push({
            type: 'bar',
            name: 'National average',
            x: labels,
            y: mapValues(deprivationDimensionData.national),
            marker: { color: hasFilteredData ? '#002244' : '#3670b3' },
            hoverlabel: this.chartService.commonHoverStyle,
            hovertemplate: '%{y:.1f}%<extra></extra>',
        });

        const layout: Partial<Layout> = {
            margin: { l: 20, r: 40, t: 20, b: hasFilteredData ? 140 : 95 },
            xaxis: {
                title: { text: '' },
                tickangle: 0,
                tickfont: { size: 11, color: '#999' },
                automargin: true,
            },
            yaxis: {
                title: { text: '' },
                ticksuffix: '%',
                showgrid: false,
                side: 'right',
                tickfont: { size: 11, color: '#999' },
                linewidth: 0,
            },
            font: this.chartService.commonFont,
            height: 250,
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            showlegend: hasFilteredData,
            legend: {
                orientation: 'v',
                x: 0,
                y: -0.26,
                xanchor: 'left',
                yanchor: 'top',
            },
            barmode: hasFilteredData ? 'group' : undefined,
            annotations: [
                {
                    text: '<b>0D</b> = Not deprived | <b>1D</b> = 1 dimension | <b>2D</b> = 2 dimensions | <b>3D</b> = 3 dimensions | <b>4D</b> = 4 dimensions',
                    showarrow: false,
                    xref: 'paper',
                    yref: 'paper',
                    x: 0,
                    y: hasFilteredData ? -0.68 : -0.35,
                    xanchor: 'left',
                    yanchor: 'top',
                    font: { size: 11, color: '#333' },
                    align: 'left',
                },
            ],
        };

        return { data, layout };
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
