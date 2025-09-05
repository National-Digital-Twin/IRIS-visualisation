import { LAYER_COLORS } from '@core/config/layer-colors.config';
import { FeatureCollection, Geometry } from 'geojson';
import * as mapboxgl from 'mapbox-gl';
import { LayerSpecification, MapMouseEvent } from 'mapbox-gl';
import { firstValueFrom } from 'rxjs';
import { ClimateDataService, WindDrivenRainProperties } from '../climate-data.service';
import { ScriptLoaderService } from '../script-loader.service';
import { AbstractBaseLayer } from './base-layer.abstract';

export interface WindDrivenRainLayerConfig {
    type: 'twoDegree' | 'fourDegree';
    warmingScenario: string;
}

export class WindDrivenRainLayer extends AbstractBaseLayer {
    private readonly config: WindDrivenRainLayerConfig;
    private data?: FeatureCollection<Geometry, WindDrivenRainProperties>;
    private maxValues?: { min: number; max: number };

    private static globalMaxValues?: { min: number; max: number };

    constructor(
        config: WindDrivenRainLayerConfig,
        private readonly climateDataService: ClimateDataService,
        private readonly scriptLoader: ScriptLoaderService,
    ) {
        super();
        this.config = config;
    }

    public get id(): string {
        return `wind-driven-rain-${this.config.type}-layer`;
    }

    public getLayerConfig(): LayerSpecification {
        if (WindDrivenRainLayer.globalMaxValues) {
            const { min, max } = WindDrivenRainLayer.globalMaxValues;
            return this.createLayerConfig(min, max);
        }

        if (this.maxValues) {
            const { min, max } = this.maxValues;
            return this.createLayerConfig(min, max);
        }

        return this.createLayerConfig(0, 1000);
    }

    private createLayerConfig(min: number, max: number): LayerSpecification {
        const colors = LAYER_COLORS.windDrivenRain;
        return {
            id: this.id,
            type: 'fill',
            source: `${this.id}-source`,
            paint: {
                'fill-color': ['interpolate', ['linear'], ['get', 'value'], min, colors.low, max, colors.high],
                'fill-opacity': colors.opacity,
                'fill-outline-color': colors.outline,
            },
        };
    }

    public async getSourceData(): Promise<FeatureCollection<Geometry, WindDrivenRainProperties>> {
        try {
            if (!this.data) {
                const result = await firstValueFrom(this.climateDataService.getWindDrivenRainData());
                if (result) {
                    this.data = result;
                } else {
                    return this.createEmptyFeatureCollection();
                }
            }

            const transformedFeatures = this.data.features.map((feature) => {
                const dataValue = this.getMaxValueForTemperatureScenario(feature.properties);
                return {
                    ...feature,
                    properties: { ...feature.properties, value: dataValue || 0 },
                };
            });

            this.calculateMaxValues();

            return {
                type: 'FeatureCollection',
                features: transformedFeatures,
            };
        } catch (error) {
            console.error(`[WindDrivenRainLayer] Error in getSourceData:`, error);
            return this.createEmptyFeatureCollection();
        }
    }

    private getMaxValueForTemperatureScenario(properties: WindDrivenRainProperties | null): number {
        if (!properties) return 0;

        const prefix = this.config.type === 'twoDegree' ? 'wdr20_' : 'wdr40_';
        const windDirections = ['0', '45', '90', '135', '180', '225', '270', '315'];

        let maxValue = 0;
        windDirections.forEach((direction) => {
            const propertyKey = `${prefix}${direction}` as keyof WindDrivenRainProperties;
            const value = properties[propertyKey];
            if (typeof value === 'number' && value > maxValue) {
                maxValue = value;
            }
        });

        return maxValue;
    }

    private calculateMaxValues(): void {
        if (!this.data) return;

        let minValue = Infinity;
        let maxValue = -Infinity;

        this.data.features.forEach((feature) => {
            const value = this.getMaxValueForTemperatureScenario(feature.properties);
            if (value < minValue) minValue = value;
            if (value > maxValue) maxValue = value;
        });

        this.maxValues = { min: minValue, max: maxValue };
        this.updateGlobalMaxValues(minValue, maxValue);
    }

