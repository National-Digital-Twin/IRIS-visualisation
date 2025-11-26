import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { Data } from '@angular/router';
import { BackendBuildingsAffectedByExtremeWeatherResponse } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import { Layout } from 'plotly.js-dist-min';
import { BaseChartComponent } from '../base-chart.component';
import { ChartPlaceholderComponent } from '../shared/chart-placeholder.component';

@Component({
    selector: 'c477-extreme-weather-chart',
    imports: [CommonModule, PlotlyModule, ChartPlaceholderComponent],
    templateUrl: './extreme-weather-chart.component.html',
    styleUrl: './extreme-weather-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtremeWeatherChartComponent extends BaseChartComponent {
    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});

    public readonly buildingsAffectedByExtremeWeatherData = signal<BackendBuildingsAffectedByExtremeWeatherResponse[] | null>(null);

    constructor() {
        super();
        effect(() => {
            const buildingsAffectedByExtremeWeatherData = this.buildingsAffectedByExtremeWeatherData();
            if (!buildingsAffectedByExtremeWeatherData) {
                return;
            }

            const built = this.buildChart(buildingsAffectedByExtremeWeatherData);
            this.chartData.set(built.data);
            this.chartLayout.set(built.layout);
        });
    }

    protected override loadData(): void {
        this.subscribe(this.dashboardService.getBuildingsAffectedByExtremeWeather(this.areaFilter), (data) => {
            this.buildingsAffectedByExtremeWeatherData.set(data);
        });
    }

    private filterBuildingsAffectedByExtremeWeatherData(
        extremeWeatherInstance: string,
        buildingsAffectedByExtremeWeatherData: BackendBuildingsAffectedByExtremeWeatherResponse[],
    ): BackendBuildingsAffectedByExtremeWeatherResponse | undefined {
        switch (extremeWeatherInstance) {
            case 'WDR':
                return buildingsAffectedByExtremeWeatherData.find((data) => data.affected_by_wdr && !data.affected_by_hsds && !data.affected_by_icing_days);
            case 'HSD':
                return buildingsAffectedByExtremeWeatherData.find((data) => !data.affected_by_wdr && data.affected_by_hsds && !data.affected_by_icing_days);
            case 'Icing days':
                return buildingsAffectedByExtremeWeatherData.find((data) => !data.affected_by_wdr && !data.affected_by_hsds && data.affected_by_icing_days);
            case 'WDR + HSD':
                return buildingsAffectedByExtremeWeatherData.find((data) => data.affected_by_wdr && data.affected_by_hsds && !data.affected_by_icing_days);
            case 'WDR + icing days':
                return buildingsAffectedByExtremeWeatherData.find((data) => data.affected_by_wdr && !data.affected_by_hsds && data.affected_by_icing_days);
            case 'HSD + icing days':
                return buildingsAffectedByExtremeWeatherData.find((data) => !data.affected_by_wdr && data.affected_by_hsds && data.affected_by_icing_days);
            case 'WDR + HSD + icing days':
                return buildingsAffectedByExtremeWeatherData.find((data) => data.affected_by_wdr && data.affected_by_hsds && data.affected_by_icing_days);
            default:
                return undefined;
        }
    }

    private formatExtremeWeatherInstance(extremeWeatherInstance: string): string {
        switch (extremeWeatherInstance) {
            case 'WDR':
            case 'HSD':
                return extremeWeatherInstance;
            case 'Icing days':
                return 'Icing<br>days';
            case 'WDR + HSD':
                return 'WDR +<br>HSD';
            case 'WDR + icing days':
                return 'WDR +<br>icing<br>days';
            case 'HSD + icing days':
                return 'HSD +<br>icing<br>days';
            case 'WDR + HSD + icing days':
                return 'WDR,<br>HSD +<br>icing<br>days';
            default:
                return '';
        }
    }

    private buildChart(buildingsAffectedByExtremeWeatherData: BackendBuildingsAffectedByExtremeWeatherResponse[]): { data: Data[]; layout: Partial<Layout> } {
        const extremeWeatherInstances = ['WDR', 'HSD', 'Icing days', 'WDR + HSD', 'WDR + icing days', 'HSD + icing days', 'WDR + HSD + icing days'];
        const hasFilteredData = !!this.areaFilter;

        const sortedInstances = [...extremeWeatherInstances].sort((a, b) => {
            const aData = this.filterBuildingsAffectedByExtremeWeatherData(a, buildingsAffectedByExtremeWeatherData);
            const bData = this.filterBuildingsAffectedByExtremeWeatherData(b, buildingsAffectedByExtremeWeatherData);
            const aValue = hasFilteredData ? (aData?.filtered_number_of_buildings ?? 0) : (aData?.number_of_buildings ?? 0);
            const bValue = hasFilteredData ? (bData?.filtered_number_of_buildings ?? 0) : (bData?.number_of_buildings ?? 0);
            return bValue - aValue; // tallest bar first
        });

        const traces: Data[] = [];
        if (hasFilteredData) {
            const totalFilteredBuildings = buildingsAffectedByExtremeWeatherData.reduce((sum, d) => sum + (d.filtered_number_of_buildings || 0), 0);
            traces.push({
                type: 'bar',
                name: 'Area average',
                x: sortedInstances.map((extremeWeatherInstance) => this.formatExtremeWeatherInstance(extremeWeatherInstance)),
                y: sortedInstances.map((extremeWeatherInstance) => {
                    const data = this.filterBuildingsAffectedByExtremeWeatherData(extremeWeatherInstance, buildingsAffectedByExtremeWeatherData);
                    const count = data?.filtered_number_of_buildings || 0;
                    return totalFilteredBuildings > 0 ? (count / totalFilteredBuildings) * 100 : 0;
                }),
                marker: { color: '#3670b3' },
                hoverlabel: this.chartService.commonHoverStyle,
                hovertemplate: '%{y:.1f}%<extra></extra>',
            });
        }

        const totalBuildings = buildingsAffectedByExtremeWeatherData.reduce((sum, d) => sum + d.number_of_buildings, 0);
        traces.push({
            type: 'bar',
            name: 'National average',
            x: sortedInstances.map((extremeWeatherInstance) => this.formatExtremeWeatherInstance(extremeWeatherInstance)),
            y: sortedInstances.map((extremeWeatherInstance) => {
                const data = this.filterBuildingsAffectedByExtremeWeatherData(extremeWeatherInstance, buildingsAffectedByExtremeWeatherData);
                const count = data?.number_of_buildings || 0;
                return totalBuildings > 0 ? (count / totalBuildings) * 100 : 0;
            }),
            marker: { color: hasFilteredData ? '#002244' : '#3670b3' },
            hoverlabel: this.chartService.commonHoverStyle,
            hovertemplate: '%{y:.1f}%<extra></extra>',
        });

        const layout: Partial<Layout> = {
            margin: { l: 20, r: 40, t: 20, b: 80 },
            xaxis: {
                title: { text: '' },
                tickangle: 'auto',
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
                orientation: 'h',
                x: 0,
                y: -0.5,
                xanchor: 'left',
                yanchor: 'top',
            },
            barmode: hasFilteredData ? 'group' : undefined,
            annotations: [
                {
                    text: '<b>WDR</b> = wind-driven rain<br><b>HSD</b> = hot summer days',
                    showarrow: false,
                    xref: 'paper',
                    yref: 'paper',
                    x: hasFilteredData ? 1.05 : 0,
                    y: hasFilteredData ? -0.5 : -0.35,
                    xanchor: hasFilteredData ? 'right' : 'left',
                    yanchor: 'top',
                    font: { size: 11, color: '#333' },
                    align: 'left',
                },
            ],
        };

        return { data: traces, layout };
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attdibuted to the Department for Business and Trade (UK) as the governing entity.
