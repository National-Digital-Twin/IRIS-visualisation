import { NumberPipe } from '@core/pipes/number.pipe';
import { FeatureCollection, Geometry } from 'geojson';
import * as mapboxgl from 'mapbox-gl';
import { FillLayerSpecification, LayerSpecification, MapMouseEvent } from 'mapbox-gl';
import { firstValueFrom } from 'rxjs';
import { EPCDataService, EPCType, EPCWardsProperties } from '../epc-data.service';
import { AbstractBaseLayer } from './base-layer.abstract';

export class EPCLayer extends AbstractBaseLayer {
    private epcType: EPCType = 'county';
    private data?: FeatureCollection<Geometry, EPCWardsProperties>;
    private currentPopup?: mapboxgl.Popup;

    constructor(private readonly epcDataService: EPCDataService) {
        super();
    }

    public setEPCType(type: EPCType): void {
        this.epcType = type;
        this.data = undefined;
    }

    public get id(): string {
        return `epc-${this.epcType}-layer`;
    }

    public getLayerConfig(): LayerSpecification {
        const EPCRatings = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'none'];
        const defaultColor = this.runtimeConfig.epcColours['default'];
        const colors: string[] = [];

        EPCRatings.forEach((rating: string) => {
            colors.push(rating);
            const color = this.runtimeConfig.epcColours[rating];
            colors.push(color);
        });
        colors.push(defaultColor);

        return {
            id: this.id,
            type: 'fill',
            source: this.id,
            paint: {
                'fill-color': ['match', ['get', 'aggEPC'], ...colors],
                'fill-opacity': 0.75,
            },
        } as FillLayerSpecification;
    }

    public async getSourceData(): Promise<FeatureCollection<Geometry, EPCWardsProperties>> {
        try {
            if (!this.data) {
                const result = await firstValueFrom(this.epcDataService.getEPCData(this.epcType));
                if (result) {
                    this.data = result;
                } else {
                    return this.createEmptyFeatureCollection();
                }
            }

            const transformedFeatures = this.data.features.map((feature) => {
                const modalRating = this.calculateModalRating(feature.properties);
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        modal_rating: modalRating,
                        aggEPC: modalRating,
                    },
                };
            });

            return {
                type: 'FeatureCollection',
                features: transformedFeatures,
            };
        } catch (error) {
            console.error(`[EPCLayer] Error in getSourceData for ${this.epcType}:`, error);
            return this.createEmptyFeatureCollection();
        }
    }

    private getEPCColour(epcRating: string): string {
        return this.runtimeConfig.epcColours[epcRating || 'default'];
    }

    private calculateModalRating(properties: EPCWardsProperties): string {
        const ratings = [
            { rating: 'A', count: properties.epc_a },
            { rating: 'B', count: properties.epc_b },
            { rating: 'C', count: properties.epc_c },
            { rating: 'D', count: properties.epc_d },
            { rating: 'E', count: properties.epc_e },
            { rating: 'F', count: properties.epc_f },
            { rating: 'G', count: properties.epc_g },
        ];

        ratings.sort((a, b) => b.count - a.count);

        return ratings[0].count > 0 ? ratings[0].rating : 'none';
    }

    public override onLayerClick = (event: MapMouseEvent): void => {
        event.preventDefault();

        const feature = event.features?.[0];
        if (feature) {
            const properties = feature.properties as EPCWardsProperties;

            if (this.currentPopup) {
                this.mapService.removePopup(this.currentPopup);
            }

            this.currentPopup = new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: false,
                maxWidth: '400px',
            })
                .setLngLat(event.lngLat)
                .setHTML(this.createPopupContent(properties));

            this.currentPopup.on('close', () => {
                this.clearHighlighting(event.target);
            });

            this.mapService.registerPopup(this.currentPopup);

            this.highlightWard(event.target, properties.name);
        }
    };

    private createEmptyFeatureCollection(): FeatureCollection<Geometry, EPCWardsProperties> {
        return {
            type: 'FeatureCollection',
            features: [],
        };
    }

    private highlightWard(map: mapboxgl.Map, wardName: string): void {
        map.setPaintProperty(this.id, 'fill-opacity', ['case', ['==', ['get', 'name'], wardName], 0.9, 0.6]);

        const outlineLayerId = `${this.id}-outline`;

        if (map.getLayer(outlineLayerId)) {
            map.removeLayer(outlineLayerId);
        }

        map.addLayer({
            id: outlineLayerId,
            type: 'line',
            source: this.id,
            paint: {
                'line-color': '#6666aa',
                'line-width': 3,
                'line-opacity': 0.75,
            },
            filter: ['==', ['get', 'name'], wardName],
        });
    }

    private clearHighlighting(map: mapboxgl.Map): void {
        map.setPaintProperty(this.id, 'fill-opacity', 0.75);

        const outlineLayerId = `${this.id}-outline`;
        if (map.getLayer(outlineLayerId)) {
            map.removeLayer(outlineLayerId);
        }
    }

    private createPopupContent(properties: EPCWardsProperties): string {
        const epcRatings = [
            { rating: 'A', count: properties.epc_a || 0 },
            { rating: 'B', count: properties.epc_b || 0 },
            { rating: 'C', count: properties.epc_c || 0 },
            { rating: 'D', count: properties.epc_d || 0 },
            { rating: 'E', count: properties.epc_e || 0 },
            { rating: 'F', count: properties.epc_f || 0 },
            { rating: 'G', count: properties.epc_g || 0 },
            { rating: 'none', count: properties.epc_null || 0 },
        ];

        const numberPropertiesWithEpc =
            properties.epc_a + properties.epc_b + properties.epc_c + properties.epc_d + properties.epc_e + properties.epc_f + properties.epc_g;
        const percentageCompleteness = (numberPropertiesWithEpc / (numberPropertiesWithEpc + properties.epc_null)) * 100;

        const histogram = this.createHistogram(epcRatings);

        return `
            <div class="popup">
                <h3>${properties.name} EPC ratings (${Math.ceil(percentageCompleteness)}% with EPCs)</h3>
                ${histogram}
                <p class="footnote">*Excluded from ${this.epcType} visualisation.</p>
            </div>
        `;
    }

    private createHistogram(epcRatings: Array<{ rating: string; count: number }>): string {
        const numberPipe = new NumberPipe();
        const maxValue = Math.max(...epcRatings.map((r) => r.count));
        const labels: string[] = [];
        const histogram = epcRatings.map((r) => {
            const height = (r.count / maxValue) * 100;
            const label = `<span>${r.rating === 'none' ? 'No EPC*' : r.rating}</span>`;
            labels.push(label);
            return `
                <div class="bar" style="height: calc(${height}% + 5px)">
                    <span class="rating">${numberPipe.transform(r.count, 1)}</span>
                    <div class="line" style="background: ${this.getEPCColour(r.rating)}"></div>
                </div>
            `;
        });

        return `
            <div class="histogram">
                <div class="chart">${histogram.join('')}</div>
                <div class="labels">${labels.join('')}</div>
            </div>
        `;
    }
}
