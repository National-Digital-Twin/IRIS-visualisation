import { Injectable, inject } from '@angular/core';
import { ClimateDataService } from '@core/services/climate-data.service';
import { EPCDataService } from '@core/services/epc-data.service';
import { ScriptLoaderService } from '@core/services/script-loader.service';
import { AbstractBaseLayer } from './base-layer.abstract';
import { BaseLayer } from './base-layer.interface';
import { DemoLayer } from './demo-layer';
import { EPCLayer } from './epc-wards.layer';
import { HotSummerDaysLayer } from './hot-summer-days.layer';
import { IcingDaysLayer } from './icing-days.layer';
import { WindDrivenRainLayer, WindDrivenRainLayerConfig } from './wind-driven-rain.layer';

@Injectable({ providedIn: 'root' })
export class LayerFactoryService {
    readonly #climateDataService = inject(ClimateDataService);
    readonly #epcDataService = inject(EPCDataService);
    readonly #scriptLoader = inject(ScriptLoaderService);

    private readonly layers = new Map<string, BaseLayer>();
    private readonly activeWindDrivenRainLayers = new Set<string>();
    private readonly epcLayer: EPCLayer;

    constructor() {
        AbstractBaseLayer.setLayerFactory(this);
        this.epcLayer = new EPCLayer(this.#epcDataService);
        this.initializeLayers();
    }

    private initializeLayers(): void {
        this.initializeDemoLayers();
        this.initializeClimateLayers();
        this.initializeEPCLayers();
    }

    private initializeDemoLayers(): void {
        const demoLayerConfigs = [
            { id: 'epc-regions-layer', color: '#4CAF50', outlineColor: '#2E7D32' },
            { id: 'epc-counties-layer', color: '#8BC34A', outlineColor: '#558B2F' },
            { id: 'epc-districts-layer', color: '#CDDC39', outlineColor: '#9E9D24' },
        ];

        demoLayerConfigs.forEach(({ id, color, outlineColor }) => {
            const layer = new DemoLayer({ id, color, outlineColor });
            this.layers.set(id, layer);
        });
    }

    private initializeClimateLayers(): void {
        const twoDegreeConfig = { type: 'twoDegree', warmingScenario: '2°C warming' } as WindDrivenRainLayerConfig;
        const twoDegreeRainLayer = new WindDrivenRainLayer(twoDegreeConfig, this.#climateDataService, this.#scriptLoader);
        this.layers.set('wind-driven-rain-twoDegree-layer', twoDegreeRainLayer);

        const fourDegreeConfig = { type: 'fourDegree', warmingScenario: '4°C warming' } as WindDrivenRainLayerConfig;
        const fourDegreeRainLayer = new WindDrivenRainLayer(fourDegreeConfig, this.#climateDataService, this.#scriptLoader);
        this.layers.set('wind-driven-rain-fourDegree-layer', fourDegreeRainLayer);

        const hotSummerDaysLayer = new HotSummerDaysLayer(this.#climateDataService);
        this.layers.set('hot-summer-days-layer', hotSummerDaysLayer);

        const icingDaysLayer = new IcingDaysLayer(this.#climateDataService);
        this.layers.set('icing-days-layer', icingDaysLayer);
    }

    private initializeEPCLayers(): void {
        const epcTypes = ['region', 'county', 'district', 'ward'] as const;

        epcTypes.forEach((type) => {
            const layerId = `epc-${type}-layer`;
            const proxyLayer = new Proxy(this.epcLayer, {
                get(target, prop): any {
                    if (prop === 'id') {
                        return layerId;
                    }
                    if (prop === 'setEPCType') {
                        return (epcType: string): void => target.setEPCType(epcType as any);
                    }
                    return target[prop as keyof typeof target];
                },
            });

            proxyLayer.setEPCType(type);
            this.layers.set(layerId, proxyLayer);
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

    public activateWindDrivenRainLayer(layerId: string): void {
        this.activeWindDrivenRainLayers.add(layerId);
    }

    public deactivateWindDrivenRainLayer(layerId: string): void {
        this.activeWindDrivenRainLayers.delete(layerId);

        if (this.activeWindDrivenRainLayers.size === 0) {
            this.#scriptLoader.unload('popup-wind-driven-rain');
        }
    }

    public isWindDrivenRainLayerActive(layerId: string): boolean {
        return this.activeWindDrivenRainLayers.has(layerId);
    }
}
