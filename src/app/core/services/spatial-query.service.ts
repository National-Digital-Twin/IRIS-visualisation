import { Injectable, inject, signal } from '@angular/core';
import { BuildingMap, BuildingModel } from '@core/models/building.model';
import { MapLayerFilter } from '@core/models/layer-filter.model';
import { bbox } from '@turf/bbox';
import { booleanWithin } from '@turf/boolean-within';
import { point } from '@turf/helpers';
import { BBox, Polygon } from 'geojson';
import { LngLat, LngLatBounds, Point } from 'mapbox-gl';
import { MapService } from './map.service';

/**
 * Service for selecting and filtering buildings
 * on the map
 */
@Injectable({
    providedIn: 'root',
})
export class SpatialQueryService {
    readonly #mapService = inject(MapService);

    public selectedBuildingTOID = signal<string | undefined>(undefined);
    public spatialFilterBounds = signal<Point[] | undefined>(undefined);
    public spatialFilterEnabled = signal<boolean>(false);
    public spatialFilterGeom = signal<GeoJSON.Feature<Polygon> | undefined>(undefined);

    /** Set the TOID of an individual building */
    public setSelectedTOID(TOID: string): void {
        this.selectedBuildingTOID.set(TOID);
    }

    /** Filter map to show selected building */
    public selectBuilding(TOID: string, multiDwelling: boolean = false): void {
        const filter = <MapLayerFilter>{
            layerId: multiDwelling
                ? 'OS/TopographicArea_2/Building/1_3D-Multi-Dwelling-Selected'
                : 'OS/TopographicArea_2/Building/1_3D-Single-Dwelling-Selected',
            expression: ['all', ['==', '_symbol', 4], ['in', 'TOID', TOID]],
        };
        this.#mapService.filterMapLayer(filter);
    }

    public setSpatialFilter(enabled: boolean): void {
        this.spatialFilterEnabled.set(enabled);
    }

    public setSpatialFilterBounds(bounds?: Point[]): void {
        this.spatialFilterBounds.set(bounds);
    }

    /**
     * Filter map to show selection of multiple buildings
     * @param geom user drawn geometry
     */
    public setSpatialGeom(geom?: GeoJSON.Feature<Polygon>): void {
        this.spatialFilterGeom.set(geom);
        // get bounding box of drawn geometry as this
        // is the input required by mapbox to query
        // features
        if (geom) {
            const geomBBox = this.getBBox(geom);
            this.setSpatialFilter(true);
            this.setSpatialFilterBounds(geomBBox);
        }
    }

    /**
     * Query map source layer to get feature geometry
     * @param TOID TOID of required geometry
     * @returns bounding box of geometry
     */
    public getFeatureGeomBB(TOID: string): LngLatBounds {
        const feature = this.#mapService.mapInstance.querySourceFeatures('esri', {
            sourceLayer: 'TopographicArea_2',
            filter: ['all', ['==', '_symbol', 4], ['in', 'TOID', TOID]],
        });
        const geomBB = bbox(feature[0]);
        const latlngBounds = this.getLngLatBounds(geomBB);
        return latlngBounds;
    }

    /**
     * Get the bounding box pixel coordinates of a geometry
     * @param geom geometry to get bounding box of
     * @returns bounding box pixel coordinates of
     * user drawn area
     */
    private getBBox(geom: GeoJSON.Feature): Point[] {
        const bboxPolygon = bbox(geom);
        const latlngBounds = this.getLngLatBounds(bboxPolygon);
        const pixelCoords = this.latlngToPixels(latlngBounds);
        return pixelCoords;
    }

    private getLngLatBounds(bboxPolygon: BBox): LngLatBounds {
        const southWest = new LngLat(bboxPolygon[0], bboxPolygon[1]);
        const northEast = new LngLat(bboxPolygon[2], bboxPolygon[3]);
        const latlngBounds = new LngLatBounds(southWest, northEast);
        return latlngBounds;
    }

    /**
     *
     * @param latlngBounds bounding box in lat lng
     * @returns bounding box in pixel coordinates
     */
    public latlngToPixels(latlngBounds: LngLatBounds): Point[] {
        const sw = this.#mapService.mapInstance.project(latlngBounds._sw);
        const ne = this.#mapService.mapInstance.project(latlngBounds._ne);
        return [sw, ne];
    }

    /**
     * Find buildings within a polygon
     * @param buildings buildings to check if within polygon
     * @param polygon search area
     * @returns
     */
    public getAddressesInPolygon(buildings: BuildingMap, polygon: GeoJSON.Feature<Polygon>): BuildingModel[] {
        const addresses: BuildingModel[] = [];
        Object.values(buildings)
            .flat()
            .forEach((b: BuildingModel) => {
                const pt = point([+b.longitude!, +b.latitude!]);
                if (booleanWithin(pt, polygon)) {
                    addresses.push(b);
                }
            });
        return addresses;
    }
}
