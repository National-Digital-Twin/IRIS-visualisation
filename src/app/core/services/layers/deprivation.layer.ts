import { LAYER_COLORS } from '@core/config/layer-colors.config';
import { DemographicsDataService, DeprivationLayerProperties } from '@core/services/demographics-data.service';
import { FeatureCollection, Geometry } from 'geojson';
import * as mapboxgl from 'mapbox-gl';
import { LayerSpecification, MapMouseEvent } from 'mapbox-gl';
import { firstValueFrom } from 'rxjs';
import { AbstractClimateLayer } from './climate-layer.abstract';

export class DeprivationLayer extends AbstractClimateLayer<DeprivationLayerProperties> {
    private currentPopup?: mapboxgl.Popup;

    constructor(private readonly demographicsDataService: DemographicsDataService) {
        super();
    }

    public get id(): string {
        return 'deprivation-layer';
    }

    public getLayerConfig(): LayerSpecification {
        if (this.maxValues) {
            const { min, max } = this.maxValues;
            return this.createLayerConfig(min, max, LAYER_COLORS.deprivation);
        }

        return this.createLayerConfig(0, 100, LAYER_COLORS.deprivation);
    }

    public async getSourceData(): Promise<FeatureCollection<Geometry, DeprivationLayerProperties>> {
        try {
            if (!this.data) {
                const result = await firstValueFrom(this.demographicsDataService.getDeprivationLayerData());
                if (result) {
                    this.data = result;
                } else {
                    return this.createEmptyFeatureCollection();
                }
            }

            return this.createFeatureCollectionFromData('dep_pct_4');
        } catch (error) {
            console.error(`[DeprivationLayer] Error in getSourceData:`, error);
            return this.createEmptyFeatureCollection();
        }
    }

