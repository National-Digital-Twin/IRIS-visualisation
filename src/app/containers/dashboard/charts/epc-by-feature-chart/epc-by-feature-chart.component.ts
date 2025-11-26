import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { EPCRatingsByCategory } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import type { Data, Layout } from 'plotly.js-dist-min';
import { BaseChartComponent } from '../base-chart.component';
import { ChartPlaceholderComponent } from '../shared/chart-placeholder.component';

const FEATURE_CONFIG: Record<string, string> = {
    glazing_types: 'Glazing types',
    fuel_types: 'Fuel types',
    wall_construction: 'Wall construction types',
    wall_insulation: 'Wall insulation types',
    floor_construction: 'Floor construction types',
    floor_insulation: 'Floor insulation types',
    roof_construction: 'Roof construction types',
    roof_insulation: 'Roof insulation location',
    roof_insulation_thickness: 'Roof insulation thickness',
    roof_material: 'Roof material',
    solar_panels: 'Solar panels',
    roof_aspect: 'Roof aspect',
};

const DISPLAY_NAME_TO_KEY = Object.fromEntries(Object.entries(FEATURE_CONFIG).map(([key, displayName]) => [displayName, key]));

@Component({
    selector: 'c477-epc-by-feature-chart',
    imports: [CommonModule, PlotlyModule, MatFormFieldModule, MatSelectModule, ChartPlaceholderComponent],
    templateUrl: './epc-by-feature-chart.component.html',
    styleUrl: './epc-by-feature-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpcByFeatureChartComponent extends BaseChartComponent {
    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});

    private readonly selectedFeatureKey = signal<string>('glazing_types');
    public readonly selectedFeatureDisplay = signal<string>('Glazing types');
    private readonly featureData = signal<EPCRatingsByCategory[]>([]);

    public readonly availableFeatures = Object.values(FEATURE_CONFIG);

    constructor() {
        super();
        effect(() => {
            const data = this.featureData();
            if (data.length === 0) {
                return;
            }

            const built = this.buildChart(data);
            this.chartData.set(built.data);
            this.chartLayout.set(built.layout);
        });
    }

    protected loadData(): void {
        this.loadFeatureData(this.selectedFeatureKey());
    }

    private loadFeatureData(featureKey: string): void {
        this.subscribe(this.dashboardService.getEPCByFeature(featureKey, this.areaFilter), (data) => {
            this.featureData.set(data);
        });
    }

    public onFeatureChange(displayName: string): void {
        const featureKey = DISPLAY_NAME_TO_KEY[displayName];
        if (featureKey) {
            this.selectedFeatureKey.set(featureKey);
            this.selectedFeatureDisplay.set(displayName);
            this.loadFeatureData(featureKey);
        }
    }

    private formatValueName(name: string): string {
        if (name.length > 1 && name === name.toUpperCase()) {
            return name;
        }

        return name
            .replaceAll(/([A-Z])/g, ' $1')
            .trim()
            .toLowerCase()
            .replace(/^\w/, (c) => c.toUpperCase());
    }

    private buildChart(featureValues: EPCRatingsByCategory[]): { data: Data[]; layout: Partial<Layout> } {
        const sortedData = featureValues.toSorted((a, b) => b.total - a.total);

        const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const valueNames = sortedData.map((v) => this.formatValueName(v.name));

        const data: Data[] = ratings.map((rating) => {
            const ratingKey = `epc_${rating.toLowerCase()}` as keyof EPCRatingsByCategory;
            const values = sortedData.map((v) => (v[ratingKey] as number) || 0);
            const percentages = sortedData.map((v) => {
                const count = (v[ratingKey] as number) || 0;
                return ((count / v.total) * 100).toFixed(1);
            });
            return {
                type: 'bar',
                name: rating,
                x: valueNames,
                y: values,
                customdata: percentages,
                marker: { color: this.chartService.epcColors[rating] },
                hoverlabel: this.chartService.commonHoverStyle,
                hovertemplate: '<b>%{fullData.name}</b><br>%{y:,}<br>%{customdata}%<extra></extra>',
            };
        });

        const maxTotal = Math.max(
            ...sortedData.map((v) => ratings.reduce((acc, curr) => acc + ((v[`epc_${curr.toLowerCase()}` as keyof EPCRatingsByCategory] as number) || 0), 0)),
        );

        const layout: Partial<Layout> = {
            barmode: 'stack',
            margin: { l: 20, r: 45, t: 20, b: 0 },
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
                yref: 'container',
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
