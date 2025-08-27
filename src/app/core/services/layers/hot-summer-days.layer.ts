import { LAYER_COLORS } from '@core/config/layer-colors.config';
import { ClimateDataService, HotSummerDaysProperties } from '@core/services/climate-data.service';
import { FeatureCollection, Geometry } from 'geojson';
import * as mapboxgl from 'mapbox-gl';
import { LayerSpecification, MapMouseEvent } from 'mapbox-gl';
import { firstValueFrom } from 'rxjs';
import { AbstractClimateLayer } from './climate-layer.abstract';

export class HotSummerDaysLayer extends AbstractClimateLayer<HotSummerDaysProperties> {
    constructor(
        private readonly climateDataService: ClimateDataService,
    ) {
        super();
    }

    public get id(): string {
        return 'hot-summer-days-layer';
    }

    public getLayerConfig(): LayerSpecification {
        if (this.maxValues) {
            const { min, max } = this.maxValues;
            return this.createLayerConfig(min, max, LAYER_COLORS.hotSummerDays);
        }
        return this.createLayerConfig(0, 10, LAYER_COLORS.hotSummerDays);
    }

    public async getSourceData(): Promise<FeatureCollection<Geometry, HotSummerDaysProperties>> {
        try {
            if (!this.data) {
                const result = await firstValueFrom(this.climateDataService.getHotSummerDaysData());
                if (result) {
                    this.data = result;
                } else {
                    return this.createEmptyFeatureCollection();
                }
            }
            return this.createFeatureCollectionFromData('hsd_30_median');
        } catch (error) {
            console.error(`[HotSummerDaysLayer] Error in getSourceData:`, error);
            return this.createEmptyFeatureCollection();
        }
    }

    public override onLayerClick = (event: MapMouseEvent): void => {
        event.preventDefault();

        const feature = event.features?.[0];
        if (feature) {
            const properties = feature.properties as HotSummerDaysProperties;

            const popupContent = `
                <div class="climate-data-popup">
                    <div class="popup-header">
                        <h3>Hot summer days (30&deg;C+)</h3>

                        <div class="info-tooltip-container">
                            <div id="popout-info" class="info-tooltip" style="display: none;">
                                <div class="info-tooltip-header">Hot summer day projections</div>
                                <p>Shows the annual count of hot summer days for the 2001-2020 baseline and different global warming projections.</p>
                                <p>A hot summer day is a day where the maximum temperature exceeds 30&deg;C.</p>
                                <button class="close-button" onclick="hidePopoutInfo()">Close</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="data-table">
                        <dl>
                            <dt class="info-link" onclick="togglePopoutInfo()">Projections</dt>
                            <dd>Annual count (days)</dd>
                            
                            <dt>2001-2020</dt>
                            <dd>${properties.hsd_baseline_01_20_median?.toFixed(1) || 'N/A'}</dd>
                            
                            <dt>≥ 15°C</dt>
                            <dd>${properties.hsd_15_median?.toFixed(1) || 'N/A'}</dd>
                            
                            <dt>≥ 20°C</dt>
                            <dd>${properties.hsd_20_median?.toFixed(1) || 'N/A'}</dd>
                            
                            <dt>≥ 25°C</dt>
                            <dd>${properties.hsd_25_median?.toFixed(1) || 'N/A'}</dd>
                            
                            <dt>≥ 30°C</dt>
                            <dd>${properties.hsd_30_median?.toFixed(1) || 'N/A'}</dd>
                            
                            <dt>≥ 40°C</dt>
                            <dd>${properties.hsd_40_median?.toFixed(1) || 'N/A'}</dd>
                        </dl>
                    </div>
                </div>
            `;

            new mapboxgl.Popup().setLngLat(event.lngLat).setHTML(popupContent).addTo(this.mapService.mapInstance);
        }
    };
}
