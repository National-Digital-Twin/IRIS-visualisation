import { LAYER_COLORS } from '@core/config/layer-colors.config';
import { ClimateDataService, IcingDaysLayerProperties } from '@core/services/climate-data.service';
import { FeatureCollection, Geometry } from 'geojson';
import * as mapboxgl from 'mapbox-gl';
import { LayerSpecification, MapMouseEvent } from 'mapbox-gl';
import { firstValueFrom } from 'rxjs';
import { AbstractClimateLayer } from './climate-layer.abstract';

export class IcingDaysLayer extends AbstractClimateLayer<IcingDaysLayerProperties> {
    constructor(private readonly climateDataService: ClimateDataService) {
        super();
    }

    public get id(): string {
        return 'icing-days-layer';
    }

    public getLayerConfig(): LayerSpecification {
        if (this.maxValues) {
            // we override the maximum for icing days as there are
            // some extreme outliers which cause the map to appear mono-coloured
            this.maxValues.max = 10;
            const { min, max } = this.maxValues;
            return this.createLayerConfig(min, max, LAYER_COLORS.icingDays);
        }
        return this.createLayerConfig(0, 5, LAYER_COLORS.icingDays);
    }

    public async getSourceData(): Promise<FeatureCollection<Geometry, IcingDaysLayerProperties>> {
        try {
            if (!this.data) {
                const result = await firstValueFrom(this.climateDataService.getIcingDaysLayerData());
                if (result) {
                    this.data = result;
                } else {
                    return this.createEmptyFeatureCollection();
                }
            }
            return this.createFeatureCollectionFromData('icingdays');
        } catch (error) {
            console.error(`[IcingDaysLayer] Error in getSourceData:`, error);
            return this.createEmptyFeatureCollection();
        }
    }

    public override onLayerClick = (event: MapMouseEvent): void => {
        event.preventDefault();

        const feature = event.features?.[0];
        if (feature) {
            const properties = feature.properties as IcingDaysLayerProperties;

            const popupContent = `
                <div class="climate-data-popup">
                    <div class="popup-header">
                        <h3>Annual count of icing days</h3>

                        <div class="info-tooltip-container">
                            <button class="info-button" onclick="togglePopoutInfo()">
                                <span class="info-icon">i</span>
                            </button>

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

            const popup = new mapboxgl.Popup().setLngLat(event.lngLat).setHTML(popupContent);
            popup.on('close', () => {
                this.clearHighlighting(event.target);
            });

            this.mapService.registerPopup(popup);

            this.highlightPolygon(event.target, properties.objectid, 'objectid');
        }
    };
}
