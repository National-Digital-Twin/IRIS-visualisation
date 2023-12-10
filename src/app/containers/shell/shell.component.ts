import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  inject,
  numberAttribute,
} from '@angular/core';
import { Router } from '@angular/router';

import { Subscription, combineLatest, map, tap } from 'rxjs';

import { LngLatBounds } from 'mapbox-gl';
import { Polygon } from 'geojson';

import { DetailsPanelComponent } from '@components/details-panel/details-panel.component';
import { MapComponent } from '@components/map/map.component';
import { ResultsPanelComponent } from '@containers/results-panel/results-panel.component';

import { DataService } from '@core/services/data.service';
import { MapService } from '@core/services/map.service';
import { SpatialQueryService } from '@core/services/spatial-query.service';

import { EPCMap } from '@core/models/epc.model';
import { MapConfigModel } from '@core/models/map-configuration.model';
import { MapLayerFilter } from '@core/models/layer-filter.model';
import { ToidMap } from '@core/models/toid.model';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

@Component({
  selector: 'c477-shell',
  standalone: true,
  imports: [DetailsPanelComponent, MapComponent, ResultsPanelComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ShellComponent implements OnDestroy, OnChanges {
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
  toidSubscription!: Subscription;
  epcDataSubscription!: Subscription;
  dataSubscription: Subscription;

  mapConfig?: MapConfigModel;

  constructor() {
    // TODO remove when using real API
    this.toidSubscription = this.dataService.loadTOIDS().subscribe();
    // Load data from IA
    this.epcDataSubscription = this.dataService
      .getAllEPCData()
      .pipe(
        map(rawData => this.dataService.mapBuildingEPCs(rawData, 'uprn_id')),
        tap(res => {
          this.dataService.setEPCData(res);
        })
      )
      .subscribe();

    this.dataSubscription = combineLatest([
      this.dataService.toids$.pipe(),
      this.dataService.epcs$.pipe(),
    ])
      .pipe(tap(([toids, epcs]) => this.updateMap(toids!, epcs!)))
      .subscribe();
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

  updateMap(toids: ToidMap, epcs: EPCMap) {
    // create building colour filter expression to style buildings layer
    const exp = this.mapService.createBuildingColourFilter(toids, epcs);
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
  }

  setSelectedBuildingTOID(TOID: string | null) {
    console.log(TOID);
    const currentTOID = this.selectedBuildingTOID();
    if (TOID && currentTOID !== TOID) {
      this.spatialQueryService.setSelectedTOID(TOID);
      this.spatialQueryService.selectBuilding(TOID);
    } else {
      this.spatialQueryService.setSelectedTOID('');
      this.spatialQueryService.selectBuilding('');
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
  }

  setMapBounds(bounds: LngLatBounds) {
    this.mapService.setMapBounds(bounds);
  }

  setRouteParams(params: MapConfigModel) {
    const { bearing, center, pitch, zoom } = params;
    this.zone.run(() => {
      this.router.navigate(['/'], {
        queryParams: { bearing, lat: center[1], lng: center[0], pitch, zoom },
      });
    });
  }

  ngOnDestroy(): void {
    this.toidSubscription.unsubscribe();
    this.dataSubscription.unsubscribe();
    this.epcDataSubscription.unsubscribe();
  }
}
