import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { LayerSpecification } from 'mapbox-gl';
import { AbstractBaseLayer } from './base-layer.abstract';
import { LayerUtils } from './layer-utils';

export interface DemoLayerConfig {
    id: string;
    color: string;
    outlineColor: string;
}

export class DemoLayer extends AbstractBaseLayer {
    private readonly config: DemoLayerConfig;

    constructor(config: DemoLayerConfig) {
        super();
        this.config = config;
    }

    get id(): string {
        return this.config.id;
    }

    public getLayerConfig(): LayerSpecification {
        return LayerUtils.createFillLayerConfig(this.config.id, this.config.color, this.config.outlineColor);
    }

    public async getSourceData(): Promise<FeatureCollection<Geometry, GeoJsonProperties>> {
        return LayerUtils.createDefaultPolygonData();
    }
}
