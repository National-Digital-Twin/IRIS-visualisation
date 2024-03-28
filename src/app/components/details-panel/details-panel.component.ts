import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  EventEmitter,
  Output,
  OnInit,
  inject,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { DownloadWarningComponent } from '@components/download-warning/download-warning.component';
import { LabelComponent } from '@components/label/label.component';

import { DataService } from '@core/services/data.service';
import { SETTINGS, SettingsService } from '@core/services/settings.service';
import { UtilService } from '@core/services/utils.service';
import { BuildingModel } from '@core/models/building.model';

import {
  BuildForm,
  FloorConstruction,
  FloorInsulation,
  InvalidateFlagReason,
  RoofConstruction,
  RoofInsulationLocation,
  RoofInsulationThickness,
  WallConstruction,
  WallInsulation,
  WindowGlazing,
} from '@core/enums';
import {
  DownloadDataWarningData,
  DownloadDataWarningResponse,
} from '@core/models/download-data-warning.model';

import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, EMPTY } from 'rxjs';

@Component({
  selector: 'c477-details-panel',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressBarModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './details-panel.component.html',
  styleUrl: './details-panel.component.scss',
})
export class DetailsPanelComponent implements OnInit {
  public readonly theme = inject(SettingsService).get(SETTINGS.Theme);
  private readonly dataService = inject(DataService);
  private utilService = inject(UtilService);

  @Input() resultsPanelCollapsed = false;
  @Output() closePanel: EventEmitter<null> = new EventEmitter();
  @Output() downloadData: EventEmitter<DownloadDataWarningResponse> =
    new EventEmitter();
  @Output() flag = new EventEmitter<BuildingModel[]>();
  @Output() removeFlag = new EventEmitter<BuildingModel>();
  @Output() getFlagHistory = new EventEmitter<string>();

  buildingSelection = this.dataService.buildingsSelection;
  public readonly buildingDetails = this.dataService.selectedBuilding;
  public readonly flagHistory$ = toObservable(this.dataService.flagHistory);
  public readonly activeFlag$ = toObservable(this.dataService.activeFlag);

  private readonly updateFlagHistory$ = toObservable(this.buildingDetails).pipe(
    takeUntilDestroyed(),
    switchMap(b => (b ? this.dataService.updateFlagHistory(b.UPRN) : EMPTY))
  );

  buildForm: { [key: string]: string } = BuildForm;
  floor: { [key: string]: string } = FloorConstruction;
  floorInsulation: { [key: string]: string } = FloorInsulation;
  roof: { [key: string]: string } = RoofConstruction;
  roofInsulation: { [key: string]: string } = RoofInsulationLocation;
  roofInsulationThickness: { [key: string]: string } = RoofInsulationThickness;
  wall: { [key: string]: string } = WallConstruction;
  wallInsulation: { [key: string]: string } = WallInsulation;
  windowGlazing: { [key: string]: string } = WindowGlazing;

  invalidateReason: { [key: string]: string } = InvalidateFlagReason;

  constructor(public dialog: MatDialog) {}

  /** subscribe to the flag history to make updates */
  public ngOnInit(): void {
    this.updateFlagHistory$.pipe().subscribe();
  }

  getAddressSegment(index: number) {
    return this.utilService.splitAddress(
      index,
      this.buildingDetails()?.FullAddress
    );
  }

  epcExpired() {
    return this.utilService.epcExpired(this.buildingDetails()?.InspectionDate);
  }

  openDownloadWarning() {
    this.dialog
      .open<
        DownloadWarningComponent,
        DownloadDataWarningData,
        DownloadDataWarningResponse
      >(DownloadWarningComponent, {
        panelClass: 'data-download',
        data: {
          addresses: [this.buildingDetails()?.FullAddress ?? ''],
          addressCount: undefined,
        },
      })
      .afterClosed()
      .subscribe(download => {
        if (download) {
          this.downloadData.emit(download);
        }
      });
  }

  tabChanged($event: MatTabChangeEvent) {
    if ($event.tab.textLabel === 'Flag') {
      const building = this.buildingDetails();
      if (building) {
        const { UPRN } = building;
        this.dataService.updateFlagHistory(UPRN).subscribe();
      }
    }
  }
}
