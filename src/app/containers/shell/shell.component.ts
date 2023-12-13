import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  Input,
  NgZone,
  OnChanges,
  // computed,
  effect,
  inject,
  numberAttribute,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { Polygon } from 'geojson';

import { DetailsPanelComponent } from '@components/details-panel/details-panel.component';
import { MapComponent } from '@components/map/map.component';
import { ResultsPanelComponent } from '@containers/results-panel/results-panel.component';

import { DataService } from '@core/services/data.service';
import { MapService } from '@core/services/map.service';
import { SpatialQueryService } from '@core/services/spatial-query.service';
import { UtilService } from '@core/services/utils.service';

import { MapConfigModel } from '@core/models/map-configuration.model';
import { MapLayerFilter } from '@core/models/layer-filter.model';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

@Component({
  selector: 'c477-shell',
  standalone: true,
  imports: [DetailsPanelComponent, MapComponent, ResultsPanelComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ShellComponent implements OnChanges {
  // get map state from route query params
  @Input({ transform: numberAttribute }) pitch: number = 0;
  @Input({ transform: numberAttribute }) bearing: number = 0;
  @Input({ transform: numberAttribute }) lat: number = 0;
  @Input({ transform: numberAttribute }) lng: number = 0;
  @Input({ transform: numberAttribute }) zoom: number = 0;

  private dataService = inject(DataService);
  private mapService = inject(MapService);
  private router = inject(Router);
  private runtimeConfig = inject(RUNTIME_CONFIGURATION);
  private spatialQueryService = inject(SpatialQueryService);
  private utilService = inject(UtilService);
  private zone = inject(NgZone);

  private selectedBuildingTOID = this.spatialQueryService.selectedBuildingTOID;

  detailsPanelOpen = signal(false);

  title = 'Energy Performance Viewer';

  mapConfig?: MapConfigModel;

  buildingData = this.dataService.buildings;

  buildingLayerExpression = this.utilService.currentMapViewExpression;

  // buildingData = computed(() => {
  //   const buildings = this.dataService.buildings();
  //   if (buildings && Object.keys(buildings)?.length !== 0) {
  //     console.log('data loaded');
  //     // return true;
  //   }
  //   // return false;
  // });

  constructor() {
    effect(() => {
      this.buildingData();
    });
  }

  ngOnChanges(): void {
    const mapConfig: MapConfigModel = {
      bearing: this.bearing,
      pitch: this.pitch,
      zoom: this.zoom,
      center: [this.lat, this.lng],
    };
    this.mapConfig = mapConfig;
  }

  updateMap() {
    // create building colour filter expression to style buildings layer
    this.utilService.createBuildingColourFilter();
    this.mapService.setMapLayerPaint(
      'OS/TopographicArea_2/Building/1_3D',
      'fill-extrusion-color',
      this.buildingLayerExpression()!
    );
  }

  filterLayer(filter: MapLayerFilter) {
    this.mapService.filterMapLayer(filter);
  }

  setSearchArea(searchArea: GeoJSON.Feature<Polygon>) {
    this.spatialQueryService.selectBuildings(searchArea);
    this.updateMap();
  }

  setSelectedBuildingTOID(TOID: string | null) {
    console.log(TOID);
    const currentTOID = this.selectedBuildingTOID();
    if (TOID && currentTOID !== TOID) {
      // get uprns for the selected building
      const uprns = this.dataService.getBuildingUPRNs(TOID);
      // get building details and open details panel
      if (uprns.length === 1) {
        // set many uprns to undefined to
        // close results panel if it's open
        this.dataService.setSelectedUPRNs(undefined);
        this.dataService.setSelectedUPRN(uprns[0]);
      } else if (uprns.length > 1) {
        // set individual uprn to undefined to
        // close details panel if it's open.
        this.dataService.setSelectedUPRN(undefined);
        this.dataService.setSelectedUPRNs(uprns);
      }
      this.spatialQueryService.setSelectedTOID(TOID);
      this.spatialQueryService.selectBuilding(TOID);
    } else {
      this.dataService.setSelectedUPRNs(undefined);
      this.dataService.setSelectedUPRN(undefined);
      this.spatialQueryService.setSelectedTOID('');
      this.spatialQueryService.selectBuilding('');
    }
  }

  closeDetails() {
    // if there are building UPRNs then the results
    // panel is open so only clear selected building
    // to keep building highlighted on the map
    if (this.dataService.buildingUPRNs()?.length) {
      this.dataService.setSelectedBuilding(undefined);
    } else {
      this.spatialQueryService.setSelectedTOID('');
      this.spatialQueryService.selectBuilding('');
      this.dataService.setSelectedUPRN(undefined);
    }
  }

  zoomIn() {
    this.mapService.mapInstance.zoomIn();
  }

  zoomOut() {
    this.mapService.mapInstance.zoomOut();
  }

  resetMapView() {
    this.mapService.mapInstance.easeTo({
      center: this.runtimeConfig.map.center,
      zoom: this.runtimeConfig.map.zoom,
      pitch: this.runtimeConfig.map.pitch,
      bearing: this.runtimeConfig.map.bearing,
      duration: 1500,
    });
  }

  deleteSpatialFilter() {
    this.spatialQueryService.setSpatialFilter(false);
    this.spatialQueryService.setSpatialFilterBounds(undefined);
    this.dataService.setSelectedUPRNs(undefined);
    this.dataService.setSelectedUPRN(undefined);
    this.dataService.setSelectedBuilding(undefined);
    this.updateMap();
  }

  setRouteParams(params: MapConfigModel) {
    const { bearing, center, pitch, zoom } = params;
    this.zone.run(() => {
      this.router.navigate(['/'], {
        queryParams: { bearing, lat: center[1], lng: center[0], pitch, zoom },
      });
    });
    // if zoom is greater than 15 & there isn't a spatial filter
    if (zoom >= 15 && !this.spatialQueryService.spatialFilterEnabled()) {
      this.updateMap();
    }
  }
}
