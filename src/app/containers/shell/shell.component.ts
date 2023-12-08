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

import {
  combineLatest,
  distinctUntilChanged,
  tap,
  map,
  Subscription,
} from 'rxjs';

import { LngLatBounds } from 'mapbox-gl';
import { Polygon } from 'geojson';

import { DetailsPanelComponent } from '@components/details-panel/details-panel.component';
import { MainFiltersComponent } from '@containers/main-filters/main-filters.component';
import { MapComponent } from '@components/map/map.component';
import { ResultsPanelComponent } from '@containers/results-panel/results-panel.component';

import { DataService } from '@core/services/data.service';
import { MapService } from '@core/services/map.service';
import { SpatialQueryService } from '@core/services/spatial-query.service';

import { BuildingModel } from '@core/models/building.model';
import { MapLayerFilter } from '@core/models/layer-filter.model';
import { MapConfigModel } from '@core/models/map-configuration.model';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

@Component({
  selector: 'c477-shell',
  standalone: true,
  imports: [
    DetailsPanelComponent,
    MainFiltersComponent,
    MapComponent,
    ResultsPanelComponent,
  ],
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
  dataSubscription!: Subscription;
  addressesSubscription: Subscription;

  spatialFilterSubscription: Subscription;

  mapConfig?: MapConfigModel;

  constructor() {
    // TODO remove when using real API
    this.dataSubscription = this.dataService.loadAddressData().subscribe();

    // When map bounds change, refilter data
    this.addressesSubscription = combineLatest([
      this.mapService.mapBounds$.pipe(),
      this.dataService.addresses$.pipe(distinctUntilChanged()),
    ])
      .pipe(
        map(([bounds, addresses]) =>
          this.dataService.filterAddresses(addresses!, bounds!)
        ),
        tap((data: BuildingModel[]) => {
          const spatialFilterEnabled =
            this.spatialQueryService.spatialFilterEnabled();
          if (!spatialFilterEnabled) {
            this.updateMap(data);
          }
        })
      )
      .subscribe();

    // when a spatial filter is set, filter map
    this.spatialFilterSubscription = combineLatest([
      this.spatialQueryService.spatialFilterBounds$.pipe(),
      this.dataService.addresses$.pipe(distinctUntilChanged()),
    ])
      .pipe(
        map(([bounds, addresses]) => {
          return this.dataService.filterAddresses(addresses!, bounds!);
        }),
        tap((data: BuildingModel[]) => this.updateMap(data))
      )
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

  updateMap(data: BuildingModel[]) {
    // create building colour filter expression to style buildings layer
    const exp = this.mapService.createBuildingColourFilter(data);
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
    this.dataSubscription.unsubscribe();
    this.addressesSubscription.unsubscribe();
  }
}
