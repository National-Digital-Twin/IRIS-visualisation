import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  EventEmitter,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';

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
  WallConstruction,
  WindowGlazing,
} from '@core/enums';
import {
  DownloadDataWarningData,
  DownloadDataWarningResponse,
} from '@core/models/download-data-warning.model';
import { FlagHistory } from '@core/types/flag-history';

@Component({
  selector: 'c477-details-panel',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './details-panel.component.html',
  styleUrl: './details-panel.component.scss',
})
export class DetailsPanelComponent {
  public readonly theme = inject(SettingsService).get(SETTINGS.Theme);
  private readonly dataService = inject(DataService);
  private utilService = inject(UtilService);

  @Output() closePanel: EventEmitter<null> = new EventEmitter();
  @Output() downloadData: EventEmitter<null> = new EventEmitter();
  @Output() flag = new EventEmitter<BuildingModel[]>();
  @Output() removeFlag = new EventEmitter<BuildingModel>();
  @Output() getFlagHistory = new EventEmitter<string>();

  buildingDetails = this.dataService.selectedBuilding;
  flagHistory = signal<FlagHistory[]>([]);
  activeFlag = signal<FlagHistory | undefined>(undefined);

  buildForm: { [key: string]: string } = BuildForm;
  floor: { [key: string]: string } = FloorConstruction;
  floorInsulation: { [key: string]: string } = FloorInsulation;
  roof: { [key: string]: string } = RoofConstruction;
  roofInsulation: { [key: string]: string } = RoofInsulationLocation;
  wall: { [key: string]: string } = WallConstruction;
  windowGlazing: { [key: string]: string } = WindowGlazing;

  invalidateReason: { [key: string]: string } = InvalidateFlagReason;

  constructor(public dialog: MatDialog) {}

  getAddressSegment(index: number) {
    return this.utilService.splitAddress(
      index,
      this.buildingDetails()?.FullAddress
    );
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
          this.downloadData.emit();
        }
      });
  }

  tabChanged($event: MatTabChangeEvent) {
    if ($event.tab.textLabel === 'Flag') {
      this.dataService
        .getBuildingFlagHistory(this.buildingDetails()!.UPRN)
        .subscribe(res => {
          // filter out empty results
          const filteredRes = res.filter(r => r.Flagged && r.AssessmentReason);
          this.flagHistory.set(filteredRes);
          const activeFlag = res.find(r => r.Flagged && !r.AssessmentReason);
          this.activeFlag.set(activeFlag);
        });
    }
  }
}
