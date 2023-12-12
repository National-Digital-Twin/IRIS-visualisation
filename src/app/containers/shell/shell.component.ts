import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  Input,
  NgZone,
  OnChanges,
  computed,
  effect,
  inject,
  numberAttribute,
} from '@angular/core';
import { Router } from '@angular/router';

import { Polygon } from 'geojson';

import { DetailsPanelComponent } from '@components/details-panel/details-panel.component';
import { MapComponent } from '@components/map/map.component';
import { ResultsPanelComponent } from '@containers/results-panel/results-panel.component';

import { DataService } from '@core/services/data.service';
import { MapService } from '@core/services/map.service';
import { SpatialQueryService } from '@core/services/spatial-query.service';

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
  private zone = inject(NgZone);

  private selectedBuildingTOID = this.spatialQueryService.selectedBuildingTOID;

  title = 'C477 Visualisation';

  mapConfig?: MapConfigModel;

  buildingData = computed(() => {
    const toids = this.dataService.toids();
    const epcs = this.dataService.epcs();
    if (toids && epcs) {
      console.log('update map');
      this.updateMap();
    }
  });

  constructor() {
    // TODO remove when using real API
    effect(() => this.buildingData());
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
    const exp = this.mapService.createBuildingColourFilter();
    this.mapService.setMapLayerPaint(
      'OS/TopographicArea_2/Building/1_3D',
      'fill-extrusion-color',
      exp
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
      // get buidling details and open details panel
      if (uprns.length === 1) {
        this.dataService.setSelectedUPRN(uprns[0]);
      } else if (uprns.length > 1) {
        this.dataService.setSelectedUPRNs(uprns);
      }
      this.spatialQueryService.setSelectedTOID(TOID);
      this.spatialQueryService.selectBuilding(TOID);
    } else {
      this.dataService.setSelectedUPRN(undefined);
      this.spatialQueryService.setSelectedTOID('');
      this.spatialQueryService.selectBuilding('');
    }
  }

  closeDetails() {
    this.spatialQueryService.setSelectedTOID('');
    this.spatialQueryService.selectBuilding('');
    this.dataService.setSelectedUPRN(undefined);
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
