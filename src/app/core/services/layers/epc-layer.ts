import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { LayerSpecification } from 'mapbox-gl';
import { AbstractBaseLayer } from './base-layer.abstract';
import { LayerUtils } from './layer-utils';

export interface EPCLayerConfig {
    type: 'regions' | 'counties' | 'districts' | 'wards';
    color: string;
    outlineColor: string;
}

export class EPCLayer extends AbstractBaseLayer {
    private readonly config: EPCLayerConfig;

    constructor(config: EPCLayerConfig) {
        super();
        this.config = config;
    }

    public get id(): string {
        return `epc-${this.config.type}-layer`;
    }

    public getLayerConfig(): LayerSpecification {
        return LayerUtils.createFillLayerConfig(this.id, this.config.color, this.config.outlineColor);
    }

    public async getSourceData(): Promise<FeatureCollection<Geometry, GeoJsonProperties>> {
        return LayerUtils.createDefaultPolygonData({
            type: this.config.type,
        });
    }
}
