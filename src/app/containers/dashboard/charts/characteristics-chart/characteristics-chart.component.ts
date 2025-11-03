import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, computed, effect } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BackendBuildingAttributesResponse, RegionCharacteristicData } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import type { Data, Layout } from 'plotly.js-dist-min';
import { BaseChartComponent } from '../base-chart.component';
import { RegionSelectorComponent } from '../shared/region-selector.component';

interface CharacteristicOption {
    value: keyof BackendBuildingAttributesResponse;
    label: string;
}

@Component({
    selector: 'c477-characteristics-chart',
    imports: [CommonModule, PlotlyModule, MatFormFieldModule, MatSelectModule, RegionSelectorComponent],
    templateUrl: './characteristics-chart.component.html',
    styleUrl: './characteristics-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacteristicsChartComponent extends BaseChartComponent {
    public readonly characteristicOptions: CharacteristicOption[] = [
        { value: 'percentage_double_glazing', label: 'Double Glazing' },
        { value: 'percentage_single_glazing', label: 'Single Glazing' },
        { value: 'percentage_cavity_wall', label: 'Cavity Wall' },
        { value: 'percentage_roof_solar_panels', label: 'Solar Panels' },
        { value: 'percentage_pitched_roof', label: 'Pitched Roof' },
        { value: 'percentage_solid_floor', label: 'Solid Floor' },
        { value: 'percentage_roof_insulation_thickness_150mm', label: 'Roof Insulation 150mm' },
        { value: 'percentage_roof_insulation_thickness_200mm', label: 'Roof Insulation 200mm' },
        { value: 'percentage_roof_insulation_thickness_250mm', label: 'Roof Insulation 250mm' },
    ];

    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});
    public loading = signal(true);

    public selectedCharacteristic = signal<keyof BackendBuildingAttributesResponse>('percentage_double_glazing');
    public availableRegions = signal<string[]>([]);
    public selectedRegions = signal<string[]>([]);

    private readonly buildingAttributesByRegion = signal<BackendBuildingAttributesResponse[] | null>(null);

    private readonly characteristicData = computed<RegionCharacteristicData[]>(() => {
        const apiResponse = this.buildingAttributesByRegion();
        if (!apiResponse) {
            return [];
        }

        const fieldName = this.selectedCharacteristic();
        return apiResponse.map((data) => ({
            region_name: data.region_name,
            percentage: Number(data[fieldName]) || 0,
        }));
    });

    constructor() {
        super();
        effect(() => {
            const regions = this.selectedRegions();
            const characteristic = this.selectedCharacteristic();
            const data = this.characteristicData();

            if (!data.length) {
                return;
            }

            const label = this.characteristicOptions.find((o) => o.value === characteristic)?.label ?? String(characteristic);
            const built = this.buildChart(label, data, regions);
            this.chartData.set(built.data);
            this.chartLayout.set(built.layout);
            this.loading.set(false);
        });
    }

    protected loadData(): void {
        this.loading.set(true);

        const polygon = this.selectedArea?.geometry;
        const sub = this.dashboardService.getAllBuildingAttributesPerRegion(polygon).subscribe((apiResponse) => {
            this.buildingAttributesByRegion.set(apiResponse);

            const regions = apiResponse.map((r) => r.region_name);
            this.availableRegions.set(regions);
            this.selectedRegions.set(regions);
        });

        this.subscriptions.add(sub);
    }

    private buildChart(characteristic: string, regions: RegionCharacteristicData[], selectedRegions: string[]): { data: Data[]; layout: Partial<Layout> } {
        const filteredRegions = regions.filter((r) => selectedRegions.includes(r.region_name));
        const sortedRegions = this.chartService.sortRegionsAlphabetically(filteredRegions);

        const data: Data[] = [
            {
                type: 'bar',
                x: sortedRegions.map((r) => r.region_name.replaceAll(' ', '<br>')),
                y: sortedRegions.map((r) => r.percentage),
                marker: { color: '#3670B3' },
                text: sortedRegions.map((r) => `${r.percentage > 9 ? Math.round(r.percentage) : r.percentage}%`),
                textposition: 'auto',
                textfont: { ...this.chartService.commonFont, color: 'white', size: 14 },
                hovertemplate: '<b>%{x}</b><br>%{y:.1f}% of buildings have ' + characteristic + '<extra></extra>',
                hoverlabel: this.chartService.commonHoverStyle,
            },
        ];

        const maxPercentage = Math.max(...sortedRegions.map((r) => r.percentage));
        const layout: Partial<Layout> = {
            margin: { l: 40, r: 20, t: 20, b: 80 },
            xaxis: {
                title: { text: '' },
                tickangle: 'auto',
                tickfont: { size: 11, color: '#999' },
                automargin: true,
            },
            yaxis: {
                title: { text: '' },
                range: [0, maxPercentage * 1.15],
                visible: false,
            },
            font: this.chartService.commonFont,
            height: 250,
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            showlegend: false,
        };

        return { data, layout };
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
