import { LAYER_COLORS } from '@core/config/layer-colors.config';
import { ClimateDataService, IcingDaysProperties } from '@core/services/climate-data.service';
import { FeatureCollection, Geometry } from 'geojson';
import * as mapboxgl from 'mapbox-gl';
import { LayerSpecification, MapMouseEvent } from 'mapbox-gl';
import { firstValueFrom } from 'rxjs';
import { ScriptLoaderService } from '../script-loader.service';
import { AbstractBaseLayer } from './base-layer.abstract';

export class IcingDaysLayer extends AbstractBaseLayer {
    private data?: FeatureCollection<Geometry, IcingDaysProperties>;
    private maxValues?: { min: number; max: number };

    constructor(
        private readonly climateDataService: ClimateDataService,
        private readonly scriptLoader: ScriptLoaderService,
    ) {
        super();
    }

    public get id(): string {
        return 'icing-days-layer';
    }

    public getLayerConfig(): LayerSpecification {
        if (this.maxValues) {
            const { min, max } = this.maxValues;
            return this.createLayerConfig(min, max);
        }
        return this.createLayerConfig(0, 5);
    }

    private createLayerConfig(min: number, max: number): LayerSpecification {
        const colors = LAYER_COLORS.icingDays;
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

    public async getSourceData(): Promise<FeatureCollection<Geometry, IcingDaysProperties>> {
        try {
            if (!this.data) {
                const result = await firstValueFrom(this.climateDataService.getIcingDaysData());
                if (result) {
                    this.data = result;
                } else {
                    return this.createEmptyFeatureCollection();
                }
            }

            const transformedFeatures = this.data.features.map((feature) => {
                const dataValue = feature.properties?.icingdays;

                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        value: dataValue || 0,
                    },
                };
            });

            this.calculateMaxValues();

            return {
                type: 'FeatureCollection',
                features: transformedFeatures,
            };
        } catch (error) {
            console.error(`[IcingDaysLayer] Error in getSourceData:`, error);
            return this.createEmptyFeatureCollection();
        }
    }

    private calculateMaxValues(): void {
        if (!this.data) return;

        let minValue = Infinity;
        let maxValue = -Infinity;

        this.data.features.forEach((feature) => {
            const value = feature.properties?.icingdays || 0;
            if (value < minValue) minValue = value;
            if (value > maxValue) maxValue = value;
        });

        this.maxValues = { min: minValue, max: maxValue };
    }

    protected override async addLayerToMap(): Promise<void> {
        await this.scriptLoader.load('popup-common', 'assets/js/popup-common.js');
        await super.addLayerToMap();
    }

    public override onLayerClick = (event: MapMouseEvent): void => {
        event.preventDefault();

        const feature = event.features?.[0];
        if (feature) {
            const properties = feature.properties as IcingDaysProperties;

            const popupContent = `
                <div class="climate-data-popup">
                    <div class="popup-header">
                        <h3>Annual count of <span class="info-link" onclick="togglePopoutInfo()">icing days</span></h3>

                        <div class="info-tooltip-container">
                            <div id="popout-info" class="info-tooltip" style="display: none;">
                                <div class="info-tooltip-header">Icing days</div>
                                <p>An icing day is a day where the maximum temperature is below 0&deg;C.</p>
                                <p>Data captured 1991-2020.</p>
                                <button class="close-button" onclick="hidePopoutInfo()">Close</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="data-table">
                        <dl>
                            <dt>Icing days</dt>
                            <dd>${properties.icingdays?.toFixed(2) || 'N/A'} days</dd>
                        </dl>
                    </div>
                </div>
            `;

            new mapboxgl.Popup().setLngLat(event.lngLat).setHTML(popupContent).addTo(this.mapService.mapInstance);
        }
    };

    private createEmptyFeatureCollection(): FeatureCollection<Geometry, IcingDaysProperties> {
        return {
            type: 'FeatureCollection',
            features: [],
        };
    }
}
