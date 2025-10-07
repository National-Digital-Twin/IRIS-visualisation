import { Injectable, inject } from '@angular/core';
import { EPCRegionData, OverallEPCResponse, RegionCharacteristicData, TimelineDataPoint } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import type { Data, Layout } from 'plotly.js-dist-min';
export interface ChartState<T = unknown> {
    data: Data[];
    layout: Partial<Layout>;
    loading: boolean;
    metadata?: T;
}

export interface CharacteristicsMetadata {
    selectedCharacteristic: string;
    selectedRegions: string[];
}

export interface EPCRegionMetadata {
    selectedRegions: string[];
}

export interface OverallEPCMetadata {
    total: number;
}

export interface DashboardCharts {
    epcRegion: ChartState<EPCRegionMetadata>;
    overallEPCDonut: ChartState<OverallEPCMetadata>;
    overallEPCBar: ChartState<OverallEPCMetadata>;
    characteristics: ChartState<CharacteristicsMetadata>;
    sapTimeline: ChartState;
}

const COMMON_HOVER_STYLE = {
    bgcolor: '#000',
    font: { color: 'white', family: 'Roboto, sans-serif' },
};

@Injectable({ providedIn: 'root' })
export class ChartBuilderService {
    readonly #config = inject(RUNTIME_CONFIGURATION);

    private get epcColors(): Record<string, string> {
        return this.#config.epcColours;
    }

    public buildCharacteristicsChart(
        characteristic: string,
        regions: RegionCharacteristicData[],
        selectedRegions: string[],
    ): Partial<ChartState<CharacteristicsMetadata>> {
        const filteredRegions = regions.filter((r) => selectedRegions.includes(r.region_name));
        const sortedRegions = [...filteredRegions].sort((a, b) => a.region_name.localeCompare(b.region_name));

        const data: Data[] = [
            {
                type: 'bar',
                x: sortedRegions.map((r) => r.region_name),
                y: sortedRegions.map((r) => r.percentage),
                marker: { color: '#5729CE' },
                text: sortedRegions.map((r) => `${Math.round(r.percentage)}%`),
                textposition: 'auto',
                textfont: { color: 'white', size: 14, family: 'Roboto, sans-serif' },
                hovertemplate: '<b>%{x}</b><br>%{y:.1f}% of buildings have ' + characteristic + '<extra></extra>',
                hoverlabel: COMMON_HOVER_STYLE,
                width: 0.5,
            },
        ];

        const maxPercentage = Math.max(...sortedRegions.map((r) => r.percentage));
        const layout: Partial<Layout> = {
            margin: { l: 40, r: 20, t: 20, b: 80 },
            xaxis: {
                title: { text: '' },
                tickangle: 'auto',
                tickfont: { size: 11, color: '#333' },
                automargin: true,
            },
            yaxis: {
                title: { text: '' },
                range: [0, maxPercentage * 1.15],
                visible: false,
            },
            font: { family: 'Roboto, sans-serif' },
            height: 250,
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            showlegend: false,
        };

        return {
            data,
            layout,
            metadata: { selectedCharacteristic: characteristic, selectedRegions },
        };
    }

    public buildEPCRegionChart(regionData: EPCRegionData[], selectedRegions: string[]): Partial<ChartState<EPCRegionMetadata>> {
        const filteredData = regionData.filter((r) => selectedRegions.includes(r.region_name));
        const sortedData = [...filteredData].sort((a, b) => a.region_name.localeCompare(b.region_name));

        const ratings = ['G', 'F', 'E', 'D', 'C', 'B', 'A'];
        const regionNames = sortedData.map((r) => r.region_name);
        const data: Data[] = ratings.map((rating) => ({
            type: 'bar',
            name: rating,
            x: regionNames,
            y: sortedData.map((r) => r[`epc_${rating.toLowerCase()}` as keyof EPCRegionData] || 0),
            marker: { color: this.epcColors[rating] },
            hoverlabel: COMMON_HOVER_STYLE,
            hovertemplate: '<b>%{x}</b><br>%{y:,}<extra></extra>',
            width: 0.5,
        }));

        const maxTotal = Math.max(
            ...sortedData.map((r) => ratings.reduce((acc, curr) => acc + ((r[`epc_${curr.toLowerCase()}` as keyof EPCRegionData] as number) || 0), 0)),
        );
        const layout: Partial<Layout> = {
            barmode: 'stack',
            margin: { l: 20, r: 40, t: 20, b: 80 },
            xaxis: {
                title: { text: '' },
                tickangle: 'auto',
                tickfont: { size: 11, color: '#333' },
                automargin: true,
            },
            yaxis: {
                title: { text: '' },
                range: [0, maxTotal * 1.1],
                tickformat: '.2s',
                showgrid: true,
                gridcolor: '#e0e0e0',
                side: 'right',
            },
            font: { family: 'Roboto, sans-serif' },
            height: 250,
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            showlegend: true,
            legend: {
                orientation: 'h',
                x: 0.5,
                y: -0.3,
                xanchor: 'center',
                yanchor: 'top',
                traceorder: 'reversed',
            },
        };

        return {
            data,
            layout,
            metadata: { selectedRegions },
        };
    }

