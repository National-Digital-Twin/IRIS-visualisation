import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, computed, effect } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BackendBuildingAttributesResponse, RegionCharacteristicData } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import type { Data, Layout } from 'plotly.js-dist-min';
import { BaseChartComponent } from '../base-chart.component';
import { RegionSelectorComponent } from '../shared/region-selector.component';

@Component({
    selector: 'c477-characteristics-chart',
    imports: [CommonModule, PlotlyModule, MatFormFieldModule, MatSelectModule, RegionSelectorComponent],
    templateUrl: './characteristics-chart.component.html',
    styleUrl: './characteristics-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacteristicsChartComponent extends BaseChartComponent {
    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});
    public loading = signal(true);

    public selectedCharacteristic = signal<string>('');
    public availableRegions = signal<string[]>([]);
    public selectedRegions = signal<string[]>([]);

    private readonly buildingAttributesByRegion = signal<BackendBuildingAttributesResponse[] | null>(null);

    public readonly characteristicOptions = computed<string[]>(() => {
        const apiResponse = this.buildingAttributesByRegion();
        if (!apiResponse || apiResponse.length === 0) {
            return [];
        }
        return apiResponse[0].attributes.map((attr) => attr.label);
    });

    private readonly characteristicData = computed<RegionCharacteristicData[]>(() => {
        const apiResponse = this.buildingAttributesByRegion();
        if (!apiResponse) {
            return [];
        }

        const selectedLabel = this.selectedCharacteristic();
        return apiResponse.map((region) => {
            const attribute = region.attributes.find((attr) => attr.label === selectedLabel);
            return {
                region_name: region.region_name,
                percentage: attribute?.value ?? 0,
            };
        });
    });

    constructor() {
        super();
        effect(() => {
            const regions = this.selectedRegions();
            const characteristic = this.selectedCharacteristic();
            const data = this.characteristicData();

            if (!data.length || !characteristic) {
                return;
            }

            const built = this.buildChart(characteristic, data, regions);
            this.chartData.set(built.data);
            this.chartLayout.set(built.layout);
            this.loading.set(false);
        });
    }

    protected loadData(): void {
        this.loading.set(true);

        const sub = this.dashboardService.getAllBuildingAttributesPerRegion(this.areaFilter).subscribe((apiResponse) => {
            this.buildingAttributesByRegion.set(apiResponse);

            const regions = apiResponse.map((r) => r.region_name);
            this.availableRegions.set(regions);
            this.selectedRegions.set(regions);

            const attributes = apiResponse[0]?.attributes ?? [];
            if (attributes.length) {
                const defaultCharacteristic = attributes.find((attr) => attr.label === 'Solar panels')?.label ?? attributes[0].label;
                this.selectedCharacteristic.set(defaultCharacteristic);
            }
        });

        this.subscriptions.add(sub);
    }

    private buildChart(characteristic: string, regions: RegionCharacteristicData[], selectedRegions: string[]): { data: Data[]; layout: Partial<Layout> } {
        const filteredRegions = regions.filter((r) => selectedRegions.includes(r.region_name));
        const sortedRegions = filteredRegions.toSorted((a, b) => b.percentage - a.percentage);

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
            margin: { l: 20, r: 20, t: 20, b: 80 },
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
