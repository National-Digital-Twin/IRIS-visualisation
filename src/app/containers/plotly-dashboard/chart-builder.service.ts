import { Injectable, inject } from '@angular/core';
import { EPCRegionData, OverallEPCResponse, RegionCharacteristicData, TimelineDataPoint } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import type { Data, Layout } from 'plotly.js-dist-min';
export interface ChartState<T = any> {
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

    buildCharacteristicsChart(characteristic: string, regions: RegionCharacteristicData[], selectedRegions: string[]): Partial<ChartState> {
        const filteredRegions = regions.filter((r) => selectedRegions.includes(r.region_name));
        const sortedRegions = [...filteredRegions].sort((a, b) => a.region_name.localeCompare(b.region_name));
        const regionsWithPercentages = sortedRegions.map((r) => ({
            ...r,
            percentage: (r.count / r.total) * 100,
        }));

        const data: Data[] = [
            {
                type: 'bar',
                x: regionsWithPercentages.map((r) => r.region_name),
                y: regionsWithPercentages.map((r) => r.percentage),
                marker: { color: '#5729CE' },
                text: regionsWithPercentages.map((r) => `${Math.round(r.percentage)}%`),
                textposition: 'auto',
                textfont: { color: 'white', size: 14, family: 'Roboto, sans-serif' },
                hovertemplate: '<b>%{x}</b><br>%{y:.1f}%<br>(%{customdata})<extra></extra>',
                hoverlabel: COMMON_HOVER_STYLE,
                customdata: regionsWithPercentages.map((r) => `${r.count.toLocaleString()} of ${r.total.toLocaleString()} buildings`),
                width: 0.5,
            },
        ];

        const maxPercentage = Math.max(...regionsWithPercentages.map((r) => r.percentage));
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

    buildEPCRegionChart(regionData: EPCRegionData[], selectedRegions: string[]): Partial<ChartState> {
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

    buildOverallEPCDonut(response: OverallEPCResponse): Partial<ChartState> {
        const data: Data[] = [
            {
                type: 'pie',
                values: response.ratings.map((r) => r.count),
                labels: response.ratings.map((r) => r.rating),
                hole: 0.75,
                marker: {
                    colors: response.ratings.map((r) => this.epcColors[r.rating]),
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
                    text: `<b>${response.total.toLocaleString()}</b><br><span style="font-size: 14px;">EPC ratings</span>`,
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

    buildOverallEPCBar(response: OverallEPCResponse): Partial<ChartState> {
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
                color: sortedRatings.map((r) => this.epcColors[r.rating]),
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
                    font: { size: 11, color: '#333', family: 'Roboto, sans-serif' },
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
                    font: { size: 11, color: '#333', family: 'Roboto, sans-serif' },
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
            annotations: annotations as any,
        };

        return {
            data,
            layout,
            metadata: { total: response.total },
        };
    }

    buildSAPTimeline(timeline: TimelineDataPoint[]): Partial<ChartState> {
        const data: Data[] = [
            {
                type: 'scatter',
                mode: 'lines',
                x: timeline.map((t) => t.year),
                y: timeline.map((t) => t.avg_sap_score),
                line: { color: '#000000', width: 2 },
                hovertemplate: '<b>%{x}</b><br>SAP Score: %{y:.1f}<br>Assessments: %{customdata}<extra></extra>',
                customdata: timeline.map((t) => t.assessment_count.toLocaleString()),
            },
        ];

        const layout: Partial<Layout> = {
            margin: { l: 50, r: 15, t: 10, b: 40 },
            xaxis: {
                title: { text: '' },
                tickmode: 'linear',
                dtick: 5,
                showgrid: false,
                tickfont: { size: 9 },
            },
            yaxis: {
                title: { text: 'SAP score', font: { size: 10 } },
                range: [50, 100],
                showgrid: true,
                gridcolor: '#e0e0e0',
                tickfont: { size: 9 },
            },
            font: { family: 'Roboto, sans-serif', size: 10 },
            height: 250,
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
