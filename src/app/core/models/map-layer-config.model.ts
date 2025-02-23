import { AnyLayer, AnyLayout, AnyPaint } from 'mapbox-gl';
export interface MapLayerConfig {
    displayName: string;
    filename: string; // name of geojson file
    id: string;
    labelProperty: string; // feature label property
    type: AnyLayer['type']; // mapbox gl layer type
    layout: AnyLayout;
    paint?: AnyPaint;
    paintExpression?: AnyPaint;
}
