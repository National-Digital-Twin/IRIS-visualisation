import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  Input,
  NgZone,
  AfterViewInit,
  OnChanges,
  ViewChild,
  ElementRef,
  inject,
  numberAttribute,
  computed,
} from '@angular/core';
import { Router } from '@angular/router';

import { Polygon } from 'geojson';

import { ArcAccessibility, ArcContainer, ArcSwitch } from '@arc-web/components';
import { DetailsPanelComponent } from '@components/details-panel/details-panel.component';
import { MainFiltersComponent } from '@containers/main-filters/main-filters.component';
import { MapComponent } from '@components/map/map.component';
import { ResultsPanelComponent } from '@containers/results-panel/results-panel.component';

import { SettingService } from '@core/services/setting.service';
import { DataService } from '@core/services/data.service';
import { FilterService } from '@core/services/filter.service';
import { MapService } from '@core/services/map.service';
import { SpatialQueryService } from '@core/services/spatial-query.service';
import { UtilService } from '@core/services/utils.service';

import { MapConfigModel } from '@core/models/map-configuration.model';
import { MapLayerFilter } from '@core/models/layer-filter.model';

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
export class ShellComponent implements AfterViewInit, OnChanges {
  // get map state from route query params
  @Input({ transform: numberAttribute }) pitch: number = 0;
  @Input({ transform: numberAttribute }) bearing: number = 0;
  @Input({ transform: numberAttribute }) lat: number = 0;
  @Input({ transform: numberAttribute }) lng: number = 0;
  @Input({ transform: numberAttribute }) zoom: number = 0;
  @Input() filter: string = '';

  private readonly settingService = inject(SettingService);
  private readonly colorBlindMode = computed(
    () => this.settingService.settings()['colorBlindMode'] as boolean
  );

  @ViewChild('container')
  public container!: ElementRef<ArcContainer>;
  @ViewChild('accessibility')
  public accessibility?: ElementRef<ArcAccessibility>;
  @ViewChild('colorBlindSwitch')
  public colorBlindSwitch!: ElementRef<ArcSwitch>;

  private dataService = inject(DataService);
  private filterService = inject(FilterService);
  private mapService = inject(MapService);
  private router = inject(Router);
  private runtimeConfig = inject(RUNTIME_CONFIGURATION);
  private spatialQueryService = inject(SpatialQueryService);
  private utilService = inject(UtilService);
  private zone = inject(NgZone);

  private selectedBuildingTOID = this.spatialQueryService.selectedBuildingTOID;

  title = 'Energy Performance Viewer';

  mapConfig?: MapConfigModel;

  buildingLayerExpression = this.utilService.currentMapViewExpression;

  public ngAfterViewInit(): void {
    const colorBlindMode = this.colorBlindMode();
    this.container.nativeElement.setAttribute(
      'color-blind-mode',
      colorBlindMode ? 'true' : 'false'
    );
    this.colorBlindSwitch.nativeElement.checked = colorBlindMode;
  }

  ngOnChanges(): void {
    const mapConfig: MapConfigModel = {
      bearing: this.bearing,
      pitch: this.pitch,
      zoom: this.zoom,
      center: [this.lat, this.lng],
    };
    this.mapConfig = mapConfig;
    if (this.filter) {
      this.filterService.parseFilter(this.filter);
    }
  }

  public handleShowAccessibility(event: Event): void {
    event.preventDefault();
    this.accessibility?.nativeElement.show();
  }

  public handleColorBlindSwitchChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.container.nativeElement.setAttribute(
      'color-blind-mode',
      checked ? 'true' : 'false'
    );
    this.settingService.set('colorBlindMode', checked);
  }

  updateBuildingLayerFilter() {
    this.utilService.createBuildingColourFilter();
  }

  filterLayer(filter: MapLayerFilter) {
    this.mapService.filterMapLayer(filter);
  }

  setSearchArea(searchArea: GeoJSON.Feature<Polygon>) {
    this.spatialQueryService.selectBuildings(searchArea);
    this.updateBuildingLayerFilter();
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
    this.updateBuildingLayerFilter();
  }

  setRouteParams(params: MapConfigModel) {
    const { bearing, center, pitch, zoom } = params;
    this.zone.run(() => {
      this.router.navigate(['/'], {
        queryParams: { bearing, lat: center[1], lng: center[0], pitch, zoom },
        queryParamsHandling: 'merge',
      });
    });
    // if zoom is greater than 15 & there isn't a spatial filter
    if (zoom >= 15 && !this.spatialQueryService.spatialFilterEnabled()) {
      this.updateBuildingLayerFilter();
    }
  }
}
