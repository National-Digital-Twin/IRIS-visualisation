import { Injectable, inject } from '@angular/core';
import { EPCRegionData, OverallEPCResponse, RegionCharacteristicData, TimelineDataPoint } from '@core/services/dashboard.service';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { Chart, ChartConfiguration, ChartEvent, Element } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

interface BarElement extends Element {
    x: number;
    y: number;
    height: number;
    width: number;
    options: {
        backgroundColor: string;
    };
}

export interface ChartState<T = unknown> {
    config: ChartConfiguration;
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

        const config: ChartConfiguration = {
            type: 'bar',
            data: {
                labels: sortedRegions.map((r) => r.region_name),
                datasets: [
                    {
                        data: sortedRegions.map((r) => r.percentage),
                        backgroundColor: '#5729CE',
                        barThickness: 'flex',
                        maxBarThickness: 60,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: '#000',
                        titleColor: 'white',
                        bodyColor: 'white',
                        titleFont: { family: 'Roboto, sans-serif' },
                        bodyFont: { family: 'Roboto, sans-serif' },
                        callbacks: {
                            label: (context) => {
                                return `${context.parsed.y.toFixed(1)}% of buildings have ${characteristic}`;
                            },
                        },
                    },
                    datalabels: {
                        display: true,
                        color: 'white',
                        font: {
                            size: 14,
                            family: 'Roboto, sans-serif',
                        },
                        anchor: 'center',
                        align: 'center',
                        formatter: (value: number) => `${Math.round(value)}%`,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: Math.max(...sortedRegions.map((r) => r.percentage)) * 1.15,
                        display: false,
                    },
                    x: {
                        ticks: {
                            font: { size: 11 },
                            color: '#333',
                        },
                        grid: {
                            display: false,
                        },
                    },
                },
            },
            plugins: [ChartDataLabels],
        };

