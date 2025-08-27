import { inject, Injectable } from '@angular/core';
import { LayerColors } from '@core/config/layer-colors.config';
import { FeatureCollection, Geometry } from 'geojson';
import { LayerSpecification } from 'mapbox-gl';
import { ScriptLoaderService } from '../script-loader.service';
import { AbstractBaseLayer } from './base-layer.abstract';

@Injectable()
export abstract class AbstractClimateLayer<ClimateProperties> extends AbstractBaseLayer {
    protected data?: FeatureCollection<Geometry, ClimateProperties>;
    protected maxValues?: { min: number; max: number };
    protected scriptLoader = inject(ScriptLoaderService);

    protected createFeatureCollectionFromData(valueKey: string): FeatureCollection<Geometry, ClimateProperties> {
        if (this.data) {
            const transformedFeatures = this.data.features.map((feature) => {
                const dataValue = (feature.properties as Record<string, number> | undefined)?.[valueKey];

                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        value: dataValue || 0,
                    },
                };
            });

            this.calculateMaxValues(valueKey);

            return {
                type: 'FeatureCollection',
                features: transformedFeatures,
            };
        } else {
            return this.createEmptyFeatureCollection();
        }
    }

    protected calculateMaxValues(valueKey: string): void {
        if (!this.data) return;

        let minValue = Infinity;
        let maxValue = -Infinity;

        this.data.features.forEach((feature) => {
            const value = (feature.properties as Record<string, number> | undefined)?.[valueKey] ?? 0;
            if (value < minValue) minValue = value;
            if (value > maxValue) maxValue = value;
        });

        this.maxValues = { min: minValue, max: maxValue };
    }

    protected createEmptyFeatureCollection(): FeatureCollection<Geometry, ClimateProperties> {
        return {
            type: 'FeatureCollection',
            features: [],
        };
    }

    protected createLayerConfig(min: number, max: number, colors: LayerColors): LayerSpecification {
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

    protected override async addLayerToMap(): Promise<void> {
        await this.scriptLoader.load('popup-common', 'assets/js/popup-common.js');
        await super.addLayerToMap();
    }
}
