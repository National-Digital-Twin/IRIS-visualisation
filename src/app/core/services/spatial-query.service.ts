import { Injectable, inject, signal } from '@angular/core';

import bbox from '@turf/bbox';

import { MapService } from './map.service';
import { Polygon } from 'geojson';
import { LngLat } from 'mapbox-gl';
import { MapLayerFilter } from '@core/models/layer-filter.model';
import { SignalsService } from './signals.service';

/**
 * Service for selecting and filtering buildings
 * on the map
 */
@Injectable({
  providedIn: 'root',
})
export class SpatialQueryService {
  private mapService = inject(MapService);
  private signalsService = inject(SignalsService);

  spatialFilterBounds = signal<number[] | undefined>(undefined);

  spatialFilterGeom = signal<GeoJSON.Feature<Polygon> | undefined>(undefined);

  spatialFilterEnabled = signal<boolean>(false);
  selectedBuildingTOID = signal<string | undefined>(undefined);

  /** Set the TOID of an individual building */
  setSelectedTOID(TOID: string) {
    this.selectedBuildingTOID.set(TOID);
  }

  /** Filter map to show selected building */
  selectBuilding(TOID: string) {
    const filter: MapLayerFilter = {
      layerId: 'OS/TopographicArea_2/Building/1_3D-selected',
      expression: ['all', ['==', '_symbol', 4], ['in', 'TOID', TOID]],
    };
    this.mapService.filterMapLayer(filter);
    const panelOpen = TOID ? true : false;
    this.signalsService.detailsPanelOpen.set(panelOpen);
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
  selectBuildings(geom: GeoJSON.Feature<Polygon>) {
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
    const nePointPixel = this.mapService.mapInstance.project(northEast);
    const swPointPixel = this.mapService.mapInstance.project(southWest);
    return [swPointPixel, nePointPixel];
  }
}
