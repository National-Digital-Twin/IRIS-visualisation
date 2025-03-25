import { ExpressionSpecification } from 'mapbox-gl';

export interface MapLayerFilter {
    layerId: string;
    expression: ExpressionSpecification;
}
