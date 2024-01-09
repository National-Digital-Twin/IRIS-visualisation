import { Injectable, inject, signal } from '@angular/core';

import bbox from '@turf/bbox';
import { LngLat, LngLatBounds } from 'mapbox-gl';
import { Polygon } from 'geojson';

import { MapService } from './map.service';

import { MapLayerFilter } from '@core/models/layer-filter.model';

/**
 * Service for selecting and filtering buildings
 * on the map
 */
@Injectable({
  providedIn: 'root',
})
export class SpatialQueryService {
  private mapService = inject(MapService);

  /** pixel coordinates of the spatial filter bounding box */
  spatialFilterBounds = signal<number[] | undefined>(undefined);

  /** user drawn spatial filter geometry */
  spatialFilterGeom = signal<GeoJSON.Feature<Polygon> | undefined>(undefined);

  spatialFilterEnabled = signal<boolean>(false);
  selectedBuildingTOID = signal<string | undefined>(undefined);

  /** Set the TOID of an individual building */
  setSelectedTOID(TOID: string) {
    this.selectedBuildingTOID.set(TOID);
  }

  /** Filter map to show selected building */
  selectBuilding(TOID: string, multiDwelling: boolean = false) {
    const filter = <MapLayerFilter>{
      layerId: multiDwelling
        ? 'OS/TopographicArea_2/Building/1_3D-Multi-Dwelling-Selected'
        : 'OS/TopographicArea_2/Building/1_3D-Single-Dwelling-Selected',
      expression: ['all', ['==', '_symbol', 4], ['in', 'TOID', TOID]],
    };
    this.mapService.filterMapLayer(filter);
  }

  setSpatialFilter(enabled: boolean) {
    this.spatialFilterEnabled.set(enabled);
  }

  setSpatialFilterBounds(bounds: number[] | undefined) {
    this.spatialFilterBounds.set(bounds);
  }

  /**
   * Filter map to show selection of multiple buildings
   * @param geom user drawn geometry
   */
  setSpatialGeom(geom: GeoJSON.Feature<Polygon>) {
    this.spatialFilterGeom.set(geom);
    // get bounding box of drawn geometry as this
    // is the input required by mapbox to query
    // features
    const geomBBox = this.getBBox(geom);
    this.setSpatialFilter(true);
    this.setSpatialFilterBounds(geomBBox);
  }

  /**
   * Get the bounding box coordinates of a geometry
   * @param geom geometry to get bounding box of
   * @returns bounding box pixel coordinates of
   * user drawn area
   */
  private getBBox(geom: GeoJSON.Feature): number[] {
    const bboxPolygon = bbox(geom);
    const southWest = new LngLat(bboxPolygon[0], bboxPolygon[1]);
    const northEast = new LngLat(bboxPolygon[2], bboxPolygon[3]);
    const latlngBounds = new LngLatBounds(southWest, northEast);
    const pixelCoords = this.latlngToPixels(latlngBounds);
    return pixelCoords;
  }

  /**
   *
   * @param latlngBounds bounding box in lat lng
   * @returns bounding box in pixel coordinates
   */
  latlngToPixels(latlngBounds: LngLatBounds) {
    const sw = this.mapService.mapInstance.project(latlngBounds._sw);
    const ne = this.mapService.mapInstance.project(latlngBounds._ne);
    return [sw, ne];
  }
}
