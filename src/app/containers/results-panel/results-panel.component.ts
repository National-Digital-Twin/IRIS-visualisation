import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { ResultsCardComponent } from '@components/results-card/results-card.component';
import { ResultsCardExpandableComponent } from '@components/results-card-expandable/results-card-expandable.component';

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
  private dataService = inject(DataService);
  private spatialQueryService = inject(SpatialQueryService);
  private utilService = inject(UtilService);

  selectedCardUPRN = this.utilService.selectedCardUPRN;

  buildingSelection = this.dataService.buildingsSelection;

  selectMultiple: boolean = false;

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

  getZoomCenter(TOID: string): number[] {
    const geomBB = this.spatialQueryService.getFeatureGeomBB(TOID);
    return [geomBB.getCenter().lng - 0.0005, geomBB.getCenter().lat];
  }
}
