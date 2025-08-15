import { Injectable, inject } from '@angular/core';
import { ClimateDataService } from '@core/services/climate-data.service';
import { AbstractBaseLayer } from './base-layer.abstract';
import { BaseLayer } from './base-layer.interface';
import { DemoLayer } from './demo-layer';
import { WindDrivenRainLayer } from './wind-driven-rain.layer';

@Injectable({
    providedIn: 'root',
})
export class LayerFactoryService {
    private readonly climateDataService = inject(ClimateDataService);

    private readonly layers = new Map<string, BaseLayer>();

    constructor() {
        AbstractBaseLayer.setLayerFactory(this);
        this.initializeLayers();
    }

    private initializeLayers(): void {
        this.initializeWindDrivenRainLayers();
        this.initializeDemoLayers();
    }

    private initializeWindDrivenRainLayers(): void {
        const windDirections: Array<{
            type: 'twoDegree0' | 'twoDegree90' | 'twoDegree180' | 'twoDegree270' | 'fourDegree0' | 'fourDegree90' | 'fourDegree180' | 'fourDegree270';
            scenario: string;
            dataProperty: keyof import('@core/services/climate-data.service').WindDrivenRainProperties;
        }> = [
            { type: 'twoDegree0', scenario: '2°C - North', dataProperty: 'wdr20_0' },
            { type: 'twoDegree90', scenario: '2°C - East', dataProperty: 'wdr20_90' },
            { type: 'twoDegree180', scenario: '2°C - South', dataProperty: 'wdr20_180' },
            { type: 'twoDegree270', scenario: '2°C - West', dataProperty: 'wdr20_270' },
            { type: 'fourDegree0', scenario: '4°C - North', dataProperty: 'wdr40_0' },
            { type: 'fourDegree90', scenario: '4°C - East', dataProperty: 'wdr40_90' },
            { type: 'fourDegree180', scenario: '4°C - South', dataProperty: 'wdr40_180' },
            { type: 'fourDegree270', scenario: '4°C - West', dataProperty: 'wdr40_270' },
        ];

        windDirections.forEach(({ type, scenario, dataProperty }) => {
            const layer = new WindDrivenRainLayer({ type, warmingScenario: scenario, dataProperty }, this.climateDataService);
            this.layers.set(`wind-driven-rain-${type}-layer`, layer);
        });
    }

    private initializeDemoLayers(): void {
        const demoLayerConfigs = [
            { id: 'epc-regions-layer', color: '#4CAF50', outlineColor: '#2E7D32' },
            { id: 'epc-counties-layer', color: '#8BC34A', outlineColor: '#558B2F' },
            { id: 'epc-districts-layer', color: '#CDDC39', outlineColor: '#9E9D24' },
            { id: 'epc-wards-layer', color: '#FFEB3B', outlineColor: '#F57F17' },
            { id: 'icing-days-layer', color: '#2196F3', outlineColor: '#1565C0' },
            { id: 'hot-summer-days-layer', color: '#FF5722', outlineColor: '#D84315' },
        ];

        demoLayerConfigs.forEach(({ id, color, outlineColor }) => {
            const layer = new DemoLayer({ id, color, outlineColor });
            this.layers.set(id, layer);
        });
    }

    public getLayer(layerId: string): BaseLayer | undefined {
        return this.layers.get(layerId);
    }

    public getAllLayers(): BaseLayer[] {
        return Array.from(this.layers.values());
    }

    public getVisibleLayers(): BaseLayer[] {
        return this.getAllLayers().filter((layer) => layer.isVisible);
    }
}
