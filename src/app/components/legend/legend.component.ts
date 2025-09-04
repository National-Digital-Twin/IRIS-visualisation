import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { LabelComponent } from '@components/label/label.component';
import { LAYER_COLORS } from '@core/config/layer-colors.config';

export interface LayerState {
    epc: {
        region: boolean;
        county: boolean;
        district: boolean;
        ward: boolean;
    };
    windDrivenRain: {
        twoDegree: boolean;
        fourDegree: boolean;
    };
    icingDays: boolean;
    hotSummerDays: boolean;
}

export interface LegendConfig {
    type: 'epc' | 'wind-driven-rain' | 'hot-summer-days' | 'icing-days';
    title: string;
    gradient?: {
        colors: string[];
        labels: string[];
    };
    items?: Array<{ rating: string; sapPoints: string }>;
}

@Component({
    selector: 'c477-legend',
    imports: [CommonModule, LabelComponent],
    templateUrl: './legend.component.html',
    styleUrl: './legend.component.scss',
})
export class LegendComponent {
    public layerState = input<LayerState>();

    public epcItems = [
        { rating: 'A', sapPoints: '92 +' },
        { rating: 'B', sapPoints: '81-91' },
        { rating: 'C', sapPoints: '69-80' },
        { rating: 'D', sapPoints: '55-68' },
        { rating: 'E', sapPoints: '39-54' },
        { rating: 'F', sapPoints: '21-38' },
        { rating: 'G', sapPoints: '1-20' },
        { rating: 'none', sapPoints: '' },
        { rating: 'avg', sapPoints: '1-20' },
    ];

    public currentLegend = computed(() => {
        const layerState = this.layerState();
        if (!layerState) {
            return this.getEpcLegend();
        }

        if (layerState.windDrivenRain.twoDegree || layerState.windDrivenRain.fourDegree) {
            return this.getWindDrivenRainLegend();
        }

        if (layerState.hotSummerDays) {
            return this.getHotSummerDaysLegend();
        }

        if (layerState.icingDays) {
            return this.getIcingDaysLegend();
        }

        if (layerState.epc.region || layerState.epc.county || layerState.epc.district || layerState.epc.ward) {
            return this.getEpcLegend();
        }

        return this.getEpcLegend();
    });

    public getGradientStyle = computed(() => {
        const legend = this.currentLegend();

        if (!legend.gradient) {
            return '';
        }

        const { colors } = legend.gradient;
        if (colors.length === 2) {
            return `linear-gradient(to bottom, ${colors[0]} 0%, ${colors[1]} 100%)`;
        }

        const colorStops = colors
            .map((color, index) => {
                const percentage = (index / (colors.length - 1)) * 100;
                return `${color} ${percentage}%`;
            })
            .join(', ');

        return `linear-gradient(to bottom, ${colorStops})`;
    });

    private getEpcLegend(): LegendConfig {
        return {
            type: 'epc',
            title: 'EPC legend',
            items: this.epcItems,
        };
    }

    private getWindDrivenRainLegend(): LegendConfig {
        const colors = LAYER_COLORS.windDrivenRain;
        return {
            type: 'wind-driven-rain',
            title: 'Wind Driven Rain',
            gradient: {
                colors: [colors.high, colors.low],
                labels: ['High', 'Low'],
            },
        };
    }

    private getHotSummerDaysLegend(): LegendConfig {
        const colors = LAYER_COLORS.hotSummerDays;
        return {
            type: 'hot-summer-days',
            title: 'Hot Summer Days',
            gradient: {
                colors: [colors.high, colors.low],
                labels: ['High', 'Low'],
            },
        };
    }

    private getIcingDaysLegend(): LegendConfig {
        const colors = LAYER_COLORS.icingDays;
        return {
            type: 'icing-days',
            title: 'Icing Days',
            gradient: {
                colors: [colors.high, colors.low],
                labels: ['High', 'Low'],
            },
        };
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
