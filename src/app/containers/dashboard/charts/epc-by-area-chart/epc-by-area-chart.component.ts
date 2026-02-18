import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AreaLevel } from '@core/models/area-filter.model';
import { EPCAreaData } from '@core/services/dashboard.service';
import { PlotlyModule } from 'angular-plotly.js';
import type { Data, Layout } from 'plotly.js-dist-min';
import { AreaSelectorComponent } from '../shared/area-selector.component';
import { ChartPlaceholderComponent } from '../shared/chart-placeholder.component';
import { ChartScrollbarComponent } from '../shared/chart-scrollbar.component';
import { ScrollableChartComponent } from '../shared/scrollable-chart.component';

@Component({
    selector: 'c477-epc-by-area-chart',
    imports: [CommonModule, PlotlyModule, MatFormFieldModule, MatSelectModule, AreaSelectorComponent, ChartPlaceholderComponent, ChartScrollbarComponent],
    templateUrl: './epc-by-area-chart.component.html',
    styleUrl: './epc-by-area-chart.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpcByAreaChartComponent extends ScrollableChartComponent {
    protected readonly maxVisibleItems = 10;
    protected readonly totalItems = (): number => this.selectedAreas().length;

    public chartData = signal<Data[]>([]);
    public chartLayout = signal<Partial<Layout>>({});
    public availableAreas = signal<string[]>([]);
    public selectedAreas = signal<string[]>([]);

    private readonly epcAreaData = signal<EPCAreaData[] | null>(null);

    private readonly groupingConfig = computed(() => {
        const filter = this.areaFilter;

        if (filter?.mode === 'named-areas') {
            const isSingleArea = filter.names.length === 1;

            if (isSingleArea) {
                const nextLevel = this.getNextLevelDown(filter.level);
                return {
                    mode: 'single' as const,
                    groupBy: nextLevel,
                    filterLevel: filter.level,
                    filterNames: filter.names,
                    areaName: filter.names[0],
                };
            } else {
                return {
                    mode: 'multiple' as const,
                    groupBy: filter.level,
                    filterLevel: filter.level,
                    filterNames: filter.names,
                };
            }
        }

        return {
            mode: 'national' as const,
            groupBy: 'region' as AreaLevel,
            filterLevel: undefined as AreaLevel | undefined,
            filterNames: undefined as string[] | undefined,
        };
    });

    public readonly chartTitle = computed(() => {
        const config = this.groupingConfig();

        if (config.mode === 'single') {
            return 'EPC ratings of';
        }

        return 'EPC ratings by';
    });

    public readonly titleSuffix = computed(() => {
        const config = this.groupingConfig();
        return config.mode === 'single' ? ` in ${config.areaName}` : '';
    });

    public readonly selectorLabel = computed(() => {
        return this.groupingConfig().groupBy;
    });

    constructor() {
        super();
        effect(() => {
            const data = this.epcAreaData();
            const areas = this.selectedAreas();
            if (!data || areas.length === 0) {
                return;
            }

            this.clampScrollPosition();

            const built = this.buildChart(data, areas);
            this.chartData.set(built.data);
            this.chartLayout.set(built.layout);
        });
    }

    protected loadData(): void {
        const config = this.groupingConfig();

        this.subscribe(this.dashboardService.getEPCByAreaLevel(config.groupBy, config.filterLevel, config.filterNames), (areaData) => {
            this.epcAreaData.set(areaData);

            const areas = areaData.map((r) => r.name);
            this.availableAreas.set(areas);
            this.selectedAreas.set(areas);

            this.initializeScrollToTop();
        });
    }

    private buildChart(areaData: EPCAreaData[], selectedAreas: string[]): { data: Data[]; layout: Partial<Layout> } {
        const filteredData = areaData.filter((r) => selectedAreas.includes(r.name));
        const sortedData = filteredData.toSorted((a, b) => a.total - b.total);

        const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const areaNames = sortedData.map((r) => r.name);

        const data: Data[] = ratings.map((rating) => {
            const values = sortedData.map((r) => r[`epc_${rating.toLowerCase()}` as keyof EPCAreaData] || 0);
            const percentages = sortedData.map((r) => {
                const ratingCount = (r[`epc_${rating.toLowerCase()}` as keyof EPCAreaData] as number) || 0;
                return ((ratingCount / r.total) * 100).toFixed(1);
            });
            return {
                type: 'bar',
                name: rating,
                y: areaNames,
                x: values,
                orientation: 'h',
                customdata: percentages,
                marker: { color: this.chartService.epcColors[rating] },
                hoverlabel: this.chartService.commonHoverStyle,
                hovertemplate: '<b>%{fullData.name}</b><br>%{x:,}<br>%{customdata}%<extra></extra>',
            };
        });

        const maxTotal = Math.max(
            ...sortedData.map((r) => ratings.reduce((acc, curr) => acc + ((r[`epc_${curr.toLowerCase()}` as keyof EPCAreaData] as number) || 0), 0)),
        );

        const layout: Partial<Layout> = {
            barmode: 'stack',
            margin: { l: 0, r: 20, t: 20, b: 0 },
            xaxis: {
                title: { text: '' },
                range: [0, maxTotal * 1.1],
                tickformat: '.2s',
                tickfont: { size: 11, color: '#999' },
                showgrid: false,
                linecolor: '#e0e0e0',
                zerolinecolor: '#e0e0e0',
                fixedrange: true,
            },
            yaxis: {
                title: { text: '' },
                tickfont: { size: 11, color: '#999' },
                automargin: true,
                linecolor: '#e0e0e0',
                range: this.getAxisRange(),
                fixedrange: true,
            },
            dragmode: false,
            font: this.chartService.commonFont,
            height: 400,
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            showlegend: true,
            legend: {
                orientation: 'h',
                x: -1,
                xref: 'paper',
                xanchor: 'left',
                traceorder: 'normal',
            },
        };

        return { data, layout };
    }

    private getNextLevelDown(level: AreaLevel): AreaLevel {
        const hierarchy: Record<AreaLevel, AreaLevel> = {
            region: 'county',
            county: 'district',
            district: 'ward',
            ward: 'ward',
        };
        return hierarchy[level];
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
