import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  EventEmitter,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

import { DownloadWarningComponent } from '@components/download-warning/download-warning.component';
import { LabelComponent } from '@components/label/label.component';

import { DataService } from '@core/services/data.service';
import { UtilService } from '@core/services/utils.service';

import {
  BuildForm,
  Floor,
  FloorInsulation,
  Roof,
  RoofInsulation,
  Wall,
} from '@core/enums';

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
  private dataService = inject(DataService);
  private utilService = inject(UtilService);

  @Output() closePanel: EventEmitter<null> = new EventEmitter();

  buildingDetails = this.dataService.selectedBuilding;
  buildingParts = this.dataService.parts;

  buildForm: { [key: string]: string } = BuildForm;
  floor: { [key: string]: string } = Floor;
  floorInsulation: { [key: string]: string } = FloorInsulation;
  roof: { [key: string]: string } = Roof;
  roofInsulation: { [key: string]: string } = RoofInsulation;
  wall: { [key: string]: string } = Wall;

  constructor(public dialog: MatDialog) {}

  getAddressSegment(index: number) {
    return this.utilService.splitAddress(
      index,
      this.buildingDetails()?.FullAddress
    );
  }

  openDownloadWarning() {
    this.dialog.open(DownloadWarningComponent, { panelClass: 'data-download' });
  }
}
