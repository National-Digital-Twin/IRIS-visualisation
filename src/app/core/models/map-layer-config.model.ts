import { LayerSpecification, LayoutSpecification, PaintSpecification } from 'mapbox-gl';
export interface MapLayerConfig {
    displayName: string;
    filename: string;
    id: string;
    labelProperty: string;
    type: LayerSpecification['type'];
    layout: LayoutSpecification;
    paint?: PaintSpecification;
    paintExpression?: PaintSpecification;
}
