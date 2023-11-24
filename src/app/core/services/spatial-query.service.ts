import { Injectable, inject, signal } from '@angular/core';

import bbox from '@turf/bbox';
import intersect from '@turf/intersect';

import { MapService } from './map.service';
import { Polygon } from 'geojson';
import { Expression } from 'mapbox-gl';
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
    // query the features from the 2d buildings layer
    // querying 3d layer isn't accurate due to pitch of map
    const selectedBuildings = this.mapService.mapInstance.queryRenderedFeatures(
      geomBBox,
      { layers: ['OS/TopographicArea_2/Building/1_2D'] }
    );
    // filter the buildings by doing an intersect between the queryed building results
    // and the original drawn geometry.  This is because the bounding box geom will
    // be larger than the drawn geometry so need to remove some results
    const filteredBuildings = this.getBuildingsInGeom(geom, selectedBuildings);
    // apply the filter to the building highlight layer
    const filter: MapLayerFilter = {
      layerId: 'OS/TopographicArea_2/Building/1_3D-highlighted',
      expression: filteredBuildings,
    };
    this.mapService.filterMapLayer(filter);
  }

  /**
   * Get the bounding box coordinates of a geometry
   * @param geom geometry to get bounding box of
   * @returns bounding box pixel coordinates of
   * user drawn area
   */
  private getBBox(geom: GeoJSON.Feature): number[] {
    const bboxPolygon = bbox(geom);
    const southWest = [bboxPolygon[0], bboxPolygon[1]];
    const northEast = [bboxPolygon[2], bboxPolygon[3]];
    // convert to canvas x,y pixel coordinates
    const nePointPixel = this.mapService.mapInstance.project(northEast);
    const swPointPixel = this.mapService.mapInstance.project(southWest);
    return [swPointPixel, nePointPixel];
  }

  /**
   * Find buildings that intersect the input (user drawn) geometry
   * and return their TOIDs as a Mapbox filter expression
   * @param searchGeom input geometry
   * @param features features to intersect with input geometry
   * @returns a Mapbox expression that includes a list of TOIDs
   * that are from buildings that intersect the input geometry
   */
  private getBuildingsInGeom(
    searchGeom: GeoJSON.Feature<Polygon>,
    features: Array<GeoJSON.Feature<Polygon>>
  ): Expression {
    const filtered = features.reduce(
      (memo, feature) => {
        const intersects = intersect(feature, searchGeom);
        if (intersects) {
          // only add the building if the feature intersects the user
          // drawn geometry
          memo.push(feature.properties!.TOID);
        }
        return memo;
      },
      ['in', 'TOID']
    );
    return filtered as Expression;
  }
}
