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
import { toObservable } from '@angular/core/rxjs-interop';
import { Params, Router } from '@angular/router';
import { AsyncPipe, DOCUMENT } from '@angular/common';

import {
  first,
  forkJoin,
  map,
  switchMap,
  EMPTY,
  Observable,
  combineLatest,
} from 'rxjs';

import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { ComponentType } from '@angular/cdk/portal';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import type { UserPreferences } from '@arc-web/components/src/components/accessibility/ArcAccessibility';
import type { ArcAccessibility, ArcSwitch } from '@arc-web/components';
import '@arc-web/components/src/components/container/arc-container';
import '@arc-web/components/src/components/switch/arc-switch';

import { GeoJsonProperties, Geometry, Polygon } from 'geojson';
import { FeatureCollection } from '@turf/helpers';

import { DetailsPanelComponent } from '@components/details-panel/details-panel.component';
import { MainFiltersComponent } from '@containers/main-filters/main-filters.component';
import { MapComponent } from '@components/map/map.component';
import { ResultsPanelComponent } from '@containers/results-panel/results-panel.component';
import {
  FlagModalComponent,
  FlagModalData,
  FlagModalResult,
} from '@components/flag-modal/flag.modal.component';
import { LoadingScreenComponent } from '@components/loading-screen/loading-screen.component';
import { MinimapComponent } from '@components/minimap/minimap.component';
import {
  RemoveFlagModalComponent,
  RemoveFlagModalData,
  RemoveFlagModalResult,
} from '@components/remove-flag-modal/remove-flag-modal.component';

import { SettingsService, SETTINGS } from '@core/services/settings.service';
import { DataService } from '@core/services/data.service';
import { DataDownloadService } from '@core/services/data-download.service';
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
import { MinimapData } from '@core/models/minimap-data.model';
import { BuildingMap, BuildingModel } from '@core/models/building.model';

import { RUNTIME_CONFIGURATION } from '@core/tokens/runtime-configuration.token';
import { DownloadWarningComponent } from '@components/download-warning/download-warning.component';
import {
  DownloadDataWarningData,
  DownloadDataWarningResponse,
} from '@core/models/download-data-warning.model';

