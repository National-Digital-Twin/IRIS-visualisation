import { InjectionToken, WritableSignal } from '@angular/core';
import { URLStateModel } from '@core/models/url-state.model';
import { Feature } from 'geojson';
import { Observable } from 'rxjs';

export const MAP_SERVICE = new InjectionToken<MapService<any>>('MAP_SERVICE');

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

    addMapSource(name: string, source: unknown): T;

    addMapLayer(layerConfig: unknown): T;

    filterMapLayer(filter: unknown): T;

    setMapLayerPaint(layerId: string, paintProperty: string, value: unknown): T | void;

    queryFeatures(): Feature[];

    setStyle(style: string): T;

    addLayers(): Observable<T[]>;

    zoomToCoords(center: MapLatLng, zoom?: number): T;

    destroyMap(): void;

    getViewportBoundingBox(): { minLat: number; maxLat: number; minLng: number; maxLng: number } | null;

    addDrawControl(): MapDraw;
}
