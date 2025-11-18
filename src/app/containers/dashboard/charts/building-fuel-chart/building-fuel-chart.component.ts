// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, computed, effect } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FuelType } from '@core/enums';
import { BackendFuelTypesByBuildingTypeResponse } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import type { Data } from 'plotly.js-dist-min';
import { BaseChartComponent } from '../base-chart.component';

interface FuelTypeData {
    label: string;
    value: number;
}

interface Layout extends Partial<Plotly.Layout> {
    legend?: Plotly.Layout['legend'] & {
        maxheight?: number; // documented in Python: https://plotly.com/python/legend/#legend-max-height
    };
}

@Component({
    selector: 'c477-building-fuel-chart',
    imports: [CommonModule, PlotlyModule, MatFormFieldModule, MatSelectModule],
    templateUrl: './building-fuel-chart.component.html',
    styleUrl: './building-fuel-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildingFuelChartComponent extends BaseChartComponent {
    private readonly fuelTypeLabels: Record<string, string> = FuelType;

    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});
    public loading = signal(true);

    public availableBuildingTypes = signal<string[]>([]);
    public selectedBuildingType = signal<string | null>(null);

    private readonly fuelTypesByBuildingType = signal<BackendFuelTypesByBuildingTypeResponse[] | null>(null);

    private readonly fuelTypeData = computed<FuelTypeData[]>(() => {
        const apiResponse = this.fuelTypesByBuildingType();
        if (!apiResponse) {
            return [];
        }

        const selectedType = this.selectedBuildingType();
        const buildingData = selectedType ? apiResponse.filter((d) => d.building_type === selectedType) : [];

        if (!buildingData.length) {
            return [];
        }

        const chartData = buildingData.map((item) => ({
            label: this.getFuelTypeLabel(item.fuel_type),
            value: item.count,
        }));

        // smallest first, rendered bottom-to-top
        return chartData.sort((a, b) => a.value - b.value);
    });

    constructor() {
        super();
        effect(() => {
            const data = this.fuelTypeData();
            const selectedType = this.selectedBuildingType();
            if (!data.length || !selectedType) {
                return;
            }

            const built = this.buildChart(data);
            this.chartData.set(built.data);
            this.chartLayout.set(built.layout);
            this.loading.set(false);
        });
    }

    protected loadData(): void {
        this.loading.set(true);

        const sub = this.dashboardService.getFuelTypesByBuildingType(this.areaFilter).subscribe((apiResponse) => {
            this.fuelTypesByBuildingType.set(apiResponse);

            const buildingTypes = [...new Set(apiResponse.map((r) => r.building_type))].sort((a, b) => a.localeCompare(b));
            this.availableBuildingTypes.set(buildingTypes);

            if (buildingTypes.length > 0) {
                const defaultType = buildingTypes.includes('House') ? 'House' : buildingTypes[0];
                this.selectedBuildingType.set(defaultType);
            }
        });

        this.subscriptions.add(sub);
    }

    private getFuelTypeLabel(fuelType: string): string {
        if (this.fuelTypeLabels[fuelType]) {
            return this.fuelTypeLabels[fuelType];
        }
        return fuelType.replaceAll(/([A-Z])/g, ' $1').trim();
    }

    private buildChart(data: FuelTypeData[]): { data: Data[]; layout: Partial<Layout> } {
        const total = data.reduce((sum, d) => sum + d.value, 0);
        const percentages = data.map((d) => (d.value / total) * 100);

        const chartData: Data[] = [
            {
                type: 'bar',
                orientation: 'h',
                x: percentages,
                y: data.map((d) => d.label),
                customdata: data.map((d) => d.value),
                marker: {
                    color: '#3670B3',
                },
                hovertemplate: '<b>%{y}</b><br>%{customdata:,} buildings<br>%{x:.1f}%<extra></extra>',
                hoverlabel: this.chartService.commonHoverStyle,
            },
        ];

        const layout: Layout = {
            margin: { l: 20, r: 20, t: 20, b: 20 },
            font: this.chartService.commonFont,
            height: 300,
            xaxis: {
                showgrid: false,
                showticklabels: true,
                showline: true,
                ticksuffix: '%',
                color: '#999',
            },
            yaxis: {
                showticklabels: true,
                automargin: true,
                categoryorder: 'trace',
                color: '#999',
                linecolor: '#999',
            },
        };

        return { data: chartData, layout };
    }
}