    public buildOverallEPCDonut(response: OverallEPCResponse, hiddenRatings: Record<string, boolean> = {}): Partial<ChartState<OverallEPCMetadata>> {
        const visibleTotal = response.ratings.filter((r) => !hiddenRatings[r.rating]).reduce((sum, r) => sum + r.count, 0);

        const data: Data[] = [
            {
                type: 'pie',
                values: response.ratings.map((r) => (hiddenRatings[r.rating] ? 0 : r.count)),
                labels: response.ratings.map((r) => r.rating),
                hole: 0.9,
                marker: {
                    colors: response.ratings.map((r) => this.epcColors[r.rating]),
                    line: { color: 'white', width: 2 },
                },
                textinfo: 'none',
                hovertemplate: '<b>%{label}</b><br>%{value:,}<br>%{percent}<extra></extra>',
                hoverlabel: COMMON_HOVER_STYLE,
            },
        ];

        const layout: Partial<Layout> = {
            margin: { l: 30, r: 30, t: 30, b: 30 },
            height: 280,
            showlegend: false,
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            font: { family: 'Roboto, sans-serif' },
            annotations: [
                {
                    text: `<b>${visibleTotal.toLocaleString()}</b><br><span style="font-size: 14px;">EPC ratings</span>`,
                    x: 0.5,
                    y: 0.5,
                    xref: 'paper',
                    yref: 'paper',
                    showarrow: false,
                    font: { size: 28, color: '#333' },
                },
            ],
        };

        return {
            data,
            layout,
            metadata: { total: response.total },
        };
    }

    public buildOverallEPCBar(response: OverallEPCResponse, hiddenRatings: Record<string, boolean> = {}): Partial<ChartState<OverallEPCMetadata>> {
        const sortedRatings = [...response.ratings].sort((a, b) => a.rating.localeCompare(b.rating));

        const backgroundBars: Data = {
            type: 'bar',
            x: sortedRatings.map(() => response.total),
            y: sortedRatings.map((r) => r.rating),
            orientation: 'h',
            marker: { color: '#EFEFEF' },
            hoverinfo: 'skip',
            showlegend: false,
            width: 0.25,
        };

        const dataBars: Data = {
            type: 'bar',
            x: sortedRatings.map((r) => r.count),
            y: sortedRatings.map((r) => r.rating),
            orientation: 'h',
            marker: {
                color: sortedRatings.map((r) => (hiddenRatings[r.rating] ? '#D3D3D3' : this.epcColors[r.rating])),
            },
            customdata: sortedRatings.map((r) => ((r.count / response.total) * 100).toFixed(1)),
            hovertemplate: '<b>%{y}</b><br>%{x:,} (%{customdata}%)<extra></extra>',
            hoverlabel: COMMON_HOVER_STYLE,
            showlegend: false,
            width: 0.25,
        };

        const data: Data[] = [backgroundBars, dataBars];

        const annotations = sortedRatings
            .map((rating) => [
                {
                    x: 0,
                    y: rating.rating,
                    xref: 'x',
                    yref: 'y',
                    text: rating.rating,
                    showarrow: false,
                    xanchor: 'left',
                    yanchor: 'bottom',
                    yshift: 14,
                    font: { size: 11, color: hiddenRatings[rating.rating] ? '#999' : '#333', family: 'Roboto, sans-serif' },
                },
                {
                    x: response.total,
                    y: rating.rating,
                    xref: 'x',
                    yref: 'y',
                    text: rating.count.toLocaleString(),
                    showarrow: false,
                    xanchor: 'right',
                    yanchor: 'bottom',
                    yshift: 14,
                    font: { size: 11, color: hiddenRatings[rating.rating] ? '#999' : '#333', family: 'Roboto, sans-serif' },
                },
            ])
            .flat();

        const layout: Partial<Layout> = {
            margin: { l: 5, r: 5, t: 20, b: 5 },
            height: 360,
            barmode: 'overlay',
            xaxis: {
                showgrid: false,
                showticklabels: false,
                showline: false,
                zeroline: false,
                range: [0, response.total * 1.01],
                fixedrange: true,
            },
            yaxis: {
                showgrid: false,
                showticklabels: false,
                showline: false,
                zeroline: false,
                automargin: false,
                categoryorder: 'array',
                categoryarray: ['G', 'F', 'E', 'D', 'C', 'B', 'A'],
                fixedrange: true,
            },
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            font: { family: 'Roboto, sans-serif' },
            showlegend: false,
            annotations: annotations as Partial<Layout>['annotations'],
        };

        return {
            data,
            layout,
            metadata: { total: response.total },
        };
    }

    public buildSAPTimeline(timeline: TimelineDataPoint[]): Partial<ChartState> {
        const startIndex = Math.floor(timeline.length * 0.8);
        const startDate = timeline[startIndex]?.date || new Date();
        const endDate = timeline[timeline.length - 1]?.date || new Date();

        const data: Data[] = [
            {
                type: 'scatter',
                mode: 'lines',
                x: timeline.map((t) => t.date.toISOString().split('T')[0]),
                y: timeline.map((t) => t.avg_sap_score),
                line: { color: '#000000', width: 1 },
                hovertemplate: '<b>%{x}</b><br>SAP Score: %{y:.1f}<extra></extra>',
            },
        ];

        const layout: Partial<Layout> = {
            margin: { l: 50, r: 15, t: 10, b: 40 },
            xaxis: {
                title: { text: '' },
                type: 'date',
                showgrid: false,
                tickfont: { size: 9 },
                range: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
                rangeslider: { visible: true },
            },
            yaxis: {
                title: { text: 'SAP score', font: { size: 10 } },
                range: [50, 100],
                showgrid: true,
                gridcolor: '#e0e0e0',
                tickfont: { size: 9 },
            },
            font: { family: 'Roboto, sans-serif', size: 10 },
            height: 300,
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
        };

        return {
            data,
            layout,
        };
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
