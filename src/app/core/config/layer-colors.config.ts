export interface LayerColors {
    low: string;
    high: string;
    outline: string;
    opacity: number;
}

export interface LayerColorConfig {
    windDrivenRain: LayerColors;
    hotSummerDays: LayerColors;
    icingDays: LayerColors;
    deprivation: LayerColors;
    sunlightHours: LayerColors;
}

export const LAYER_COLORS: LayerColorConfig = {
    windDrivenRain: {
        low: '#ffffff',
        high: '#000099',
        outline: '#ffffff',
        opacity: 0.8,
    },
    hotSummerDays: {
        low: '#ffffff',
        high: '#990000',
        outline: '#ffffff',
        opacity: 0.8,
    },
    icingDays: {
        low: '#ffffff',
        high: '#006699',
        outline: '#ffffff',
        opacity: 0.8,
    },
    deprivation: {
        low: '#CDE594',
        high: '#080C54',
        outline: '#ffffff',
        opacity: 0.8,
    },
    sunlightHours: {
        low: '#464433',
        high: '#FFF91F',
        outline: '#ffffff',
        opacity: 0.8,
    },
};
