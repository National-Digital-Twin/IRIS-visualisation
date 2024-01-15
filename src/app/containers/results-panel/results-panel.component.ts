import { Component, ViewChild, effect, inject } from '@angular/core';
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

  @ViewChild(CdkVirtualScrollViewport) viewPort?: CdkVirtualScrollViewport;

  private dataService = inject(DataService);
  private spatialQueryService = inject(SpatialQueryService);
  private utilService = inject(UtilService);

  selectedCardUPRN = this.utilService.selectedCardUPRN;
  selectedParentTOID = this.utilService.multiDwelling;

  buildingSelection = this.dataService.buildingsSelection;

  selectMultiple: boolean = false;

  public readonly checkedCards: BuildingModel['UPRN'][] = [];
  public cardIsChecked(UPRN: BuildingModel['UPRN']): boolean {
    return this.checkedCards.includes(UPRN);
  }

  public onToggleChecked(value: BuildingModel['UPRN']) {
    const isChecked = this.checkedCards.includes(value);
    if (isChecked) {
      const index = this.checkedCards.indexOf(value);
      this.checkedCards.splice(index, 1);
    } else {
      this.checkedCards.push(value);
    }
  }

  public onFlagSelected() {
    /* TODO: Implement */
    throw new Error(
      'On flag selected: Not implemented' + this.checkedCards.toString()
    );

    /* TODO: filter out already flagged buildings */
    /* TODO: open modal and flag buildings */
  }

  public onFlag(uprn: BuildingModel['UPRN']) {
    /* TODO: Implement */
    throw new Error('On flag: Not implemented' + uprn);
  }

  public onRemoveFlag(uprn: BuildingModel['UPRN']) {
    /* TODO: Implement */
    throw new Error('On remove flag: Not implemented' + uprn);
  }

  constructor() {
    /** listen for UPRN set from map click */
    effect(() => {
      const selectedUPRN = this.utilService.selectedUPRN();
      const selectedTOID = this.utilService.multiDwelling();
      if (selectedUPRN) {
        const idx = this.buildingSelection()?.findIndex(
          building => +building[0].UPRN === selectedUPRN
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
      +selectedBuilding.UPRN,
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
    if (this.utilService.selectedCardUPRN() === +selectedBuilding.UPRN) {
      /** deselect card */
      this.utilService.resultsCardDeselected();
    } else {
      /** select card */
      this.utilService.resultsCardSelected(TOID!, +UPRN);
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
}
