import { ClimateDataService, WindDrivenRainProperties } from '@core/services/climate-data.service';
import { FeatureCollection, Geometry } from 'geojson';
import * as mapboxgl from 'mapbox-gl';
import { LayerSpecification, MapMouseEvent } from 'mapbox-gl';
import { firstValueFrom } from 'rxjs';
import { AbstractBaseLayer } from './base-layer.abstract';

export interface WindDrivenRainLayerConfig {
    type: 'twoDegree0' | 'twoDegree90' | 'twoDegree180' | 'twoDegree270' | 'fourDegree0' | 'fourDegree90' | 'fourDegree180' | 'fourDegree270';
    warmingScenario: string;
    dataProperty: keyof WindDrivenRainProperties;
}

export class WindDrivenRainLayer extends AbstractBaseLayer {
    private readonly config: WindDrivenRainLayerConfig;
    private data?: FeatureCollection<Geometry, WindDrivenRainProperties>;

    constructor(
        config: WindDrivenRainLayerConfig,
        private readonly climateDataService: ClimateDataService,
    ) {
        super();
        this.config = config;
    }

    public get id(): string {
        return `wind-driven-rain-${this.config.type}-layer`;
    }

    public getLayerConfig(): LayerSpecification {
        return {
            id: this.id,
            type: 'fill',
            source: `${this.id}-source`,
            paint: {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'value'],
                    0,
                    '#ffffff',
                    50,
                    '#e1f5fe',
                    100,
                    '#b3e5fc',
                    200,
                    '#81d4fa',
                    300,
                    '#4fc3f7',
                    400,
                    '#29b6f6',
                    500,
                    '#0288d1',
                    600,
                    '#01579b',
                    700,
                    '#000000',
                ],
                'fill-opacity': 0.7,
                'fill-outline-color': '#0d47a1',
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
                const dataValue = feature.properties?.[this.config.dataProperty];

                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        value: dataValue || 0,
                    },
                };
            });

            return {
                type: 'FeatureCollection',
                features: transformedFeatures,
            };
        } catch (error) {
            console.error(`[WindDrivenRainLayer] Error in getSourceData:`, error);
            return this.createEmptyFeatureCollection();
        }
    }

    public override onLayerClick = (event: MapMouseEvent): void => {
        const feature = event.features?.[0];
        if (feature) {
            const properties = feature.properties as WindDrivenRainProperties;

            const isTwoDegree = this.config.type.startsWith('twoDegree');
            const dataPrefix = isTwoDegree ? 'wdr20_' : 'wdr40_';
            const scenarioLabel = isTwoDegree ? '2°C Warming' : '4°C Warming';

            const popupContent = `
                <div style="width: 400px;">
                    <h3>Wind-Driven Rain Data</h3>
                    <h4>${scenarioLabel} (mm)</h4>
                    <p><strong>North (0°):</strong> ${properties[`${dataPrefix}0`]?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Northeast (45°):</strong> ${properties[`${dataPrefix}45`]?.toFixed(2) || 'N/A'}</p>
                    <p><strong>East (90°):</strong> ${properties[`${dataPrefix}90`]?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Southeast (135°):</strong> ${properties[`${dataPrefix}135`]?.toFixed(2) || 'N/A'}</p>
                    <p><strong>South (180°):</strong> ${properties[`${dataPrefix}180`]?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Southwest (225°):</strong> ${properties[`${dataPrefix}225`]?.toFixed(2) || 'N/A'}</p>
                    <p><strong>West (270°):</strong> ${properties[`${dataPrefix}270`]?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Northwest (315°):</strong> ${properties[`${dataPrefix}315`]?.toFixed(2) || 'N/A'}</p>
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
