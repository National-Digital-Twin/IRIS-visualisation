import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { LayerSpecification } from 'mapbox-gl';

export class LayerUtils {
    public static createDefaultPolygonData(properties: GeoJsonProperties = {}): FeatureCollection<Geometry, GeoJsonProperties> {
        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [-0.1, 51.5],
                                [0.1, 51.5],
                                [0.1, 51.7],
                                [-0.1, 51.7],
                                [-0.1, 51.5],
                            ],
                        ],
                    },
                    properties,
                },
            ],
        };
    }

    public static createFillLayerConfig(id: string, color: string, outlineColor: string, opacity: number = 0.6): LayerSpecification {
        return {
            id,
            type: 'fill' as const,
            source: id,
            paint: {
                'fill-color': color,
                'fill-opacity': opacity,
                'fill-outline-color': outlineColor,
            },
        };
    }
}
