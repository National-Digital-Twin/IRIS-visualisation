import { importProvidersFrom } from '@angular/core';
import { PlotlyModule } from 'angular-plotly.js';

export const mockPlotlyJS = {
    react: jest.fn(() => Promise.resolve(undefined)),
    newPlot: jest.fn(() => Promise.resolve(undefined)),
    purge: jest.fn(),
    Plots: {
        resize: jest.fn(),
    },
};

jest.mock('plotly.js-dist-min', () => mockPlotlyJS, { virtual: true });

export const getPlotlyModuleProviders = (): ReturnType<typeof importProvidersFrom>[] => {
    return [importProvidersFrom(PlotlyModule.forRoot(mockPlotlyJS))];
};
