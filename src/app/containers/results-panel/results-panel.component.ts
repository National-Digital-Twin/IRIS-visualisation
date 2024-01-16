import {
  Component,
  ViewChild,
  Output,
  EventEmitter,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';

import { ResultsCardComponent } from '@components/results-card/results-card.component';
import { ResultsCardExpandableComponent } from '@components/results-card-expandable/results-card-expandable.component';

import { SettingsService, SETTINGS } from '@core/services/settings.service';
import { DataService } from '@core/services/data.service';
import { SpatialQueryService } from '@core/services/spatial-query.service';
import { UtilService } from '@core/services/utils.service';

import { BuildingModel } from '@core/models/building.model';
import { DataDownloadService } from '@core/services/data-download.service';
import { MatDialog } from '@angular/material/dialog';
import { DownloadWarningComponent } from '@components/download-warning/download-warning.component';
import {
  DownloadDataWarningData,
  DownloadDataWarningResponse,
} from '@core/models/download-data-warning.model';

@Component({
  selector: 'c477-results-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    ResultsCardComponent,
    ResultsCardExpandableComponent,
    ScrollingModule,
  ],
  templateUrl: './results-panel.component.html',
  styleUrl: './results-panel.component.scss',
})
export class ResultsPanelComponent {
  public readonly theme = inject(SettingsService).get(SETTINGS.Theme);

  @Output() flag = new EventEmitter<BuildingModel[]>();
  @Output() removeFlag = new EventEmitter<BuildingModel>();

  @ViewChild(CdkVirtualScrollViewport) viewPort?: CdkVirtualScrollViewport;

  private readonly dataService = inject(DataService);
  private spatialQueryService = inject(SpatialQueryService);
  private utilService = inject(UtilService);
  private dataDownloadService = inject(DataDownloadService);

  selectedCardUPRN = this.utilService.selectedCardUPRN;
  selectedParentTOID = this.utilService.multiDwelling;

  buildingSelection = this.dataService.buildingsSelection;

  selectMultiple: boolean = false;

  public readonly checkedCards = signal<BuildingModel[]>([]);

  public canFlagSelected() {
    const selected = this.checkedCards();
    return selected.length > 0 && selected.some(s => !s.Flagged);
  }

  public cardIsChecked(uprn: BuildingModel['UPRN']): boolean {
    return this.checkedCards().some(building => building.UPRN === uprn);
  }

  public onToggleChecked(building: BuildingModel) {
    this.checkedCards.update(cards =>
      this.cardIsChecked(building.UPRN)
        ? cards.filter(c => c.UPRN !== building.UPRN)
        : [...cards, building]
    );
  }

  constructor(public dialog: MatDialog) {
    /** listen for UPRN set from map click */
    effect(() => {
      const selectedUPRN = this.utilService.selectedUPRN();
      const selectedTOID = this.utilService.multiDwelling();
      if (selectedUPRN) {
        const idx = this.buildingSelection()?.findIndex(
          building => building[0].UPRN === selectedUPRN
        );
        if (idx! > -1) {
          /** scroll to index*/
          this.viewPort?.scrollToIndex(idx!);
        }
      }
      if (selectedTOID) {
        const idx = this.buildingSelection()?.findIndex(
          building => building[0].ParentTOID === selectedTOID
        );
        if (idx! > -1) {
          /** scroll to index*/
          this.viewPort?.scrollToIndex(idx!);
        }
      }
    });
  }

  /**
   * View Details button handler
   * @param building selected building
   */
  viewDetails(selectedBuilding: BuildingModel) {
    const TOID = selectedBuilding.TOID
      ? selectedBuilding.TOID
      : selectedBuilding.ParentTOID;

    const center = this.getZoomCenter(TOID!);
    this.utilService.viewDetailsButtonClick(
      TOID!,
      selectedBuilding.UPRN,
      center
    );
  }

  /**
   * Single dwelling results card handler
   * @param selectedBuilding building for selected card
   */
  cardSelected(selectedBuilding: BuildingModel) {
    const TOID = selectedBuilding.TOID
      ? selectedBuilding.TOID
      : selectedBuilding.ParentTOID;
    const UPRN = selectedBuilding.UPRN;
    /**
     * if selected card building uprn === the current selected card uprn
     * deselect card and building
     */
    if (this.utilService.selectedCardUPRN() === selectedBuilding.UPRN) {
      /** deselect card */
      this.utilService.resultsCardDeselected();
    } else {
      /** select card */
      this.utilService.resultsCardSelected(TOID!, UPRN);
    }
  }

  trackByUPRN(index: number, item: BuildingModel[]) {
    if (item.length == 1) {
      return item[0].UPRN;
    } else {
      return item[0].ParentTOID;
    }
  }

  getZoomCenter(TOID: string): number[] {
    const geomBB = this.spatialQueryService.getFeatureGeomBB(TOID);
    return [geomBB.getCenter().lng - 0.0005, geomBB.getCenter().lat];
  }

  downloadAll() {
    let addresses: string[] = [];
    let addressCount = undefined;
    /** download selected */
    if (this.selectMultiple) {
      if (this.checkedCards().length <= 10) {
        this.checkedCards().forEach((building: BuildingModel) =>
          addresses.push(building.FullAddress)
        );
      } else {
        addressCount = this.checkedCards().length;
      }
    } else {
      /** download all */
      if (
        this.buildingSelection() &&
        this.buildingSelection()!.flat().length <= 10
      ) {
        this.buildingSelection()
          ?.flat()
          .forEach((building: BuildingModel) =>
            addresses.push(building.FullAddress)
          );
      } else if (
        this.buildingSelection() &&
        this.buildingSelection()!.flat().length > 10
      ) {
        addressCount = this.buildingSelection()!.flat().length;
      }
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
          if (this.selectMultiple) {
            this.dataDownloadService.downloadData(this.checkedCards());
          } else {
            this.dataDownloadService.downloadData(
              this.buildingSelection()!.flat()
            );
          }
          addresses = [];
          addressCount = undefined;
        }
      });
  }

  downloadBuilding(building: BuildingModel) {
    this.dataDownloadService.downloadData([building]);
  }
}