        return {
            config,
            metadata: { selectedCharacteristic: characteristic, selectedRegions },
        };
    }

    public buildEPCRegionChart(regionData: EPCRegionData[], selectedRegions: string[]): Partial<ChartState<EPCRegionMetadata>> {
        const filteredData = regionData.filter((r) => selectedRegions.includes(r.region_name));
        const sortedData = [...filteredData].sort((a, b) => a.region_name.localeCompare(b.region_name));

        const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const regionNames = sortedData.map((r) => r.region_name);

        const config: ChartConfiguration = {
            type: 'bar',
            data: {
                labels: regionNames,
                datasets: ratings.map((rating) => ({
                    label: rating,
                    data: sortedData.map((r) => Number(r[`epc_${rating.toLowerCase()}` as keyof EPCRegionData] || 0)),
                    backgroundColor: this.epcColors[rating],
                    barThickness: 'flex' as const,
                    maxBarThickness: 60,
                })),
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        reverse: false,
                        labels: {
                            font: { family: 'Roboto, sans-serif' },
                            usePointStyle: true,
                            pointStyle: 'rect',
                            boxWidth: 12,
                            boxHeight: 12,
                        },
                    },
                    tooltip: {
                        backgroundColor: '#000',
                        titleColor: 'white',
                        bodyColor: 'white',
                        titleFont: { family: 'Roboto, sans-serif' },
                        bodyFont: { family: 'Roboto, sans-serif' },
                        callbacks: {
                            label: (context) => {
                                return `${context.parsed.y.toLocaleString()}`;
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        position: 'right',
                        ticks: {
                            callback: (value) => {
                                if (typeof value === 'number') {
                                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                    return value.toString();
                                }
                                return value;
                            },
                        },
                        grid: {
                            color: '#e0e0e0',
                        },
                    },
                    x: {
                        stacked: true,
                        ticks: {
                            font: { size: 11 },
                            color: '#333',
                        },
                        grid: {
                            display: false,
                        },
                    },
                },
            },
        };

        return {
            config,
            metadata: { selectedRegions },
        };
    }

    public buildOverallEPCDonut(response: OverallEPCResponse, hiddenRatings: Record<string, boolean> = {}): Partial<ChartState<OverallEPCMetadata>> {
        const config: ChartConfiguration<'doughnut'> = {
            type: 'doughnut',
            data: {
                labels: response.ratings.map((r) => r.rating),
                datasets: [
                    {
                        data: response.ratings.map((r) => (hiddenRatings[r.rating] ? 0 : r.count)),
                        backgroundColor: response.ratings.map((r) => this.epcColors[r.rating]),
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '90%',
                spacing: 2,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: '#000',
                        titleColor: 'white',
                        bodyColor: 'white',
                        titleFont: { family: 'Roboto, sans-serif' },
                        bodyFont: { family: 'Roboto, sans-serif' },
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed as number;
                                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return [`${label}`, `${value.toLocaleString()}`, `${percentage}%`];
                            },
                        },
                    },
                },
            },
            plugins: [
                {
                    id: 'centerText',
                    afterDraw: (chart: Chart): void => {
                        const ctx = chart.ctx;
                        const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
                        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

                        const currentHiddenRatings = (chart as any).hiddenRatings || hiddenRatings;
                        const visibleTotal = response.ratings.filter((r) => !currentHiddenRatings[r.rating]).reduce((sum, r) => sum + r.count, 0);

                        ctx.save();
                        ctx.font = 'bold 28px Roboto, sans-serif';
                        ctx.fillStyle = '#333';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(visibleTotal.toLocaleString(), centerX, centerY - 10);

                        ctx.font = '14px Roboto, sans-serif';
                        ctx.fillText('EPC ratings', centerX, centerY + 15);
                        ctx.restore();
                    },
                },
            ],
        };

        return {
            config,
            metadata: response,
        };
    }

    public buildOverallEPCBar(
        response: OverallEPCResponse,
        hiddenRatings: Record<string, boolean> = {},
        onRatingClick?: (rating: string) => void,
    ): Partial<ChartState<OverallEPCMetadata>> {
        const sortedRatings = [...response.ratings].sort((a, b) => a.rating.localeCompare(b.rating));

        const config: ChartConfiguration = {
            type: 'bar',
            data: {
                labels: sortedRatings.map((r) => r.rating),
                datasets: [
                    {
                        data: sortedRatings.map((r) => r.count),
                        backgroundColor: sortedRatings.map((r) => this.epcColors[r.rating]),
                        barPercentage: 0.35,
                        categoryPercentage: 0.9,
                    },
                ],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 20,
                    },
                },
                onClick: (event: ChartEvent, activeElements, chart: Chart) => {
                    if (!onRatingClick) return;

                    const elements = chart.getElementsAtEventForMode(event.native as Event, 'y', { intersect: false }, false);

                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const rating = sortedRatings[index].rating;
                        onRatingClick(rating);
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: '#000',
                        titleColor: 'white',
                        bodyColor: 'white',
                        titleFont: { family: 'Roboto, sans-serif' },
                        bodyFont: { family: 'Roboto, sans-serif' },
                        callbacks: {
                            label: (context) => {
                                const index = context.dataIndex;
                                const rating = sortedRatings[index];
                                const percentage = ((rating.count / response.total) * 100).toFixed(1);
                                return `${context.parsed.x.toLocaleString()} (${percentage}%)`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        display: false,
                        max: response.total,
                    },
                    y: {
                        display: false,
                    },
                },
            },
            plugins: [
                {
                    id: 'grayOutHiddenBars',
                    beforeDatasetsDraw: (chart: Chart): void => {
                        const meta = chart.getDatasetMeta(0);
                        const currentHiddenRatings = (chart as any).hiddenRatings || hiddenRatings;

                        meta.data.forEach((element, index: number) => {
                            const bar = element as BarElement;
                            const rating = sortedRatings[index].rating;
                            bar.options.backgroundColor = currentHiddenRatings[rating] ? '#D3D3D3' : this.epcColors[rating];
                        });
                    },
                },
                {
                    id: 'backgroundBars',
                    beforeDatasetsDraw: (chart: Chart): void => {
                        const ctx = chart.ctx;
                        const meta = chart.getDatasetMeta(0);
                        const xScale = chart.scales['x'];

                        ctx.save();
                        ctx.fillStyle = '#EFEFEF';

                        meta.data.forEach((element) => {
                            const bar = element as BarElement;
                            ctx.fillRect(bar.x, bar.y - bar.height / 2, xScale.width, bar.height);
                        });

                        ctx.restore();
                    },
                },
                {
                    id: 'customLabels',
                    afterDatasetsDraw: (chart: Chart): void => {
                        const ctx = chart.ctx;
                        const meta = chart.getDatasetMeta(0);
                        const currentHiddenRatings = (chart as any).hiddenRatings || hiddenRatings;

                        sortedRatings.forEach((rating, index) => {
                            const bar = meta.data[index] as BarElement;
                            const labelY = bar.y - bar.height / 2 - 3;

                            ctx.fillStyle = currentHiddenRatings[rating.rating] ? '#999' : '#333';
                            ctx.font = '11px Roboto, sans-serif';
                            ctx.textBaseline = 'bottom';

                            ctx.textAlign = 'left';
                            ctx.fillText(rating.rating, chart.chartArea.left, labelY);

                            ctx.textAlign = 'right';
                            ctx.fillText(rating.count.toLocaleString(), chart.chartArea.right, labelY);
                        });
                    },
                },
            ],
        };

        return {
            config,
            metadata: response,
        };
    }

    public buildSAPTimeline(timeline: TimelineDataPoint[]): Partial<ChartState> {
        const totalDataPoints = timeline.length;
        const startIndex = Math.floor(totalDataPoints * 0.8);

        const config: ChartConfiguration = {
            type: 'line',
            data: {
                labels: timeline.map((t) => t.date.toLocaleDateString('en-GB')),
                datasets: [
                    {
                        data: timeline.map((t) => t.avg_sap_score),
                        borderColor: '#000000',
                        backgroundColor: '#000000',
                        borderWidth: 1,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: '#000',
                        titleColor: 'white',
                        bodyColor: 'white',
                        titleFont: { family: 'Roboto, sans-serif' },
                        bodyFont: { family: 'Roboto, sans-serif' },
                        callbacks: {
                            title: (items) => items[0].label,
                            label: (context) => {
                                const index = context.dataIndex;
                                const point = timeline[index];
                                return [`SAP Score: ${point.avg_sap_score.toFixed(1)}`];
                            },
                        },
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true,
                            },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        },
                        limits: {
                            x: { min: 0, max: totalDataPoints - 1 },
                        },
                    },
                },
                scales: {
                    y: {
                        min: 50,
                        max: 100,
                        ticks: {
                            font: { size: 9 },
                        },
                        title: {
                            display: true,
                            text: 'SAP score',
                            font: { size: 10 },
                        },
                        grid: {
                            color: '#e0e0e0',
                        },
                    },
                    x: {
                        min: startIndex,
                        max: totalDataPoints - 1,
                        ticks: {
                            font: { size: 9 },
                            autoSkip: true,
                            maxTicksLimit: 10,
                        },
                        grid: {
                            display: false,
                        },
                    },
                },
            },
        };

        return {
            config,
        };
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
