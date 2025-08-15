import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { LayerSpecification, MapMouseEvent } from 'mapbox-gl';

export interface BaseLayer {
    readonly id: string;

    isVisible: boolean;

    show(): void;
    hide(): void;

    getLayerConfig(): LayerSpecification;
    getSourceData(): FeatureCollection<Geometry, GeoJsonProperties> | Promise<FeatureCollection<Geometry, GeoJsonProperties>>;

    onLayerClick?(event: MapMouseEvent): void;
}