    private updateGlobalMaxValues(localMin: number, localMax: number): void {
        if (!WindDrivenRainLayer.globalMaxValues) {
            WindDrivenRainLayer.globalMaxValues = { min: localMin, max: localMax };
        } else {
            WindDrivenRainLayer.globalMaxValues.min = Math.min(WindDrivenRainLayer.globalMaxValues.min, localMin);
            WindDrivenRainLayer.globalMaxValues.max = Math.max(WindDrivenRainLayer.globalMaxValues.max, localMax);
        }
    }

    protected override async addLayerToMap(): Promise<void> {
        await this.scriptLoader.load('popup-common', 'assets/js/popup-common.js');
        await this.scriptLoader.load('popup-wind-driven-rain', 'assets/js/popup-wind-driven-rain.js');
        await super.addLayerToMap();
    }

    public override onLayerClick = (event: MapMouseEvent): void => {
        event.preventDefault();

        const feature = event.features?.[0];
        if (feature) {
            const properties = feature.properties as WindDrivenRainProperties;
            const isTwoDegree = this.config.type === 'twoDegree';
            const dataPrefix = isTwoDegree ? 'wdr20_' : 'wdr40_';

            const popupContent = `
                <div class="climate-data-popup">
                    <div class="popup-header">
                        <h3>Wind driven rain</h3>

                        <div class="info-tooltip-container">
                            <button class="info-button" onclick="togglePopoutInfo()">
                                <span class="info-icon">i</span>
                            </button>
                        
                            <div id="popout-info" class="info-tooltip" style="display: none;">
                                <div class="info-tooltip-header">Wind-driven rain projections</div>
                                <p>Shows the projections of wind-driven rain for future global warming levels.</p>
                                <button class="close-button" onclick="hidePopoutInfo()">Close</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="scenario-toggle">
                        <button class="scenario-button ${!isTwoDegree ? 'checked' : ''}" onclick="toggleWindDrivenRainScenario(this, 'wdr40_', ${JSON.stringify(properties).replace(/"/g, '&quot;')})">
                            <div class="check"></div>
                            <span>4&deg;C warming</span>
                        </button>
                        <button class="scenario-button ${isTwoDegree ? 'checked' : ''}" onclick="toggleWindDrivenRainScenario(this, 'wdr20_', ${JSON.stringify(properties).replace(/"/g, '&quot;')})">
                            <div class="check"></div>
                            <span>2&deg;C warming</span>
                        </button>
                    </div>
                    
                    <div class="data-table">
                        <dl id="scenario-data">
                            <dt>Wall orientation</dt>
                            <dd>Wind-driven rain index (mm/year)</dd>

                            <dt>North</dt>
                            <dd>${properties[`${dataPrefix}0`].toFixed(3)}</dd>
                            <dt>North east</dt>
                            <dd>${properties[`${dataPrefix}45`].toFixed(3)}</dd>
                            <dt>East</dt>
                            <dd>${properties[`${dataPrefix}90`].toFixed(3)}</dd>
                            <dt>South east</dt>
                            <dd>${properties[`${dataPrefix}135`].toFixed(3)}</dd>
                            <dt>South</dt>
                            <dd>${properties[`${dataPrefix}180`].toFixed(3)}</dd>
                            <dt>South west</dt>
                            <dd>${properties[`${dataPrefix}225`].toFixed(3)}</dd>
                            <dt>West</dt>
                            <dd>${properties[`${dataPrefix}270`].toFixed(3)}</dd>
                            <dt>North west</dt>
                            <dd>${properties[`${dataPrefix}315`].toFixed(3)}</dd>
                        </dl>
                    </div>
                </div>
            `;

            new mapboxgl.Popup().setLngLat(event.lngLat).setHTML(popupContent).addTo(this.mapService.mapInstance);
        }
    };

    private createEmptyFeatureCollection(): FeatureCollection<Geometry, WindDrivenRainProperties> {
        return {
            type: 'FeatureCollection',
            features: [],
        };
    }
}
