import { Injectable, inject, signal } from '@angular/core';

import { Subject } from 'rxjs';

import bbox from '@turf/bbox';

import { MapService } from './map.service';
import { Polygon } from 'geojson';
import { LngLat, LngLatBounds } from 'mapbox-gl';
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

  private spatialFilterBounds = new Subject<LngLatBounds | undefined>();
  spatialFilterBounds$ = this.spatialFilterBounds.asObservable();

  spatialFilterEnabled = signal<boolean>(false);
  selectedBuildingTOID = signal<string | undefined>(undefined);

  /** Set the TOID of an individual building */
  setSelectedTOID(TOID: string) {
    this.selectedBuildingTOID.set(TOID);
  }

  /** Filter map to show selected buildings */
  selectBuilding(TOID: string) {
    const filter: MapLayerFilter = {
      layerId: 'OS/TopographicArea_2/Building/1_3D-selected',
      expression: ['all', ['==', '_symbol', 4], ['in', 'TOID', TOID]],
    };
    this.mapService.filterMapLayer(filter);
    this.signalsService.detailsPanelOpen.set(true);
  }

  setSpatialFilter(enabled: boolean) {
    this.spatialFilterEnabled.set(enabled);
  }

  /**
   * Filter map to show selection of multiple buildings
   * @param geom user drawn geometry
   */
  selectBuildings(geom: GeoJSON.Feature<Polygon>) {
    // get bounding box of drawn geometry as this
    // is the input required by mapbox to query
    // features
    const geomBBox = this.getBBox(geom);
    this.setSpatialFilter(true);
    this.spatialFilterBounds.next(geomBBox);
  }

  /**
   * Get the bounding box coordinates of a geometry
   * @param geom geometry to get bounding box of
   * @returns bounding box pixel coordinates of
   * user drawn area
   */
  private getBBox(geom: GeoJSON.Feature): LngLatBounds {
    const bboxPolygon = bbox(geom);
    const southWest = new LngLat(bboxPolygon[0], bboxPolygon[1]);
    const northEast = new LngLat(bboxPolygon[2], bboxPolygon[3]);
    const bbBounds = new LngLatBounds(southWest, northEast);
    return bbBounds;
  }
}
