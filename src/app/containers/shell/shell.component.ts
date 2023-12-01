import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  OnDestroy,
  inject,
} from '@angular/core';
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
import { MapComponent } from '@components/map/map.component';
import { ResultsPanelComponent } from '@containers/results-panel/results-panel.component';

import { DataService } from '@core/services/data.service';
import { MapService } from '@core/services/map.service';
import { SpatialQueryService } from '@core/services/spatial-query.service';

import { BuildingModel } from '@core/models/building.model';
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
export class ShellComponent implements OnDestroy {
  private dataService = inject(DataService);
  private mapService = inject(MapService);
  private runtimeConfig = inject(RUNTIME_CONFIGURATION);
  private spatialQueryService = inject(SpatialQueryService);
  private selectedBuildingTOID = this.spatialQueryService.selectedBuildingTOID;

  title = 'C477 Visualisation';
  dataSubscription!: Subscription;
  addressesSubscription: Subscription;

  constructor() {
    // TODO remove when using real API
    // this.dataSubscription = this.dataService.loadAddressData().subscribe();

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
          // create building colour filter expression to style buildings layer
          const exp = this.mapService.createBuildingColourFilter(data);
          this.mapService.setMapLayerPaint(
            'OS/TopographicArea_2/Building/1_3D',
            'fill-extrusion-color',
            exp
          );
        })
      )
      .subscribe();
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

  setMapBounds(bounds: LngLatBounds) {
    this.mapService.setMapBounds(bounds);
    this.dataService
      .getEPCWithinBounds$(bounds)
      .subscribe(res => console.log(res));
  }

  ngOnDestroy(): void {
    this.dataSubscription.unsubscribe();
    this.addressesSubscription.unsubscribe();
  }
}
