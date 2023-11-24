import { Expression } from 'mapbox-gl';

export interface MapLayerFilter {
  layerId: string;
  expression: Expression;
}
