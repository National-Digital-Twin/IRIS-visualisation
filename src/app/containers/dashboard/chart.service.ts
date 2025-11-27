import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

export const dashboardTypes = ['national', 'area'] as const;
export type DashboardType = (typeof dashboardTypes)[number];

export interface Layout extends Partial<Plotly.Layout> {
    legend?: Plotly.Layout['legend'] & {
        maxheight?: number; // documented in Python: https://plotly.com/python/legend/#legend-max-height
    };
}

@Injectable({ providedIn: 'root' })
export class ChartService {
    readonly #config = inject(RUNTIME_CONFIGURATION);

    public get epcColors(): Record<string, string> {
        return this.#config.epcColours;
    }

    public get commonHoverStyle(): { bgcolor: string; font: { color: string; family: string } } {
        return {
            bgcolor: '#000',
            font: { color: 'white', family: 'Roboto, sans-serif' },
        };
    }

    public get commonFont(): { family: string } {
        return { family: 'Roboto, sans-serif' };
    }

    public get colorway(): string[] {
        return ['#3670B3', '#002244', '#FFCF06', '#E02720', '#62BA5A'];
    }

    public sortRegionsAlphabetically<T extends { region_name: string }>(regions: T[]): T[] {
        return [...regions].sort((a, b) => a.region_name.localeCompare(b.region_name));
    }

    public getSAPTimelineLayout(maxScore: number, height: number = 300): Partial<Layout> {
        return {
            margin: { l: 40, r: 15, t: 10, b: 0 },
            colorway: this.colorway,
            xaxis: {
                title: { text: '' },
                showgrid: false,
                tickfont: { size: 11, color: '#999' },
                linecolor: '#999',
                automargin: true,
            },
            yaxis: {
                title: { text: 'SAP score', font: { size: 11, color: '#999' } },
                showgrid: false,
                tickfont: { size: 11, color: '#999' },
                linecolor: '#999',
                zeroline: false,
                range: [0, maxScore * 1.1],
            },
            font: { ...this.commonFont, size: 10 },
            height,
            showlegend: true,
            legend: {
                orientation: 'h',
                font: { size: 11 },
                maxheight: 0.2,
                xanchor: 'left',
            },
        };
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
