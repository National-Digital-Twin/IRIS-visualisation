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
  signal,
} from '@angular/core';
import { Params, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';

import { Polygon } from 'geojson';

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

import {
  AdvancedFiltersFormModel,
  FilterKeys,
  FilterProps,
} from '@core/models/advanced-filters.model';
import { URLStateModel } from '@core/models/url-state.model';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';

import type { UserPreferences } from '@arc-web/components/src/components/accessibility/ArcAccessibility';
import type { ArcAccessibility, ArcSwitch } from '@arc-web/components';
import '@arc-web/components/src/components/container/arc-container';
import '@arc-web/components/src/components/switch/arc-switch';
import { ContainerTheme } from '@arc-web/components/src/components/container/constants/ContainerConstants';

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
  // get filters from route query params
  @Input() set filter(filter: string) {
    if (filter) {
      this.filterProps = this.filterService.parseFilterString(filter);
      this.utilService.setFilters(this.filterProps);
    } else {
      this.utilService.setFilters({});
      this.closeResults();
    }
  }

  private readonly settingService = inject(SettingService);
  private readonly colorBlindMode = computed(
    () => this.settingService.settings()['colorBlindMode'] as boolean
  );

  private readonly theme = signal<ContainerTheme | undefined>(undefined);

  public readonly companyLogoSrc = computed(() => {
    const theme = this.theme();
    if (!theme) return '';
    const imageSrc = this.runtimeConfig.companyLogo[theme];
    return imageSrc ? imageSrc : '';
  });

  @ViewChild('accessibility')
  public accessibility?: ElementRef<ArcAccessibility>;
  @ViewChild('colorBlindSwitch')
  public colorBlindSwitch?: ElementRef<ArcSwitch>;
  private readonly document = inject(DOCUMENT);

  private dataService = inject(DataService);
  private filterService = inject(FilterService);
  private mapService = inject(MapService);
  private router = inject(Router);
  private runtimeConfig = inject(RUNTIME_CONFIGURATION);
  private spatialQueryService = inject(SpatialQueryService);
  private utilService = inject(UtilService);
  private zone = inject(NgZone);

  private selectedBuildingTOID = this.spatialQueryService.selectedBuildingTOID;

  title = 'IRIS';

  mapConfig?: URLStateModel;

  filterProps?: FilterProps;

  public ngAfterViewInit(): void {
    const colorBlindMode = this.colorBlindMode();
    this.setColorBlindMode(colorBlindMode);
    if (this.colorBlindSwitch) {
      this.colorBlindSwitch.nativeElement.checked = colorBlindMode;
    }
  }

  ngOnChanges(): void {
    const mapConfig: URLStateModel = {
      bearing: this.bearing,
      pitch: this.pitch,
      zoom: this.zoom,
      center: [this.lat, this.lng],
    };
    this.mapConfig = mapConfig;

    /**
     * Trigger a update of building color
     * whenever an input changes.
     * This should be done on any map
     * or filter related change.
     * However if @Input()'s are added
     * which are unrelated to the map
     * or filters, a condition statement
     * will need to be added
     */
    this.updateBuildingLayerColour();
  }

  public handleShowAccessibility(event: Event): void {
    event.preventDefault();
    this.accessibility?.nativeElement.show();
  }

  public handleColorBlindSwitchChange(event: Event): void {
    const colorBlindMode = (event.target as HTMLInputElement).checked;
    this.setColorBlindMode(colorBlindMode);
    this.settingService.set('colorBlindMode', colorBlindMode);
  }

  public handleAccessibilityChange(event: Event): void {
    type IEvent = CustomEvent<{ preferences: UserPreferences }>;
    let { theme } = (event as IEvent).detail.preferences;
    if (theme === 'auto') {
      const { matches } = window.matchMedia('(prefers-color-scheme: dark)');
      theme = matches ? 'dark' : 'light';
    }
    this.document?.body?.setAttribute('theme', theme);
    this.theme.set(theme);
  }

  private setColorBlindMode(colorBlindMode: boolean): void {
    this.document?.body?.setAttribute(
      'color-blind-mode',
      colorBlindMode.toString()
    );
  }

  updateBuildingLayerColour() {
    if (this.mapConfig?.zoom && this.mapConfig?.zoom >= 15) {
      this.utilService.createBuildingColourFilter();
    }
  }

  setSearchArea(searchArea: GeoJSON.Feature<Polygon>) {
    this.dataService.setSelectedUPRN(undefined);
    this.dataService.setSelectedBuilding(undefined);
    this.spatialQueryService.setSelectedTOID('');

    /** clear building layer selections */
    this.spatialQueryService.selectBuilding('', true);
    this.spatialQueryService.selectBuilding('', false);
    this.spatialQueryService.setSpatialGeom(searchArea);
    /**
     * need to run this in zone otherwise change detection
     * isn't triggered and results panel won't open
     */
    this.zone.run(() => {
      this.utilService.createBuildingColourFilter();
    });
  }

  setSelectedBuildingTOID(TOID: string | null) {
    /**
     * if there are filters results panel is
     * open so don't allow selection from map
     */
    const filters = this.utilService.filterProps();
    if (Object.keys(filters).length) {
      return;
    }
    const currentTOID = this.selectedBuildingTOID();
    if (TOID && currentTOID !== TOID) {
      /** Get building UPRNs */
      const buildings = this.utilService.getBuildings(TOID);
      if (buildings.length === 1) {
        /** Single dwelling */
        this.dataService.setSelectedBuildings(undefined);
        this.dataService.setSelectedUPRN(+buildings[0].UPRN);
      } else if (buildings.length > 1) {
        /* Multiple dwellings */
        this.zone.run(() => {
          this.dataService.setSelectedUPRN(undefined);
          this.dataService.setSelectedBuildings(buildings);
        });
      }

      this.spatialQueryService.setSelectedTOID(TOID);
      this.spatialQueryService.selectBuilding(TOID, buildings.length > 1);
      this.spatialQueryService.selectBuilding('', buildings.length === 1);
    } else {
      this.zone.run(() => {
        this.dataService.setSelectedUPRN(undefined);
        this.dataService.setSelectedBuilding(undefined);
        this.dataService.setSelectedBuildings(undefined);
        this.spatialQueryService.setSelectedTOID('');
        this.spatialQueryService.selectBuilding('', true);
        this.spatialQueryService.selectBuilding('', false);
      });
    }
  }

  closeDetails() {
    // if there are building UPRNs then the results
    // panel is open so only clear selected building
    // to keep building highlighted on the map
    if (this.dataService.buildingsSelection()) {
      this.dataService.setSelectedBuilding(undefined);
    } else {
      this.dataService.setSelectedBuilding(undefined);
      this.spatialQueryService.setSelectedTOID('');
      this.spatialQueryService.selectBuilding('');
      this.dataService.setSelectedUPRN(undefined);
    }
  }

  closeResults() {
    /** if there is no spatial filter close results panel */
    if (!this.spatialQueryService.spatialFilterEnabled()) {
      this.dataService.setSelectedBuildings(undefined);
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
    this.dataService.setSelectedUPRN(undefined);
    this.dataService.setSelectedBuilding(undefined);
    this.dataService.setSelectedBuildings(undefined);
    this.updateBuildingLayerColour();
  }

  setAdvancedFilters(filter: AdvancedFiltersFormModel) {
    for (const [key, value] of Object.entries(filter)) {
      if (value === null) {
        delete filter[key as keyof AdvancedFiltersFormModel];
      }
    }
    const queryParams = this.createQueryParams(
      filter as unknown as { [key: string]: string[] }
    );
    this.navigate(queryParams);
  }

  setFilterParams(filter: { [key: string]: string[] }) {
    const queryParams = this.createQueryParams(filter);
    this.navigate(queryParams);
  }

  setRouteMapParams(params: URLStateModel) {
    const { bearing, center, pitch, zoom } = params;
    const queryParams = {
      bearing,
      lat: center[1],
      lng: center[0],
      pitch,
      zoom,
    };
    this.navigate(queryParams);
  }

  private createQueryParams(filter: { [key: string]: string[] }) {
    Object.keys(filter).forEach((key: string) => {
      if (this.filterProps && this.filterProps[key as FilterKeys]) {
        delete this.filterProps[key as FilterKeys];
      }
    });
    const filterString = this.filterService.createFilterString(
      filter,
      this.filterProps
    );
    const queryParams = {
      filter: filterString !== '' ? filterString : undefined,
    };
    return queryParams;
  }

  private navigate(queryParams: Params) {
    this.zone.run(() => {
      this.router.navigate(['/'], {
        queryParams,
        queryParamsHandling: 'merge',
      });
    });
  }
}
