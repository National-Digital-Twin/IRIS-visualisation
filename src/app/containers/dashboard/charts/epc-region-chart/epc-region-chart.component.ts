import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { EPCRegionData } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import type { Data, Layout } from 'plotly.js-dist-min';
import { BaseChartComponent } from '../base-chart.component';
import { RegionSelectorComponent } from '../shared/region-selector.component';

@Component({
    selector: 'c477-epc-region-chart',
    imports: [CommonModule, PlotlyModule, MatFormFieldModule, MatSelectModule, RegionSelectorComponent],
    templateUrl: './epc-region-chart.component.html',
    styleUrl: './epc-region-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpcRegionChartComponent extends BaseChartComponent {
    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});
    public loading = signal(true);
    public availableRegions = signal<string[]>([]);

    public selectedRegions = signal<string[]>([]);
    private readonly epcRegionData = signal<EPCRegionData[] | null>(null);

    constructor() {
        super();
        effect(() => {
            const data = this.epcRegionData();
            const regions = this.selectedRegions();
            if (!data || regions.length === 0) {
                return;
            }

            const built = this.buildChart(data, regions);
            this.chartData.set(built.data);
            this.chartLayout.set(built.layout);
            this.loading.set(false);
        });
    }

    protected loadData(): void {
        this.loading.set(true);

        const sub = this.dashboardService.getEPCByRegion(this.areaFilter).subscribe((regionData) => {
            this.epcRegionData.set(regionData);

            const regions = regionData.map((r) => r.region_name);
            this.availableRegions.set(regions);
            this.selectedRegions.set(regions);
        });

        this.subscriptions.add(sub);
    }

    private buildChart(regionData: EPCRegionData[], selectedRegions: string[]): { data: Data[]; layout: Partial<Layout> } {
        const filteredData = regionData.filter((r) => selectedRegions.includes(r.region_name));
        const sortedData = this.chartService.sortRegionsAlphabetically(filteredData);

        const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const regionNames = sortedData.map((r) => r.region_name);

        const data: Data[] = ratings.map((rating) => {
            const values = sortedData.map((r) => r[`epc_${rating.toLowerCase()}` as keyof EPCRegionData] || 0);
            const percentages = sortedData.map((r) => {
                const ratingCount = (r[`epc_${rating.toLowerCase()}` as keyof EPCRegionData] as number) || 0;
                return ((ratingCount / r.total) * 100).toFixed(1);
            });
            return {
                type: 'bar',
                name: rating,
                x: regionNames.map((r) => r.replaceAll(' ', '<br>')),
                y: values,
                customdata: percentages,
                marker: { color: this.chartService.epcColors[rating] },
                hoverlabel: this.chartService.commonHoverStyle,
                hovertemplate: '<b>%{fullData.name}</b><br>%{y:,}<br>%{customdata}%<extra></extra>',
            };
        });

        const maxTotal = Math.max(
            ...sortedData.map((r) => ratings.reduce((acc, curr) => acc + ((r[`epc_${curr.toLowerCase()}` as keyof EPCRegionData] as number) || 0), 0)),
        );

        const layout: Partial<Layout> = {
            barmode: 'stack',
            margin: { l: 20, r: 60, t: 20, b: 80 },
            xaxis: {
                title: { text: '' },
                tickangle: 'auto',
                tickfont: { size: 11, color: '#999' },
                automargin: true,
            },
            yaxis: {
                title: { text: '' },
                range: [0, maxTotal * 1.1],
                tickformat: '.2s',
                tickfont: { size: 11, color: '#999' },
                showgrid: true,
                gridcolor: '#e0e0e0',
                side: 'right',
                automargin: true,
            },
            font: this.chartService.commonFont,
            height: 300,
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            showlegend: true,
            legend: {
                orientation: 'h',
                x: 0.5,
                y: -0.5,
                xanchor: 'center',
                traceorder: 'normal',
            },
        };

        return { data, layout };
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