@Component({
  selector: 'c477-shell',
  standalone: true,
  imports: [
    DetailsPanelComponent,
    LoadingScreenComponent,
    MainFiltersComponent,
    MapComponent,
    MinimapComponent,
    ResultsPanelComponent,
    AsyncPipe,
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

  private readonly settings = inject(SettingsService);
  private readonly colorBlindMode = this.settings.get(SETTINGS.ColorBlindMode);
  private readonly theme = this.settings.get(SETTINGS.Theme);
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

  private readonly dialog = inject(MatDialog);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private dataService = inject(DataService);
  private dataDownloadService = inject(DataDownloadService);
  private filterService = inject(FilterService);
  private mapService = inject(MapService);
  private router = inject(Router);
  private runtimeConfig = inject(RUNTIME_CONFIGURATION);
  private spatialQueryService = inject(SpatialQueryService);
  private utilService = inject(UtilService);
  private zone = inject(NgZone);

  private selectedBuildingTOID = this.spatialQueryService.selectedBuildingTOID;

  contextData$: Observable<
    FeatureCollection<Geometry, GeoJsonProperties>[] | undefined
  >;

  title = 'IRIS';
  loading = this.dataService.loading;
  mapConfig?: URLStateModel;
  filterProps?: FilterProps;
  minimapData?: MinimapData;
  showMinimap: boolean = true;
  spatialFilterEnabled = this.spatialQueryService.spatialFilterEnabled;

  constructor() {
    this.contextData$ = combineLatest([
      this.dataService.contextData$,
      toObservable(this.dataService.buildings),
    ]).pipe(
      map(([contextData, buildings]) => {
        if (buildings) {
          return this.aggregateEPC(contextData, buildings!);
        } else {
          return undefined;
        }
      })
    );
  }

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
    this.settings.set(SETTINGS.ColorBlindMode, colorBlindMode);
  }

  public handleAccessibilityChange(event: Event): void {
    type IEvent = CustomEvent<{ preferences: UserPreferences }>;
    let { theme } = (event as IEvent).detail.preferences;
    if (theme === 'auto') {
      const { matches } = window.matchMedia('(prefers-color-scheme: dark)');
      theme = matches ? 'dark' : 'light';
    }
    this.document?.body?.setAttribute('theme', theme);
    this.settings.set(SETTINGS.Theme, theme);
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
    this.utilService.setSpatialFilter(searchArea);
    /**
     * need to run this in zone otherwise change detection
     * isn't triggered and results panel won't open
     * Only run when buildings are visible
     */
    if (this.mapConfig?.zoom && this.mapConfig?.zoom >= 15) {
      this.zone.run(() => {
        this.utilService.createBuildingColourFilter();
      });
    }
  }

  /**
   * (Map) building click handler
   * @param TOID TOID of building selected on the map
   */
  setSelectedBuildingTOID(TOID: string | null) {
    const currentTOID = this.selectedBuildingTOID();
    /** new selection on map */
    if (TOID && currentTOID !== TOID) {
      /** Get building UPRNs */
      const buildings = this.utilService.getBuildings(TOID);
      /** single dwelling */
      if (buildings.length === 1) {
        this.utilService.singleDwellingSelectedOnMap(TOID, buildings[0].UPRN);
      } else if (buildings.length > 1) {
        /** multiple dwelling */
        this.zone.run(() =>
          this.utilService.multipleDwellingSelectedOnMap(TOID)
        );
      }
    } else {
      /** deselecting current map selection */
      if (this.utilService.multiDwelling() === undefined) {
        this.utilService.singleDwellingDeselected();
      } else {
        this.utilService.multiDwellingDeselected();
      }
    }
  }

  closeDetails() {
    this.utilService.closeDetailsButtonClick();
  }

  downloadData(format: string) {
    if (format === 'xlsx') {
      this.dataDownloadService.downloadXlsxData([
        this.dataService.selectedBuilding()!,
      ]);
    } else if (format === 'csv') {
      {
        this.dataDownloadService.downloadCSVData([
          this.dataService.selectedBuilding()!,
        ]);
      }
    }
  }

  /**
   * Bulk download addresses within a user drawn polygon
   */
  downloadAddresses() {
    const buildings = this.dataService.buildings();
    const searchGeom = this.spatialQueryService.spatialFilterGeom();

    const buildingsToDownload = this.spatialQueryService.getAddressesInPolygon(
      buildings!,
      searchGeom!
    );

    this.utilService.deleteSpatialFilter();
    let addresses: string[] = [];
    let addressCount = undefined;
    if (buildingsToDownload.length <= 10) {
      buildingsToDownload.forEach((building: BuildingModel) =>
        addresses.push(building.FullAddress)
      );
    } else {
      addressCount = buildingsToDownload.length;
    }

    this.dialog
      .open<
        DownloadWarningComponent,
        DownloadDataWarningData,
        DownloadDataWarningResponse
      >(DownloadWarningComponent, {
        panelClass: 'data-download',
        data: {
          addresses,
          addressCount,
        },
      })
      .afterClosed()
      .subscribe(download => {
        if (download) {
          if (download === 'xlsx') {
            this.dataDownloadService.downloadXlsxData(buildingsToDownload);
          } else if (download === 'csv') {
            this.dataDownloadService.downloadCSVData(buildingsToDownload);
          }
          addresses = [];
          addressCount = undefined;
        }
      });
  }

  closeResults() {
    /** if there is no spatial filter close results panel */
    if (!this.spatialFilterEnabled()) {
      this.utilService.closeResultsPanel();
    }
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

  resetNorth() {
    this.mapService.mapInstance.easeTo({ bearing: 0 });
  }

  tilt2D(twoDimensions: boolean) {
    const maxPitch = twoDimensions ? 0 : 85;
    const pitch = twoDimensions ? 0 : this.runtimeConfig.map.pitch;
    this.mapService.mapInstance.easeTo({ pitch });
    this.mapService.mapInstance.setMaxPitch(maxPitch);
  }

  zoomIn() {
    this.mapService.mapInstance.zoomIn();
  }

  zoomOut() {
    this.mapService.mapInstance.zoomOut();
  }

  deleteSpatialFilter() {
    this.utilService.deleteSpatialFilter();
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

  public onFlag(buildings: BuildingModel[]): void {
    /* filter out buildings that are already flagged */
    const toFlag = buildings.filter(b => typeof b.Flagged === 'undefined');
    this.openFlagModal<FlagModalComponent, FlagModalData, FlagModalResult>(
      FlagModalComponent,
      toFlag
    )
      .pipe(
        switchMap(modal => modal.afterClosed()),
        switchMap(flag =>
          flag !== undefined && flag == true
            ? forkJoin(
                ...toFlag.map(b => this.dataService.flagToInvestigate(b))
              )
            : EMPTY
        )
      )
      .subscribe();
  }

  public onRemoveFlag(building: BuildingModel): void {
    this.openFlagModal<
      RemoveFlagModalComponent,
      RemoveFlagModalData,
      RemoveFlagModalResult
    >(RemoveFlagModalComponent, building)
      .pipe(
        switchMap(modal => modal.afterClosed()),
        switchMap(reason =>
          reason !== undefined
            ? this.dataService.invalidateFlag(building, reason!)
            : EMPTY
        )
      )
      .subscribe();
  }

  /**
   * Open Flag Modal.
   *
   * Opens a material dialog with a given component flag modal component
   * and data. The modal is opened in fullscreen on mobile devices and
   * cannot be closed by clicking outside of the modal.
   */
  private openFlagModal<C, D, R>(
    template: ComponentType<C>,
    data: D
  ): Observable<MatDialogRef<C, R>> {
    return this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      first(),
      map(({ matches }) =>
        this.dialog.open<C, D, R>(template, {
          data: data,
          disableClose: true,
          ...(matches
            ? {
                width: '100%',
                height: '100%',
                maxWidth: '100vw',
                maxHeight: '100vh',
              }
            : {
                width: 'auto',
                height: 'auto',
                minWidth: '400px',
              }),
        })
      )
    );
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

  clearAllFilters() {
    if (this.filterProps && Object.keys(this.filterProps).length > 0) {
      const params = this.createQueryParams({
        EPC: [],
        PropertyType: [],
        PostCode: [],
        BuildForm: [],
        WindowGlazing: [],
        WallConstruction: [],
        WallInsulation: [],
        FloorConstruction: [],
        FloorInsulation: [],
        RoofConstruction: [],
        RoofInsulationLocation: [],
        RoofInsulationThickness: [],
        YearOfAssessment: [],
        Flagged: [],
        EPCExpiry: [],
      });
      this.navigate(params);
      /** delete spatial filter if it exists */
      if (this.spatialFilterEnabled()) {
        this.utilService.deleteSpatialFilter();
      }
    }
    /** if there is only a spatial filter, delete and redraw map */
    if (
      !this.filterProps ||
      (Object.keys(this.filterProps).length === 0 &&
        this.spatialFilterEnabled())
    ) {
      this.utilService.deleteSpatialFilter();
      this.updateBuildingLayerColour();
    }
  }

  private navigate(queryParams: Params) {
    this.zone.run(() => {
      this.router.navigate(['/'], {
        queryParams,
        queryParamsHandling: 'merge',
      });
    });
  }

  private aggregateEPC(
    contextData: FeatureCollection<Geometry, GeoJsonProperties>[],
    buildings: BuildingMap
  ) {
    const aggregateData = this.utilService.createAddressPoints(
      Object.values(buildings).flat(),
      contextData
    );
    return aggregateData;
  }
}
