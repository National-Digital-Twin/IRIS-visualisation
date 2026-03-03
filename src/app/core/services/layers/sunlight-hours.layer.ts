import { LAYER_COLORS } from '@core/config/layer-colors.config';
import { FeatureCollection, Geometry } from 'geojson';
import * as mapboxgl from 'mapbox-gl';
import { LayerSpecification, MapMouseEvent } from 'mapbox-gl';
import { firstValueFrom } from 'rxjs';
import { ClimateDataService, SunlightHoursProperties } from '../climate-data.service';
import { AbstractClimateLayer } from './climate-layer.abstract';

export class SunlightHoursLayer extends AbstractClimateLayer<SunlightHoursProperties> {
    constructor(private readonly climateDataService: ClimateDataService) {
        super();
    }

    public get id(): string {
        return 'sunlight-hours-layer';
    }

    public getLayerConfig(): LayerSpecification {
        if (this.maxValues) {
            const { min, max } = this.maxValues;
            return this.createLayerConfig(min, max, LAYER_COLORS.sunlightHours);
        }
        return this.createLayerConfig(0, 10, LAYER_COLORS.sunlightHours);
    }

    public async getSourceData(): Promise<FeatureCollection<Geometry, SunlightHoursProperties>> {
        try {
            if (!this.data) {
                const result = await firstValueFrom(this.climateDataService.getSunlightHoursLayerData());
                if (result) {
                    this.data = result;
                } else {
                    return this.createEmptyFeatureCollection();
                }
            }
            return this.createFeatureCollectionFromData('sunlight_hours');
        } catch (error) {
            console.error(`[SunlightHoursLayer] Error in getSourceData:`, error);
            return this.createEmptyFeatureCollection();
        }
    }

    public override onLayerClick = (event: MapMouseEvent): void => {
        event.preventDefault();

        const feature = event.features?.[0];
        if (feature) {
            const properties = feature.properties as SunlightHoursProperties;

            const popupContent = `
                    <div class="climate-data-popup">
                        <div class="popup-header">
                            <h3>Hours of sunlight</h3>
    
                            <div class="info-tooltip-container">
                                <button class="info-button" onclick="togglePopoutInfo()">
                                    <span class="info-icon">i</span>
                                </button>
    
                                <div id="popout-info" class="info-tooltip" style="display: none;">
                                    <div class="info-tooltip-header">Hours of sunlight</div>
                                    <p>
                                        Mean averages for annual and daily hours of sunlight are taken from the annual hours of sunlight data from 
                                        2019 to the end of 2024 (inclusive).</p>
                                    <p>
                                        Data comes from the Met Office. 
                                        <a href="https://catalogue.ceda.ac.uk/uuid/4dc8450d889a491ebb20e724debe2dfb/?q=&results_per_page=20&sort_by=title_desc&objects_related_to_uuid=4dc8450d889a491ebb20e724debe2dfb&permissions_option=any&geo_option=True&north_bound=&west_bound=&east_bound=&south_bound=&start_date=&end_date=&date_option=publication_date&start_date_pub=&end_date_pub=" target="_blank">Click here</a>
                                        to read more about the dataset collection.
                                    </p>
                                    <button class="close-button" onclick="hidePopoutInfo()">Close</button>
                                </div>
                            </div>
                        </div>
    
                        <div class="data-table">
                            <dl>
                                <dt>Average annual hours of sunlight</dt>
                                <dd>Average daily hours of sunlight</dd>

                                <dd>${properties.sunlight_hours.toFixed(1) || 'N/A'}</dd>
                                <dd>${(properties.sunlight_hours / 365.25).toFixed(1) || 'N/A'}</dd>
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

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
