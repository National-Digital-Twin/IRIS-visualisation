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

    private readonly pieChartData = computed<FuelTypeData[]>(() => {
        const apiResponse = this.fuelTypesByBuildingType();
        if (!apiResponse) {
            return [];
        }

        const selectedType = this.selectedBuildingType();
        const buildingData = selectedType ? apiResponse.filter((d) => d.building_type === selectedType) : [];

        if (!buildingData.length) {
            return [];
        }

        return buildingData.map((item) => ({
            label: this.getFuelTypeLabel(item.fuel_type),
            value: item.count,
        }));
    });

    constructor() {
        super();
        effect(() => {
            const data = this.pieChartData();
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
                this.selectedBuildingType.set(buildingTypes[0]);
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
        const chartData: Data[] = [
            {
                type: 'pie',
                labels: data.map((d) => d.label),
                values: data.map((d) => d.value),
                textposition: 'none',
                hovertemplate: '<b>%{label}</b><br>%{value} buildings<br>%{percent}<extra></extra>',
                hoverlabel: this.chartService.commonHoverStyle,
                marker: {
                    line: { color: 'white', width: 2 },
                },
            },
        ];

        const layout: Layout = {
            margin: { l: 0, r: 0, t: 0, b: 0 },
            font: this.chartService.commonFont,
            colorway: this.chartService.colorway,
            height: 250,
            showlegend: true,
            legend: {
                orientation: 'h',
                maxheight: 0.3,
                font: { size: 10 },
            },
        };

        return { data: chartData, layout };
    }
}