    public override onLayerClick = (event: MapMouseEvent): void => {
        event.preventDefault();

        const feature = event.features?.[0];
        if (!feature) {
            return;
        }

        const properties = feature.properties as DeprivationLayerProperties;
        const areaName = properties.area_nm?.trim() || 'this area';
        const dep4HouseholdCount = this.formatHouseholdCount(properties.dep_4);
        const dep4Percentage = this.getAreaPercentage(properties, 'dep_pct_4');
        const dep3HouseholdCount = this.formatHouseholdCount(properties.dep_3);
        const dep3Percentage = this.getAreaPercentage(properties, 'dep_pct_3');
        const dep4Range = this.getPercentageRangeForField('dep_pct_4');
        const dep3Range = this.getPercentageRangeForField('dep_pct_3');

        if (this.currentPopup) {
            this.mapService.removePopup(this.currentPopup);
        }

        const popupContent = `
            <div class="popup deprivation-popup">
                <div class="popup-header">
                    <div class="title-row">
                        <h3><strong>${areaName}</strong></h3>
                        <div class="info-tooltip-container">
                            <button class="info-button" onclick="togglePopoutInfo()" aria-label="Show household deprivation information">
                                <span class="info-icon">i</span>
                            </button>
                            <div id="popout-info" class="info-tooltip" style="display: none;">
                                <div class="info-tooltip-header"><strong>Household deprivation</strong></div>
                                <p>The dimensions of deprivation used to classify households are indicators based on four selected household characteristics.</p>
                                <ul>
                                    <li>Education</li>
                                    <li>Employment</li>
                                    <li>Health</li>
                                    <li>Housing</li>
                                </ul>
                                <p>Households that are deprived in all four dimensions are classed as 'highly deprived' in this analysis.</p>
                                <p>
                                    Data comes from the 2021 Census.
                                    <a href="https://www.ons.gov.uk/datasets/TS011/editions/2021/versions/6" target="_blank" rel="noopener noreferrer">Click here</a>
                                    to read more about household deprivation data.
                                </p>
                                <button class="close-button" onclick="hidePopoutInfo()">Close</button>
                            </div>
                        </div>
                    </div>
                    <p class="deprivation-summary primary">
                        <span class="summary-emphasis">${dep4HouseholdCount} households (${this.formatPercentage(dep4Percentage)}) are highly deprived</span>
                        <small class="summary-context">(deprived in four dimensions)</small>
                    </p>
                    ${this.createHistogram(dep4Range.minPercentage, dep4Range.maxPercentage, dep4Percentage)}
                    <p class="deprivation-summary">
                        <span>${dep3HouseholdCount} households (${this.formatPercentage(dep3Percentage)}) are deprived in three dimensions</span>
                    </p>
                    ${this.createHistogram(dep3Range.minPercentage, dep3Range.maxPercentage, dep3Percentage)}
                </div>
            </div>
        `;

        this.currentPopup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: '400px',
        })
            .setLngLat(event.lngLat)
            .setHTML(popupContent);

        this.currentPopup.on('close', () => {
            this.currentPopup = undefined;
            this.clearFeatureHighlight(event.target);
        });

        this.mapService.registerPopup(this.currentPopup);

        this.highlightFeature(event.target, feature.id);
    };

    private createHistogram(minPercentage: number, maxPercentage: number, areaPercentage: number): string {
        const gradientColors = ['#CDE594', '#80C6A3', '#1F9EB7', '#186290', '#080C54'];
        const scaleHtml = gradientColors.map((color) => `<span class="scale-segment" style="background-color: ${color};"></span>`).join('');
        const markerPosition = this.getMarkerPosition(minPercentage, maxPercentage, areaPercentage);
        const stageStops = [0, 0.2, 0.4, 0.6, 0.8, 1];
        const labelsHtml = stageStops
            .map((stop) => {
                const value = minPercentage + (maxPercentage - minPercentage) * stop;
                return `<span class="stage-label" style="left: ${stop * 100}%;">${this.formatPercentage(value)}</span>`;
            })
            .join('');

        return `
            <div class="histogram deprivation-histogram">
                <div class="scale-wrapper">
                    <div class="scale">${scaleHtml}</div>
                    <div class="scale-marker" style="left: ${markerPosition}%;" aria-hidden="true"></div>
                </div>
                <div class="stage-labels">
                    ${labelsHtml}
                </div>
            </div>
        `;
    }

    private highlightFeature(map: mapboxgl.Map, featureId: string | number | undefined): void {
        if (featureId === undefined || featureId === null) {
            return;
        }

        map.setPaintProperty(this.id, 'fill-opacity', ['case', ['==', ['id'], featureId], 0.9, 0.6]);

        const outlineLayerId = `${this.id}-outline`;

        if (map.getLayer(outlineLayerId)) {
            map.removeLayer(outlineLayerId);
        }

        map.addLayer({
            id: outlineLayerId,
            type: 'line',
            source: `${this.id}-source`,
            paint: {
                'line-color': '#6666aa',
                'line-width': 3,
                'line-opacity': 0.75,
            },
            filter: ['==', ['id'], featureId],
        });
    }

    private clearFeatureHighlight(map: mapboxgl.Map): void {
        map.setPaintProperty(this.id, 'fill-opacity', LAYER_COLORS.deprivation.opacity);

        const outlineLayerId = `${this.id}-outline`;
        if (map.getLayer(outlineLayerId)) {
            map.removeLayer(outlineLayerId);
        }
    }

    private formatPercentage(value: number | undefined): string {
        if (typeof value !== 'number' || Number.isNaN(value)) {
            return '0%';
        }

        return `${value.toFixed(1)}%`;
    }

    private formatHouseholdCount(value: number | undefined): string {
        if (typeof value !== 'number' || Number.isNaN(value)) {
            return '0';
        }

        return value.toLocaleString('en-GB');
    }

    private getAreaPercentage(properties: DeprivationLayerProperties, key: 'dep_pct_3' | 'dep_pct_4'): number {
        if (typeof properties[key] === 'number' && !Number.isNaN(properties[key])) {
            return properties[key];
        }

        return 0;
    }

    private getPercentageRangeForField(key: 'dep_pct_3' | 'dep_pct_4'): { minPercentage: number; maxPercentage: number } {
        const features = this.data?.features;
        if (!features?.length) {
            return { minPercentage: 0, maxPercentage: 100 };
        }

        const values: number[] = [];
        for (const feature of features) {
            const properties = feature.properties as DeprivationLayerProperties;
            const value = this.getAreaPercentage(properties, key);
            if (!Number.isNaN(value)) {
                values.push(value);
            }
        }

        if (!values.length) {
            return { minPercentage: 0, maxPercentage: 100 };
        }

        return {
            minPercentage: Math.min(...values),
            maxPercentage: Math.max(...values),
        };
    }

    private getMarkerPosition(minPercentage: number, maxPercentage: number, areaPercentage: number): number {
        if (maxPercentage <= minPercentage) {
            return 0;
        }

        const position = ((areaPercentage - minPercentage) / (maxPercentage - minPercentage)) * 100;
        return Math.max(0, Math.min(100, position));
    }
}

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
