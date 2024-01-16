import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { DownloadWarningComponent } from '@components/download-warning/download-warning.component';
import { LabelComponent } from '@components/label/label.component';

import { UtilService } from '@core/services/utils.service';
import { SettingsService, SETTINGS } from '@core/services/settings.service';

import { BuildingModel } from '@core/models/building.model';

@Component({
  selector: 'c477-results-card[card]',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './results-card.component.html',
  styleUrl: './results-card.component.css',
})
export class ResultsCardComponent {
  public readonly theme = inject(SettingsService).get(SETTINGS.Theme);
  private utilService = inject(UtilService);

  @HostListener('click', ['$event'])
  onClick($event: MouseEvent) {
    $event.stopPropagation();
    this.selectCard();
  }

  @Input() card!: BuildingModel;
  @Input() buildingUPRN?: string;
  @Input() select: boolean = false;
  @Input() parent: boolean = false;
  @Input() checked: boolean = false;
  @Output() downloadData: EventEmitter<BuildingModel> =
    new EventEmitter<BuildingModel>();
  @Output() emitViewDetails: EventEmitter<BuildingModel> =
    new EventEmitter<BuildingModel>();
  @Output() cardSelected: EventEmitter<BuildingModel> =
    new EventEmitter<BuildingModel>();
  @Output() toggleChecked = new EventEmitter<boolean>();
  @Output() flag = new EventEmitter<void>();
  @Output() removeFlag = new EventEmitter<void>();

  constructor(public dialog: MatDialog) {}

  getAddressSegment(index: number) {
    return this.utilService.splitAddress(index, this.card?.FullAddress);
  }

  openDownloadWarning() {
    this.dialog
      .open(DownloadWarningComponent, {
        panelClass: 'data-download',
        data: {
          addresses: [this.card?.FullAddress],
        },
      })
      .afterClosed()
      .subscribe(download => {
        if (download) {
          this.downloadData.emit(this.card);
        }
      });
  }

  selectCard() {
    this.cardSelected.emit(this.card);
  }

  viewDetails($event: Event) {
    $event.stopPropagation();
    this.emitViewDetails.emit(this.card);
  }
}
