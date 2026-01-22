import { InjectionToken, WritableSignal } from '@angular/core';
import { URLStateModel } from '@core/models/url-state.model';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import mapboxgl from 'mapbox-gl';
import { Observable } from 'rxjs';

export const MAP_SERVICE = new InjectionToken<MapService<mapboxgl.Map>>('MAP_SERVICE');

export type MapBounds = {
    getSouth: () => number;
    getNorth: () => number;
    getWest: () => number;
    getEast: () => number;
};

export type MapDraw = {
    getMode: () => string;
    changeMode: (mode: string) => void;
    deleteAll: () => void;
    add: (geojson: Feature | FeatureCollection | Geometry) => string[];
    set: (featureCollection: FeatureCollection) => string[];
    getAll: () => FeatureCollection;
};

export type MapLatLng = {
    lng: number;
    lat: number;
};

export interface MapService<T> {
    mapInstance: T;
    drawControl?: MapDraw;
    mapLoaded$: Observable<boolean>;
    currentMapBounds: WritableSignal<MapBounds | undefined>;

    setup: (config: URLStateModel) => void;

    startDrawing: () => void;
    stopDrawing: () => void;
    isDrawing: () => boolean;

    addMapSource(name: string, source: unknown): T;

    addMapLayer(layerConfig: unknown): T;

    removeMapLayerAndSource(layerId: string): T | void;

    filterMapLayer(filter: unknown): T;

    setMapLayerPaint(layerId: string, paintProperty: string, value: unknown): T | void;

    queryFeatures(): Feature[];

    setStyle(style: string): T;

    addLayers(): Observable<T[]>;

    zoomToCoords(center: MapLatLng, zoom?: number): T;

    destroyMap(): void;

    getViewportBoundingBox(): { minLat: number; maxLat: number; minLng: number; maxLng: number } | null;

    addDrawControl(): MapDraw;

    registerPopup(popup: mapboxgl.Popup): void;

    removePopup(popup: mapboxgl.Popup): void;

    clearAllPopups(): void;
}
